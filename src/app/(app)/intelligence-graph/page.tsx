"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Sparkles,
  Info,
  Zap,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  Bot,
  ArrowRight,
  Radio,
  Pause,
  Play,
} from "lucide-react";
import { IntelligenceGraph } from "@/components/graph/IntelligenceGraph";
import { AGENTS } from "@/lib/platform/registry";
import type { Agent, AgentRun, AgentType, RunStatus, Reasoning, ProposedAction, Counterfactual } from "@/lib/agents/types";

// ─── Synthetic run generator ─────────────────────────────────────────────────
// Deterministic, seeded, rich across all 11 registry agents. Produces a graph
// that already feels alive on first render.

const STAFF = [
  "J. Martinez", "A. Nguyen", "R. Patel", "S. Kim", "L. Diaz",
  "T. Okafor", "M. Brown", "Y. Ahmad", "D. White", "W. Chen",
  "K. Johnson", "H. Sato", "R. Garcia", "N. Anand", "B. Walker",
  "A. Singh", "E. Ng", "J. Park", "L. Singh", "M. Rodriguez",
  "J. Liu", "S. Lee", "A. Patel", "R. Kaur", "T. Nguyen",
  "B. Hernandez", "K. Okafor", "N. Tanaka", "G. Martinez", "F. Owusu",
];

const STATUSES: RunStatus[] = ["proposed", "notified", "approved", "rejected", "executed", "expired"];

// Per-agent action templates
const AGENT_ACTIONS: Record<string, { label: string; savings: number; trigger: string }[]> = {
  fatigue_guardian: [
    { label: "Swap night→morning · prevent rest breach", savings: 2140, trigger: "consecutive_shifts_breach" },
    { label: "Enforce 12h rest · move 3 agents", savings: 3400, trigger: "rest_period_violation" },
    { label: "Redistribute OT to rested peers", savings: 1890, trigger: "fatigue_threshold_breach" },
  ],
  demand_watcher: [
    { label: "Post extra morning shift · Sat 08:00", savings: 980, trigger: "coverage_gap" },
    { label: "Reduce afternoon coverage · overstaffed", savings: 1200, trigger: "coverage_gap" },
    { label: "Alert: +34% pax volume forecast", savings: 0, trigger: "cost_spike" },
  ],
  shift_market: [
    { label: "Post 3 open shifts to market", savings: 840, trigger: "coverage_gap" },
    { label: "Matched offer accepted in 3 min", savings: 420, trigger: "coverage_gap" },
  ],
  incentive_optimizer: [
    { label: "Round 2 pricing at $160 premium", savings: 0, trigger: "coverage_gap" },
    { label: "Fairness-first: rotate candidate order", savings: 280, trigger: "coverage_gap" },
  ],
  timeoff_watcher: [
    { label: "Auto-approve March break window", savings: 0, trigger: "coverage_gap" },
    { label: "Deny request · blackout Dec 24", savings: 0, trigger: "coverage_gap" },
    { label: "Approve with demand confidence 92%", savings: 0, trigger: "coverage_gap" },
  ],
  compliance_sentinel: [
    { label: "CATSA recert booking · E. Ng", savings: 1200, trigger: "certification_expiring" },
    { label: "De-icing cert lapse watch · 2 agents", savings: 2200, trigger: "certification_expiring" },
  ],
  outcome_observer: [
    { label: "Confirmed: fatigue dropped 18 pts post-swap", savings: 0, trigger: "fatigue_threshold_breach" },
    { label: "Observed: coverage held after reduction", savings: 0, trigger: "coverage_gap" },
  ],
  performance_observer: [
    { label: "Flag: 3 Q1 promotion candidates ready", savings: 0, trigger: "cost_spike" },
    { label: "Retention risk: 2 senior Ramp leads", savings: 0, trigger: "cost_spike" },
  ],
  signal_scanner: [
    { label: "Pattern detected: Monday AM sick cluster", savings: 0, trigger: "cost_spike" },
    { label: "Cross-training momentum · +3× baseline", savings: 0, trigger: "cost_spike" },
  ],
  cost_watcher: [
    { label: "Agency avoidance: internal OT cheaper", savings: 1840, trigger: "cost_spike" },
    { label: "Reallocate 6 OT hours to rested agents", savings: 680, trigger: "cost_spike" },
    { label: "Convert PT→FT · save $3.9K/mo", savings: 3900, trigger: "cost_spike" },
  ],
  briefing_composer: [
    { label: "Weekly executive brief generated", savings: 0, trigger: "cost_spike" },
  ],
};

