"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useMemo } from "react";
import {
  Bot,
  ArrowLeft,
  ArrowRight,
  Activity,
  Zap,
  Database,
  CheckCircle2,
  Clock,
  Shield,
  BookOpen,
  AlertTriangle,
  ExternalLink,
  Sparkles,
  FileText,
  Pause,
} from "lucide-react";
import { AGENTS, MODELS, ALGORITHMS, RULE_PACKS } from "@/lib/platform/registry";
import { docsByAgent, CATEGORY_META } from "@/lib/buildings/knowledge";
import { WORK_ORDERS } from "@/lib/buildings/work-orders";
import { TRADE_META, workerById } from "@/lib/buildings/workers";
import { PORTFOLIO_DATA } from "@/lib/buildings/portfolio";

export default function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const agent = AGENTS.find((a) => a.id === id);
  if (!agent) return notFound();
  const docs = docsByAgent(id);
  const firstWord = agent.name.split(" ")[0].toLowerCase();
  const relatedModels = MODELS.filter((m) => m.usedBy.some((u) => u.toLowerCase().includes(firstWord)));
  const relatedAlgos = ALGORITHMS.filter((a) => a.usedIn.some((u) => u.toLowerCase().includes(firstWord)));

  const recentDecisions = useMemo(() => {
    if (id !== "dispatch_agent" && id !== "work_order_market") return [];
    return WORK_ORDERS.filter((w) => w.assigneeId).slice(0, 12);
  }, [id]);

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      <BackBar agent={agent} />
      <Hero agent={agent} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <Capabilities agent={agent} />
          {recentDecisions.length > 0 && <RecentDecisions decisions={recentDecisions} />}
          <KnowledgeReferences docs={docs} />
          <ExplainFactors agent={agent} />
        </div>
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <StatsCard agent={agent} />
          <ModelsUsed models={relatedModels} />
          <AlgorithmsUsed algorithms={relatedAlgos} />
          <RulesEnforced />
        </div>
      </div>
    </div>
  );
}

function BackBar({ agent }: { agent: typeof AGENTS[number] }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
      <Link href="/agents" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
        <ArrowLeft className="w-3 h-3" /> Agents
      </Link>
      <span>›</span>
      <span className="font-bold text-[#0F172A]">{agent.name}</span>
    </div>
  );
}

