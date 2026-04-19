import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

/**
 * POST /api/ask-maia
 * body: { question: string }
 * returns: { answer, source, model?, context? }
 *
 * Buildings-domain assistant for Royal York Property Management.
 */

const SYSTEM_PROMPT = `You are MAIA, a property-intelligence assistant for Royal York Property Management — a 120-building, 11,400-unit residential portfolio across the Greater Toronto Area.

You answer questions from property managers, asset managers, the ops director, and the CEO. You have access to live portfolio data: buildings, tenants, leases, work orders, arrears, energy telemetry, compliance obligations, vendor performance, and a log of decisions made by autonomous MAIA Agents.

When answering:
- Cite specific numbers from the CONTEXT block.
- Keep it to 2–4 short paragraphs, max ~180 words.
- If you recommend an action, say "MAIA suggests…" and be specific (which building, what action, when, why).
- Never speculate beyond the provided context. If the data isn't there, say so and suggest what to look at next.
- Format: plain text with short line breaks. No headers, no bullets unless truly needed for clarity.
- Confidence tone: use percentages when you can (e.g. "confidence 91%"), otherwise say "high", "moderate", or "low".
- Always stay in the property-management domain. Never reference shifts, fatigue, airport operations, or workforce-specific terminology.`;

interface BuildingsContext {
  org: string;
  headline: {
    buildings: number;
    units: number;
    residents: number;
    occupancy_pct: number;
    monthly_rent_under_mgmt_usd: number;
    open_work_orders: number;
    overdue_work_orders: number;
    arrears_tenants: number;
    arrears_balance_usd: number;
    compliance_alerts: number;
  };
  agents: { name: string; status: string }[];
  recent_decisions_summary: {
    total_this_week: number;
    auto_assigned: number;
    human_approved: number;
    acceptance_rate: number;
    est_savings_week_usd: number;
  };
  critical_case: {
    building: string;
    unit: string;
    issue: string;
    status: string;
    projected_resolution_hours: number;
  };
  jurisdiction: string;
}

function buildLiveContext(): BuildingsContext {
  return {
    org: "Royal York Property Management · GTA",
    headline: {
      buildings: 120,
      units: 11_400,
      residents: 22_800,
      occupancy_pct: 94.7,
      monthly_rent_under_mgmt_usd: 28_500_000,
      open_work_orders: 186,
      overdue_work_orders: 14,
      arrears_tenants: 186,
      arrears_balance_usd: 412_000,
      compliance_alerts: 8,
    },
    agents: [
      { name: "Dispatch Agent",              status: "live" },
      { name: "Work Order Market",           status: "live" },
      { name: "Vacancy & Turnover Watcher",  status: "live" },
      { name: "Arrears Sentinel",            status: "live" },
      { name: "Energy & Utility Optimizer",  status: "live" },
      { name: "Compliance Sentinel",         status: "live" },
      { name: "Turnover Orchestrator",       status: "live" },
      { name: "Briefing Composer",           status: "live" },
    ],
    recent_decisions_summary: {
      total_this_week: 2_847,
      auto_assigned: 2_588,
      human_approved: 259,
      acceptance_rate: 94,
      est_savings_week_usd: 18_400,
    },
    critical_case: {
      building: "842 Bay St",
      unit: "1404",
      issue: "Water leak through living room ceiling",
      status: "Dispatch Agent auto-assigned Apex Plumbing (ETA 18 min)",
      projected_resolution_hours: 2,
    },
    jurisdiction: "Ontario · RTA + Fire Code + TSSA + WSIB",
  };
}

