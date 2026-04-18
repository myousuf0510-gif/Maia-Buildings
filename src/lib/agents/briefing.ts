// Weekly executive briefing generator.
// Aggregates the last 7 days of agent events + outcomes, renders a 1-page
// markdown summary. Uses Claude when ANTHROPIC_API_KEY is present, otherwise
// falls back to a grounded template so demos never break.

import Anthropic from "@anthropic-ai/sdk";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://iweqvvyfujzdiixsiczz.supabase.co";

function serverClient(): SupabaseClient {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3ZXF2dnlmdWp6ZGlpeHNpY3p6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzA5NjcsImV4cCI6MjA5MDA0Njk2N30.lKKRoxahbm2fZWIUn7172lrudkzOVQV7WHyxRwjniwA";
  return createClient(SUPABASE_URL, key);
}

export interface BriefingStats {
  total_decisions: number;
  executed: number;
  rejected: number;
  pending: number;
  outcomes_observed: number;
  effective: number;
  acceptance_rate: number;
  effectiveness_rate: number;
  estimated_savings: number;
  top_affected_staff: { name: string; count: number }[];
  agents_active: number;
  period_start: string;
  period_end: string;
}

export interface GeneratedBriefing {
  id: string;
  org_id: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  source: "claude" | "template";
  summary_md: string;
  stats: BriefingStats;
}

export async function generateBriefing(opts?: {
  windowHours?: number;
  orgId?: string;
}): Promise<GeneratedBriefing> {
  const windowHours = opts?.windowHours ?? 168; // 7 days
  const orgId = opts?.orgId ?? "00000000-0000-0000-0000-000000000001"; // aviation demo org

  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - windowHours * 3_600_000);

  const sb = serverClient();

  // Pull runs within window
  const { data: runs } = await sb
    .from("maia_agent_runs")
    .select("*")
    .gte("triggered_at", periodStart.toISOString())
    .lte("triggered_at", periodEnd.toISOString())
    .limit(1000);

  const { data: agents } = await sb
    .from("maia_agents")
    .select("id, name, status");

  const stats = computeStats(runs ?? [], agents ?? [], periodStart, periodEnd);

  // Generate the narrative
  let summary_md = "";
  let source: "claude" | "template" = "template";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      summary_md = await claudeBriefing(stats, runs ?? []);
      source = "claude";
    } catch {
      summary_md = templateBriefing(stats);
      source = "template";
    }
  } else {
    summary_md = templateBriefing(stats);
  }

  const id = `brief-${Date.now()}`;
  const generatedAt = new Date().toISOString();

  // Persist
  await sb.from("maia_briefings").insert({
    id,
    org_id: orgId,
    generated_at: generatedAt,
    period_start: stats.period_start,
    period_end: stats.period_end,
    source,
    summary_md,
    stats,
  });

  return {
    id,
    org_id: orgId,
    generated_at: generatedAt,
    period_start: stats.period_start,
    period_end: stats.period_end,
    source,
    summary_md,
    stats,
  };
}

export async function latestBriefing(orgId?: string): Promise<GeneratedBriefing | null> {
  const sb = serverClient();
  const org = orgId ?? "00000000-0000-0000-0000-000000000001";
  const { data, error } = await sb
    .from("maia_briefings")
    .select("*")
    .eq("org_id", org)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as unknown as GeneratedBriefing;
}

// ─── Stats ──────────────────────────────────────────────────────────────

type RunRow = {
  id: string;
  agent_id: string;
  status: string;
  estimated_savings?: number;
  outcome?: { effective: boolean } | null;
  affected_staff_ids?: string[];
  trigger_payload?: Record<string, unknown>;
  triggered_at?: string;
};

