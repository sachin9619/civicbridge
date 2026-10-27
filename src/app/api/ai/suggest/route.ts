/**
 * POST /api/ai/suggest
 *
 * AI Complaint Intelligence:
 * Analyzes citizen problem descriptions to recommend:
 * 1. Category (with confidence score)
 * 2. Relevant Municipal Department
 * 3. Recommended Priority (URGENT / HIGH / MEDIUM / LOW)
 * 4. Transparent Explanation / Justification
 *
 * Works with Gemini 2.0 when GEMINI_API_KEY is configured,
 * and falls back seamlessly to deterministic rule-based intelligence when offline.
 */

import { NextRequest, NextResponse } from "next/server";
import { getDepartmentForCategory } from "@/lib/utils";
import type { ComplaintCategory, Priority } from "@/types";

export const maxDuration = 30;

export interface AISuggestionResponse {
  category: ComplaintCategory;
  confidenceScore: number;
  department: string;
  priority: Priority;
  reasoning: string[];
  summary: string;
  aiEngine: "Gemini 2.0 Flash" | "Municipal Rule Intelligence";
}

// Deterministic Rule Engine for AI Suggestion
function analyzeWithRules(title: string, description: string): AISuggestionResponse {
  const combined = `${title} ${description}`.toLowerCase();

  // 1. Women Safety (Life / Personal Security)
  if (
    combined.includes("mahila") ||
    combined.includes("safety") ||
    combined.includes("harassment") ||
    combined.includes("eve teasing") ||
    combined.includes("stalking") ||
    combined.includes("dark spot") ||
    combined.includes("unsafe")
  ) {
    return {
      category: "WOMEN_SAFETY",
      confidenceScore: 94,
      department: getDepartmentForCategory("WOMEN_SAFETY"),
      priority: "HIGH",
      summary: "Identified safety or security concern requiring urgent police and municipal illumination coordination.",
      reasoning: [
        "Keywords matching women safety and vulnerability identified.",
        "Citizen Charter classifies personal safety as prioritized intervention.",
        "Assigned to Women Safety & Urban Surveillance Unit.",
      ],
      aiEngine: "Municipal Rule Intelligence",
    };
  }

  // 2. Urgent / Hazard Detection
  const hasUrgentHazard =
    combined.includes("live wire") ||
    combined.includes("electric spark") ||
    combined.includes("fire") ||
    combined.includes("gas leak") ||
    combined.includes("cave in") ||
    combined.includes("collapsed") ||
    combined.includes("deep trench") ||
    combined.includes("cylinder");

  // 3. Drainage & Sewage
  if (
    combined.includes("naali") ||
    combined.includes("drain") ||
    combined.includes("sewage") ||
    combined.includes("sewer") ||
    combined.includes("gutter") ||
    combined.includes("waterlogging") ||
    combined.includes("overflow") ||
    combined.includes("ganda pani")
  ) {
    return {
      category: "DRAINAGE_SEWAGE",
      confidenceScore: 91,
      department: getDepartmentForCategory("DRAINAGE_SEWAGE"),
      priority: hasUrgentHazard ? "URGENT" : combined.includes("overflow") ? "HIGH" : "MEDIUM",
      summary: "Detected sewer blockage, overflow, or storm-water drain issue.",
      reasoning: [
        "Keywords matching sewage lines or storm water drainage detected.",
        hasUrgentHazard ? "Hazardous environmental contamination elevates priority to URGENT." : "Standard drainage blockage assigned to sanitation engineers.",
        "SLA timeline: 24 to 48 hours resolution mandate.",
      ],
      aiEngine: "Municipal Rule Intelligence",
    };
  }

  // 4. Water Supply
  if (
    combined.includes("paani") ||
    combined.includes("water") ||
    combined.includes("pipeline") ||
    combined.includes("tap") ||
    combined.includes("tanker") ||
    combined.includes("supply") ||
    combined.includes("leakage") ||
    combined.includes("drinking water")
  ) {
    return {
      category: "WATER_SUPPLY",
      confidenceScore: 93,
      department: getDepartmentForCategory("WATER_SUPPLY"),
      priority: combined.includes("no water") || combined.includes("burst") ? "HIGH" : "MEDIUM",
      summary: "Identified drinking water supply or municipal pipeline leakage.",
      reasoning: [
        "Keywords relate directly to municipal potable water distribution.",
        "Dispatched to Jal Board / Water Supply Division.",
        "Target SLA: 24 Hours.",
      ],
      aiEngine: "Municipal Rule Intelligence",
    };
  }

  // 5. Potholes & Roads
  if (
    combined.includes("pothole") ||
    combined.includes("gaddha") ||
    combined.includes("road") ||
    combined.includes("sadak") ||
    combined.includes("divider") ||
    combined.includes("asphalt") ||
    combined.includes("footpath") ||
    combined.includes("crater")
  ) {
    return {
      category: "POTHOLE_ROADS",
      confidenceScore: 92,
      department: getDepartmentForCategory("POTHOLE_ROADS"),
      priority: combined.includes("accident") || hasUrgentHazard ? "HIGH" : "MEDIUM",
      summary: "Road surface defect or pedestrian walkway damage reported.",
      reasoning: [
        "Identified road surface deterioration or hazardous pothole.",
        "Assigned to Public Works Department (PWD / Road Maintenance).",
        "SLA: 48 Hours inspection and cold-mix/asphalt patch repair.",
      ],
      aiEngine: "Municipal Rule Intelligence",
    };
  }

  // 6. Streetlights
  if (
    combined.includes("light") ||
    combined.includes("batti") ||
    combined.includes("streetlight") ||
    combined.includes("pole") ||
    combined.includes("andhera") ||
    combined.includes("dark") ||
    combined.includes("bulb")
  ) {
    return {
      category: "STREETLIGHTS",
      confidenceScore: 89,
      department: getDepartmentForCategory("STREETLIGHTS"),
      priority: combined.includes("spark") ? "URGENT" : "MEDIUM",
      summary: "Public lighting failure or streetlight electrical defect.",
      reasoning: [
        "Keywords indicate non-functional public street lamp or pole failure.",
        "Assigned to Electrical & Streetlight Maintenance Wing.",
        "SLA: 36 Hours replacement window.",
      ],
      aiEngine: "Municipal Rule Intelligence",
    };
  }

  // 7. Garbage & Waste (Default high probability)
  if (
    combined.includes("kooda") ||
    combined.includes("kachra") ||
    combined.includes("garbage") ||
    combined.includes("waste") ||
    combined.includes("trash") ||
    combined.includes("safai") ||
    combined.includes("dump") ||
    combined.includes("dustbin") ||
    combined.includes("badbu")
  ) {
    return {
      category: "GARBAGE_WASTE",
      confidenceScore: 95,
      department: getDepartmentForCategory("GARBAGE_WASTE"),
      priority: combined.includes("dead animal") || combined.includes("hospital") ? "HIGH" : "MEDIUM",
      summary: "Solid waste accumulation or municipal cleanliness complaint.",
      reasoning: [
        "Keywords describe solid waste disposal, uncollected trash, or sanitation deficiency.",
        "Assigned to Solid Waste Management & Health Inspector.",
        "SLA: 24 Hours door-to-door or compactor clearance mandate.",
      ],
      aiEngine: "Municipal Rule Intelligence",
    };
  }

  // Default fallback
  return {
    category: "PUBLIC_INFRASTRUCTURE",
    confidenceScore: 72,
    department: getDepartmentForCategory("PUBLIC_INFRASTRUCTURE"),
    priority: "MEDIUM",
    summary: "General civic or municipal infrastructure maintenance issue.",
    reasoning: [
      "No specific hazard indicators detected.",
      "Assigned to General Urban Maintenance.",
      "Citizen and officer may adjust category if needed.",
    ],
    aiEngine: "Municipal Rule Intelligence",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title = "", description = "" } = body;

    if (!title.trim() && !description.trim()) {
      return NextResponse.json({ error: "Title or description required for AI analysis" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If Gemini key is available, attempt generative categorization
    if (apiKey) {
      try {
        const prompt = `You are a Municipal Grievance Triage AI for CivicBridge.
Analyze this civic issue report:
Title: "${title}"
Description: "${description}"

Categories available:
- GARBAGE_WASTE (Solid waste, trash, cleanliness)
- POTHOLE_ROADS (Road damage, craters, divider, footpath)
- STREETLIGHTS (Dark poles, blown bulbs, non-working street lamps)
- DRAINAGE_SEWAGE (Blocked drains, sewage overflow, gutters)
- WATER_SUPPLY (Drinking water shortage, pipeline leakage)
- WOMEN_SAFETY (Harassment, dark unlit alleys, security)
- PUBLIC_INFRASTRUCTURE (Parks, government buildings, benches)
- OTHER

Priorities available:
- URGENT (immediate danger to human life, live electrical hazards, gas leak)
- HIGH (severe health hazard, blocked main road, complete water outage)
- MEDIUM (standard repair, broken bulb, uncollected waste)
- LOW (minor aesthetic defect, non-urgent maintenance)

Respond strictly in JSON matching:
{
  "category": "ONE OF THE CATEGORIES ABOVE",
  "confidenceScore": number (0 to 100),
  "department": "Department Name",
  "priority": "URGENT" | "HIGH" | "MEDIUM" | "LOW",
  "summary": "1 sentence brief",
  "reasoning": ["point 1", "point 2"]
}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return NextResponse.json({
              ...parsed,
              department: parsed.department || getDepartmentForCategory(parsed.category),
              aiEngine: "Gemini 2.0 Flash",
            });
          }
        }
      } catch (err) {
        console.warn("[AI Suggest] Gemini API failed, falling back to rule engine:", err);
      }
    }

    // Deterministic Rule-Based Fallback
    const ruleResult = analyzeWithRules(title, description);
    return NextResponse.json(ruleResult);
  } catch (err: any) {
    console.error("[AI Suggest] Handler error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze complaint" }, { status: 500 });
  }
}
