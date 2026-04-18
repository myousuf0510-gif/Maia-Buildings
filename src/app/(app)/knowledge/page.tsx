"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Search,
  Filter as FilterIcon,
  ArrowRight,
  Bot,
} from "lucide-react";
import {
  KNOWLEDGE_DOCS,
  CATEGORY_META,
  knowledgeStats,
  type DocCategory,
  type KnowledgeDoc,
} from "@/lib/buildings/knowledge";
import { AGENTS } from "@/lib/platform/registry";

export default function KnowledgeHubPage() {
  const [category, setCategory] = useState<DocCategory | "all">("all");
  const [search, setSearch] = useState("");
  const stats = useMemo(() => knowledgeStats(), []);

  const filtered = useMemo(() => {
    return KNOWLEDGE_DOCS.filter((d) => {
      if (category !== "all" && d.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!d.title.toLowerCase().includes(q) &&
            !d.summary.toLowerCase().includes(q) &&
            !d.tags.some((t) => t.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [category, search]);

  return (
    <div className="p-8 space-y-6">
      <Hero stats={stats} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {(Object.entries(CATEGORY_META) as [DocCategory, typeof CATEGORY_META[DocCategory]][]).map(([key, meta]) => (
          <CategoryCard
            key={key}
            category={key}
            meta={meta}
            count={stats.byCategory[key]}
            active={category === key}
            onClick={() => setCategory(category === key ? "all" : key)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <CategoryPills value={category} onChange={setCategory} stats={stats} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search regulations, SOPs, templates, playbooks…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> of {stats.total}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((d) => <DocRow key={d.id} doc={d} />)}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[13px] text-[#64748B]">No documents match that search.</div>
      )}
    </div>
  );
}

function Hero({ stats }: { stats: ReturnType<typeof knowledgeStats> }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", boxShadow: "0 2px 6px rgba(124,58,237,0.3)" }}
        >
          <BookOpen className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #7C3AED, #2563EB)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Knowledge hub · {stats.total} documents · {(stats.totalWords / 1000).toFixed(1)}k words
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        The documentation MAIA reads before every decision
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        Ontario regulations, Royal York SOPs, emergency playbooks, tenant communication templates, integration runbooks,
        and per-agent reasoning playbooks. Every cited source MAIA uses when it proposes an action is visible here.
      </p>
    </div>
  );
}

function CategoryCard({
  category, meta, count, active, onClick,
}: {
  category: DocCategory;
  meta: typeof CATEGORY_META[DocCategory];
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl p-3 text-left transition-all hover:shadow-md"
      style={{
        background: active ? `${meta.color}08` : `linear-gradient(135deg, ${meta.color}04, #FFFFFF 60%)`,
        border: active ? `1.5px solid ${meta.color}55` : `1px solid ${meta.color}22`,
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[18px]">{meta.icon}</span>
        <span className="text-[16px] font-bold tabular-nums" style={{ color: meta.color }}>{count}</span>
      </div>
      <div className="text-[10px] font-bold tracking-[0.14em] uppercase" style={{ color: meta.color }}>
        {meta.label}
      </div>
    </button>
  );
}

function CategoryPills({
  value, onChange, stats,
}: {
  value: DocCategory | "all";
  onChange: (c: DocCategory | "all") => void;
  stats: ReturnType<typeof knowledgeStats>;
}) {
  const opts: { key: DocCategory | "all"; label: string; color: string; count: number }[] = [
    { key: "all", label: "All docs", color: "#0F172A", count: stats.total },
    ...(Object.entries(CATEGORY_META) as [DocCategory, typeof CATEGORY_META[DocCategory]][]).map(([key, meta]) => ({
      key, label: meta.label, color: meta.color, count: stats.byCategory[key],
    })),
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      {opts.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="kn-filter"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`, boxShadow: `0 2px 8px ${t.color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">
              {t.label} <span className="opacity-70 ml-0.5 tabular-nums">{t.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function DocRow({ doc }: { doc: KnowledgeDoc }) {
  const meta = CATEGORY_META[doc.category];
  const referencingAgents = AGENTS.filter((a) => doc.referencedBy.includes(a.id));
  return (
    <Link
      href={`/knowledge/${doc.id}`}
      className="block rounded-2xl p-5 hover:shadow-md transition-all"
      style={{
        background: "#FFFFFF",
        border: `1px solid ${meta.color}18`,
        boxShadow: "0 2px 16px rgba(15,23,42,0.04)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[20px]"
          style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}30` }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-[0.14em] uppercase"
              style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30` }}>
              {meta.label}
            </span>
            {doc.jurisdiction && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-[0.12em] uppercase"
                style={{ background: "rgba(15,23,42,0.04)", color: "#475569", border: "1px solid rgba(15,23,42,0.08)" }}>
                {doc.jurisdiction}
              </span>
            )}
            <span className="text-[10.5px] text-[#94A3B8] font-mono">{doc.version}</span>
            <span className="text-[10.5px] text-[#94A3B8]">·</span>
            <span className="text-[10.5px] text-[#94A3B8]">updated {doc.lastUpdated}</span>
          </div>
          <div className="text-[14px] font-bold text-[#0F172A] leading-tight mb-1">{doc.title}</div>
          <div className="text-[12px] text-[#475569] leading-relaxed mb-2">{doc.summary}</div>
          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span className="text-[#94A3B8] font-mono">{doc.wordCount.toLocaleString()} words</span>
            {doc.tags.slice(0, 4).map((t) => (
              <span key={t} className="px-1.5 py-0.5 rounded text-[10px]"
                style={{ background: "rgba(15,23,42,0.04)", color: "#64748B", border: "1px solid rgba(15,23,42,0.06)" }}>
                #{t}
              </span>
            ))}
            {referencingAgents.length > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#7C3AED] font-semibold">
                <Bot className="w-2.5 h-2.5" />
                Referenced by {referencingAgents.map((a) => a.name).slice(0, 2).join(", ")}
                {referencingAgents.length > 2 && ` · +${referencingAgents.length - 2}`}
              </span>
            )}
          </div>
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-1" />
      </div>
    </Link>
  );
}
