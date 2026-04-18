"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bot, ArrowRight } from "lucide-react";
import { useAgents, useAgentRuns, computeMetrics } from "@/lib/agents/data";

/**
 * Compact status strip in the top-nav showing MAIA Agents are actively watching.
 * - Aggregates across all ACTIVE agents (currently Fatigue Guardian)
 * - Pulses amber when there are pending decisions (draws the eye)
 * - Click → navigates to /agents for triage
 * - Reads live from Supabase via data hooks (falls back to mock automatically)
 */
export function LiveAgentIndicator() {
  const { data: agents, source } = useAgents();
  const active = useMemo(
    () => agents.filter((a) => a.status === "active"),
    [agents],
  );
  const primary = active[0];
  const { data: runs } = useAgentRuns(primary?.id ?? "");

  const metrics = useMemo(
    () => (primary ? computeMetrics(runs, primary.id) : null),
    [runs, primary],
  );

  const data = useMemo(
    () => ({
      activeCount: active.length,
      totalRuns: metrics?.total_runs ?? 0,
      totalPending: metrics?.pending_review ?? 0,
      primaryName: primary?.name ?? "Agents",
    }),
    [active.length, metrics, primary],
  );

  const hasPending = data.totalPending > 0;

  return (
    <Link
      href="/agents"
      className="group flex items-center gap-2.5 px-3 py-1.5 rounded-lg shrink-0 transition-all"
      style={{
        background: hasPending ? "rgba(245,158,11,0.06)" : "rgba(37,99,235,0.04)",
        border: `1px solid ${hasPending ? "rgba(245,158,11,0.25)" : "rgba(37,99,235,0.15)"}`,
      }}
      title={
        hasPending
          ? `${data.totalPending} decision${data.totalPending === 1 ? "" : "s"} waiting for review · source: ${source}`
          : `${data.primaryName} is watching ${data.totalRuns.toLocaleString()} decisions · source: ${source}`
      }
    >
      {/* Pulsing dot */}
      <span className="relative flex items-center justify-center w-2 h-2 shrink-0">
        <span
          className="absolute inline-flex w-full h-full rounded-full"
          style={{
            background: hasPending ? "#F59E0B" : "#2563EB",
            opacity: 0.4,
            animation: "pulse-dot 2s ease-in-out infinite",
          }}
        />
        <span
          className="relative w-1.5 h-1.5 rounded-full"
          style={{ background: hasPending ? "#F59E0B" : "#2563EB" }}
        />
      </span>

      <Bot
        className="w-3.5 h-3.5 shrink-0"
        style={{ color: hasPending ? "#D97706" : "#2563EB" }}
      />

      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold tracking-wide leading-none">
        <span
          className="uppercase tracking-[0.08em]"
          style={{ color: hasPending ? "#D97706" : "#2563EB" }}
        >
          {data.primaryName}
        </span>
        <span className="text-slate-300">·</span>
        <span className="font-mono text-slate-600 tabular-nums">
          {data.totalRuns}
        </span>
        <span className="text-slate-400">decisions</span>

        {hasPending && (
          <>
            <span className="text-slate-300">·</span>
            <span
              className="font-mono font-bold tabular-nums px-1.5 py-0.5 rounded"
              style={{
                background: "#F59E0B",
                color: "#FFFFFF",
              }}
            >
              {data.totalPending} PENDING
            </span>
          </>
        )}

        {/* Subtle source indicator — green dot when Supabase, grey when mock */}
        <span
          className="w-1 h-1 rounded-full shrink-0 ml-0.5"
          style={{
            background: source === "supabase" ? "#10B981" : "#CBD5E1",
            boxShadow: source === "supabase" ? "0 0 4px rgba(16,185,129,0.55)" : "none",
          }}
        />
      </div>

      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-slate-700 transition-all" />
    </Link>
  );
}
