"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plus,
  Pause,
  Play,
  Activity,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Database,
  ChevronDown,
  Zap,
  Clock,
  FileText,
  Link as LinkIcon,
  Search,
} from "lucide-react";
import { AGENTS } from "@/lib/platform/registry";
import type { Agent as RegistryAgent } from "@/lib/platform/registry";

type StatusFilter = "all" | "live" | "paused" | "draft";

export default function AgentsListPage() {
  const [pauseAll, setPauseAll] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AGENTS.filter((a) => {
      if (status !== "all" && a.status !== status) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.purpose.toLowerCase().includes(q) ||
        a.scope.toLowerCase().includes(q)
      );
    });
  }, [status, search]);

  const counts = useMemo(() => ({
    all: AGENTS.length,
    live: AGENTS.filter((a) => a.status === "live").length,
    paused: AGENTS.filter((a) => a.status === "paused").length,
    draft: AGENTS.filter((a) => a.status === "draft").length,
  }), []);

  return (
    <div className="p-8 space-y-6">
      <HeroHeader
        total={counts.all}
        live={counts.live}
        pauseAll={pauseAll}
        onTogglePause={() => setPauseAll((v) => !v)}
      />

      {pauseAll && (
        <div
          className="px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
        >
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <div className="text-[12.5px] text-amber-900 flex-1">
            <span className="font-bold">All agents paused.</span>{" "}
            MAIA continues to watch and propose, but no autonomous actions will execute until resumed.
          </div>
        </div>
      )}

      <FilterBar
        status={status}
        onStatus={setStatus}
        counts={counts}
        search={search}
        onSearch={setSearch}
      />

      <div className="space-y-3">
        {filtered.map((a, i) => (
          <AgentCard
            key={a.id}
            agent={a}
            index={i}
            paused={pauseAll}
            expanded={expanded === a.id}
            onToggle={() => setExpanded(expanded === a.id ? null : a.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="py-10 text-center text-[13px] text-slate-500">
            No agents match this filter.
          </div>
        )}
      </div>

      <div className="text-[10.5px] text-[#94A3B8] text-center max-w-2xl mx-auto pt-4">
        <Bot className="inline w-3 h-3 text-[#7C3AED] mr-1 -mt-0.5" />
        Every agent writes to Supabase, emits Slack alerts for critical events, and records its outcome in the Decisions Ledger.
      </div>
    </div>
  );
}

function HeroHeader({
  total, live, pauseAll, onTogglePause,
}: {
  total: number;
  live: number;
  pauseAll: boolean;
  onTogglePause: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
          >
            <Bot className="w-2.5 h-2.5 text-white" />
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Autonomous agents · {live} of {total} live
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          The operators running MAIA
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 max-w-2xl">
          Each agent watches a slice of the airport, proposes the next move, and — with your rules — executes.
          Every decision is logged, reversible, and backed by the rule engine.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePause}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide transition-all"
          style={{
            background: pauseAll
              ? "linear-gradient(135deg, #F59E0B, #D97706)"
              : "#FFFFFF",
            color: pauseAll ? "#FFFFFF" : "#475569",
            border: pauseAll ? "1px solid rgba(245,158,11,0.5)" : "1px solid rgba(15,23,42,0.1)",
            boxShadow: pauseAll ? "0 2px 8px rgba(245,158,11,0.3)" : "none",
          }}
          title={pauseAll ? "Resume autonomous execution" : "Pause all autonomous actions. Proposals still generated."}
        >
          {pauseAll ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          {pauseAll ? "Resume all" : "Pause all"}
        </button>
        <Link
          href="/agents/new"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #2563EB, #7C3AED)",
            boxShadow: "0 2px 8px rgba(37,99,235,0.3)",
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New agent
        </Link>
      </div>
    </div>
  );
}

function FilterBar({
  status, onStatus, counts, search, onSearch,
}: {
  status: StatusFilter;
  onStatus: (s: StatusFilter) => void;
  counts: Record<StatusFilter, number>;
  search: string;
  onSearch: (s: string) => void;
}) {
  const tabs: { key: StatusFilter; label: string; color: string }[] = [
    { key: "all",    label: "All",    color: "#0F172A" },
    { key: "live",   label: "Live",   color: "#10B981" },
    { key: "paused", label: "Paused", color: "#F59E0B" },
    { key: "draft",  label: "Draft",  color: "#64748B" },
  ];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div
        className="inline-flex items-center gap-1 p-1 rounded-xl"
        style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
      >
        {tabs.map((t) => {
          const active = t.key === status;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onStatus(t.key)}
              className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg"
              style={{ color: active ? "#FFFFFF" : "#475569" }}
            >
              {active && (
                <motion.span
                  layoutId="agents-filter-active"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`, boxShadow: `0 2px 8px ${t.color}40` }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              )}
              <span className="relative">
                {t.label}{" "}
                <span className="opacity-70 ml-0.5 tabular-nums">{counts[t.key]}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
        style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
      >
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search by name, purpose, scope…"
          className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearch("")}
            className="text-[10px] text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function AgentCard({
  agent, index, paused, expanded, onToggle,
}: {
  agent: RegistryAgent;
  index: number;
  paused: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const effectiveStatus = paused && agent.status === "live" ? "paused" : agent.status;
  const STATUS_META: Record<RegistryAgent["status"] | "paused", { label: string; color: string; bg: string }> = {
    live:   { label: "Live",   color: "#059669", bg: "rgba(16,185,129,0.1)" },
    paused: { label: "Paused", color: "#B45309", bg: "rgba(245,158,11,0.1)" },
    draft:  { label: "Draft",  color: "#64748B", bg: "rgba(100,116,139,0.08)" },
  };
  const meta = STATUS_META[effectiveStatus];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
      className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: "#FFFFFF",
        border: expanded ? `1.5px solid ${agent.accent}55` : "1px solid rgba(15,23,42,0.06)",
        boxShadow: expanded ? `0 8px 32px ${agent.accent}14` : "0 2px 16px rgba(15,23,42,0.04)",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-[#F8FAFC] transition-colors"
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: `linear-gradient(135deg, ${agent.accent}14 0%, ${agent.accent}06 100%)`,
            border: `1px solid ${agent.accent}30`,
          }}
        >
          <Bot className="w-5 h-5" style={{ color: agent.accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[15.5px] font-bold text-[#0F172A] leading-tight">
              {agent.name}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
              style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}30` }}
            >
              {effectiveStatus === "live" && (
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-40 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
              )}
              {meta.label}
            </span>
          </div>
          <p className="text-[12.5px] text-[#64748B] leading-relaxed max-w-3xl">{agent.purpose}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap text-[10.5px] text-[#475569]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" style={{ color: agent.accent }} />
              <span className="font-semibold">{agent.cadence}</span>
            </span>
            {agent.lastRun && (
              <span className="inline-flex items-center gap-1">
                <Activity className="w-2.5 h-2.5 text-[#94A3B8]" />
                Last run <span className="font-semibold text-[#0F172A]">{agent.lastRun}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="w-2.5 h-2.5 text-[#94A3B8]" />
              Feeds <span className="font-semibold text-[#0F172A]">{agent.feedsPages.length}</span> page{agent.feedsPages.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        <ChevronDown
          className="w-4 h-4 text-[#94A3B8] shrink-0 transition-transform mt-1"
          style={{ transform: expanded ? "rotate(180deg)" : undefined }}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${agent.accent}14` }}
          >
            <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ background: `${agent.accent}04` }}>
              <DetailBlock title="Scope" icon={Zap} accent={agent.accent}>
                <div className="text-[12px] text-[#334155] leading-relaxed">{agent.scope}</div>
              </DetailBlock>

              <DetailBlock title="Source" icon={FileText} accent={agent.accent}>
                <div className="text-[11px] font-mono text-[#475569] leading-relaxed break-all">
                  {agent.source}
                </div>
              </DetailBlock>

              <DetailBlock title="Writes to" icon={Database} accent={agent.accent}>
                <div className="flex flex-wrap gap-1">
                  {agent.writesTo.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                      style={{ background: `${agent.accent}10`, color: agent.accent, border: `1px solid ${agent.accent}26` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </DetailBlock>

              {agent.notifies && agent.notifies.length > 0 && (
                <DetailBlock title="Notifies" icon={Activity} accent={agent.accent}>
                  <ul className="space-y-0.5">
                    {agent.notifies.map((n) => (
                      <li key={n} className="text-[11px] text-[#475569] leading-tight">• {n}</li>
                    ))}
                  </ul>
                </DetailBlock>
              )}

              <DetailBlock title="Feeds pages" icon={LinkIcon} accent={agent.accent}>
                <div className="flex flex-wrap gap-1">
                  {agent.feedsPages.map((p) => (
                    <Link
                      key={p}
                      href={p}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-bold hover:underline"
                      style={{ background: "#FFFFFF", color: agent.accent, border: `1px solid ${agent.accent}30` }}
                    >
                      {p}
                      <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  ))}
                </div>
              </DetailBlock>

              <DetailBlock title="Quick actions" icon={CheckCircle2} accent={agent.accent}>
                <div className="flex flex-col gap-1.5">
                  <Link
                    href={agent.feedsPages[0] ?? "/decisions-ledger"}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10.5px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${agent.accent}, ${agent.accent}CC)` }}
                  >
                    Open agent surface <ArrowRight className="w-2.5 h-2.5" />
                  </Link>
                  <Link
                    href="/decisions-ledger"
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10.5px] font-bold"
                    style={{ background: "#FFFFFF", color: agent.accent, border: `1px solid ${agent.accent}30` }}
                  >
                    View decisions
                  </Link>
                </div>
              </DetailBlock>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DetailBlock({
  title, icon: Icon, accent, children,
}: {
  title: string;
  icon: React.ElementType;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-2.5 h-2.5" style={{ color: accent }} />
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