function Hero({ agent }: { agent: typeof AGENTS[number] }) {
  return (
    <div
      className="rounded-2xl p-6 overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${agent.accent}08, #FFFFFF 60%)`,
        border: `1px solid ${agent.accent}28`,
        boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-6 flex-wrap relative">
        <div className="flex items-start gap-4 min-w-0">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${agent.accent}22, ${agent.accent}08)`,
              border: `1px solid ${agent.accent}40`,
            }}
          >
            <Bot className="w-7 h-7" style={{ color: agent.accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {agent.status === "live" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.14em] uppercase"
                  style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.3)" }}>
                  <span className="relative flex w-1.5 h-1.5">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </span>
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.14em] uppercase"
                  style={{ background: "rgba(245,158,11,0.1)", color: "#B45309", border: "1px solid rgba(245,158,11,0.25)" }}>
                  <Pause className="w-2.5 h-2.5" />
                  {agent.status}
                </span>
              )}
              <span className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: agent.accent }}>
                {agent.cadence}
              </span>
              {agent.lastRun && (
                <>
                  <span className="text-[10.5px] text-[#94A3B8]">·</span>
                  <span className="text-[10.5px] text-[#64748B]">Last run {agent.lastRun}</span>
                </>
              )}
            </div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">{agent.name}</h1>
            <p className="text-[13px] text-[#475569] mt-1 max-w-3xl leading-relaxed">{agent.purpose}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/decisions-ledger" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide text-[#475569]"
            style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.1)" }}>
            <FileText className="w-3.5 h-3.5" />
            Decisions ledger
          </Link>
          {agent.feedsPages[0] && (
            <Link href={agent.feedsPages[0]} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide text-white"
              style={{ background: `linear-gradient(135deg, ${agent.accent}, ${agent.accent}CC)`, boxShadow: `0 2px 8px ${agent.accent}40` }}>
              Open surface <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function Capabilities({ agent }: { agent: typeof AGENTS[number] }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5" style={{ color: agent.accent }} />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: agent.accent }}>Scope & capability</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Scope</div>
          <div className="text-[12.5px] text-[#0F172A] leading-relaxed">{agent.scope}</div>
        </div>
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Source</div>
          <div className="text-[11.5px] font-mono text-[#475569] leading-relaxed break-all">{agent.source}</div>
        </div>
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Writes to</div>
          <div className="flex flex-wrap gap-1">
            {agent.writesTo.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                style={{ background: `${agent.accent}10`, color: agent.accent, border: `1px solid ${agent.accent}26` }}>
                <Database className="w-2.5 h-2.5" />
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Feeds pages</div>
          <div className="flex flex-wrap gap-1">
            {agent.feedsPages.map((p) => (
              <Link key={p} href={p} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-semibold hover:underline"
                style={{ background: "rgba(37,99,235,0.06)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.2)" }}>
                {p}
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            ))}
          </div>
        </div>
        {agent.notifies && agent.notifies.length > 0 && (
          <div className="md:col-span-2">
            <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Notifies</div>
            <div className="flex flex-wrap gap-1">
              {agent.notifies.map((n) => (
                <span key={n} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px]"
                  style={{ background: "rgba(15,23,42,0.03)", color: "#475569", border: "1px solid rgba(15,23,42,0.08)" }}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RecentDecisions({ decisions }: { decisions: typeof WORK_ORDERS }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="px-5 py-4 flex items-center gap-2 border-b border-slate-100">
        <Activity className="w-3.5 h-3.5 text-[#7C3AED]" />
        <div>
          <div className="text-[12.5px] font-bold text-[#0F172A] leading-tight">Recent decisions with reasoning</div>
          <div className="text-[10.5px] text-[#64748B]">Every dispatch with the factor breakdown that drove it</div>
        </div>
        <Link href="/decisions-ledger" className="ml-auto text-[10.5px] font-bold text-[#2563EB] hover:underline">
          Full ledger →
        </Link>
      </div>
      <div className="divide-y divide-slate-50">
        {decisions.slice(0, 8).map((w) => {
          const trade = TRADE_META[w.trade];
          const assignee = w.assigneeId ? workerById(w.assigneeId) : null;
          const building = PORTFOLIO_DATA.find((b) => b.id === w.buildingId);
          return (
            <div key={w.id} className="px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
                  style={{ background: `${trade.color}14`, border: `1px solid ${trade.color}30` }}
                >
                  {trade.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[12px] font-bold text-[#0F172A]">{w.title}</span>
                    <span className="text-[10px] text-[#64748B]">· {building?.name}</span>
                    {w.autoAssigned && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                        style={{ background: "rgba(124,58,237,0.08)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.26)" }}>
                        <Sparkles className="w-2.5 h-2.5" />
                        AUTO · score {w.score}
                      </span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-[#475569] mb-1">
                    → <span className="font-semibold">{assignee?.type === "contractor" ? assignee.company : assignee?.name}</span>
                  </div>
                  {w.rationale && (
                    <div className="text-[10.5px] text-[#64748B] italic leading-snug">&ldquo;{w.rationale}&rdquo;</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KnowledgeReferences({ docs }: { docs: ReturnType<typeof docsByAgent> }) {
  if (docs.length === 0) return null;
  return (
    <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.04), #FFFFFF 60%)", border: "1px solid rgba(124,58,237,0.22)" }}>
      <div className="flex items-center gap-1.5 mb-3">
        <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#7C3AED]">Knowledge referenced by this agent</span>
        <span className="ml-auto text-[10px] text-[#94A3B8]">{docs.length} documents</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {docs.map((d) => {
          const meta = CATEGORY_META[d.category];
          return (
            <Link key={d.id} href={`/knowledge/${d.id}`} className="rounded-xl p-3 hover:shadow-md transition-all"
              style={{ background: "#FFFFFF", border: `1px solid ${meta.color}22` }}>
              <div className="flex items-start gap-2">
                <span className="text-[16px] shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-1 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
                      style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}26` }}>
                      {meta.label}
                    </span>
                    {d.jurisdiction && <span className="text-[9.5px] text-[#94A3B8] font-mono">{d.jurisdiction}</span>}
                  </div>
                  <div className="text-[12px] font-bold text-[#0F172A] leading-tight mb-0.5">{d.title}</div>
                  <div className="text-[10.5px] text-[#64748B] leading-snug line-clamp-2">{d.summary}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ExplainFactors({ agent }: { agent: typeof AGENTS[number] }) {
  if (agent.id !== "dispatch_agent") return null;
  const factors = [
    { label: "Skill match",         urgentW: 0.22, routineW: 0.20, desc: "Trade match precision. Sub-skill bonuses apply." },
    { label: "Availability",        urgentW: 0.26, routineW: 0.18, desc: "Real-time load. 100 if available now; drops with active assignments." },
    { label: "Cost",                urgentW: 0.12, routineW: 0.28, desc: "Lower loaded $/hr scores higher. Employee bonus +3." },
    { label: "Fairness rotation",   urgentW: 0.14, routineW: 0.22, desc: "Penalises workers above expected share of monthly volume." },
    { label: "Quality",             urgentW: 0.26, routineW: 0.12, desc: "70% rating + 30% SLA hit rate." },
  ];
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-3.5 h-3.5" style={{ color: agent.accent }} />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: agent.accent }}>How this agent scores candidates</span>
      </div>
      <div className="text-[11.5px] text-[#64748B] leading-relaxed mb-3">
        Every work order triggers a ranked candidate list. Each candidate gets a 0–100 score combining the five factors below, with weights that shift based on urgency.
      </div>
      <div className="space-y-2">
        {factors.map((f) => (
          <div key={f.label} className="rounded-lg p-3" style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.05)" }}>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[12px] font-bold text-[#0F172A] flex-1">{f.label}</span>
              <WeightBar label="Urgent" weight={f.urgentW} color="#DC2626" />
              <WeightBar label="Routine" weight={f.routineW} color="#2563EB" />
            </div>
            <div className="text-[10.5px] text-[#64748B] leading-snug">{f.desc}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg p-3 flex items-start gap-2" style={{ background: "rgba(220,38,38,0.04)", border: "1px solid rgba(220,38,38,0.2)" }}>
        <Shield className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
        <div className="text-[11px] text-[#475569] leading-snug">
          <span className="font-bold text-[#991B1B]">Hard gates:</span> contractor must have valid CGL insurance, current WSIB clearance, and active trade license.
          Any failure forces the candidate&apos;s score to 0 and flags them <code className="font-mono text-[10.5px] bg-slate-100 px-1 rounded">blocked</code>.
        </div>
      </div>
    </div>
  );
}

function WeightBar({ label, weight, color }: { label: string; weight: number; color: string }) {
  return (
    <div className="text-right min-w-[56px]">
      <div className="text-[9px] font-bold tracking-[0.08em] uppercase" style={{ color }}>{label}</div>
      <div className="text-[11.5px] font-bold tabular-nums" style={{ color }}>{Math.round(weight * 100)}%</div>
    </div>
  );
}

function StatsCard({ agent }: { agent: typeof AGENTS[number] }) {
  const stats = {
    decisionsWeek: agent.id === "dispatch_agent" ? 284 :
                   agent.id === "work_order_market" ? 47 :
                   agent.id === "arrears_sentinel" ? 62 :
                   agent.id === "energy_optimizer" ? 1_247 :
                   agent.id === "compliance_sentinel" ? 38 :
                   agent.id === "vacancy_watcher" ? 28 :
                   agent.id === "turnover_orchestrator" ? 14 :
                   7,
    autoAssign: agent.id === "dispatch_agent" ? "91%" : agent.id === "energy_optimizer" ? "98%" : "—",
    acceptance: agent.id === "dispatch_agent" ? "94%" : agent.id === "arrears_sentinel" ? "83%" : "—",
    savedUsd: agent.id === "energy_optimizer" ? 4_280 :
              agent.id === "dispatch_agent" ? 11_900 :
              0,
  };
  return (
    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B] mb-3">Performance · last 7 days</div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Decisions" value={stats.decisionsWeek.toLocaleString()} accent="#2563EB" />
        <Stat label="Auto-rate" value={stats.autoAssign} accent="#10B981" />
        <Stat label="Acceptance" value={stats.acceptance} accent="#7C3AED" />
        <Stat label="Saved" value={stats.savedUsd > 0 ? `$${stats.savedUsd.toLocaleString()}` : "—"} accent="#F59E0B" />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: `${accent}06`, border: `1px solid ${accent}22` }}>
      <div className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>{label}</div>
      <div className="text-[16px] font-bold tabular-nums text-[#0F172A] leading-tight mt-0.5">{value}</div>
    </div>
  );
}

