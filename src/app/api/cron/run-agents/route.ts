import { NextRequest, NextResponse } from "next/server";
import { runAgentOnce, listActiveAgents } from "@/lib/agents/runner";

export const runtime = "nodejs";
export const maxDuration = 60; // allow up to 60s for multi-agent runs

/**
 * GET /api/cron/run-agents
 *
 * Scheduled entry point for Vercel Cron. Iterates every active agent and
 * runs one pass per agent. Returns a summary for the Vercel Cron logs.
 *
 * Security: Vercel Cron requests include an Authorization: Bearer <CRON_SECRET>
 * header. We verify it against process.env.CRON_SECRET. If no CRON_SECRET is
 * configured (dev mode), we allow the request so you can hit it locally.
 */
export async function GET(req: NextRequest) {
  // Auth check — production requires CRON_SECRET
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization") ?? req.headers.get("Authorization") ?? "";
    const expected = `Bearer ${secret}`;
    if (auth !== expected) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const started = Date.now();
  const agents = await listActiveAgents();

  if (agents.length === 0) {
    return NextResponse.json({
      ok: true,
      mode: "cron",
      active_agents: 0,
      results: [],
      duration_ms: Date.now() - started,
      note: "No active agents; nothing to do.",
    });
  }

  // Run each active agent sequentially (simple, safe, avoids rate limit collisions)
  const results = [];
  for (const a of agents) {
    const result = await runAgentOnce(a.id as string);
    results.push(result);
  }

  const summary = {
    ok: true,
    mode: "cron",
    active_agents: agents.length,
    total_new_runs: results.filter((r) => r.ok && r.run_id).length,
    skipped: results.filter((r) => r.skipped_reason).length,
    failed: results.filter((r) => !r.ok).length,
    results,
    duration_ms: Date.now() - started,
  };

  return NextResponse.json(summary);
}

/**
 * Allow POST too — some cron providers (and manual curl testing) prefer it.
 */
export async function POST(req: NextRequest) {
  return GET(req);
}