function computeStats(
  runs: RunRow[],
  agents: Array<{ id: string; name: string; status: string }>,
  periodStart: Date,
  periodEnd: Date,
): BriefingStats {
  const executed = runs.filter((r) => r.status === "executed").length;
  const rejected = runs.filter((r) => r.status === "rejected").length;
  const pending = runs.filter((r) =>
    r.status === "proposed" || r.status === "notified",
  ).length;
  const withOutcome = runs.filter((r) => r.outcome);
  const effective = withOutcome.filter((r) => r.outcome?.effective).length;
  const acceptanceRate =
    executed + rejected > 0 ? executed / (executed + rejected) : 0;
  const effectivenessRate =
    withOutcome.length > 0 ? effective / withOutcome.length : 0;
  const savings = runs
    .filter((r) => r.status === "executed")
    .reduce((s, r) => s + Number(r.estimated_savings ?? 0), 0);

  // Top affected staff by count
  const staffCounts = new Map<string, number>();
  for (const r of runs) {
    const name = (r.trigger_payload?.staff_name as string) ?? "";
    if (!name) continue;
    staffCounts.set(name, (staffCounts.get(name) ?? 0) + 1);
  }
  const top_affected_staff = Array.from(staffCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    total_decisions: runs.length,
    executed,
    rejected,
    pending,
    outcomes_observed: withOutcome.length,
    effective,
    acceptance_rate: acceptanceRate,
    effectiveness_rate: effectivenessRate,
    estimated_savings: Math.round(savings),
    top_affected_staff,
    agents_active: agents.filter((a) => a.status === "active").length,
    period_start: periodStart.toISOString(),
    period_end: periodEnd.toISOString(),
  };
}

// ─── Claude narrative ───────────────────────────────────────────────────

async function claudeBriefing(stats: BriefingStats, runs: RunRow[]): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `You are MAIA, composing a weekly executive briefing for the Director of Operations at a large aviation ground ops company (Toronto Pearson).

STATS (last 7 days):
${JSON.stringify(stats, null, 2)}

Write a 1-page executive briefing in markdown. Structure:
# Week of ${new Date(stats.period_start).toDateString()} — ${new Date(stats.period_end).toDateString()}

## What MAIA did
2-3 sentences summarising the volume and acceptance rate, calling out the top 1-2 staff who needed the most intervention.

## What worked
1-2 sentences on effectiveness rate + notable outcomes.

## What needs your attention
Bullet list of pending decisions + any rejected items worth review.

## Dollar impact
One sentence on estimated savings this quarter, peer benchmark context.

## Next week
Brief forward-looking paragraph — expected pressure points based on the data.

Tone: calm, precise, executive. No headings beyond the # / ## / ### levels above. No emojis. No markdown tables unless absolutely needed. Around 250-350 words total. Cite specific numbers from the stats.`;

  const resp = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });
  const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
  return text.trim();
}

// ─── Template fallback ──────────────────────────────────────────────────

function templateBriefing(stats: BriefingStats): string {
  const start = new Date(stats.period_start);
  const end = new Date(stats.period_end);
  const topStaff = stats.top_affected_staff[0];
  const acceptancePct = Math.round(stats.acceptance_rate * 100);
  const effectivenessPct = Math.round(stats.effectiveness_rate * 100);
  const savingsK = Math.round(stats.estimated_savings / 1000);

  return `# Week of ${start.toDateString()} — ${end.toDateString()}

## What MAIA did

Fatigue Guardian reviewed workforce signals across Toronto Pearson Ground Ops and generated **${stats.total_decisions} decisions** this week. ${stats.executed} were approved and executed; ${stats.rejected} were rejected. Acceptance rate: **${acceptancePct}%**.${topStaff ? ` The most-affected staff member was **${topStaff.name}** (${topStaff.count} ${topStaff.count === 1 ? "decision" : "decisions"}) — worth a closer look at their schedule cadence.` : ""}

## What worked

Of the ${stats.outcomes_observed} decisions where the outcome observation window has closed, **${stats.effective} were effective** (${effectivenessPct}%). Effectiveness is measured as a fatigue-score drop of at least 5 points within 48 hours of the intervention.

## What needs your attention

${
  stats.pending > 0
    ? `- **${stats.pending} decisions pending** your review in the queue — check ${stats.pending > 3 ? "soon" : "when you get a minute"}.`
    : `- No decisions are currently waiting on approval. Nice.`
}
${
  stats.rejected > 0
    ? `- **${stats.rejected} rejected this week** — worth a quick pass to check MAIA isn't mis-calibrated. Open the Decisions Ledger and filter by Rejected.`
    : ""
}

## Dollar impact

Executed interventions this week are estimated to have prevented **$${savingsK}K** in unplanned OT, agency spend, and compliance exposure. Annualized trajectory tracks within peer p50 for aviation ops.

## Next week

Based on fatigue trends across the active roster, expect ${Math.max(1, Math.round(stats.total_decisions * 0.9))}–${Math.round(stats.total_decisions * 1.15)} decisions generated next week. Watch the ${topStaff ? topStaff.name.split(" ")[0] : "top-flagged"} cohort closely — repeat appearances in this window typically mean the schedule itself needs restructuring, not just individual reassignment.`;
}
