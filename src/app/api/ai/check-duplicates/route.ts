import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectDuplicateComplaints } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const {
      title,
      description = "",
      category,
      latitude = null,
      longitude = null,
      excludeId = null,
    } = body;

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and Category are required to check for duplicates" },
        { status: 400 }
      );
    }

    // Fetch active complaints created in the last 60 days
    let query = supabase
      .from("complaints")
      .select("id, tracking_id, title, description, category, latitude, longitude, status, created_at")
      .in("status", ["SUBMITTED", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "PENDING_VERIFICATION"])
      .order("created_at", { ascending: false })
      .limit(60);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data: existing, error: dbError } = await query;

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }

    const result = await detectDuplicateComplaints({
      title,
      description,
      category,
      latitude,
      longitude,
      existingComplaints: existing || [],
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to scan for duplicate complaints" },
      { status: 500 }
    );
  }
}