function makeReasoning(summary: string): Reasoning {
  return {
    chain_of_thought: [
      "Pulled current-state metrics from Supabase",
      "Cross-checked against rule engine constraints",
      "Scored candidate actions on fairness + impact",
      "Selected highest-confidence action within guardrails",
    ],
    drivers: [
      { label: "Historical pattern match", weight: 0.34 },
      { label: "Current constraint stack", weight: 0.28 },
      { label: "Fairness score", weight: 0.21 },
      { label: "Cost delta", weight: 0.17 },
    ],
    sources: ["maia_workforce_state", "maia_rule_pack_esa", "maia_demand_forecasts"],
    summary,
  };
}

function makeProposedAction(label: string, savings: number): ProposedAction {
  return {
    kind: "reassignment",
    description: label,
    payload: {},
    impact: {
      fatigue_delta: -12,
      cost_delta: -savings,
      compliance_impact: "improve",
      coverage_impact: "improve",
    },
  };
}

function makeCounterfactual(): Counterfactual {
  return {
    if_accepted: { outcome_summary: "Constraint satisfied; measured improvement visible in 24h observation window." },
    if_ignored: { outcome_summary: "Likely rest-period breach + escalation to HR within 48h." },
    historical: { total_cases: 128, acceptance_led_to_improvement_pct: 0.89 },
  };
}

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233_280; return s / 233_280; };
}

function generateSyntheticRuns(): AgentRun[] {
  const runs: AgentRun[] = [];
  const r = rng(12345);
  const now = new Date();
  // 180 runs distributed with weighting toward the busy agents
  const agentWeights: Record<string, number> = {
    fatigue_guardian: 3.2,
    demand_watcher: 2.8,
    shift_market: 2.4,
    incentive_optimizer: 1.6,
    timeoff_watcher: 1.4,
    compliance_sentinel: 1.8,
    outcome_observer: 2.0,
    performance_observer: 1.0,
    signal_scanner: 1.2,
    cost_watcher: 1.6,
    briefing_composer: 0.3,
  };
  const agentPool: string[] = [];
  for (const a of AGENTS) {
    const n = Math.max(1, Math.round((agentWeights[a.id] ?? 1) * 10));
    for (let i = 0; i < n; i++) agentPool.push(a.id);
  }

  for (let i = 0; i < 180; i++) {
    const agentId = agentPool[Math.floor(r() * agentPool.length)];
    const actions = AGENT_ACTIONS[agentId] ?? AGENT_ACTIONS.fatigue_guardian;
    const action = actions[Math.floor(r() * actions.length)];
    const staff = STAFF[Math.floor(r() * STAFF.length)];

    // Time: weighted toward recent
    const hoursAgo = Math.floor(Math.pow(r(), 2.2) * 240);
    const triggeredAt = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

    // Status distribution: 55% executed, 15% approved, 10% proposed/notified, 10% outcome, 5% rejected, 5% expired
    const roll = r();
    let status: RunStatus;
    if (roll < 0.55) status = "executed";
    else if (roll < 0.70) status = "approved";
    else if (roll < 0.80) status = "proposed";
    else if (roll < 0.85) status = "notified";
    else if (roll < 0.92) status = "executed";
    else if (roll < 0.96) status = "rejected";
    else status = "expired";

    const affectedIds = [`staff-${staff.toLowerCase().replace(/[^a-z]/g, "-")}`];
    if (r() > 0.7 && agentId !== "briefing_composer") {
      const second = STAFF[Math.floor(r() * STAFF.length)];
      affectedIds.push(`staff-${second.toLowerCase().replace(/[^a-z]/g, "-")}`);
    }

    const hasOutcome = status === "executed" && r() > 0.4;
    const confidence = 0.62 + r() * 0.36;

    runs.push({
      id: `run-${i.toString().padStart(4, "0")}-${agentId}`,
      agent_id: agentId,
      triggered_at: triggeredAt,
      trigger_type: action.trigger as AgentRun["trigger_type"],
      trigger_payload: {
        staff_name: staff,
        staff_id: `staff-${staff.toLowerCase().replace(/[^a-z]/g, "-")}`,
        fatigue_score: Math.round(55 + r() * 40),
      },
      reasoning: makeReasoning(action.label),
      proposed_action: makeProposedAction(action.label, action.savings),
      counterfactual: makeCounterfactual(),
      status,
      confidence_score: Number(confidence.toFixed(2)),
      approved_by: status === "approved" || status === "executed" ? "Moe Yousuf" : null,
      approved_at: status === "approved" || status === "executed" ? triggeredAt : null,
      executed_at: status === "executed" ? triggeredAt : null,
      outcome: hasOutcome ? {
        observed_at: new Date(now.getTime() - (hoursAgo - 24) * 60 * 60 * 1000).toISOString(),
        effective: r() > 0.12,
        notes: ["Metric improved within 24h window.", "No downstream escalation triggered."],
        measured: { fatigue_delta: -12, cost_delta: -action.savings, coverage_held: 1 },
      } : null,
      affected_staff_ids: affectedIds,
      estimated_savings: action.savings,
      response_time_seconds: Math.round(20 + r() * 540),
    });
  }
  return runs.sort((a, b) => b.triggered_at.localeCompare(a.triggered_at));
}