function ModelsUsed({ models }: { models: typeof MODELS }) {
  if (models.length === 0) return null;
  return (
    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <Link href="/models" className="flex items-center gap-1.5 mb-3 hover:opacity-80">
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B]">Models used</span>
        <span className="ml-auto text-[10.5px] font-bold text-[#2563EB]">all →</span>
      </Link>
      <div className="space-y-2">
        {models.map((m) => (
          <div key={m.id} className="rounded-lg p-2.5" style={{ background: `${m.accent}06`, border: `1px solid ${m.accent}22` }}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11.5px] font-bold text-[#0F172A] truncate flex-1">{m.name}</span>
              <span className="text-[9.5px] font-mono text-[#64748B]">{m.version}</span>
            </div>
            <div className="text-[10px] text-[#64748B] leading-snug line-clamp-2">{m.purpose}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlgorithmsUsed({ algorithms }: { algorithms: typeof ALGORITHMS }) {
  if (algorithms.length === 0) return null;
  return (
    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <Link href="/algorithms" className="flex items-center gap-1.5 mb-3 hover:opacity-80">
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B]">Algorithms</span>
        <span className="ml-auto text-[10.5px] font-bold text-[#2563EB]">all →</span>
      </Link>
      <div className="space-y-2">
        {algorithms.map((a) => (
          <div key={a.id} className="rounded-lg p-2.5" style={{ background: `${a.accent}06`, border: `1px solid ${a.accent}22` }}>
            <div className="text-[11.5px] font-bold text-[#0F172A] leading-tight mb-0.5">{a.name}</div>
            <div className="text-[9.5px] text-[#94A3B8] font-mono mb-0.5">{a.complexity}</div>
            <div className="text-[10px] text-[#64748B] leading-snug line-clamp-2">{a.purpose}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RulesEnforced() {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <Link href="/rules" className="flex items-center gap-1.5 mb-3 hover:opacity-80">
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B]">Rules enforced</span>
        <span className="ml-auto text-[10.5px] font-bold text-[#2563EB]">all rules →</span>
      </Link>
      <div className="space-y-1.5">
        {RULE_PACKS.slice(0, 3).map((p) => (
          <div key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
            style={{ background: `${p.accent}06`, border: `1px solid ${p.accent}22` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.accent }} />
            <span className="text-[11px] font-bold text-[#0F172A] flex-1 truncate">{p.name}</span>
            <span className="text-[9.5px] text-[#94A3B8]">{p.rules.length} rules</span>
          </div>
        ))}
      </div>
    </div>
  );
}

void AlertTriangle; void Clock; void CheckCircle2;