function demoAnswer(question: string, ctx: BuildingsContext): string {
  const q = question.toLowerCase();

  if (q.includes("arrears") || q.includes("rent") || q.includes("late") || q.includes("delinquent")) {
    return `Arrears Sentinel is tracking ${ctx.headline.arrears_tenants} tenants with a combined balance of $${(ctx.headline.arrears_balance_usd / 1000).toFixed(0)}K. Most are early-stage — soft reminders already sent.

Seven tenants are in N4 territory (≥15 days overdue, balance above one month's rent). MAIA has drafted RTA-compliant N4 notices for each — they're waiting on your approval in the Arrears queue.

MAIA suggests reviewing the N4 queue today: delaying past day 20 adds roughly $180 per tenant in LTB filing prep and pushes average recovery out by 3 weeks. Confidence: high.`;
  }

  if (q.includes("work order") || q.includes("dispatch") || q.includes("emergency") || q.includes("leak") || q.includes("flood")) {
    return `${ctx.headline.open_work_orders} open work orders portfolio-wide, ${ctx.headline.overdue_work_orders} overdue. Dispatch Agent auto-assigned 2,588 of this week's 2,847 orders (91% auto rate).

Top active case: ${ctx.critical_case.building} Unit ${ctx.critical_case.unit} — ${ctx.critical_case.issue.toLowerCase()}. ${ctx.critical_case.status}. Projected resolution ${ctx.critical_case.projected_resolution_hours}h.

MAIA suggests reviewing the Work Order Market for the ${ctx.headline.overdue_work_orders} overdue items — most are routine and can be batch-escalated to their fallback vendor with one click.`;
  }

  if (q.includes("energy") || q.includes("hvac") || q.includes("heat") || q.includes("cost") || q.includes("utility")) {
    return `Energy Optimizer saved $4,280 last week across 22 buildings by widening overnight HVAC setpoint drift during off-peak TOU windows. Portfolio energy intensity is running 2.3 kWh/sqft below the GTA Class B office benchmark.

Top opportunity: expand BMS integration to 14 more buildings — projected $38K/month incremental savings based on the pilot cohort. The ClimateCare HVAC contract bid came in $38K under incumbent for a 4-building package; MAIA flagged it as a clean swap.

MAIA suggests reviewing Energy Intelligence → Savings Opportunities. Confidence: 87%.`;
  }

  if (q.includes("vacancy") || q.includes("turnover") || q.includes("flip") || q.includes("lease")) {
    return `Vacancy Watcher is tracking 68 units actively turning over, with 14 flagged as pipeline bottlenecks (painters booked solid, flooring delivery delay). Average expected flip time is 12 days, target is 14.

Projected rent lift across the current flip wave: +$42K/month (+8% average uplift vs. current rents).

MAIA suggests adding a second painter vendor to the rotation for buildings in the downtown core — that's where the bottleneck is concentrated. Turnover Orchestrator has a draft posting ready.`;
  }

  if (q.includes("compliance") || q.includes("fire") || q.includes("inspection") || q.includes("tssa") || q.includes("elevator")) {
    return `Compliance Sentinel is tracking ${ctx.headline.compliance_alerts} active alerts on a ±90-day horizon.

Critical right now: Elevator #3 at 622 Lorne Park — TSSA annual inspection overdue by 4 days. Two buildings have fire alarm inspections due in the next 8 days (140 Queen St, 228 Dundas St W); MAIA has pre-booked LCI Fire Safety for both.

One contractor compliance flag: Hydro Electric Inc. — WSIB clearance lapsed. Dispatch Agent has auto-blocked 3 pending assignments until renewal. MAIA suggests escalating to their admin today.`;
  }

  if (q.includes("vendor") || q.includes("contractor") || q.includes("fairness") || q.includes("rotation")) {
    return `Vendor pool has 214 active contractors. Monthly fairness audit is clean — no single vendor exceeds the 25% share cap in any trade.

Top performers this month: Apex Plumbing (4.8★, 98% SLA), ClimateCare HVAC (4.8★, 96%), Precision Painters (4.6★). Hydro Electric Inc. is flagged for WSIB lapse.

MAIA suggests reviewing the Vendor Performance page for a contract renegotiation with ClimateCare — their volume has grown 34% QoQ and they're underpriced against market rate by ~12%.`;
  }

  if (q.includes("agent") || q.includes("maia") || q.includes("autonomous")) {
    const agents = ctx.agents;
    const active = agents.filter((a) => a.status === "live");
    return `You have ${agents.length} MAIA Agents running across the portfolio — all ${active.length} are live.

Busiest this week: Dispatch Agent (${ctx.recent_decisions_summary.auto_assigned} auto-assignments), Energy Optimizer (continuous optimization across 22 BMS-integrated buildings), Arrears Sentinel (drafted 7 N4 notices for your review).

Total this week: ${ctx.recent_decisions_summary.total_this_week} decisions, ${ctx.recent_decisions_summary.acceptance_rate}% acceptance rate, $${(ctx.recent_decisions_summary.est_savings_week_usd / 1000).toFixed(1)}K estimated savings from executed actions. Confidence: high.`;
  }

  if (q.includes("occupancy") || q.includes("vacant") || q.includes("portfolio")) {
    return `Portfolio occupancy is running at ${ctx.headline.occupancy_pct}% across ${ctx.headline.units.toLocaleString()} units — on par with the GTA benchmark for residential.

Monthly rent under management: $${(ctx.headline.monthly_rent_under_mgmt_usd / 1_000_000).toFixed(1)}M. 68 units currently in turnover pipeline.

MAIA suggests focusing on the 8 buildings with health scores below 55 — they account for 40% of overdue work orders and 28% of arrears balance. The Portfolio Map surfaces them as red pins.`;
  }

  // Generic
  return `I can answer questions about arrears, work orders, vacancies, energy, compliance, vendors, or any specific building using your live portfolio data.

Right now I can tell you: ${ctx.headline.buildings} buildings · ${ctx.headline.units.toLocaleString()} units · ${ctx.headline.occupancy_pct}% occupancy · $${(ctx.headline.monthly_rent_under_mgmt_usd / 1_000_000).toFixed(1)}M monthly rent. ${ctx.headline.open_work_orders} open work orders, ${ctx.headline.arrears_tenants} arrears cases, ${ctx.headline.compliance_alerts} compliance alerts.

Ask me something specific — e.g. "what's happening at 842 Bay Street", "who's most at risk for arrears this month", "which vendors are above their fairness cap", "how much did we save on energy this week".`;
}

export async function POST(req: NextRequest) {
  let body: { question?: string } = {};
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const question = (body.question ?? "").trim();
  if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });

  const ctx = buildLiveContext();

  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
  if (hasKey) {
    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const resp = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 640,
        system: SYSTEM_PROMPT + "\n\nCONTEXT (live):\n" + JSON.stringify(ctx, null, 2),
        messages: [{ role: "user", content: question }],
      });
      const text = resp.content[0]?.type === "text" ? resp.content[0].text : "";
      return NextResponse.json({ answer: text, source: "claude", model: resp.model });
    } catch (err) {
      return NextResponse.json({
        answer: demoAnswer(question, ctx) +
          `\n\n(Note: Claude API call failed — falling back to demo. ${(err as Error).message})`,
        source: "demo",
        error: (err as Error).message,
      });
    }
  }

  return NextResponse.json({ answer: demoAnswer(question, ctx), source: "demo" });
}
