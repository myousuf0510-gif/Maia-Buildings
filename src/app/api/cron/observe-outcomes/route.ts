import { NextRequest, NextResponse } from "next/server";
import { observePendingOutcomes } from "@/lib/agents/outcome-observer";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * GET /api/cron/observe-outcomes
 * Scheduled by Vercel Cron. For each executed run 24–168h old that doesn't
 * yet have an outcome, reads the current fatigue score and writes the outcome JSONB.
 *
 * Query params (manual invocation):
 *   ?minAgeHours=1       — override the 24h minimum (useful for demo)
 *   ?effectivenessDrop=5 — override the effective threshold
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth =
      req.headers.get("authorization") ??
      req.headers.get("Authorization") ??
      "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const minAgeHours = Number(url.searchParams.get("minAgeHours")) || undefined;
  const maxAgeHours = Number(url.searchParams.get("maxAgeHours")) || undefined;
  const effectivenessDrop =
    Number(url.searchParams.get("effectivenessDrop")) || undefined;

  const summary = await observePendingOutcomes({
    minAgeHours,
    maxAgeHours,
    effectivenessDrop,
  });

  return NextResponse.json(summary);
}

export async function POST(req: NextRequest) {
  return GET(req);
}
