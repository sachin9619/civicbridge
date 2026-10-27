/**
 * POST /api/complaints/[id]/confirm
 *
 * Citizen Resolution Verification & Dispute Workflow:
 * Allows the reporting citizen to:
 * 1. CONFIRM resolution with a satisfaction rating (1-5 stars)
 * 2. DISPUTE / REOPEN complaint if repair was inadequate or fake
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: complaintId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership of the complaint or admin privileges
    const { data: comp, error: compError } = await supabase
      .from("complaints")
      .select("id, tracking_id, title, reporter_id, status, assigned_employee_id")
      .eq("id", complaintId)
      .single();

    if (compError || !comp) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isReporter = comp.reporter_id === user.id;
    const isAdmin = profile?.role === "admin";

    if (!isReporter && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden — only the citizen who lodged this complaint can verify or dispute the resolution" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action, rating = 5, feedbackNotes = "" } = body;

    const now = new Date().toISOString();

    if (action === "CONFIRM") {
      // Citizen confirms satisfactory resolution
      await supabase
        .from("complaints")
        .update({
          status: "RESOLVED",
          resolved_at: now,
        })
        .eq("id", complaintId);

      // Log in status history
      await supabase.from("status_history").insert({
        complaint_id: complaintId,
        old_status: comp.status,
        new_status: "RESOLVED",
        changed_by: user.id,
        notes: `[Citizen Confirmed] Citizen verified resolution satisfaction rating: ${rating}/5 Stars. Feedback: "${feedbackNotes || "Resolution accepted."}"`,
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "CITIZEN_RESOLUTION_CONFIRMED",
        entity_type: "complaint",
        entity_id: complaintId,
        metadata: {
          rating,
          feedbackNotes,
          tracking_id: comp.tracking_id,
          confirmed_at: now,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Resolution verified and closed by citizen.",
        newStatus: "RESOLVED",
      });
    } else if (action === "DISPUTE") {
      // Citizen disputes resolution — reopen complaint
      if (!feedbackNotes || feedbackNotes.trim().length < 5) {
        return NextResponse.json(
          { error: "Please provide a brief reason explaining why the issue is still unresolved." },
          { status: 400 }
        );
      }

      await supabase
        .from("complaints")
        .update({
          status: "REOPENED",
          priority: "HIGH", // Bump priority for re-opened cases
        })
        .eq("id", complaintId);

      // Log in status history
      await supabase.from("status_history").insert({
        complaint_id: complaintId,
        old_status: comp.status,
        new_status: "REOPENED",
        changed_by: user.id,
        notes: `[Citizen Dispute / Reopened] Citizen reported issue persists: "${feedbackNotes}". Priority elevated to HIGH.`,
      });

      // Audit log
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "CITIZEN_RESOLUTION_DISPUTED",
        entity_type: "complaint",
        entity_id: complaintId,
        metadata: {
          feedbackNotes,
          previous_status: comp.status,
          reopened_at: now,
        },
      });

      // Notify assigned staff
      if (comp.assigned_employee_id) {
        await supabase.from("notifications").insert({
          user_id: comp.assigned_employee_id,
          title: `🔄 Grievance Reopened: #${comp.tracking_id}`,
          message: `The citizen was unsatisfied with the resolution proof: "${feedbackNotes}". Please re-inspect.`,
          type: "warning",
          complaint_id: complaintId,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Grievance reopened and escalated for re-inspection.",
        newStatus: "REOPENED",
      });
    }

    return NextResponse.json({ error: "Invalid action. Expected CONFIRM or DISPUTE" }, { status: 400 });
  } catch (err: any) {
    console.error("[Citizen Confirm] Error:", err);
    return NextResponse.json({ error: err.message || "Action failed" }, { status: 500 });
  }
}