// Convert registry agents into the Agent[] shape the graph expects
function registryToGraphAgents(): Agent[] {
  // Map registry IDs that don't match AgentType exactly → default to fatigue_guardian
  const typeMap: Record<string, AgentType> = {
    fatigue_guardian: "fatigue_guardian",
    demand_watcher: "demand_watcher",
    compliance_sentinel: "compliance_sentinel",
  };
  return AGENTS.map((a): Agent => ({
    id: a.id,
    org_id: "org-pearson",
    name: a.name,
    type: typeMap[a.id] ?? "fatigue_guardian",
    status: a.status === "live" ? "active" : a.status === "paused" ? "paused" : "draft",
    autonomy: 2,
    description: a.purpose,
    config: {
      triggers: [],
      actions: [],
      guardrails: {
        jurisdiction: "ON-CA",
        max_decisions_per_hour: 12,
        require_human_approval_if: [],
        dry_run: false,
      },
      scope: { all_departments: true },
    },
    created_by: "Moe Yousuf",
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
    deployed_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  }));
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function IntelligenceGraphPage() {
  const agents = useMemo(() => registryToGraphAgents(), []);
  const [runs, setRuns] = useState<AgentRun[]>(() => generateSyntheticRuns());
  const [live, setLive] = useState(true);
  const [tick, setTick] = useState(0);

  // Stream simulation — every 4–7 seconds, add a new run at the front
  useEffect(() => {
    if (!live) return;
    const spawn = () => {
      setRuns((prev) => {
        const fresh = generateSyntheticRuns()[0];
        const updated: AgentRun = {
          ...fresh,
          id: `live-${Date.now()}`,
          triggered_at: new Date().toISOString(),
        };
        return [updated, ...prev].slice(0, 240);
      });
      setTick((t) => t + 1);
    };
    const scheduleNext = () => {
      const delay = 4000 + Math.random() * 3000;
      return window.setTimeout(() => { spawn(); const id = scheduleNext(); timer.current = id; }, delay);
    };
    const timer = { current: 0 };
    timer.current = scheduleNext();
    return () => { if (timer.current) window.clearTimeout(timer.current); };
  }, [live]);

  const stats = useMemo(() => {
    const totalRuns = runs.length;
    const executed = runs.filter((r) => r.status === "executed").length;
    const staffIds = new Set<string>();
    runs.forEach((r) => r.affected_staff_ids?.forEach((s) => staffIds.add(s)));
    const outcomes = runs.filter((r) => r.outcome).length;
    const savedUsd = runs.filter((r) => r.status === "executed").reduce((s, r) => s + r.estimated_savings, 0);
    const pending = runs.filter((r) => r.status === "proposed" || r.status === "notified").length;
    return {
      totalRuns,
      executed,
      uniqueStaff: staffIds.size,
      outcomes,
      agents: agents.length,
      savedUsd,
      pending,
    };
  }, [runs, agents]);

  const perAgentCounts = useMemo(() => {
    const m = new Map<string, { total: number; executed: number; saved: number }>();
    for (const a of agents) m.set(a.id, { total: 0, executed: 0, saved: 0 });
    for (const r of runs) {
      const bucket = m.get(r.agent_id);
      if (!bucket) continue;
      bucket.total++;
      if (r.status === "executed") { bucket.executed++; bucket.saved += r.estimated_savings; }
    }
    return m;
  }, [runs, agents]);

  return (
    <div className="p-8 space-y-6">
      <HeroHeader stats={stats} live={live} onToggleLive={() => setLive((v) => !v)} tick={tick} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
          >
            <div className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
              <Network className="w-4 h-4 text-blue-600" />
              <div className="text-[12.5px] font-bold text-[#0F172A]">Decision ecosystem · live force-directed graph</div>
              <span className="flex-1" />
              <HelperChip icon={Sparkles} label="Drag nodes · scroll to zoom · click to inspect" />
            </div>
            <IntelligenceGraph agents={agents} runs={runs.slice(0, 60)} height={720} />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-3 space-y-4">
          <LiveStream runs={runs} />
          <AgentLeaderboard agents={agents} counts={perAgentCounts} />
        </div>
      </div>

      <OutcomeInsights stats={stats} runs={runs} />
    </div>
  );
}

function HeroHeader({
  stats, live, onToggleLive, tick,
}: {
  stats: { totalRuns: number; executed: number; uniqueStaff: number; outcomes: number; agents: number; savedUsd: number; pending: number };
  live: boolean;
  onToggleLive: () => void;
  tick: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED, #EC4899)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
        >
          <Network className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED, #EC4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Intelligence Graph · {stats.agents} agents · {stats.totalRuns.toLocaleString()} decisions
        </span>
      </div>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
            The living map of every MAIA decision
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
            Agents at the core. Decisions radiating out. Staff affected. Outcomes observed. Every link is a causal chain.
            The graph updates every few seconds as new decisions come in.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleLive}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide transition-all"
          style={{
            background: live ? "linear-gradient(135deg, #10B981, #059669)" : "#FFFFFF",
            color: live ? "#FFFFFF" : "#475569",
            border: live ? "1px solid rgba(16,185,129,0.5)" : "1px solid rgba(15,23,42,0.1)",
            boxShadow: live ? "0 2px 8px rgba(16,185,129,0.3)" : "none",
          }}
        >
          {live ? (
            <>
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-50 animate-ping" />
                <span className="relative w-2 h-2 rounded-full bg-white" />
              </span>
              Live · streaming
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              Resume stream
            </>
          )}
          {live && (
            <span className="text-[9.5px] font-mono opacity-80 ml-1 tabular-nums">
              +{tick}
            </span>
          )}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard label="Agents online" value={stats.agents} icon={Bot} accent="#2563EB" sub="all live" />
        <StatCard label="Decisions" value={stats.totalRuns.toLocaleString()} icon={Zap} accent="#7C3AED" sub="total graph" live={live} />
        <StatCard label="Executed" value={stats.executed.toLocaleString()} icon={CheckCircle2} accent="#10B981" sub={`${Math.round((stats.executed / stats.totalRuns) * 100)}% rate`} />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="#F59E0B" sub="awaiting review" live={live} />
        <StatCard label="Staff touched" value={stats.uniqueStaff} icon={Activity} accent="#0891B2" sub="unique individuals" />
        <StatCard label="Outcomes" value={stats.outcomes.toLocaleString()} icon={TrendingUp} accent="#059669" sub="verified effective" />
        <StatCard label="Saved" value={`$${(stats.savedUsd / 1000).toFixed(1)}K`} icon={Sparkles} accent="#EC4899" sub="from exec'd runs" />
      </div>
    </div>
  );
}

