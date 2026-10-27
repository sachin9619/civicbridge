/**
 * GET /api/cron/sla
 *
 * Scheduled Cron Worker for SLA Escalation.
 * Safe to be scheduled on Vercel Cron or GitHub Actions (e.g. hourly: '0 * * * *').
 * Idempotent: Can run repeatedly without creating duplicate escalation events.
 */

import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 45;

export async function GET(req: NextRequest) {
  // Pass through to the POST /api/sla/escalate handler internally
  const url = new URL("/api/sla/escalate", req.url);
  const cronSecret = process.env.CRON_SECRET;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {}),
    },
  });

  const data = await res.json();
  return NextResponse.json({
    cron: "CivicBridge SLA Escalation Cron",
    result: data,
  }, { status: res.status });
}
