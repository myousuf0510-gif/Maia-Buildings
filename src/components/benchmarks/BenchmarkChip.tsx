"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Users, ChevronRight } from "lucide-react";
import {
  BENCHMARKS,
  percentileFor,
  toneForPercentile,
  formatValue,
  type IndustryCode,
} from "@/lib/benchmarks";
import { cn } from "@/lib/utils";

/**
 * BenchmarkChip — shows the customer's value vs industry distribution.
 *
 * <BenchmarkChip metric="absenteeism_rate" value={4.2} industry="aviation" />
 *   → "4.2% · p50 3.8% · p90 6.1% · peer percentile 62"
 */

export function BenchmarkChip({
  metric,
  value,
  industry = "aviation",
  variant = "inline",
  showLabel = false,
  className,
}: {
  metric: string;
  value: number;
  industry?: IndustryCode;
  variant?: "inline" | "block";
  showLabel?: boolean;
  className?: string;
}) {
  const bench = BENCHMARKS[metric];
  const dist = bench?.industries[industry] ?? bench?.industries.generic;

  const { percentile, tone, formattedP50, formattedP90, delta } = useMemo(() => {
    if (!bench || !dist) return { percentile: 50, tone: "ok" as const, formattedP50: "—", formattedP90: "—", delta: 0 };
    const pct = percentileFor(value, dist, bench.direction);
    const t = toneForPercentile(pct, bench.direction);
    const p50Formatted = formatValue(dist.p50, bench.unit);
    const p90Formatted = formatValue(dist.p90, bench.unit);
    const d = ((value - dist.p50) / dist.p50) * 100;
    return { percentile: Math.round(pct), tone: t, formattedP50: p50Formatted, formattedP90: p90Formatted, delta: d };
  }, [bench, dist, value]);

  if (!bench || !dist) return null;

  const toneClasses = {
    good: { color: "#059669", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.18)", label: "TOP TIER" },
    ok:   { color: "#2563EB", bg: "rgba(37,99,235,0.05)",  border: "rgba(37,99,235,0.15)",  label: "AT MEDIAN" },
    warn: { color: "#D97706", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)",  label: "ABOVE MEDIAN" },
    bad:  { color: "#DC2626", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.2)",   label: "BOTTOM QUARTILE" },
  }[tone];

  if (variant === "block") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 px-3.5 py-2.5 rounded-xl",
          className,
        )}
        style={{
          background: toneClasses.bg,
          border: `1px solid ${toneClasses.border}`,
        }}
      >
        <Users className="w-3.5 h-3.5 shrink-0" style={{ color: toneClasses.color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]"
               style={{ color: toneClasses.color }}>
            <span>{toneClasses.label}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-mono">P{percentile}</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {showLabel && <span className="text-slate-700">{bench.label}: </span>}
            vs industry p50 <span className="font-mono font-semibold text-slate-700">{formattedP50}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            p90 <span className="font-mono font-semibold text-slate-700">{formattedP90}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md",
        className,
      )}
      style={{
        background: toneClasses.bg,
        border: `1px solid ${toneClasses.border}`,
      }}
    >
      <Users className="w-2.5 h-2.5 shrink-0" style={{ color: toneClasses.color }} />
      <span className="text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{ color: toneClasses.color }}>
        P{percentile}
      </span>
      <span className="text-slate-300 text-[10px]">·</span>
      <span className="text-[10px] text-slate-500 font-medium">
        peer p50 <span className="font-mono text-slate-700 font-semibold">{formattedP50}</span>
      </span>
    </div>
  );
}

/**
 * Mini trend dial — used inline next to a metric value.
 * Shows a 6-tick percentile scale with the customer's position marked.
 */
export function BenchmarkDial({
  metric,
  value,
  industry = "aviation",
  className,
}: {
  metric: string;
  value: number;
  industry?: IndustryCode;
  className?: string;
}) {
  const bench = BENCHMARKS[metric];
  const dist = bench?.industries[industry] ?? bench?.industries.generic;

  if (!bench || !dist) return null;

  const pct = percentileFor(value, dist, bench.direction);
  const tone = toneForPercentile(pct, bench.direction);
  const color =
    tone === "good" ? "#10B981" :
    tone === "ok"   ? "#2563EB" :
    tone === "warn" ? "#F59E0B" : "#EF4444";
  const markerLeft = Math.min(95, Math.max(5, pct));

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative h-1.5 w-[80px] rounded-full bg-slate-100 overflow-hidden">
        {/* Distribution gradient */}
        <div
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background: bench.direction === "lower_is_better"
              ? "linear-gradient(90deg, #10B981 0%, #2563EB 30%, #F59E0B 65%, #EF4444 100%)"
              : "linear-gradient(90deg, #EF4444 0%, #F59E0B 35%, #2563EB 70%, #10B981 100%)",
          }}
        />
        {/* Customer marker */}
        <span
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2.5 rounded-sm shadow-sm"
          style={{
            left: `${markerLeft}%`,
            background: "#FFFFFF",
            border: `1.5px solid ${color}`,
          }}
        />
      </div>
      <span className="text-[9.5px] font-bold uppercase tracking-[0.1em] font-mono" style={{ color }}>
        P{Math.round(pct)}
      </span>
    </div>
  );
}
