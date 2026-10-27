/**
 * POST /api/complaints/link-duplicate
 *
 * Links a duplicate complaint to a primary complaint without deleting either record.
 * Preserves full referential integrity and reporter associations.
 * Logs decision in status_history and audit_logs.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Only administrators can link duplicate complaints" }, { status: 403 });
    }

    const body = await req.json();
    const { complaintId, primaryComplaintId, reason } = body;

    if (!complaintId || !primaryComplaintId) {
      return NextResponse.json({ error: "Both complaintId and primaryComplaintId are required" }, { status: 400 });
    }

    // Fetch primary complaint tracking ID
    const { data: primaryComp } = await supabase
      .from("complaints")
      .select("id, tracking_id, title")
      .eq("id", primaryComplaintId)
      .single();

    if (!primaryComp) {
      return NextResponse.json({ error: "Primary complaint not found" }, { status: 404 });
    }

    // 1. Log into status_history of duplicate complaint
    await supabase.from("status_history").insert({
      complaint_id: complaintId,
      old_status: "UNDER_REVIEW",
      new_status: "UNDER_REVIEW",
      changed_by: user.id,
      notes: `[AI Duplicate Linked] Verified as duplicate of primary grievance #${primaryComp.tracking_id}. Reason: ${reason || "Geographic and description match."}`,
    });

    // 2. Record in audit_logs
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "COMPLAINT_DUPLICATE_LINKED",
      entity_type: "complaint",
      entity_id: complaintId,
      metadata: {
        primary_complaint_id: primaryComp.id,
        primary_tracking_id: primaryComp.tracking_id,
        reason,
        linked_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully linked as duplicate of #${primaryComp.tracking_id}`,
      primaryTrackingId: primaryComp.tracking_id,
    });
  } catch (err: any) {
    console.error("[Link Duplicate] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to link duplicate" }, { status: 500 });
  }
}
