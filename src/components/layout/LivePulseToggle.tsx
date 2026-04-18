"use client";

import { useLivePulse } from "@/lib/LivePulseContext";
import { Radio, RadioTower } from "lucide-react";

export function LivePulseToggle() {
  const { enabled, toggle } = useLivePulse();

  return (
    <button
      type="button"
      onClick={toggle}
      title={
        enabled
          ? "Disable Live Pulse mode"
          : "Enable Live Pulse — command-center display"
      }
      aria-pressed={enabled}
      className="group relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 transition-all duration-300 overflow-hidden"
      style={
        enabled
          ? {
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.14) 0%, rgba(124,58,237,0.14) 100%)",
              border: "1px solid rgba(37,99,235,0.45)",
              boxShadow:
                "0 0 0 1px rgba(37,99,235,0.15), 0 0 16px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.6)",
            }
          : {
              background: "rgba(15,23,42,0.03)",
              border: "1px solid rgba(15,23,42,0.08)",
            }
      }
    >
      {/* Animated aurora behind the button when ON */}
      {enabled && (
        <span
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 50%, rgba(37,99,235,0.25) 0%, transparent 70%)",
            animation: "pulse-glow 2.4s ease-in-out infinite",
          }}
        />
      )}

      <span className="relative flex items-center gap-1.5">
        {enabled ? (
          <RadioTower className="w-3 h-3" style={{ color: "#2563EB" }} />
        ) : (
          <Radio className="w-3 h-3 text-slate-400" />
        )}
        <span
          className="text-[10px] font-bold tracking-[0.14em] uppercase"
          style={{ color: enabled ? "#1E40AF" : "#94A3B8" }}
        >
          {enabled ? "PULSE LIVE" : "PULSE"}
        </span>
        {enabled && (
          <span className="relative flex w-1.5 h-1.5 ml-0.5">
            <span
              className="absolute inline-flex w-full h-full rounded-full bg-blue-500 opacity-60"
              style={{ animation: "pulse-dot 1.4s ease-in-out infinite" }}
            />
            <span className="relative w-1.5 h-1.5 rounded-full bg-blue-600" />
          </span>
        )}
      </span>
    </button>
  );
}
