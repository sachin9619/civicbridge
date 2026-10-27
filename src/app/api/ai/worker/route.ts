/**
 * POST /api/ai/worker
 *
 * Worker AI Field Assistant — server-side route handler.
 * Only authenticated employees can access this endpoint.
 * Task visibility is strictly enforced by assignment.
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isAIConfigured,
  generateWithRole,
  aiNotConfiguredResponse,
} from "@/lib/ai/gemini";
import {
  getMyAssignedTasksSummary,
  getAssignedTaskDetail,
} from "@/lib/ai/data-helpers";

export const maxDuration = 30;

interface WorkerAIRequest {
  message: string;
  intent?:
    | "general"
    | "task_briefing"
    | "checklist"
    | "completion_report"
    | "escalation"
    | "evidence_check";
  complaintId?: string;
  category?: string;
  history?: { role: "user" | "model"; text: string }[];
}

export async function POST(req: NextRequest) {
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

  if (!profile || profile.role !== "employee") {
    return Response.json({ error: "Forbidden — workers only" }, { status: 403 });
  }

  let body: WorkerAIRequest;
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
    return Response.json({ error: "Message too long" }, { status: 400 });
  }

  let context = "";

  try {
    if (
      (intent === "task_briefing" ||
        intent === "checklist" ||
        intent === "completion_report" ||
        intent === "escalation" ||
        intent === "evidence_check") &&
      complaintId
    ) {
      // Assignment is enforced inside getAssignedTaskDetail
      context = await getAssignedTaskDetail(user.id, complaintId);

      if (intent === "checklist") {
        context +=
          "\n\nPlease generate a suggested inspection checklist for this complaint category. Label it as AI-suggested. Do not include unsafe instructions.";
      } else if (intent === "completion_report") {
        context +=
          "\n\nThe worker will describe what they did. Convert it into a professional, factual completion report. Do not add work, measurements, or observations that the worker did not mention.";
      } else if (intent === "escalation") {
        context +=
          "\n\nHelp the worker prepare a professional escalation note. Only submit after worker confirmation.";
      } else if (intent === "evidence_check") {
        context +=
          "\n\nCheck if the evidence described by the worker is sufficient for verification. List what is missing. Do not declare the repair successful.";
      }
    } else {
      // General task overview
      context = await getMyAssignedTasksSummary(user.id);
    }
  } catch (err) {
    console.error("[WorkerAI] Context fetch error:", err);
  }

  // Optionally add category-specific context
  if (category && intent === "checklist" && !complaintId) {
    context = `Category: ${category.replace(/_/g, " ")}

Generate a suggested inspection checklist for a ${category.replace(/_/g, " ")} complaint. Label it as AI-suggested. Do not include unsafe instructions.`;
  }

  try {
    const result = await generateWithRole({
      role: "employee",
      userMessage: message,
      context: context || undefined,
      history,
    });

    return Response.json({ reply: result.text, model: result.model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    console.error("[WorkerAI] Generation error:", err);
    return Response.json({ error: "ai_error", message: msg }, { status: 500 });
  }
}

