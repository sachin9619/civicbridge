"use client";

/**
 * Worker AI Field Assistant
 *
 * Inline card on the employee task detail page.
 * Provides task briefing, checklists, report assistance, and escalation help.
 */

import { useState } from "react";
import { Bot, Sparkles, ClipboardList, FileText, AlertTriangle } from "lucide-react";
import { AIChatDrawer } from "@/components/ai/ai-chat-drawer";
import type { AIChatContext } from "@/components/ai/ai-chat-drawer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorkerAIAssistantProps {
  complaintId: string;
  category: string;
}

export function WorkerAIAssistant({ complaintId, category }: WorkerAIAssistantProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeIntent, setActiveIntent] = useState<AIChatContext["intent"]>("task_briefing");

  const openWith = (intent: AIChatContext["intent"], question: string) => {
    setActiveIntent(intent);
    setDrawerOpen(true);
  };

  const quickActions = [
    {
      icon: ClipboardList,
      label: "Get Checklist",
      description: "AI-suggested inspection steps",
      intent: "checklist" as const,
      question: "Generate an inspection checklist for my task",
    },
    {
      icon: FileText,
      label: "Write Report",
      description: "Convert notes into professional report",
      intent: "completion_report" as const,
      question: "Help me write my completion report",
    },
    {
      icon: AlertTriangle,
      label: "Escalate Issue",
      description: "Help prepare an escalation note",
      intent: "escalation" as const,
      question: "I need to escalate this task",
    },
  ];

  return (
    <>
      <Card className="border-purple-100 bg-purple-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span>AI Field Assistant</span>
            <span className="text-[10px] font-normal text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Suggested
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <button
                key={action.intent}
                onClick={() => openWith(action.intent, action.question)}
                className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-xl border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
              >
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <action.icon className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {action.label}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {action.description}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setActiveIntent("task_briefing");
              setDrawerOpen(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs text-purple-700 bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Open AI Field Assistant
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            AI suggestions are guides only. Always follow official safety procedures.
          </p>
        </CardContent>
      </Card>

      <AIChatDrawer
        apiEndpoint="/api/ai/worker"
        title="AI Field Assistant"
        subtitle="Field Support"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        context={{
          intent: activeIntent,
          complaintId,
          category,
        }}
        suggestedQuestions={[
          "Summarize my task and what needs to be done",
          "Generate an inspection checklist for this complaint",
          "Help me write my completion report",
          "I cannot complete this task — help me escalate",
          "What evidence do I need to submit?",
        ]}
        welcomeMessage={`Hi! I'm your AI Field Assistant. 🔧

I can help you:
• Understand your task requirements
• Generate an inspection checklist (AI-suggested)
• Convert your notes into a professional report
• Prepare an escalation note if needed
• Check what evidence you need to submit

All checklists are suggestions. Follow official safety procedures at all times.`}
      />
    </>
  );
}

