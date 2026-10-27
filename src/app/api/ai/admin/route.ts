/**
 * POST /api/ai/admin
 *
 * Admin AI Copilot — server-side route handler.
 * Only authenticated admins can access this endpoint.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isAIConfigured,
  generateWithRole,
  aiNotConfiguredResponse,
} from "@/lib/ai/gemini";
import {
  getComplaintAnalyticsSummary,
  getEligibleWorkers,
  getOverdueComplaintsSummary,
} from "@/lib/ai/data-helpers";

export const maxDuration = 30;

interface AdminAIRequest {
  message: string;
  intent?:
    | "general"
    | "analytics"
    | "worker_recommendation"
    | "overdue_review"
    | "evidence_review";
  departmentId?: string;
  complaintId?: string;
  history?: { role: "user" | "model"; text: string }[];
}

export async function POST(req: NextRequest) {
  if (!isAIConfigured()) return aiNotConfiguredResponse();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  let body: AdminAIRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message, intent = "general", departmentId, complaintId, history } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  if (message.length > 3000) {
    return Response.json({ error: "Message too long" }, { status: 400 });
  }

  let context = "";

  try {
    if (intent === "analytics") {
      context = await getComplaintAnalyticsSummary();
    } else if (intent === "worker_recommendation" && departmentId) {
      const [analytics, workers, overdue] = await Promise.all([
        getComplaintAnalyticsSummary(),
        getEligibleWorkers(departmentId),
        getOverdueComplaintsSummary(5),
      ]);
      context = `${analytics}\n\nEligible workers for this department:\n${workers}\n\nMost overdue complaints:\n${overdue}`;
    } else if (intent === "overdue_review") {
      context = await getOverdueComplaintsSummary(15);
    } else if (intent === "evidence_review" && complaintId) {
      // Fetch complaint + evidence for review
      const { data: comp } = await supabase
        .from("complaints")
        .select(
          "tracking_id, title, description, status, category, priority"
        )
        .eq("id", complaintId)
        .single();

      const { data: evidence } = await supabase
        .from("resolution_evidence")
        .select("notes, photo_urls, created_at, is_approved")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (comp) {
        const ev = evidence?.[0];
        context = `Complaint: ${comp.tracking_id}
Title: ${comp.title}
Description: ${comp.description}
Category: ${comp.category}
Priority: ${comp.priority}
Status: ${comp.status}

${
  ev
    ? `Latest resolution submission:
Notes: ${ev.notes}
Photos submitted: ${Array.isArray(ev.photo_urls) ? ev.photo_urls.length : 0}
Previously approved: ${ev.is_approved === null ? "Pending" : ev.is_approved ? "Yes" : "No"}`
    : "No resolution evidence submitted yet."
}`;
      }
    } else {
      // Default: provide general analytics context
      context = await getComplaintAnalyticsSummary();
    }
  } catch (err) {
    console.error("[AdminAI] Context fetch error:", err);
  }

  try {
    const result = await generateWithRole({
      role: "admin",
      userMessage: message,
      context: context || undefined,
      history,
      maxOutputTokens: 1500,
    });

    return Response.json({ reply: result.text, model: result.model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    console.error("[AdminAI] Generation error:", err);
    return Response.json({ error: "ai_error", message: msg }, { status: 500 });
  }
}

