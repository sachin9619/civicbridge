/**
 * GET /api/ai/civicpulse
 *
 * CivicPulse — Live Neighborhood Intelligence.
 * Returns AI-generated civic alerts derived from actual complaint records.
 * Publicly accessible (no auth required) but:
 *   - Sensitive complaints are strictly excluded
 *   - Personal citizen data is never included
 *   - Alert text is grounded in actual database records
 *
 * Query params:
 *   category?  filter by category
 *   limit?     max alerts (default 10)
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  isAIConfigured,
  generateStructuredJSON,
  GEMINI_MODEL,
} from "@/lib/ai/gemini";

export const maxDuration = 45;

interface CivicAlert {
  id: string;
  headline: string;
  summary: string;
  category: string;
  affectedArea: string;
  reportCount: number;
  firstReported: string;
  latestUpdate: string;
  status: string;
  verificationLevel: "citizen_reported" | "multiple_reports" | "official_confirmed" | "resolved" | "stale";
  relatedComplaintIds: string[];
  coordinates?: { lat: number; lng: number };
  severity: "low" | "medium" | "high" | "urgent";
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);

  const supabase = await createClient();

  // Fetch recent non-sensitive complaints
  let query = supabase
    .from("complaints")
    .select(
      "id, tracking_id, title, category, status, priority, address, latitude, longitude, created_at, updated_at"
    )
    .eq("is_sensitive", false) // NEVER expose sensitive complaints
    .not("status", "in", '("REJECTED")')
    .order("created_at", { ascending: false })
    .limit(50);

  if (category) {
    query = query.eq("category", category);
  }

  const { data: complaints, error } = await query;

  if (error) {
    return Response.json({ error: "Database error" }, { status: 500 });
  }

  if (!complaints || complaints.length === 0) {
    return Response.json({ alerts: [], total: 0, model: null });
  }

  // Group complaints by category + approximate area
  // Uses a simple deterministic clustering: same category + similar address keywords
  const groups = groupComplaints(complaints);
  const topGroups = groups.slice(0, limit);

  // If AI is not configured, return deterministic alerts without AI text
  if (!isAIConfigured()) {
    const deterministicAlerts: CivicAlert[] = topGroups.map((g) =>
      buildDeterministicAlert(g)
    );
    return Response.json({
      alerts: deterministicAlerts,
      total: deterministicAlerts.length,
      model: null,
      aiAvailable: false,
    });
  }

  // Generate AI headlines and summaries
  const alerts: CivicAlert[] = [];

  for (const group of topGroups) {
    try {
      const base = buildDeterministicAlert(group);
      const context = group.complaints
        .slice(0, 5)
        .map(
          (c) =>
            `- ${c.tracking_id}: "${c.title}" | Status: ${c.status} | Priority: ${c.priority} | Area: ${c.address ?? "Unknown"} | Reported: ${new Date(c.created_at).toLocaleDateString("en-IN")}`
        )
        .join("\n");

      const aiResult = await generateStructuredJSON<{
        headline: string;
        summary: string;
      }>({
        role: "citizen",
        prompt: `Based on the following civic complaint records, generate a factual civic alert.

Rules:
- Use only information present in the source records
- Never invent traffic conditions, road closures, casualties, or government announcements
- Use "reported" language, not confirmed facts unless status is RESOLVED
- Keep headline under 10 words
- Keep summary under 50 words
- Affected area: "${base.affectedArea}"
- Category: ${base.category}
- Report count: ${base.reportCount}
- Verification level: ${base.verificationLevel}`,
        context,
        schemaDescription: '{ "headline": "string (max 10 words)", "summary": "string (max 50 words)" }',
      });

      alerts.push({
        ...base,
        headline: aiResult?.headline ?? base.headline,
        summary: aiResult?.summary ?? base.summary,
      });
    } catch {
      alerts.push(buildDeterministicAlert(group));
    }
  }

  return Response.json({
    alerts,
    total: alerts.length,
    model: GEMINI_MODEL,
    aiAvailable: true,
    generatedAt: new Date().toISOString(),
  });
}

// -------------------------------------------------------------------
// Deterministic complaint grouping
// -------------------------------------------------------------------

interface ComplaintRecord {
  id: string;
  tracking_id: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

interface ComplaintGroup {
  key: string;
  category: string;
  complaints: ComplaintRecord[];
  representativeArea: string;
  latestStatus: string;
  highestPriority: string;
}

function groupComplaints(complaints: ComplaintRecord[]): ComplaintGroup[] {
  const groups = new Map<string, ComplaintRecord[]>();

  for (const c of complaints) {
    // Group by category + first word of address (rough area)
    const areaKey = c.address?.split(",")[0]?.trim()?.toLowerCase() ?? "unknown";
    const key = `${c.category}|${areaKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  return Array.from(groups.entries())
    .map(([key, cs]) => ({
      key,
      category: cs[0].category,
      complaints: cs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
      representativeArea: cs[0].address?.split(",").slice(0, 2).join(",").trim() ?? "Unknown area",
      latestStatus: cs.reduce((latest, c) =>
        new Date(c.updated_at) > new Date(latest.updated_at) ? c : latest
      ).status,
      highestPriority: getPriorityRank(cs),
    }))
    .sort((a, b) => b.complaints.length - a.complaints.length);
}

function getPriorityRank(complaints: ComplaintRecord[]): string {
  const order = ["URGENT", "HIGH", "MEDIUM", "LOW"];
  for (const p of order) {
    if (complaints.some((c) => c.priority === p)) return p;
  }
  return "LOW";
}

function buildDeterministicAlert(group: ComplaintGroup): CivicAlert {
  const cs = group.complaints;
  const count = cs.length;
  const oldest = cs[cs.length - 1];
  const newest = cs[0];

  const allResolved = cs.every((c) => c.status === "RESOLVED");
  const anyOfficiallyConfirmed = cs.some((c) => c.status === "RESOLVED");

  let verificationLevel: CivicAlert["verificationLevel"];
  if (allResolved) verificationLevel = "resolved";
  else if (count >= 3) verificationLevel = "multiple_reports";
  else if (anyOfficiallyConfirmed) verificationLevel = "official_confirmed";
  else verificationLevel = "citizen_reported";

  // Check staleness: last update more than 7 days ago
  const daysSinceUpdate =
    (Date.now() - new Date(newest.updated_at).getTime()) /
    (1000 * 60 * 60 * 24);
  if (daysSinceUpdate > 7 && !allResolved)
    verificationLevel = "stale";

  const categoryLabel = group.category.replace(/_/g, " ").toLowerCase();

  const headline =
    count === 1
      ? `${categoryLabel} reported near ${group.representativeArea}`
      : `${count} ${categoryLabel} reports near ${group.representativeArea}`;

  const summary =
    count === 1
      ? `A ${categoryLabel} issue has been citizen-reported near ${group.representativeArea}. Status: ${group.latestStatus.replace(/_/g, " ")}.`
      : `${count} citizen reports of ${categoryLabel} near ${group.representativeArea}. Latest status: ${group.latestStatus.replace(/_/g, " ")}.`;

  // Find representative coordinates
  const withCoords = cs.find((c) => c.latitude && c.longitude);

  return {
    id: group.key,
    headline,
    summary,
    category: group.category,
    affectedArea: group.representativeArea,
    reportCount: count,
    firstReported: oldest.created_at,
    latestUpdate: newest.updated_at,
    status: group.latestStatus,
    verificationLevel,
    relatedComplaintIds: cs.map((c) => c.id),
    coordinates:
      withCoords?.latitude && withCoords?.longitude
        ? { lat: withCoords.latitude, lng: withCoords.longitude }
        : undefined,
    severity: group.highestPriority.toLowerCase() as CivicAlert["severity"],
  };
}

