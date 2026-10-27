import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyResolutionEvidence } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      complaintId,
      beforePhotoUrls = [],
      afterPhotoUrls = [],
      employeeNotes = "",
    } = body;

    if (!complaintId) {
      return NextResponse.json({ error: "Complaint ID is required" }, { status: 400 });
    }

    // Fetch complaint details if not fully provided
    const { data: complaint } = await supabase
      .from("complaints")
      .select("title, description, category, photo_urls")
      .eq("id", complaintId)
      .single();

    const title = complaint?.title || "Civic Complaint";
    const description = complaint?.description || "";
    const category = complaint?.category || "OTHER";
    const beforePhotos = beforePhotoUrls.length > 0 ? beforePhotoUrls : complaint?.photo_urls || [];

    const result = await verifyResolutionEvidence({
      beforePhotoUrls: beforePhotos,
      afterPhotoUrls,
      complaintTitle: title,
      complaintDescription: description,
      category,
      employeeNotes,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to analyze resolution evidence" },
      { status: 500 }
    );
  }
}
