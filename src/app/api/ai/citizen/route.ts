/**
 * POST /api/ai/citizen
 *
 * Citizen AI Assistant — server-side route handler.
 * Auth and ownership are enforced here; the LLM never receives
 * raw SQL or private records from other citizens.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isAIConfigured,
  generateWithRole,
  aiNotConfiguredResponse,
} from "@/lib/ai/gemini";
import {
  getMyComplaintsSummary,
  getMyComplaintDetail,
  searchSimilarComplaints,
} from "@/lib/ai/data-helpers";

export const maxDuration = 30;

interface CitizenAIRequest {
  message: string;
  intent?:
    | "general"
    | "track_complaint"
    | "find_similar"
    | "draft_complaint"
    | "civic_guidance";
  complaintId?: string;
  category?: string;
  history?: { role: "user" | "model"; text: string }[];
}

export async function POST(req: NextRequest) {
  // 1. Check AI configuration first
  if (!isAIConfigured()) return aiNotConfiguredResponse();

  // 2. Authenticate the request server-side
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 3. Verify role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "citizen") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. Parse and validate request body
  let body: CitizenAIRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, intent = "general", complaintId, category, history } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 2000) {
    return Response.json(
      { error: "Message too long (max 2000 characters)" },
      { status: 400 }
    );
  }

  // 5. Fetch relevant context based on intent
  let context = "";

  try {
    if (intent === "track_complaint") {
      if (complaintId) {
        // Ownership enforced inside getMyComplaintDetail
        context = await getMyComplaintDetail(user.id, complaintId);
      } else {
        context = await getMyComplaintsSummary(user.id);
      }
    } else if (intent === "find_similar" && category) {
      context = await searchSimilarComplaints(category);
    } else if (intent === "draft_complaint") {
      // Provide category guidance context
      context = `Available complaint categories: GARBAGE_WASTE, POTHOLE_ROADS, STREETLIGHTS, DRAINAGE_SEWAGE, WATER_SUPPLY, WOMEN_SAFETY, PUBLIC_INFRASTRUCTURE, OTHER

Priority guidelines:
- URGENT: Immediate safety risk or essential service disruption
- HIGH: Significant impact on daily life
- MEDIUM: Noticeable inconvenience
- LOW: Minor issue, non-urgent

Help the citizen draft a complaint. You MUST NOT submit it — ask them to confirm first.`;
    }
  } catch (err) {
    console.error("[CitizenAI] Context fetch error:", err);
    // Continue without context rather than failing
  }

  // 6. Generate AI response
  try {
    const result = await generateWithRole({
      role: "citizen",
      userMessage: message,
      context: context || undefined,
      history,
    });

    return Response.json({ reply: result.text, model: result.model });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI generation failed";
    console.error("[CitizenAI] Generation error:", err);
    return Response.json({ error: "ai_error", message }, { status: 500 });
  }
}

