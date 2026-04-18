"use client";

import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  sub,
  accent,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  accent?: "blue" | "amber" | "green" | "red";
  className?: string;
}) {
  const accentColor =
    accent === "blue"
      ? "#2563EB"
      : accent === "amber"
      ? "#D97706"
      : accent === "green"
      ? "#059669"
      : accent === "red"
      ? "#DC2626"
      : "#0F172A";

  return (
    <div
      className={cn(
        "solid-card px-4 py-3.5 flex flex-col gap-1.5",
        className,
      )}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div
        className="font-bold tabular-nums leading-none"
        style={{
          fontSize: 22,
          letterSpacing: "-0.02em",
          color: accentColor,
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] text-slate-500 leading-tight font-medium">
          {sub}
        </div>
      )}
    </div>
  );
}
