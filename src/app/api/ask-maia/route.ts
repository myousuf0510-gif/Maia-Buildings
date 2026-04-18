import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * POST /api/ask-maia
 * body: { question: string }
 * returns: { answer: string, source: 'claude' | 'demo', model?: string, context?: object }
 *
 * Strategy:
 *   1) Build a compact live-context object from Supabase
 *      (agents snapshot + recent runs + headline metrics).
 *   2) If ANTHROPIC_API_KEY is set, call Claude with that context + the question.
 *   3) Otherwise, pattern-match against the question and return a canned but
 *      realistic answer grounded in the same context. Never break the demo.
 */

const SYSTEM_PROMPT = `You are MAIA, a workforce intelligence assistant for a large aviation ground operations company (Toronto Pearson).

You answer questions from directors, managers, and compliance officers. You have access to live workforce data: staff records, shifts, fatigue scores, compliance signals, cost ledgers, and a log of decisions made by autonomous MAIA Agents.

When answering:
- Cite specific numbers from the CONTEXT block.
- Keep it to 2-4 short paragraphs, max ~180 words.
- If you recommend an action, say "MAIA suggests…" and be specific (who, what, when, why).
- Never speculate beyond the provided context. If the data isn't there, say so and suggest what to look at next.
- Format: plain text with short line breaks. No headers, no bullets unless truly needed for clarity.
- Confidence tone: use percentages when you can (e.g. "confidence 91%"), otherwise say "high", "moderate", or "low".`;

async function buildLiveContext() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iweqvvyfujzdiixsiczz.supabase.co";
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXF2dnlmdWp6ZGlpeHNpY3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzA5NjcsImV4cCI6MjA5MDA0Njk2N30.lKKRoxahbm2fZWIUn7172lrudkzOVQV7WHyxRwjniwA";
    const sb = createClient(url, key);

    const [agents, pendingRuns, recentRuns] = await Promise.all([
      sb.from("maia_agents").select("id, name, type, status, autonomy"),
      sb
        .from("maia_agent_runs")
        .select(
          "id, agent_id, status, confidence_score, trigger_payload, proposed_action, triggered_at",
        )
        .in("status", ["proposed", "notified"])
        .order("triggered_at", { ascending: false })
        .limit(5),
      sb
        .from("maia_agent_runs")
        .select("id, status, estimated_savings, confidence_score, triggered_at, outcome")
        .order("triggered_at", { ascending: false })
        .limit(20),
    ]);

    const runsTotal = recentRuns.data?.length ?? 0;
    const executed = recentRuns.data?.filter((r) => r.status === "executed").length ?? 0;
    const rejected = recentRuns.data?.filter((r) => r.status === "rejected").length ?? 0;
    const acceptance =
      executed + rejected > 0 ? executed / (executed + rejected) : 0;
    const savings =
      recentRuns.data?.reduce(
        (s, r) => s + Number(r.estimated_savings ?? 0),
        0,
      ) ?? 0;

    return {
      org: "Toronto Pearson Ground Operations (Aviation)",
      headline: {
        active_staff: 820,
        sla_compliance_pct: 91.2,
        open_escalations: 23,
        peer_sla_p50_pct: 92.0,
        overtime_monthly_usd: 41000,
        peer_overtime_p50_usd: 41000,
        estimated_savings_q: 412_000,
        fatigue_critical_count: 2,
        fatigue_at_risk_count: 3,
        open_coverage_gaps_next_7d: 4,
      },
      agents: agents.data ?? [],
      pending_decisions: pendingRuns.data ?? [],
      recent_decisions_summary: {
        last_20_runs: runsTotal,
        executed,
        rejected,
        acceptance_rate: Math.round(acceptance * 100),
        estimated_savings_last20: savings,
      },
      critical_fatigue_case: {
        name: "James Martinez",
        department: "Ground Operations",
        fatigue_score: 84,
        consecutive_shifts: 6,
        rest_period_hours: 9.2,
        jurisdiction_min_rest_hours: 11,
        tier: 1,
        account_arr_usd: 2_400_000,
      },
      labour_law_jurisdiction: "ON-CA",
    };
  } catch {
    // Supabase unavailable — return static fallback
    return {
      org: "Toronto Pearson Ground Operations (Aviation)",
      headline: {
        active_staff: 820,
        sla_compliance_pct: 91.2,
        fatigue_critical_count: 2,
        estimated_savings_q: 412_000,
      },
      agents: [{ name: "Fatigue Guardian", type: "fatigue_guardian", status: "active" }],
      pending_decisions: [],
      recent_decisions_summary: {},
      critical_fatigue_case: {
        name: "James Martinez",
        fatigue_score: 84,
      },
      source_note: "Supabase unavailable; using fallback snapshot.",
    };
  }
}

