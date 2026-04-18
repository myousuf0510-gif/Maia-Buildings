"use client";

import { useEffect, useMemo, useState } from "react";
import { useLivePulse } from "@/lib/LivePulseContext";
import { Zap, Eye, CheckCircle2, Circle, AlertTriangle } from "lucide-react";

/**
 * Live Pulse overlay — scrolling command-center ticker + edge vignette.
 * Only renders when Live Pulse is enabled.
 */
export function LivePulseOverlay() {
  const { enabled } = useLivePulse();
  const [clock, setClock] = useState("");

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const d = new Date();
      setClock(
        `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}:${String(d.getUTCSeconds()).padStart(2, "0")} UTC`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [enabled]);

  // Realistic feed — agent decisions, signal telemetry, operational updates
  const feed = useMemo<TickerItem[]>(() => ([
    { icon: "agent", text: "FATIGUE GUARDIAN · Proposed reassignment · J. Martinez · Night Ramp → Morning Gate", accent: "amber", stamp: "2m ago" },
    { icon: "signal", text: "SLA COMPLIANCE steady at 91.2% · Western region", accent: "green", stamp: "4m ago" },
    { icon: "agent", text: "COMPLIANCE SENTINEL · Rest period violation flagged · Security dept · 8h below threshold", accent: "red", stamp: "6m ago" },
    { icon: "check", text: "3 shifts auto-covered · Gate Operations · last hour", accent: "green", stamp: "11m ago" },
    { icon: "alert", text: "COVERAGE ALERT · Sunday 06:00 Ground Ops · 4 hours to deadline", accent: "red", stamp: "14m ago" },
    { icon: "agent", text: "FATIGUE GUARDIAN · Executed reassignment · K. Osei · shift modified · confidence 93%", accent: "green", stamp: "47m ago" },
    { icon: "signal", text: "FORECAST ACCURACY 88% · last 30 days · Q1 peak window", accent: "green", stamp: "1h ago" },
    { icon: "signal", text: "247 decisions logged this quarter · 94% acceptance rate · est. $412K savings", accent: "blue", stamp: "1h ago" },
    { icon: "agent", text: "DEMAND WATCHER · Flight XT441 delay detected · +12% baggage demand in 90 min", accent: "amber", stamp: "1h ago" },
    { icon: "signal", text: "Western region health 72% · 2 critical fatigue cases active", accent: "amber", stamp: "2h ago" },
    { icon: "check", text: "James Mitchell approved intervention ESC-2847 · Meridian Hub · 1h 32m ETA", accent: "green", stamp: "2h ago" },
    { icon: "signal", text: "Monthly OT spend $41K · peer p50 · within band", accent: "green", stamp: "2h ago" },
  ]), []);

  if (!enabled) return null;

  return (
    <>
      {/* Top scrolling ticker */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-[32px] overflow-hidden flex items-center"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.96) 0%, rgba(15,23,42,0.9) 100%)",
          borderBottom: "1px solid rgba(37,99,235,0.35)",
          boxShadow:
            "0 2px 12px rgba(37,99,235,0.25), 0 1px 0 rgba(37,99,235,0.45)",
        }}
      >
        {/* Left label — LIVE status */}
        <div
          className="flex items-center gap-2 px-4 h-full shrink-0 relative z-10"
          style={{
            background:
              "linear-gradient(90deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0) 100%)",
          }}
        >
          <span className="relative flex w-1.5 h-1.5">
            <span
              className="absolute inline-flex w-full h-full rounded-full bg-red-500 opacity-70"
              style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }}
            />
            <span className="relative w-1.5 h-1.5 rounded-full bg-red-500" />
          </span>
          <span
            className="text-[10px] font-black tracking-[0.24em] uppercase"
            style={{
              color: "#FCA5A5",
              textShadow: "0 0 8px rgba(239,68,68,0.6)",
            }}
          >
            LIVE · OPS
          </span>
        </div>

        {/* Clock */}
        <div
          className="flex items-center gap-2 px-3 h-full shrink-0"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span
            className="font-mono text-[10.5px] font-bold tabular-nums tracking-wider"
            style={{
              color: "#60A5FA",
              textShadow: "0 0 6px rgba(37,99,235,0.55)",
            }}
          >
            {clock}
          </span>
        </div>

        {/* The scrolling feed — duplicated for seamless loop */}
        <div
          className="flex-1 overflow-hidden relative h-full"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, black 4%, black 96%, transparent 100%)",
          }}
        >
          <div
            className="flex items-center h-full ticker-track"
            style={{
              gap: 28,
              paddingLeft: 28,
              animationDuration: "90s",
            }}
          >
            {[...feed, ...feed].map((item, i) => (
              <TickerRow key={i} {...item} />
            ))}
          </div>
        </div>

        {/* Right cluster — source count + scan indicator */}
        <div
          className="flex items-center gap-2 px-4 h-full shrink-0"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-slate-400 font-mono">
            47 SRC
          </span>
          <span
            className="text-[9.5px] font-bold tracking-[0.14em] uppercase font-mono"
            style={{ color: "#10B981" }}
          >
            ·  STREAM OK
          </span>
        </div>
      </div>

      {/* Edge vignette — subtle dark fade around the edges */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[55]"
        style={{
          top: 32, // below the ticker
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, rgba(15,23,42,0.08) 80%, rgba(15,23,42,0.18) 100%)",
        }}
      />

      {/* A single slow-sweep scanline, very subtle */}
      <div
        aria-hidden
        className="fixed left-0 right-0 h-[1px] pointer-events-none z-[56]"
        style={{
          top: 32,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.5) 50%, transparent 100%)",
          boxShadow: "0 0 12px rgba(37,99,235,0.4)",
          animation: "live-scan 8s linear infinite",
        }}
      />
    </>
  );
}

interface TickerItem {
  icon: "agent" | "signal" | "check" | "alert";
  text: string;
  accent: "red" | "amber" | "green" | "blue";
  stamp: string;
}

function TickerRow({ icon, text, accent, stamp }: TickerItem) {
  const color =
    accent === "red"
      ? "#FCA5A5"
      : accent === "amber"
        ? "#FCD34D"
        : accent === "green"
          ? "#6EE7B7"
          : "#93C5FD";

  const Icon =
    icon === "agent"
      ? Zap
      : icon === "signal"
        ? Circle
        : icon === "check"
          ? CheckCircle2
          : AlertTriangle;

  return (
    <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
      <Icon className="w-3 h-3 shrink-0" style={{ color }} />
      <span
        className="text-[10.5px] font-semibold tracking-[0.02em]"
        style={{ color: "#E2E8F0" }}
      >
        {text}
      </span>
      <span
        className="text-[9.5px] font-mono tracking-wider"
        style={{ color: "#64748B" }}
      >
        · {stamp}
      </span>
      <span
        className="w-0.5 h-0.5 rounded-full shrink-0 ml-1"
        style={{ background: "rgba(255,255,255,0.25)" }}
      />
    </div>
  );
}
