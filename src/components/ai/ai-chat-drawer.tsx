"use client";

/**
 * CivicBridge AI Chat Drawer
 *
 * Shared responsive chat panel used by all role-specific AI assistants.
 * The apiEndpoint prop determines which server route handles the request.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Bot, Loader2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface AIChatMessage {
  role: "user" | "model";
  text: string;
  isError?: boolean;
}

export interface AIChatContext {
  intent?: string;
  complaintId?: string;
  departmentId?: string;
  category?: string;
}

interface AIChatDrawerProps {
  /** API route for this role, e.g. "/api/ai/citizen" */
  apiEndpoint: string;
  /** Display title */
  title: string;
  /** Subtitle / role label */
  subtitle?: string;
  /** Whether the drawer is open */
  open: boolean;
  /** Called when the drawer should close */
  onClose: () => void;
  /** Pre-filled context sent with every message */
  context?: AIChatContext;
  /** Suggested questions shown at the start */
  suggestedQuestions?: string[];
  /** Welcome message */
  welcomeMessage?: string;
}

export function AIChatDrawer({
  apiEndpoint,
  title,
  subtitle,
  open,
  onClose,
  context,
  suggestedQuestions = [],
  welcomeMessage,
}: AIChatDrawerProps) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [setupMessage, setSetupMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: AIChatMessage = { role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);
      setAiUnavailable(false);

      // Build history from current messages
      const history = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            history,
            ...context,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data.error === "ai_not_configured") {
            setAiUnavailable(true);
            setSetupMessage(data.message ?? "AI is not configured.");
            setMessages((prev) => prev.filter((m) => m !== userMsg));
            return;
          }
          throw new Error(data.message ?? `Request failed: ${res.status}`);
        }

        const modelMsg: AIChatMessage = {
          role: "model",
          text: data.reply ?? "No response received.",
        };
        setMessages((prev) => [...prev, modelMsg]);
      } catch (err) {
        const errorMsg: AIChatMessage = {
          role: "model",
          text:
            err instanceof Error
              ? `Sorry, something went wrong: ${err.message}. Please try again.`
              : "An unexpected error occurred. Please try again.",
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [apiEndpoint, context, isLoading, messages]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    setAiUnavailable(false);
    setSetupMessage(null);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed bottom-0 right-0 z-50 flex flex-col bg-white border-l border-t border-slate-200 shadow-2xl",
          "w-full sm:w-[420px] h-[85vh] sm:h-full sm:bottom-auto sm:top-0",
          "rounded-t-2xl sm:rounded-none transition-transform duration-300"
        )}
        role="dialog"
        aria-label={title}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl sm:rounded-none">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              {subtitle && (
                <p className="text-[10px] text-blue-200 uppercase tracking-wider">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                title="Clear chat"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* AI Unavailable Banner */}
        {aiUnavailable && (
          <div className="mx-3 mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  AI Not Configured
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {setupMessage}
                </p>
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  Get a free Gemini API key →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Welcome message */}
          {messages.length === 0 && welcomeMessage && (
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-none bg-slate-100 px-3.5 py-2.5">
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {welcomeMessage}
                </p>
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <Bot className="h-2.5 w-2.5" /> CivicBridge AI
                </p>
              </div>
            </div>
          )}

          {/* Suggested questions */}
          {messages.length === 0 && suggestedQuestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-1">
                Suggested questions
              </p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl px-3 py-2 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Conversation */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {msg.role === "model" && (
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    msg.isError ? "bg-red-100" : "bg-blue-100"
                  )}
                >
                  <Bot
                    className={cn(
                      "h-3.5 w-3.5",
                      msg.isError ? "text-red-600" : "text-blue-600"
                    )}
                  />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5",
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-none"
                    : msg.isError
                    ? "bg-red-50 border border-red-200 text-red-700 rounded-tl-none"
                    : "bg-slate-100 text-slate-800 rounded-tl-none"
                )}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </p>
                {msg.role === "model" && !msg.isError && (
                  <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                    <Bot className="h-2.5 w-2.5" /> AI-generated
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-2.5">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-tl-none px-3.5 py-2.5">
                <div className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                  <span className="text-xs text-slate-500">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-slate-200 px-3 py-3">
          <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-300">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 resize-none outline-none max-h-32 overflow-y-auto"
              style={{ minHeight: "24px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center transition-colors shrink-0",
                input.trim() && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            AI responses may contain errors. Always verify important information.
          </p>
        </div>
      </div>
    </>
  );
}

// -------------------------------------------------------------------
// Floating trigger button
// -------------------------------------------------------------------
interface AIFloatingButtonProps {
  onClick: () => void;
  label?: string;
  isOpen?: boolean;
}

export function AIFloatingButton({
  onClick,
  label = "Ask AI",
  isOpen = false,
}: AIFloatingButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full px-4 py-3 shadow-lg transition-all duration-200",
        "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-xl",
        isOpen && "ring-4 ring-blue-500/30"
      )}
      aria-label={label}
    >
      {isOpen ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
      <span className="text-sm font-semibold">{isOpen ? "Close AI" : label}</span>
    </button>
  );
}

