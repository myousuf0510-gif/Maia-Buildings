"use client";

import { cn } from "@/lib/utils";
import type { AgentStatus, AutonomyLevel } from "@/lib/agents/types";

const LABELS: Record<AgentStatus, string> = {
  active: "ACTIVE",
  paused: "PAUSED",
  learning: "LEARNING",
  draft: "DRAFT",
};

const STYLES: Record<AgentStatus, string> = {
  active: "badge-green",
  paused: "badge-amber",
  learning: "badge-blue",
  draft: "badge-gray",
};

export function AgentStatusPill({
  status,
  autonomy,
  className,
}: {
  status: AgentStatus;
  autonomy?: AutonomyLevel;
  className?: string;
}) {
  const autonomyLabel: Record<AutonomyLevel, string> = {
    0: "SUGGEST",
    1: "APPROVE → EXECUTE",
    2: "EXECUTE + FALLBACK",
    3: "FULLY AUTONOMOUS",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className={cn("badge", STYLES[status])}>
        {status === "active" && (
          <span className="relative flex w-1.5 h-1.5">
            <span
              className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-40"
              style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
            />
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
        )}
        {LABELS[status]}
      </span>
      {autonomy !== undefined && status !== "draft" && (
        <span className="text-[9px] font-semibold tracking-[0.1em] uppercase text-slate-400">
          {autonomyLabel[autonomy]}
        </span>
      )}
    </div>
  );
}