function StatCard({
  label, value, icon: Icon, accent, sub, live,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sub: string;
  live?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color: accent }} />
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>
          {label}
        </span>
        {live && (
          <span className="relative flex w-1.5 h-1.5 ml-auto">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-40 animate-ping" style={{ background: accent }} />
            <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          </span>
        )}
      </div>
      <div className="text-[20px] font-bold tabular-nums leading-tight text-[#0F172A]">{value}</div>
      <div className="text-[10px] text-[#64748B] mt-0.5">{sub}</div>
    </div>
  );
}

function HelperChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
      style={{ background: "rgba(37,99,235,0.04)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.15)" }}
    >
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

// ─── Live stream ─────────────────────────────────────────────────────────────

function LiveStream({ runs }: { runs: AgentRun[] }) {
  const recent = runs.slice(0, 20);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        <Radio className="w-3.5 h-3.5 text-rose-500" />
        <div className="text-[12px] font-bold text-[#0F172A]">Live event stream</div>
        <span className="ml-auto text-[10px] text-[#94A3B8]">{recent.length} most recent</span>
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: 480, scrollbarWidth: "thin" }}
      >
        <AnimatePresence initial={false}>
          {recent.map((run) => (
            <motion.div
              key={run.id}
              layout
              initial={{ opacity: 0, x: -8, backgroundColor: "rgba(37,99,235,0.1)" }}
              animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StreamRow run={run} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StreamRow({ run }: { run: AgentRun }) {
  const agent = AGENTS.find((a) => a.id === run.agent_id);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);
  const ago = timeAgo(new Date(run.triggered_at).getTime(), now);
  const staff = run.trigger_payload.staff_name as string | undefined;

  const STATUS_META: Record<RunStatus, { icon: React.ElementType; color: string; label: string }> = {
    proposed:          { icon: Clock,       color: "#D97706", label: "Proposed" },
    notified:          { icon: Clock,       color: "#D97706", label: "Notified" },
    approved:          { icon: CheckCircle2,color: "#059669", label: "Approved" },
    rejected:          { icon: XCircle,     color: "#DC2626", label: "Rejected" },
    executed:          { icon: CheckCircle2,color: "#10B981", label: "Executed" },
    expired:           { icon: Clock,       color: "#94A3B8", label: "Expired" },
    failed:            { icon: XCircle,     color: "#DC2626", label: "Failed" },
  };
  const sm = STATUS_META[run.status];
  const SIcon = sm.icon;

  return (
    <div className="px-4 py-2.5 flex items-start gap-2.5 border-b border-slate-50 hover:bg-[#F8FAFC] transition-colors">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${agent?.accent ?? "#2563EB"}14`, border: `1px solid ${agent?.accent ?? "#2563EB"}30` }}
      >
        <Bot className="w-3.5 h-3.5" style={{ color: agent?.accent ?? "#2563EB" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
          <span className="text-[11px] font-bold text-[#0F172A]">{agent?.name ?? run.agent_id}</span>
          {staff && <span className="text-[10.5px] text-[#64748B]">· {staff}</span>}
        </div>
        <div className="text-[11px] text-[#334155] leading-snug line-clamp-2">
          {run.proposed_action.description}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[9.5px]">
          <span
            className="inline-flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-bold tracking-[0.1em] uppercase"
            style={{ background: `${sm.color}10`, color: sm.color, border: `1px solid ${sm.color}26` }}
          >
            <SIcon className="w-2 h-2" />
            {sm.label}
          </span>
          <span className="font-mono text-[#94A3B8]">{ago}</span>
          {run.estimated_savings > 0 && (
            <span className="text-[#059669] font-bold tabular-nums">+${run.estimated_savings}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agent leaderboard ───────────────────────────────────────────────────────

function AgentLeaderboard({
  agents, counts,
}: {
  agents: Agent[];
  counts: Map<string, { total: number; executed: number; saved: number }>;
}) {
  const sorted = [...agents].sort((a, b) => (counts.get(b.id)?.total ?? 0) - (counts.get(a.id)?.total ?? 0));
  const maxTotal = Math.max(...sorted.map((a) => counts.get(a.id)?.total ?? 0), 1);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-[12px] font-bold text-[#0F172A]">Agent activity</div>
        <div className="text-[10px] text-[#94A3B8]">Decisions per agent · last 10d rolling</div>
      </div>
      <div className="divide-y divide-slate-50">
        {sorted.map((a) => {
          const c = counts.get(a.id) ?? { total: 0, executed: 0, saved: 0 };
          const reg = AGENTS.find((x) => x.id === a.id);
          const pct = (c.total / maxTotal) * 100;
          return (
            <Link
              key={a.id}
              href="/agents"
              className="block px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: reg?.accent ?? "#2563EB" }}
                />
                <span className="text-[11px] font-bold text-[#0F172A] truncate flex-1">{a.name}</span>
                <span className="text-[10px] font-mono text-[#64748B] tabular-nums">{c.total}</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.04)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: reg?.accent ?? "#2563EB" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <div className="flex items-center gap-3 mt-1 text-[9.5px] text-[#94A3B8]">
                <span>{c.executed} executed</span>
                {c.saved > 0 && <span className="text-[#059669] font-semibold">${(c.saved / 1000).toFixed(1)}K saved</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Outcome insights ────────────────────────────────────────────────────────

function OutcomeInsights({ stats, runs }: { stats: { totalRuns: number; executed: number; outcomes: number }; runs: AgentRun[] }) {
  const effectiveOutcomes = runs.filter((r) => r.outcome?.effective).length;
  const ineffective = runs.filter((r) => r.outcome && !r.outcome.effective).length;
  const effectiveRate = stats.outcomes > 0 ? Math.round((effectiveOutcomes / stats.outcomes) * 100) : 0;
  const avgConfidence = Math.round(runs.reduce((s, r) => s + r.confidence_score, 0) / runs.length * 100);
  const avgResponseSec = Math.round(runs.reduce((s, r) => s + (r.response_time_seconds ?? 0), 0) / runs.length);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <InsightCard
        title="Pattern: acceptance trust"
        body={`Green executed nodes cluster around Fatigue Guardian, Compliance Sentinel, and Cost Watcher — the three agents where management trust has translated to ~${Math.round((stats.executed / stats.totalRuns) * 100)}% execution rate across ${stats.totalRuns.toLocaleString()} decisions.`}
        metric={`${Math.round((stats.executed / stats.totalRuns) * 100)}%`}
        metricLabel="execution rate"
        accent="#10B981"
        icon={CheckCircle2}
      />
      <InsightCard
        title="Outcome verification"
        body={`${effectiveOutcomes} of ${stats.outcomes} observed outcomes confirmed the intervention worked; ${ineffective} flagged as ineffective and routed back to the learning loop. The 24h observation window closes every cycle.`}
        metric={`${effectiveRate}%`}
        metricLabel="effective"
        accent="#059669"
        icon={TrendingUp}
      />
      <InsightCard
        title="Confidence × speed"
        body={`Average decision confidence is ${avgConfidence}% with mean response time of ${avgResponseSec}s from trigger to proposed action. Rejected decisions concentrate on low-confidence outlier runs — exactly where a human should step in.`}
        metric={`${avgConfidence}%`}
        metricLabel={`avg · ${avgResponseSec}s`}
        accent="#2563EB"
        icon={Info}
      />
    </div>
  );
}

function InsightCard({
  title, body, metric, metricLabel, accent, icon: Icon,
}: {
  title: string;
  body: string;
  metric: string;
  metricLabel: string;
  accent: string;
  icon: React.ElementType;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: `linear-gradient(135deg, ${accent}04 0%, #FFFFFF 70%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <span className="text-[10px] font-bold tracking-[0.16em] uppercase" style={{ color: accent }}>
          {title}
        </span>
      </div>
      <div className="text-[22px] font-bold tabular-nums text-[#0F172A] leading-none mb-0.5">
        {metric}
      </div>
      <div className="text-[10px] font-bold tracking-[0.12em] uppercase text-[#94A3B8] mb-3">{metricLabel}</div>
      <p className="text-[12px] text-[#475569] leading-relaxed">{body}</p>
    </div>
  );
}

function timeAgo(timestamp: number, now: number): string {
  const delta = Math.max(0, now - timestamp);
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// Suppress lint for imports that may read as unused if graph is tree-shaken
void Pause;
