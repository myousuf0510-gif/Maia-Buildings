"use client";

import { motion } from "framer-motion";
import { FlaskConical, ShieldCheck, Bot, Gavel } from "lucide-react";
import { RULE_PACKS } from "@/lib/platform/registry";

export default function RulesPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #DC2626, #F59E0B)", boxShadow: "0 2px 6px rgba(220,38,38,0.3)" }}>
            <Gavel className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ background: "linear-gradient(90deg, #DC2626, #F59E0B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Rules engine · {RULE_PACKS.length} packs · {RULE_PACKS.reduce((s, p) => s + p.rules.length, 0)} rules
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          The rules MAIA refuses to break
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          Labour law, aviation regulation, WSIB, union contract, internal policy, escalation logic. Auto-enforced rules block violating decisions at the agent layer.
        </p>
      </div>

      <div className="space-y-4">
        {RULE_PACKS.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.04 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: `1px solid ${p.accent}2E`,
              boxShadow: "0 2px 16px rgba(15,23,42,0.04)",
            }}
          >
            <div
              className="px-5 py-4 flex items-start justify-between gap-3 flex-wrap"
              style={{ background: `linear-gradient(135deg, ${p.accent}06, transparent 70%)`, borderBottom: `1px solid ${p.accent}14` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${p.accent}14`, border: `1px solid ${p.accent}30` }}>
                  <FlaskConical className="w-5 h-5" style={{ color: p.accent }} />
                </div>
                <div>
                  <div className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: p.accent }}>
                    {p.jurisdiction}
                  </div>
                  <div className="text-[17px] font-bold text-[#0F172A] leading-tight">{p.name}</div>
                  <div className="text-[11.5px] text-[#64748B] mt-0.5 max-w-2xl">{p.purpose}</div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-[0.14em] uppercase shrink-0"
                style={{ background: p.enforced ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.08)", color: p.enforced ? "#059669" : "#6B7280", border: `1px solid ${p.enforced ? "rgba(16,185,129,0.25)" : "rgba(107,114,128,0.18)"}` }}>
                <ShieldCheck className="w-2.5 h-2.5" /> {p.enforced ? "Enforced" : "Reference"}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {p.rules.map((r, ri) => (
                <div key={ri} className="px-5 py-3 flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold tabular-nums shrink-0 mt-0.5"
                    style={{ background: "rgba(15,23,42,0.04)", color: "#64748B" }}>
                    {ri + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] text-[#0F172A] leading-relaxed">{r.text}</div>
                    <div className="text-[10px] text-[#94A3B8] mt-0.5 font-mono">{r.source}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase shrink-0"
                    style={{
                      background: r.autoEnforced ? "rgba(124,58,237,0.1)" : "rgba(15,23,42,0.04)",
                      color: r.autoEnforced ? "#7C3AED" : "#64748B",
                      border: `1px solid ${r.autoEnforced ? "rgba(124,58,237,0.3)" : "rgba(15,23,42,0.08)"}`,
                    }}>
                    {r.autoEnforced && <Bot className="w-2.5 h-2.5" />}
                    {r.autoEnforced ? "Auto" : "Advisory"}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-[10.5px] text-[#94A3B8] text-center max-w-2xl mx-auto">
        <ShieldCheck className="inline w-3 h-3 text-emerald-500 mr-1 -mt-0.5" />
        Auto-enforced rules block any decision that would violate them at the agent layer. Advisory rules are surfaced to managers but not blocking.
      </div>
    </div>
  );
}
