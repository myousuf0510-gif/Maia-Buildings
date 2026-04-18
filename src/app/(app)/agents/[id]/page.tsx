"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pause,
  Settings as SettingsIcon,
  Activity,
  MessageSquare,
  FileText,
  BarChart3,
  Sliders,
  Play,
  ShieldAlert,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Zap,
  Loader2,
} from "lucide-react";
import {
  useAgent,
  useAgentRuns,
  computeMetrics,
  approveRun as approveRunRemote,
  rejectRun as rejectRunRemote,
} from "@/lib/agents/data";
import { AgentStatusPill } from "@/components/agents/AgentStatusPill";
import { MetricTile } from "@/components/agents/MetricTile";
import { DecisionCard } from "@/components/agents/DecisionCard";
import type { AgentRun } from "@/lib/agents/types";

const TABS = ["Decisions", "Performance", "Configuration", "Activity"] as const;
type Tab = (typeof TABS)[number];

export default function AgentInspectorPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: agent } = useAgent(params.id);
  const { data: baseRuns, source } = useAgentRuns(params.id);

  // Local state mirrors the server response so optimistic approve/reject works
  const [runs, setRuns] = useState<AgentRun[]>(baseRuns);
  useEffect(() => setRuns(baseRuns), [baseRuns]);

  const metrics = useMemo(
    () => (agent ? computeMetrics(runs, agent.id) : null),
    [agent, runs],
  );

  const [tab, setTab] = useState<Tab>("Decisions");
  const [paused, setPaused] = useState(false);
  const [runFilter, setRunFilter] = useState<"all" | "pending" | "executed" | "rejected">("all");
  const [runNowState, setRunNowState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [runNowMessage, setRunNowMessage] = useState<string | null>(null);

  const triggerRunNow = async () => {
    if (!agent || runNowState === "running") return;
    setRunNowState("running");
    setRunNowMessage(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}/run-once`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setRunNowState("done");
        setRunNowMessage(
          `${data.reasoning_source === "claude" ? "Claude" : "Synthesized"} · ${data.candidate?.name ?? "candidate"} · ${data.run_id}`,
        );
        // Reload the page to pick up the new run
        setTimeout(() => window.location.reload(), 900);
      } else {
        setRunNowState("error");
        setRunNowMessage(data.error ?? "Run failed");
      }
    } catch (e) {
      setRunNowState("error");
      setRunNowMessage((e as Error).message);
    }
  };

  if (!agent || !metrics) {
    return (
      <div className="px-8 py-12 text-center">
        <h1 className="text-[20px] font-bold text-slate-900 mb-2">Agent not found</h1>
        <Link href="/agents" className="text-blue-600">
          ← Back to agents
        </Link>
      </div>
    );
  }

  const filteredRuns = runs.filter((r) => {
    if (runFilter === "all") return true;
    if (runFilter === "pending")
      return r.status === "proposed" || r.status === "notified";
    return r.status === runFilter;
  });

  const approveRun = async (run: AgentRun) => {
    const approverName = "James Mitchell";
    const now = new Date().toISOString();
    const executed = new Date(Date.now() + 2500).toISOString();
    // Optimistic update
    setRuns((prev) =>
      prev.map((r) =>
        r.id === run.id
          ? {
              ...r,
              status: "executed",
              approved_by: approverName,
              approved_at: now,
              executed_at: executed,
              response_time_seconds: Math.floor(
                (Date.now() - new Date(r.triggered_at).getTime()) / 1000,
              ),
              estimated_savings: r.estimated_savings || 2140,
            }
          : r,
      ),
    );
    // Persist (falls back to no-op in mock mode)
    await approveRunRemote(run.id, approverName);
  };

  const rejectRun = async (run: AgentRun) => {
    const approverName = "James Mitchell";
    const now = new Date().toISOString();
    setRuns((prev) =>
      prev.map((r) =>
        r.id === run.id
          ? {
              ...r,
              status: "rejected",
              approved_by: approverName,
              approved_at: now,
              response_time_seconds: Math.floor(
                (Date.now() - new Date(r.triggered_at).getTime()) / 1000,
              ),
            }
          : r,
      ),
    );
    await rejectRunRemote(run.id, approverName);
  };

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      {/* Back link */}
      <Link
        href="/agents"
        className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Agents
      </Link>

      {/* Hero */}
      <div
        className="solid-card p-6 mb-5 relative overflow-hidden animate-fade-in"
        style={{
          background:
            "linear-gradient(135deg, #FFFFFF 0%, rgba(248,250,252,0.6) 60%, rgba(37,99,235,0.02) 100%)",
        }}
      >
        {/* Plasma accent */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-[360px] h-[180px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 100% 0%, rgba(37,99,235,0.12) 0%, transparent 60%)",
            filter: "blur(20px)",
          }}
        />

        <div className="relative flex items-start gap-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)",
              border: "1px solid rgba(37,99,235,0.18)",
            }}
          >
            <ShieldAlert className="w-7 h-7 text-blue-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-[26px] font-bold tracking-[-0.02em] text-slate-900">
                {agent.name}
              </h1>
              <AgentStatusPill
                status={paused && agent.status === "active" ? "paused" : agent.status}
                autonomy={agent.autonomy}
              />
            </div>
            <p className="text-[13.5px] text-slate-600 leading-relaxed max-w-3xl mb-4">
              {agent.description}
            </p>
            <div className="flex items-center flex-wrap gap-3 text-[11px] text-slate-500">
              <Meta label="Deployed">
                {agent.deployed_at
                  ? new Date(agent.deployed_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </Meta>
              <span className="text-slate-300">·</span>
              <Meta label="Jurisdiction">
                {agent.config.guardrails.jurisdiction}
              </Meta>
              <span className="text-slate-300">·</span>
              <Meta label="Scope">
                {agent.config.scope.all_departments
                  ? "All departments"
                  : `${agent.config.scope.department_ids?.length ?? 0} departments`}
              </Meta>
              <span className="text-slate-300">·</span>
              <Meta label="Max/hour">
                {agent.config.guardrails.max_decisions_per_hour} decisions
              </Meta>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Run Now — manually trigger a single agent pass */}
            <button
              type="button"
              onClick={triggerRunNow}
              disabled={runNowState === "running" || agent.status !== "active"}
              className="btn-primary flex items-center gap-1.5"
              title={
                agent.status !== "active"
                  ? "Agent is not active"
                  : "Trigger a single manual run — scans live fatigue data and generates a new decision"
              }
            >
              {runNowState === "running" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running…
                </>
              ) : runNowState === "done" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Queued
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Run Now
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setPaused((v) => !v)}
              className="btn-secondary"
            >
              {paused ? (
                <>
                  <Play className="w-4 h-4 inline-block mr-1.5" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 inline-block mr-1.5" />
                  Pause
                </>
              )}
            </button>
            <button type="button" className="btn-secondary">
              <SettingsIcon className="w-4 h-4 inline-block mr-1.5" />
              Configure
            </button>
          </div>
        </div>
        {runNowMessage && (
          <div
            className="relative mt-4 mx-6 px-3 py-2 rounded-lg text-[11.5px] font-medium"
            style={{
              background:
                runNowState === "error"
                  ? "rgba(239,68,68,0.06)"
                  : "rgba(16,185,129,0.06)",
              border: `1px solid ${runNowState === "error" ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.22)"}`,
              color: runNowState === "error" ? "#DC2626" : "#059669",
            }}
          >
            {runNowState === "error" ? "⚠ " : "✓ "}
            {runNowMessage}
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <MetricTile
          label="Total Runs"
          value={metrics.total_runs.toLocaleString()}
          sub="lifetime"
          className="card-enter-1"
        />
        <MetricTile
          label="Acceptance"
          value={`${Math.round(metrics.acceptance_rate * 100)}%`}
          sub="last 15 days"
          accent="green"
          className="card-enter-2"
        />
        <MetricTile
          label="Avg Response"
          value={formatDur(metrics.avg_response_seconds)}
          sub="proposal → decision"
          className="card-enter-3"
        />
        <MetricTile
          label="Est. Savings"
          value={`$${(metrics.estimated_savings / 1000).toFixed(0)}K`}
          sub="this quarter"
          accent="green"
          className="card-enter-4"
        />
        <MetricTile
          label="Effectiveness"
          value={`${Math.round(metrics.effectiveness_rate * 100)}%`}
          sub="post-hoc outcome"
          accent="blue"
          className="card-enter-5"
        />
        <MetricTile
          label="Pending Review"
          value={metrics.pending_review}
          sub={metrics.pending_review > 0 ? "needs your decision" : "all clear"}
          accent={metrics.pending_review > 0 ? "amber" : "green"}
          className="card-enter-6"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 mb-5">
        {TABS.map((t) => {
          const active = t === tab;
          const Icon =
            t === "Decisions"
              ? MessageSquare
              : t === "Performance"
                ? BarChart3
                : t === "Configuration"
                  ? Sliders
                  : Activity;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className="relative px-4 py-3 text-[13px] font-semibold flex items-center gap-2 transition-colors"
              style={{ color: active ? "#2563EB" : "#64748B" }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t}
              {active && (
                <span
                  className="absolute left-0 right-0 bottom-[-1px] h-[2px] rounded-full"
                  style={{
                    background:
                      "linear-gradient(90deg, #2563EB 0%, #7C3AED 100%)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab bodies */}
      {tab === "Decisions" && (
        <div className="space-y-4">
          {/* Filter chips */}
          <div className="flex items-center gap-2 mb-1">
            <FilterChip
              active={runFilter === "all"}
              onClick={() => setRunFilter("all")}
            >
              All · {runs.length}
            </FilterChip>
            <FilterChip
              active={runFilter === "pending"}
              onClick={() => setRunFilter("pending")}
              accent="amber"
            >
              Pending · {runs.filter((r) => r.status === "proposed" || r.status === "notified").length}
            </FilterChip>
            <FilterChip
              active={runFilter === "executed"}
              onClick={() => setRunFilter("executed")}
              accent="green"
            >
              Executed · {runs.filter((r) => r.status === "executed").length}
            </FilterChip>
            <FilterChip
              active={runFilter === "rejected"}
              onClick={() => setRunFilter("rejected")}
              accent="red"
            >
              Rejected · {runs.filter((r) => r.status === "rejected").length}
            </FilterChip>
          </div>

          {filteredRuns.slice(0, 24).map((run, i) => (
            <DecisionCard
              key={run.id}
              run={run}
              onApprove={approveRun}
              onReject={rejectRun}
              defaultOpen={i === 0}
            />
          ))}
          {filteredRuns.length > 24 && (
            <div className="text-center text-[12px] text-slate-500 py-4">
              Showing 24 of {filteredRuns.length} runs · Load more
            </div>
          )}
        </div>
      )}

      {tab === "Performance" && <PerformanceTab runs={runs} />}
      {tab === "Configuration" && <ConfigurationTab agent={agent} />}
      {tab === "Activity" && <ActivityTab runs={runs} />}
    </div>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-semibold uppercase tracking-[0.08em] text-[10px] text-slate-400">
        {label}
      </span>
      <span className="font-mono font-medium text-slate-700">{children}</span>
    </span>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: "amber" | "green" | "red";
}) {
  const accentColor =
    accent === "amber"
      ? "#D97706"
      : accent === "green"
        ? "#059669"
        : accent === "red"
          ? "#DC2626"
          : "#2563EB";

  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-[11.5px] font-semibold transition-all"
      style={{
        background: active ? accentColor : "rgba(15,23,42,0.04)",
        color: active ? "#FFFFFF" : "#475569",
        border: active
          ? `1px solid ${accentColor}`
          : "1px solid rgba(15,23,42,0.06)",
      }}
    >
      {children}
    </button>
  );
}

function formatDur(s: number) {
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function PerformanceTab({ runs }: { runs: AgentRun[] }) {
  // Aggregate daily counts for a simple SVG bar chart
  const byDay = useMemo(() => {
    const map = new Map<string, { executed: number; rejected: number }>();
    for (const r of runs) {
      const d = new Date(r.triggered_at).toISOString().slice(0, 10);
      if (!map.has(d)) map.set(d, { executed: 0, rejected: 0 });
      const bucket = map.get(d)!;
      if (r.status === "executed") bucket.executed++;
      else if (r.status === "rejected") bucket.rejected++;
    }
    return Array.from(map.entries())
      .sort()
      .slice(-14)
      .map(([d, v]) => ({ day: d, ...v }));
  }, [runs]);

  const maxDay = Math.max(1, ...byDay.map((b) => b.executed + b.rejected));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="solid-card p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="text-[13px] font-bold text-slate-900">Daily Activity — last 14 days</h3>
          <span className="text-[11px] text-slate-400">Executed vs Rejected</span>
        </div>
        <div className="h-[200px] flex items-end gap-1.5">
          {byDay.map((d) => (
            <div
              key={d.day}
              className="flex-1 flex flex-col-reverse gap-0.5 h-full"
              title={`${d.day}: ${d.executed} executed, ${d.rejected} rejected`}
            >
              <div
                className="w-full rounded-sm"
                style={{
                  background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                  height: `${(d.executed / maxDay) * 180}px`,
                }}
              />
              <div
                className="w-full rounded-sm"
                style={{
                  background: "linear-gradient(180deg, #EF4444 0%, #DC2626 100%)",
                  height: `${(d.rejected / maxDay) * 180}px`,
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10.5px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-emerald-500" /> Executed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-red-500" /> Rejected
          </span>
        </div>
      </div>

      <div className="solid-card p-5">
        <h3 className="text-[13px] font-bold text-slate-900 mb-4">Outcome Distribution</h3>
        <div className="space-y-3">
          <OutcomeRow
            label="Effective"
            value={runs.filter((r) => r.outcome?.effective).length}
            total={runs.filter((r) => r.outcome).length}
            color="#059669"
          />
          <OutcomeRow
            label="Ineffective"
            value={
              runs.filter((r) => r.outcome && !r.outcome.effective).length
            }
            total={runs.filter((r) => r.outcome).length}
            color="#D97706"
          />
        </div>

        <div className="border-t border-slate-100 mt-5 pt-4">
          <h3 className="text-[13px] font-bold text-slate-900 mb-3">Impact — this quarter</h3>
          <div className="space-y-2.5 text-[12.5px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Avg fatigue reduction</span>
              <span className="font-mono font-semibold text-slate-900">−12.4 pts</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Compliance breaches prevented</span>
              <span className="font-mono font-semibold text-slate-900">31</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Unplanned OT prevented</span>
              <span className="font-mono font-semibold text-emerald-700">$52,340</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Avg manager time saved</span>
              <span className="font-mono font-semibold text-slate-900">2.8 hrs/wk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OutcomeRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[12.5px] mb-1.5">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-500 font-mono">
          <span className="font-semibold text-slate-900">{value}</span> / {total}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function ConfigurationTab({ agent }: { agent: ReturnType<typeof getAgent> }) {
  if (!agent) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="solid-card p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3">
          Triggers
        </h3>
        <div className="space-y-2.5">
          {agent.config.triggers.map((t, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg text-[12.5px]"
              style={{
                background: "rgba(37,99,235,0.03)",
                border: "1px solid rgba(37,99,235,0.08)",
              }}
            >
              <div className="font-mono font-semibold text-slate-900">{t.type}</div>
              {t.threshold !== undefined && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  threshold ≥ {t.threshold}
                </div>
              )}
              {t.window && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  window: {t.window}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="solid-card p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3">
          Actions
        </h3>
        <div className="space-y-2.5">
          {agent.config.actions.map((a, i) => (
            <div
              key={i}
              className="p-2.5 rounded-lg text-[12.5px]"
              style={{
                background: "rgba(124,58,237,0.03)",
                border: "1px solid rgba(124,58,237,0.08)",
              }}
            >
              <div className="font-mono font-semibold text-slate-900">{a.type}</div>
              {a.channel && (
                <div className="text-[11px] text-slate-500 mt-0.5">
                  via {a.channel}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="solid-card p-5">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-3">
          Guardrails
        </h3>
        <div className="space-y-2.5 text-[12.5px]">
          <GuardrailRow
            label="Jurisdiction"
            value={agent.config.guardrails.jurisdiction}
          />
          <GuardrailRow
            label="Max decisions/hr"
            value={agent.config.guardrails.max_decisions_per_hour}
          />
          <GuardrailRow
            label="Off-hours policy"
            value={agent.config.guardrails.off_hours_autonomy ?? "same"}
          />
          <GuardrailRow
            label="Dry-run"
            value={agent.config.guardrails.dry_run ? "on" : "off"}
          />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1.5">
              Always human-approve if
            </div>
            {agent.config.guardrails.require_human_approval_if.map((rule) => (
              <span
                key={rule}
                className="badge badge-amber inline-flex mr-1 mb-1 text-[10px]"
              >
                {rule}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GuardrailRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function ActivityTab({ runs }: { runs: AgentRun[] }) {
  const events = useMemo(() => {
    return runs
      .slice(0, 40)
      .flatMap((r) => {
        const list: { ts: string; icon: string; actor: string; text: string; runId: string }[] = [];
        list.push({
          ts: r.triggered_at,
          icon: "⚡",
          actor: "MAIA",
          text: `triggered on ${r.trigger_payload.staff_name} — ${r.trigger_type}`,
          runId: r.id,
        });
        if (r.approved_at && r.approved_by) {
          list.push({
            ts: r.approved_at,
            icon: r.status === "rejected" ? "✕" : "✓",
            actor: r.approved_by,
            text: `${r.status === "rejected" ? "rejected" : "approved"} ${r.id}`,
            runId: r.id,
          });
        }
        if (r.executed_at) {
          list.push({
            ts: r.executed_at,
            icon: "→",
            actor: "MAIA",
            text: `executed reassignment for ${r.trigger_payload.staff_name}`,
            runId: r.id,
          });
        }
        if (r.outcome) {
          list.push({
            ts: r.outcome.observed_at,
            icon: r.outcome.effective ? "✓" : "·",
            actor: "MAIA",
            text: `outcome observed: ${r.outcome.effective ? "effective" : "ineffective"}`,
            runId: r.id,
          });
        }
        return list;
      })
      .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
      .slice(0, 60);
  }, [runs]);

  return (
    <div className="solid-card p-5">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-[13px] font-bold text-slate-900">Append-only event log</h3>
        <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider">
          Decisions Ledger · Read-only
        </span>
      </div>
      <div className="space-y-0 relative">
        <div
          aria-hidden
          className="absolute left-[9px] top-3 bottom-3 w-[1px] bg-slate-100"
        />
        {events.map((e, i) => (
          <div
            key={i}
            className="relative flex items-center gap-3 py-2 pl-7 pr-2 rounded-lg text-[12px] hover:bg-slate-50/50 transition-colors group"
          >
            <span
              className="absolute left-0 w-[18px] h-[18px] rounded-full flex items-center justify-center font-mono text-[10px] bg-white border"
              style={{
                borderColor: "rgba(15,23,42,0.12)",
                color: e.icon === "✓" ? "#059669" : e.icon === "✕" ? "#DC2626" : "#475569",
              }}
            >
              {e.icon}
            </span>
            <span className="font-mono text-[10.5px] text-slate-400 w-[92px] shrink-0">
              {new Date(e.ts).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
            <span className="font-semibold text-slate-700 w-[110px] shrink-0 truncate">
              {e.actor}
            </span>
            <span className="text-slate-600 flex-1 truncate">{e.text}</span>
            <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {e.runId}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