function demoAnswer(question: string, ctx: Record<string, unknown>): string {
  const q = question.toLowerCase();

  if (q.includes("sick") || q.includes("absent") || q.includes("call in")) {
    return `Based on fatigue scores, recent attendance, and shift patterns, four staff are at elevated risk of calling in sick this week.

James Martinez (fatigue 84/100, 6 consecutive shifts) is the highest-risk: historical base rate for this fatigue band is 3.6× average absenteeism. Anh Nguyen, Ravi Patel, and Marcus Brown are the other three — all crossed the 68-threshold in the last 72 hours.

MAIA suggests pre-confirming Monday's Gate Ops roster with 1 backup picker from Central region. Confidence: high (similar patterns historically led to 3+ no-shows 82% of the time).`;
  }

  if (q.includes("fatigue") || q.includes("martinez") || q.includes("breach")) {
    return `James Martinez is your most urgent case. Fatigue score 84/100 — critical. Six consecutive shifts (Mar 20–25). Rest period 9.2h falls below the ON-CA 11h minimum, so a labour law violation is already recorded.

The Fatigue Guardian proposed a reassignment 14m ago: Night Ramp (Apr 18 22:00) → Morning Gate (Apr 19 06:00). Projected fatigue relief: −14 points. Cost delta: zero. Coverage stays intact.

Confidence: 91%. This is waiting on your approval in the Decisions queue. If you wait until tomorrow, probability of breach rises to 87% and est. unplanned OT: $2,140.`;
  }

  if (q.includes("overtime") || q.includes(" ot ") || q.includes("cost")) {
    return `Current OT spend is $41K/month — sitting at peer p50 for aviation (industry p90 is $82K, so you're safely in band). Gate Operations is the outlier, approaching its weekly $12K cap.

MAIA has identified $156.8K in annualized savings across agency avoidance (38%), OT optimization (29%), and absenteeism reduction (18%). 54% actioned to date. True Labour Cost vs payroll gap for the current 820-person roster: $1.26M hidden (14% of payroll).

MAIA suggests shifting 1 FTE from part-time to full-time at $4.2K/mo cost, eliminating $8.1K/mo in recurring OT — net +$3.9K/mo.`;
  }

  if (q.includes("coverage") || q.includes("shift") || q.includes("sunday") || q.includes("open")) {
    return `Shift coverage this week: 96.5% — at industry p50. Three unassigned shifts on Sunday 06:00 in Ground Ops, with roughly 4 hours to the posting-notice deadline.

MAIA identified 2 available certified staff cross-trained in Ramp (Terry Okafor, Anh Nguyen), with 88% acceptance probability based on their last 6 months of voluntary shift pickups. Estimated cost vs agency: −$1,840.

MAIA suggests sending offers to both simultaneously with incentive pay (+10%) — historical response-time is 18 minutes.`;
  }

  if (q.includes("compliance") || q.includes("violation") || q.includes("rest period") || q.includes("labour law")) {
    return `Five active compliance items across 9 labour-law jurisdictions (ON-CA is primary).

One critical: James Martinez rest-period violation — 9.2h between shifts vs 11h ON-CA minimum. Two warnings: working hours approaching 48h (Mike Rodriguez, Ground Ops), certification expiring in 7 days (Jennifer Liu, Passenger Services). One minor OT overage, resolved.

MAIA's Compliance Sentinel is running in dry-run mode — it's caught every violation in the last 14 days without auto-executing. Recommend flipping it to Approve-to-Execute once you've reviewed the dry-run log.`;
  }

  if (q.includes("agent") || q.includes("maia")) {
    const agents = (ctx.agents as Array<{ name?: string; status?: string }>) ?? [];
    const active = agents.filter((a) => a.status === "active");
    const activeNames = active.map((a) => a.name).join(", ") || "Fatigue Guardian";
    return `You have ${agents.length} MAIA Agents configured. ${active.length} active: ${activeNames}. The rest are in draft (Compliance Sentinel, Demand Watcher).

Fatigue Guardian has logged 247 decisions this quarter with 94% acceptance rate and est. $412K savings. Average response time from proposal to manager decision: 2m 18s.

MAIA suggests activating Compliance Sentinel next — it's been running in dry-run for 11 days and caught 17 violations with zero false positives. Estimated annualized value: $84K in avoided tribunals and audit prep.`;
  }

  if (q.includes("peer") || q.includes("benchmark") || q.includes("industry") || q.includes("compare")) {
    return `Against the 127 aviation ops orgs in the MAIA benchmarks network, you're sitting at:

P52 for SLA compliance (91.2% vs industry p50 92.0%) — slightly below median, recoverable this quarter.
P48 for OT spend ($41K/mo vs p50 $41K) — at median, no action needed.
P34 for forecast accuracy (88% vs p50 83%) — top third, your demand model is working.
P71 for compliance violations — 7 this quarter vs p50 of 4. This is the weakest benchmark — MAIA suggests this is where to focus.`;
  }

  // Generic
  return `I can answer workforce, fatigue, compliance, OT, coverage, and agent-activity questions using your live data.

Right now I can tell you: 820 active staff, SLA compliance 91.2% (peer p50 92%), 2 critical fatigue cases (James Martinez at the top), 23 open escalations, 3 decisions pending your approval in the Fatigue Guardian queue.

Ask me something specific — e.g. "who's at risk of calling in sick tomorrow", "what's driving the compliance violations", "how much OT are we running vs peers", or "what's the Martinez situation".`;
}

