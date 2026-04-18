"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Cpu, CheckCircle2, Clock, Database, Sparkles, ChevronDown, Gauge } from "lucide-react";
import { MODELS } from "@/lib/platform/registry";
import type { ModelType } from "@/lib/platform/registry";

const TYPE_META: Record<ModelType, { label: string; color: string }> = {
  llm:           { label: "LLM",             color: "#7C3AED" },
  deterministic: { label: "Deterministic",   color: "#2563EB" },
  statistical:   { label: "Statistical",     color: "#F59E0B" },
  heuristic:     { label: "Heuristic",       color: "#0EA5E9" },
  ml:            { label: "Machine Learning",color: "#EC4899" },
};

export default function ModelsPage() {
  const [filter, setFilter] = useState<ModelType | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(
    () => filter === "all" ? MODELS : MODELS.filter((m) => m.type === filter),
    [filter],
  );

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #7C3AED, #EC4899)", boxShadow: "0 2px 6px rgba(124,58,237,0.3)" }}>
            <Brain className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ background: "linear-gradient(90deg, #7C3AED, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Models · {MODELS.length} in production
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          Every model powering MAIA, in one place
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          LLMs, deterministic attribution engines, statistical scoring, heuristic optimisers — with inputs, outputs, performance, and who uses them.
        </p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap" style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}>
        {(["all", "llm", "deterministic", "statistical", "heuristic", "ml"] as const).map((t) => {
          const active = t === filter;
          const meta = t === "all" ? null : TYPE_META[t];
          const label = t === "all" ? "All" : meta!.label;
          const color = t === "all" ? "#0F172A" : meta!.color;
          const count = t === "all" ? MODELS.length : MODELS.filter((m) => m.type === t).length;
          return (
            <button key={t} type="button" onClick={() => setFilter(t)}
              className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap"
              style={{ color: active ? "#FFFFFF" : "#475569" }}>
              {active && (
                <motion.span layoutId="models-filter-active" className="absolute inset-0 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }} />
              )}
              <span className="relative">{label} <span className="opacity-70 ml-0.5 tabular-nums">{count}</span></span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((m, i) => {
          const meta = TYPE_META[m.type];
          const isExpanded = expanded === m.id;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              onClick={() => setExpanded(isExpanded ? null : m.id)}
              className="rounded-xl p-4 cursor-pointer transition-all"
              style={{
                background: isExpanded ? `${m.accent}06` : "#FFFFFF",
                border: isExpanded ? `1.5px solid ${m.accent}55` : "1px solid rgba(15,23,42,0.06)",
                boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${m.accent}14`, border: `1px solid ${m.accent}30` }}>
                    <Cpu className="w-4 h-4" style={{ color: m.accent }} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-[#0F172A] leading-tight truncate">{m.name}</div>
                    <div className="text-[10.5px] text-[#64748B]">v{m.version}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
                    style={{ background: `${meta.color}14`, color: meta.color, border: `1px solid ${meta.color}30` }}>
                    {meta.label}
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> {m.status}
                  </span>
                </div>
              </div>

              <div className="text-[11.5px] text-[#475569] leading-relaxed mb-2.5">{m.purpose}</div>

              <div className="flex items-center gap-2.5 text-[10.5px] text-[#64748B] flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Gauge className="w-2.5 h-2.5" />
                  {m.metric.name}: <span className="font-bold text-[#0F172A] tabular-nums">{m.metric.value}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {m.lastUpdated}
                </span>
                <span className="ml-auto">
                  <ChevronDown className="w-3 h-3" style={{ transform: isExpanded ? "rotate(180deg)" : undefined, transition: "transform 200ms" }} />
                </span>
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
                    <div className="border-t border-slate-100 pt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <InfoBlock title="Inputs" items={m.inputs} icon={Database} accent={m.accent} />
                      <InfoBlock title="Outputs" items={m.outputs} icon={Sparkles} accent={m.accent} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Used by</div>
                      <div className="flex flex-wrap gap-1">
                        {m.usedBy.map((u) => (
                          <span key={u} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                            style={{ background: `${m.accent}10`, color: m.accent, border: `1px solid ${m.accent}26` }}>
                            {u}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] mt-2">
                        Retrain cadence: <span className="font-semibold text-[#475569]">{m.retrainCadence}</span>
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

function InfoBlock({ title, items, icon: Icon, accent }: { title: string; items: string[]; icon: React.ElementType; accent: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.05)" }}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-2.5 h-2.5" style={{ color: accent }} />
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>{title}</span>
      </div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it} className="text-[10.5px] text-[#334155] leading-tight">• {it}</li>
        ))}
      </ul>
    </div>
  );
}
