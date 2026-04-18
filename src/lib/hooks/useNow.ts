"use client";

import { useEffect, useState } from "react";

/**
 * useNow — a ticking clock hook that returns `Date.now()` on an interval.
 * Use for live timestamps like "2m ago" that should update without a full rerender.
 *
 * Default interval: 15s. Pass a lower value for seconds-level precision.
 */
export function useNow(intervalMs: number = 15_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Format a millisecond timestamp as "Xs ago", "Xm ago", "Xh ago", "Xd ago". */
export function timeAgo(timestamp: number, now: number = Date.now()): string {
  const delta = Math.max(0, now - timestamp);
  const s = Math.floor(delta / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

/** A self-updating relative time string. Re-renders every 15s by default. */
export function useTimeAgo(isoOrMs: string | number | null | undefined): string {
  const now = useNow();
  if (!isoOrMs) return "";
  const t = typeof isoOrMs === "string" ? new Date(isoOrMs).getTime() : isoOrMs;
  return timeAgo(t, now);
}