export async function POST(req: NextRequest) {
  let body: { question?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = (body.question ?? "").trim();
  if (!question) {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  const ctx = await buildLiveContext();
  const ctxJson = JSON.stringify(ctx, null, 2);

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (hasKey) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 640,
        system: SYSTEM_PROMPT + "\n\nCONTEXT (live):\n" + ctxJson,
        messages: [{ role: "user", content: question }],
      });
      const text =
        resp.content[0]?.type === "text" ? resp.content[0].text : "";
      return NextResponse.json({
        answer: text,
        source: "claude",
        model: resp.model,
        context_summary: summarizeCtx(ctx),
      });
    } catch (err) {
      return NextResponse.json({
        answer:
          demoAnswer(question, ctx) +
          `\n\n(Note: Claude API call failed — falling back to demo answer. ${(err as Error).message})`,
        source: "demo",
        error: (err as Error).message,
        context_summary: summarizeCtx(ctx),
      });
    }
  }

  return NextResponse.json({
    answer: demoAnswer(question, ctx),
    source: "demo",
    context_summary: summarizeCtx(ctx),
  });
}

function summarizeCtx(ctx: Record<string, unknown>) {
  const agents = (ctx.agents as Array<{ name?: string }>) ?? [];
  const pending = (ctx.pending_decisions as unknown[]) ?? [];
  return {
    agents_count: agents.length,
    pending_decisions: pending.length,
    org: ctx.org,
  };
}
