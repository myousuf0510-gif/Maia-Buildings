"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentRun } from "@/lib/agents/types";

const STATUS_META: Record<
  AgentRun["status"],
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  proposed: {
    label: "AWAITING REVIEW",
    color: "#B45309",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    icon: <Clock className="w-3 h-3" />,
  },
  notified: {
    label: "AWAITING REVIEW",
    color: "#B45309",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: "APPROVED",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.08)",
    border: "rgba(37,99,235,0.2)",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  executed: {
    label: "EXECUTED",
    color: "#059669",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: "REJECTED",
    color: "#DC2626",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    icon: <XCircle className="w-3 h-3" />,
  },
  expired: {
    label: "EXPIRED",
    color: "#6B7280",
    bg: "rgba(107,114,128,0.08)",
    border: "rgba(107,114,128,0.2)",
    icon: <Clock className="w-3 h-3" />,
  },
  failed: {
    label: "FAILED",
    color: "#DC2626",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return "—";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export function DecisionCard({
  run,
  onApprove,
  onReject,
  defaultOpen = false,
}: {
  run: AgentRun;
  onApprove?: (run: AgentRun) => void;
  onReject?: (run: AgentRun) => void;
  defaultOpen?: boolean;
}) {
  const meta = STATUS_META[run.status];
  const [open, setOpen] = useState(defaultOpen);
  const pending = run.status === "proposed" || run.status === "notified";
  const confidencePct = Math.round(run.confidence_score * 100);
  const staffName = run.trigger_payload.staff_name as string;

  return (
    <div
      className="solid-card overflow-hidden animate-fade-in"
      style={{
        borderLeft: pending ? "3px solid #F59E0B" : undefined,
      }}
    >
      {/* Top bar — clickable to expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <span
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9.5px] font-bold tracking-[0.1em] uppercase"
          style={{
            color: meta.color,
            background: meta.bg,
            border: `1px solid ${meta.border}`,
          }}
        >
          {meta.icon}
          {meta.label}
        </span>

        <span className="text-[11px] font-semibold text-slate-400 font-mono tracking-wider">
          {run.id.toUpperCase()}
        </span>

        <span className="text-[11px] text-slate-500">{formatTime(run.triggered_at)}</span>

        <span className="flex-1 min-w-0 ml-2 truncate text-[14px] font-semibold text-slate-900">
          {staffName}
          <span className="text-slate-400 font-normal ml-2">
            · Fatigue {run.trigger_payload.fatigue_score}
          </span>
        </span>

        <span className="text-[11px] text-slate-500 whitespace-nowrap">
          <span className="font-semibold text-slate-700">{confidencePct}%</span> conf
        </span>

        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-5 space-y-5 animate-fade-in">
          {/* Trigger + summary */}
          <div>
            <Label>Trigger</Label>
            <p className="text-[13.5px] text-slate-700 leading-relaxed">
              {staffName} crossed {run.trigger_type === "fatigue_threshold_breach" ? "fatigue threshold" : "consecutive shifts threshold"}:{" "}
              <span className="font-mono font-semibold text-slate-900">
                {run.trigger_payload.fatigue_score}/100
              </span>{" "}
              (threshold {String(run.trigger_payload.threshold)}).
            </p>
          </div>

          {/* Drivers */}
          <div>
            <Label>Top drivers</Label>
            <div className="space-y-1.5">
              {run.reasoning.drivers.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1 text-[13px] text-slate-700">{d.label}</div>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{ width: `${d.weight * 100}%` }}
                    />
                  </div>
                  <div className="w-9 text-[11px] text-slate-500 font-mono tabular-nums text-right">
                    {Math.round(d.weight * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Proposed action */}
          <div>
            <Label>
              <Sparkles className="w-3 h-3 inline-block mr-1 text-blue-600" />
              Proposed action
            </Label>
            <div
              className="p-3.5 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(124,58,237,0.04) 100%)",
                border: "1px solid rgba(37,99,235,0.12)",
              }}
            >
              <p className="text-[13.5px] text-slate-800 leading-relaxed font-medium">
                {run.proposed_action.description}
              </p>
              <div className="mt-3 flex items-center gap-4 text-[11.5px]">
                {run.proposed_action.impact.fatigue_delta !== undefined && (
                  <ImpactChip
                    label="Δ Fatigue"
                    value={`${run.proposed_action.impact.fatigue_delta > 0 ? "+" : ""}${run.proposed_action.impact.fatigue_delta} pts`}
                    good={(run.proposed_action.impact.fatigue_delta ?? 0) < 0}
                  />
                )}
                {run.proposed_action.impact.cost_delta !== undefined && (
                  <ImpactChip
                    label="Δ Cost"
                    value={
                      run.proposed_action.impact.cost_delta === 0
                        ? "$0"
                        : `${run.proposed_action.impact.cost_delta > 0 ? "+" : "−"}$${Math.abs(run.proposed_action.impact.cost_delta)}`
                    }
                    good={(run.proposed_action.impact.cost_delta ?? 0) <= 0}
                  />
                )}
                {run.proposed_action.impact.compliance_impact && (
                  <ImpactChip
                    label="Compliance"
                    value={run.proposed_action.impact.compliance_impact}
                    good={run.proposed_action.impact.compliance_impact === "improve"}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Counterfactual side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className="p-3.5 rounded-xl"
              style={{
                background: "rgba(16,185,129,0.04)",
                border: "1px solid rgba(16,185,129,0.15)",
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700 mb-1.5">
                If accepted
              </div>
              <p className="text-[12.5px] text-slate-800 leading-relaxed">
                {run.counterfactual.if_accepted.outcome_summary}
              </p>
            </div>
            <div
              className="p-3.5 rounded-xl"
              style={{
                background: "rgba(239,68,68,0.04)",
                border: "1px solid rgba(239,68,68,0.15)",
              }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-700 mb-1.5">
                If ignored
              </div>
              <p className="text-[12.5px] text-slate-800 leading-relaxed">
                {run.counterfactual.if_ignored.outcome_summary}
              </p>
            </div>
          </div>

          {/* Historical evidence */}
          <div className="flex items-center gap-2 text-[11.5px] text-slate-500">
            <span className="font-mono">
              {run.counterfactual.historical.total_cases} similar cases
            </span>
            <span>·</span>
            <span>
              acceptance led to improvement in{" "}
              <span className="font-mono font-semibold text-slate-700">
                {Math.round(run.counterfactual.historical.acceptance_led_to_improvement_pct * 100)}%
              </span>
            </span>
          </div>

          {/* Footer — Approve/Reject or audit */}
          {pending ? (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onApprove?.(run)}
                className="btn-primary !py-2.5 !px-5 flex-1 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Execute
              </button>
              <button
                type="button"
                onClick={() => onReject?.(run)}
                className="btn-secondary !py-2.5 !px-5 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
              <button
                type="button"
                className="btn-secondary !py-2.5 !px-5"
              >
                Modify
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-[11.5px]">
              {run.approved_by && (
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-[0.1em] mb-0.5 text-[9.5px]">
                    {run.status === "rejected" ? "Rejected by" : "Approved by"}
                  </div>
                  <div className="text-slate-800 font-medium flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {run.approved_by}
                  </div>
                </div>
              )}
              {run.response_time_seconds && (
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-[0.1em] mb-0.5 text-[9.5px]">
                    Response time
                  </div>
                  <div className="text-slate-800 font-mono font-medium">
                    {formatDuration(run.response_time_seconds)}
                  </div>
                </div>
              )}
              {run.executed_at && (
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-[0.1em] mb-0.5 text-[9.5px]">
                    Executed
                  </div>
                  <div className="text-slate-800 font-mono font-medium">
                    {formatTime(run.executed_at)}
                  </div>
                </div>
              )}
              {run.estimated_savings > 0 && (
                <div>
                  <div className="text-slate-400 font-semibold uppercase tracking-[0.1em] mb-0.5 text-[9.5px]">
                    Est. savings
                  </div>
                  <div className="text-emerald-700 font-mono font-semibold">
                    ${run.estimated_savings.toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Outcome block */}
          {run.outcome && (
            <div
              className="p-3.5 rounded-xl"
              style={{
                background: "rgba(15,23,42,0.02)",
                border: "1px solid rgba(15,23,42,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className={cn("w-3.5 h-3.5", run.outcome.effective ? "text-emerald-600" : "text-amber-600")} />
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                  Outcome · {formatTime(run.outcome.observed_at)}
                </div>
              </div>
              <ul className="space-y-1">
                {run.outcome.notes.map((n, i) => (
                  <li
                    key={i}
                    className="text-[12.5px] text-slate-700 flex items-start gap-2"
                  >
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2">
      {children}
    </div>
  );
}

function ImpactChip({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-slate-500 font-semibold uppercase tracking-[0.08em] text-[10px]">
        {label}
      </span>
      <span
        className={cn(
          "font-mono font-bold tabular-nums",
          good ? "text-emerald-700" : "text-red-700",
        )}
      >
        {value}
      </span>
    </span>
  );
}
