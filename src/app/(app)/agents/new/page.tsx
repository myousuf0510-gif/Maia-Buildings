"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Bot, ArrowRight } from "lucide-react";
import { AGENTS } from "@/lib/platform/registry";

/**
 * New-agent configuration landing. In MAIA for Buildings, new agents are
 * commissioned in partnership with the ops team — contact-led flow rather
 * than self-serve. This page explains the path and links to contact.
 */
export default function NewAgentPage() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
        <Link href="/agents" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
          <ArrowLeft className="w-3 h-3" /> Agents
        </Link>
        <span>›</span>
        <span className="font-bold text-[#0F172A]">Commission a new agent</span>
      </div>

      <div
        className="rounded-2xl p-8 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.03))",
          border: "1px solid rgba(37,99,235,0.22)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
          >
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Commission a new agent
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight mb-3">
          Custom agents are commissioned with MAIA
        </h1>
        <p className="text-[13.5px] text-[#475569] leading-relaxed max-w-2xl">
          Every MAIA agent is grounded in your portfolio&apos;s rules, connected to your real data sources, and tuned
          against your SLAs. We don&apos;t ship generic templates — each new agent is scoped with the ops team,
          shadowed for 7–14 days, and then turned up gradually as trust builds.
        </p>

        <div className="mt-5 flex items-center gap-3 flex-wrap">
          <a
            href="mailto:moe@maiaintelligence.io?subject=New%20MAIA%20Agent%20commission"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
          >
            Request a briefing <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/agents"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] font-bold text-[#475569]"
            style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.1)" }}
          >
            See current agents
          </Link>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
        <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B] mb-3">
          Already live in your portfolio
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {AGENTS.map((a) => (
            <Link
              key={a.id}
              href={`/agents/${a.id}`}
              className="rounded-xl p-3 transition-all hover:shadow-md"
              style={{ background: `${a.accent}06`, border: `1px solid ${a.accent}22` }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${a.accent}14`, border: `1px solid ${a.accent}30` }}
                >
                  <Bot className="w-3.5 h-3.5" style={{ color: a.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-bold text-[#0F172A] truncate">{a.name}</div>
                  <div className="text-[10.5px] text-[#64748B] truncate">{a.purpose}</div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
