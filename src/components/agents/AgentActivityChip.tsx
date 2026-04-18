"use client";

import Link from "next/link";
import { Bot, Clock, Eye, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Inline chip showing that a MAIA Agent has touched this entity.
 * Appears next to staff rows, compliance rows, cost items, etc.
 *
 * Variants map to agent state on the entity:
 *   proposed  → amber, pulsing (awaiting approval)
 *   watching  → blue, calm
 *   executed  → green, settled
 *   cleared   → slate, resolved
 */

export type ActivityVariant = "proposed" | "watching" | "executed" | "cleared";

const META: Record<ActivityVariant, {
  label: string;
  color: string;
  bg: string;
  border: string;
  Icon: React.ComponentType<{ className?: string }>;
  pulse: boolean;
}> = {
  proposed: {
    label: "Proposed",
    color: "#B45309",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    Icon: Clock,
    pulse: true,
  },
  watching: {
    label: "Watching",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.06)",
    border: "rgba(37,99,235,0.18)",
    Icon: Eye,
    pulse: false,
  },
  executed: {
    label: "Executed",
    color: "#059669",
    bg: "rgba(16,185,129,0.06)",
    border: "rgba(16,185,129,0.2)",
    Icon: CheckCircle2,
    pulse: false,
  },
  cleared: {
    label: "Cleared",
    color: "#64748B",
    bg: "rgba(100,116,139,0.06)",
    border: "rgba(100,116,139,0.18)",
    Icon: CheckCircle2,
    pulse: false,
  },
};

export function AgentActivityChip({
  variant,
  agentName = "Fatigue Guardian",
  agentId = "agent-fatigue-guardian",
  timeLabel,
  runId,
  onClick,
  className,
  compact = false,
}: {
  variant: ActivityVariant;
  agentName?: string;
  agentId?: string;
  timeLabel?: string; // e.g., "14m ago", "in 6h", "Apr 17"
  runId?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  compact?: boolean;
}) {
  const meta = META[variant];
  const href = runId ? `/agents/${agentId}?run=${runId}` : `/agents/${agentId}`;

  return (
    <Link
      href={href}
      onClick={(e) => {
        // Stop parent click handlers (e.g., the clickable row) from firing
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-md transition-all",
        compact ? "px-1.5 py-0.5" : "px-2 py-1",
        "hover:shadow-sm",
        className,
      )}
      style={{
        background: meta.bg,
        border: `1px solid ${meta.border}`,
      }}
      title={`${agentName} · ${meta.label}${timeLabel ? ` · ${timeLabel}` : ""}`}
    >
      {/* Pulsing dot for proposed (pending review) */}
      {meta.pulse ? (
        <span className="relative flex w-1.5 h-1.5 shrink-0">
          <span
            className="absolute inline-flex w-full h-full rounded-full"
            style={{
              background: meta.color,
              opacity: 0.4,
              animation: "pulse-dot 1.8s ease-in-out infinite",
            }}
          />
          <span
            className="relative w-1.5 h-1.5 rounded-full"
            style={{ background: meta.color }}
          />
        </span>
      ) : (
        <meta.Icon className={compact ? "w-2.5 h-2.5 shrink-0" : "w-3 h-3 shrink-0"} style={{ color: meta.color }} />
      )}

      <span
        className={cn(
          "font-bold uppercase tracking-[0.08em] whitespace-nowrap",
          compact ? "text-[8.5px]" : "text-[9.5px]",
        )}
        style={{ color: meta.color }}
      >
        {meta.label}
      </span>

      {!compact && (
        <>
          <span
            className="font-semibold whitespace-nowrap text-[9.5px] opacity-80"
            style={{ color: meta.color }}
          >
            {agentName}
          </span>
          {timeLabel && (
            <>
              <span className="w-[2px] h-[2px] rounded-full" style={{ background: meta.color, opacity: 0.3 }} />
              <span className="font-mono text-[9px] whitespace-nowrap opacity-70" style={{ color: meta.color }}>
                {timeLabel}
              </span>
            </>
          )}
        </>
      )}
    </Link>
  );
}
