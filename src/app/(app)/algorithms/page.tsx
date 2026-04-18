"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ChevronDown, Settings2 } from "lucide-react";
import { ALGORITHMS } from "@/lib/platform/registry";

const CAT_COLOR: Record<string, string> = {
  optimization: "#2563EB",
  scoring:      "#10B981",
  matching:     "#F59E0B",
  detection:    "#EF4444",
  narrative:    "#7C3AED",
  attribution:  "#0891B2",
};

export default function AlgorithmsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = useMemo(() => Array.from(new Set(ALGORITHMS.map((a) => a.category))), []);
  const filtered = filter === "all" ? ALGORITHMS : ALGORITHMS.filter((a) => a.category === filter);

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #0891B2)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}>
            <Cpu className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ background: "linear-gradient(90deg, #2563EB, #0891B2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Algorithms · {ALGORITHMS.length} in use
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          The math behind every MAIA decision
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          Greedy optimisers, fair-rotation orderings, pattern detectors, attribution models — each with its complexity class, tunable parameters, and where it runs.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap" style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}>
        {(["all", ...categories] as string[]).map((c) => {
          const active = c === filter;
          const color = c === "all" ? "#0F172A" : CAT_COLOR[c] ?? "#64748B";
          const label = c === "all" ? "All" : c.charAt(0).toUpperCase() + c.slice(1);
          const count = c === "all" ? ALGORITHMS.length : ALGORITHMS.filter((a) => a.category === c).length;
          return (
            <button key={c} type="button" onClick={() => setFilter(c)}
              className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg"
              style={{ color: active ? "#FFFFFF" : "#475569" }}>
              {active && (
                <motion.span layoutId="algo-filter-active" className="absolute inset-0 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }} />
              )}
              <span className="relative">{label} <span className="opacity-70 ml-0.5 tabular-nums">{count}</span></span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.map((a, i) => {
          const isExpanded = expanded === a.id;
          const catColor = CAT_COLOR[a.category] ?? "#64748B";
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={() => setExpanded(isExpanded ? null : a.id)}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{
                background: isExpanded ? `${a.accent}06` : "#FFFFFF",
                border: isExpanded ? `1.5px solid ${a.accent}55` : "1px solid rgba(15,23,42,0.06)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase shrink-0"
                  style={{ background: `${catColor}14`, color: catColor, border: `1px solid ${catColor}30` }}>
                  {a.category}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-[#0F172A] leading-tight">{a.name}</div>
                  <div className="text-[10.5px] text-[#64748B] mt-0.5 font-mono">{a.complexity}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" style={{ transform: isExpanded ? "rotate(180deg)" : undefined, transition: "transform 200ms" }} />
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="text-[12px] text-[#334155] leading-relaxed">{a.purpose}</div>

                      <div>
                        <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Used in</div>
                        <div className="flex flex-wrap gap-1">
                          {a.usedIn.map((u) => (
                            <span key={u} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                              style={{ background: `${a.accent}10`, color: a.accent, border: `1px solid ${a.accent}26` }}>
                              {u}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Settings2 className="w-2.5 h-2.5 text-[#64748B]" />
                          <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">Tunable parameters</span>
                        </div>
                        <ul className="space-y-0.5">
                          {a.tunables.map((t) => (
                            <li key={t} className="text-[11px] text-[#334155] leading-tight">• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
