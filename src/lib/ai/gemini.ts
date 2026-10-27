/**
 * CivicBridge AI — Shared Gemini Service
 *
 * Server-side only. Never import this in client components.
 * API key is read exclusively from the server environment.
 */

import { GoogleGenAI } from "@google/genai";

// -------------------------------------------------------------------
// Model: gemini-flash-latest is the current recommended fast model.
// Override via GEMINI_MODEL env var if needed.
// -------------------------------------------------------------------
export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ?? "gemini-2.0-flash-001";

// -------------------------------------------------------------------
// Configuration check — returns null when AI is not configured.
// Callers must handle the null case and degrade gracefully.
// -------------------------------------------------------------------
export function isAIConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

let _client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY is not set. " +
          "Add it to .env.local and restart the dev server. " +
          "Get a free key at https://aistudio.google.com/apikey"
      );
    }
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

// -------------------------------------------------------------------
// Role-specific system prompts
// -------------------------------------------------------------------
export const SYSTEM_PROMPTS = {
  citizen: `You are CivicBridge AI, a helpful assistant for citizens using the CivicBridge civic grievance platform.

Your job is to help citizens:
- Report civic problems clearly and accurately
- Track the status of their complaints
- Understand the complaint process
- Find relevant civic information

Guidelines:
- Always be polite, clear, and empathetic
- Use simple language accessible to all citizens
- Support English, Hindi, and Marathi when asked
- Never fabricate complaint statuses, deadlines, or government announcements
- Never access or reveal another citizen's complaint details
- If you do not know something, say so honestly
- Do not submit any complaint without explicit citizen confirmation
- Always label AI-generated content clearly`,

  admin: `You are CivicBridge AI, a decision support assistant for government administrators.

Your job is to help administrators:
- Understand complaint trends and patterns from real data
- Identify overdue and high-priority complaints
- Get recommendations for worker assignment based on data
- Review resolution evidence systematically

Guidelines:
- Only refer to actual data provided in the context
- Clearly distinguish between calculated facts and analytical observations
- Never invent worker qualifications, complaint statuses, or outcomes
- Never automatically assign workers or approve resolutions — humans must confirm all actions
- Flag missing evidence or inconsistencies for human review
- Present numbers and statistics with the underlying counts, not just percentages
- Do not present correlations as proven causes`,

  employee: `You are CivicBridge AI, a field assistant for municipal workers.

Your job is to help workers:
- Understand their assigned tasks clearly
- Generate appropriate inspection checklists
- Write professional completion reports from plain descriptions
- Prepare escalation notes when needed
- Check evidence completeness before submission

Guidelines:
- Only provide information about tasks the worker is authorized to access
- Label AI-generated checklists as suggestions unless officially approved
- Never fabricate work done, measurements, observations, or evidence
- Never declare a repair successful — that requires admin approval
- Keep safety always paramount — do not provide unsafe technical instructions
- Help workers communicate clearly and professionally`,
} as const;

export type AIRole = keyof typeof SYSTEM_PROMPTS;

// -------------------------------------------------------------------
// Core generation function — used by all role-specific routes
// -------------------------------------------------------------------
export interface GenerateOptions {
  role: AIRole;
  userMessage: string;
  /** Structured context injected before the user message */
  context?: string;
  /** Previous turns for multi-turn conversations */
  history?: { role: "user" | "model"; text: string }[];
  /** Max output tokens */
  maxOutputTokens?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
}

export async function generateWithRole(
  opts: GenerateOptions
): Promise<GenerateResult> {
  const client = getClient();

  const systemInstruction = SYSTEM_PROMPTS[opts.role];

  // Build the full prompt with context prepended to user message
  const userContent = opts.context
    ? `[Context from CivicBridge database]\n${opts.context}\n\n[Citizen/User message]\n${opts.userMessage}`
    : opts.userMessage;

  // Build contents array from history + current message
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = [];

  if (opts.history) {
    for (const turn of opts.history) {
      contents.push({ role: turn.role, parts: [{ text: turn.text }] });
    }
  }

  contents.push({ role: "user", parts: [{ text: userContent }] });

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: {
      systemInstruction,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      temperature: 0.4,
    },
  });

  const text = response.text ?? "";
  return { text, model: GEMINI_MODEL };
}

// -------------------------------------------------------------------
// Structured JSON output — parses and validates AI JSON responses
// -------------------------------------------------------------------
export async function generateStructuredJSON<T>(opts: {
  role: AIRole;
  prompt: string;
  context?: string;
  /** JSON schema description to add to the prompt */
  schemaDescription: string;
}): Promise<T | null> {
  const client = getClient();
  const systemInstruction = SYSTEM_PROMPTS[opts.role];

  const fullPrompt = `${opts.context ? `[Context]\n${opts.context}\n\n` : ""}${opts.prompt}

Respond with valid JSON only. Schema: ${opts.schemaDescription}`;

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      maxOutputTokens: 2048,
      temperature: 0.2,
    },
  });

  try {
    const raw = response.text ?? "";
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------------
// AI availability error response helper
// -------------------------------------------------------------------
export function aiNotConfiguredResponse() {
  return Response.json(
    {
      error: "ai_not_configured",
      message:
        "The AI service is not configured. " +
        "Please add GEMINI_API_KEY to your .env.local file and restart the server. " +
        "Get a free key at https://aistudio.google.com/apikey",
      setupUrl: "https://aistudio.google.com/apikey",
    },
    { status: 503 }
  );
}

