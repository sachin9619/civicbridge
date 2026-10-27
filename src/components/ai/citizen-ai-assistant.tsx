"use client";

/**
 * Citizen AI Assistant
 *
 * Floating button and chat drawer for the citizen portal.
 * Accepts optional context (complaint tracking, draft mode, etc.)
 */

import { useState } from "react";
import { AIChatDrawer, AIFloatingButton } from "@/components/ai/ai-chat-drawer";
import type { AIChatContext } from "@/components/ai/ai-chat-drawer";

interface CitizenAIAssistantProps {
  /** Optional pre-set context (e.g., currently viewed complaint) */
  context?: AIChatContext;
  /** Override suggested questions */
  suggestedQuestions?: string[];
}

const DEFAULT_SUGGESTIONS = [
  "How do I report a civic issue?",
  "What is happening with my complaints?",
  "There is garbage piling up near my building — can you help me report it?",
  "How long does it take for a complaint to be resolved?",
  "I want to report a pothole on my street",
];

export function CitizenAIAssistant({
  context,
  suggestedQuestions,
}: CitizenAIAssistantProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AIFloatingButton
        onClick={() => setOpen((o) => !o)}
        label="Ask CivicBridge AI"
        isOpen={open}
      />
      <AIChatDrawer
        apiEndpoint="/api/ai/citizen"
        title="CivicBridge AI"
        subtitle="Citizen Assistant"
        open={open}
        onClose={() => setOpen(false)}
        context={context}
        suggestedQuestions={suggestedQuestions ?? DEFAULT_SUGGESTIONS}
        welcomeMessage={`Hi! I'm CivicBridge AI, your civic assistant. 👋

I can help you:
• Report a civic issue in your area
• Track your existing complaints
• Understand the grievance process
• Find information about ongoing civic situations

What would you like to do today?`}
      />
    </>
  );
}

