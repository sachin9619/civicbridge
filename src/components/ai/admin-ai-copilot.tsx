"use client";

/**
 * Admin AI Copilot Panel
 *
 * Inline panel for the admin dashboard.
 * Provides analytics insights, worker recommendations, and evidence review.
 */

import { useState } from "react";
import { Bot, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { AIChatDrawer } from "@/components/ai/ai-chat-drawer";
import type { AIChatContext } from "@/components/ai/ai-chat-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminAICopilotProps {
  context?: AIChatContext;
}

const ADMIN_SUGGESTIONS = [
  "Summarize today's complaint activity",
  "Which areas have the most overdue complaints?",
  "Which complaint categories have the most unresolved cases?",
  "What changed in complaint volumes this week?",
  "Show me urgent complaints that need attention",
];

export function AdminAICopilot({ context }: AdminAICopilotProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <Card className="border-blue-100 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <span>AI Insights</span>
              <span className="text-[10px] font-normal text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Copilot
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(true)}
              className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Ask AI Copilot
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ADMIN_SUGGESTIONS.slice(0, 3).map((q, i) => (
              <button
                key={i}
                onClick={() => {
                  setDrawerOpen(true);
                  // Small delay to let drawer open before we'd send
                }}
                className="text-xs text-blue-700 bg-white border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            AI analysis is based on real complaint data. All administrative actions require human confirmation.
          </p>
        </CardContent>
      </Card>

      <AIChatDrawer
        apiEndpoint="/api/ai/admin"
        title="AI Copilot"
        subtitle="Admin Decision Support"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        context={{ intent: "analytics", ...context }}
        suggestedQuestions={ADMIN_SUGGESTIONS}
        welcomeMessage={`Hi, I'm your Admin AI Copilot. 🏛️

I can help you:
• Summarize complaint trends from your database
• Identify overdue and high-priority cases
• Recommend eligible workers for assignment
• Review resolution evidence

All analysis is based on your actual complaint records. Any actions (assignment, approval) still require your confirmation.`}
      />
    </>
  );
}

