/**
 * POST /api/sla/escalate
 *
 * Automated SLA Escalation Engine
 * Evaluates active complaints, identifies SLA deadline breaches,
 * and escalates to Zonal Commissioner with an idempotent audit trail.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify admin role or cron authorization header
    const authHeader = req.headers.get("authorization");
    const isCronAuthorized =
      process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCronAuthorized) {
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden — only administrators can trigger SLA escalation" },
          { status: 403 }
        );
      }
    }

    const now = new Date().toISOString();

    // 1. Fetch active complaints where deadline has passed
    const { data: overdueComplaints, error: fetchError } = await supabase
      .from("complaints")
      .select("id, tracking_id, title, priority, status, deadline, assigned_employee_id, ward_id, created_at")
      .not("status", "in", '("RESOLVED","REJECTED")')
      .lt("deadline", now);

    if (fetchError) {
      console.error("[SLA Engine] Fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const allOverdue = overdueComplaints || [];
    const escalatedList: any[] = [];
    let alreadyEscalatedCount = 0;

    // 2. Process each overdue complaint idempotently
    for (const comp of allOverdue) {
      // Check if an escalation has already been logged to prevent duplicate events
      const { data: existingEscalation } = await supabase
        .from("audit_logs")
        .select("id")
        .eq("entity_id", comp.id)
        .eq("action", "SLA_AUTO_ESCALATED")
        .limit(1);

      if (existingEscalation && existingEscalation.length > 0) {
        alreadyEscalatedCount++;
        continue;
      }

      // Check if status history has escalation notes
      const { data: existingHist } = await supabase
        .from("status_history")
        .select("id")
        .eq("complaint_id", comp.id)
        .ilike("notes", "%SLA Breached%")
        .limit(1);

      if (existingHist && existingHist.length > 0) {
        alreadyEscalatedCount++;
        continue;
      }

      // Perform escalation
      // A. Bump priority to URGENT if not already
      if (comp.priority !== "URGENT") {
        await supabase
          .from("complaints")
          .update({ priority: "URGENT" })
          .eq("id", comp.id);
      }

      // B. Insert status history entry
      const actorId = user?.id || comp.assigned_employee_id || comp.id;
      await supabase.from("status_history").insert({
        complaint_id: comp.id,
        old_status: comp.status,
        new_status: comp.status,
        changed_by: actorId,
        notes: `[SLA BREACHED] Citizen Charter deadline exceeded. Automatically escalated to Zonal Municipal Commissioner. Priority set to URGENT.`,
      });

      // C. Record in audit_logs for deduplication and compliance
      await supabase.from("audit_logs").insert({
        actor_id: actorId,
        action: "SLA_AUTO_ESCALATED",
        entity_type: "complaint",
        entity_id: comp.id,
        metadata: {
          tracking_id: comp.tracking_id,
          title: comp.title,
          previous_priority: comp.priority,
          deadline: comp.deadline,
          escalated_at: now,
          escalate_to: "Zonal Municipal Commissioner",
        },
      });

      // D. Send notification to assigned staff or admin
      if (comp.assigned_employee_id) {
        await supabase.from("notifications").insert({
          user_id: comp.assigned_employee_id,
          title: `⚠️ SLA Breached: ${comp.tracking_id}`,
          message: `Work order '${comp.title}' has exceeded Citizen Charter resolution timeline and has been escalated to the Zonal Commissioner.`,
          type: "warning",
          complaint_id: comp.id,
        });
      }

      escalatedList.push({
        id: comp.id,
        tracking_id: comp.tracking_id,
        title: comp.title,
        deadline: comp.deadline,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      totalOverdueEvaluated: allOverdue.length,
      newlyEscalatedCount: escalatedList.length,
      alreadyEscalatedCount,
      escalatedComplaints: escalatedList,
    });
  } catch (err: any) {
    console.error("[SLA Engine] Critical error:", err);
    return NextResponse.json({ error: err.message || "SLA evaluation failed" }, { status: 500 });
  }
}
