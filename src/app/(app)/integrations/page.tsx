"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plug,
  CheckCircle2,
  Search,
  ArrowRight,
  ExternalLink,
  ArrowDown,
  ArrowUp,
  Key,
  Bot,
} from "lucide-react";
import {
  INTEGRATIONS,
  CATEGORY_META,
  STATUS_META,
  type IntegrationCategory,
  type ConnectionStatus,
  type Integration,
} from "@/lib/buildings/integrations";
import { AGENTS } from "@/lib/platform/registry";

export default function IntegrationsPage() {
  const [category, setCategory] = useState<IntegrationCategory | "all">("all");
  const [status, setStatus] = useState<ConnectionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Integration | null>(null);

  const kpis = useMemo(() => {
    const total = INTEGRATIONS.length;
    const connected = INTEGRATIONS.filter((i) => i.status === "connected").length;
    const available = INTEGRATIONS.filter((i) => i.status === "available").length;
    const beta = INTEGRATIONS.filter((i) => i.status === "beta").length;
    return { total, connected, available, beta };
  }, []);

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter((i) => {
      if (category !== "all" && i.category !== category) return false;
      if (status !== "all" && i.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!i.name.toLowerCase().includes(q) && !i.vendor.toLowerCase().includes(q) && !i.purpose.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [category, status, search]);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total integrations" value={kpis.total}     sub="catalog"        accent="#2563EB" />
        <Kpi label="Connected"          value={kpis.connected} sub="live right now" accent="#10B981" live />
        <Kpi label="Available"          value={kpis.available} sub="ready to wire"  accent="#7C3AED" />
        <Kpi label="Beta"               value={kpis.beta}      sub="pilot deploy"   accent="#F59E0B" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <CategoryPills value={category} onChange={setCategory} />
        <StatusPills value={status} onChange={setStatus} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integration, vendor, purpose…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> of {INTEGRATIONS.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((i) => (
          <IntegrationCard key={i.id} integration={i} onSelect={() => setSelected(i)} />
        ))}
      </div>

      {selected && <IntegrationDrawer integration={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Hero({ kpis }: { kpis: { total: number; connected: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #0891B2, #2563EB)", boxShadow: "0 2px 6px rgba(8,145,178,0.3)" }}
        >
          <Plug className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #0891B2, #2563EB)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Integrations · {kpis.connected} of {kpis.total} connected
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Every data source MAIA can plug into
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        Property management systems, payments, BMS, utilities, messaging, AI, identity, monitoring.
        Click any integration for its data flow, auth method, and connection steps.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, accent, live }: { label: string; value: number; sub: string; accent: string; live?: boolean }) {
  return (
    <div className="rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`, border: `1px solid ${accent}22` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>{label}</span>
        {live && (
          <span className="relative flex w-1.5 h-1.5 ml-auto">
            <span className="absolute inline-flex w-full h-full rounded-full opacity-40 animate-ping" style={{ background: accent }} />
            <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          </span>
        )}
      </div>
      <div className="text-[20px] font-bold tabular-nums leading-tight text-[#0F172A]">{value}</div>
      <div className="text-[10px] text-[#64748B] mt-0.5">{sub}</div>
    </div>
  );
}

function CategoryPills({ value, onChange }: { value: IntegrationCategory | "all"; onChange: (c: IntegrationCategory | "all") => void }) {
  const cats: (IntegrationCategory | "all")[] = ["all", ...Object.keys(CATEGORY_META) as IntegrationCategory[]];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {cats.map((c) => {
        const active = c === value;
        const label = c === "all" ? "All" : CATEGORY_META[c].label;
        const color = c === "all" ? "#0F172A" : CATEGORY_META[c].color;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="int-cat"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatusPills({ value, onChange }: { value: ConnectionStatus | "all"; onChange: (s: ConnectionStatus | "all") => void }) {
  const statuses: (ConnectionStatus | "all")[] = ["all", "connected", "available", "beta", "planned"];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {statuses.map((s) => {
        const active = s === value;
        const label = s === "all" ? "Any status" : STATUS_META[s].label;
        const color = s === "all" ? "#0F172A" : STATUS_META[s].color;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="int-status"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function IntegrationCard({ integration, onSelect }: { integration: Integration; onSelect: () => void }) {
  const status = STATUS_META[integration.status];
  const category = CATEGORY_META[integration.category];
  const refAgents = AGENTS.filter((a) => integration.usedBy.includes(a.id));
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left rounded-2xl p-4 hover:shadow-md transition-all"
      style={{
        background: "#FFFFFF",
        border: integration.status === "connected" ? `1.5px solid ${status.color}40` : `1px solid ${integration.accent}22`,
        boxShadow: "0 2px 16px rgba(15,23,42,0.04)",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${integration.accent}14`, border: `1px solid ${integration.accent}30` }}
          >
            <span className="text-[12px] font-bold" style={{ color: integration.accent }}>{integration.name[0]}</span>
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#0F172A] leading-tight">{integration.name}</div>
            <div className="text-[10px] text-[#64748B]">{integration.vendor}</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase shrink-0"
          style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
          {integration.status === "connected" && (
            <span className="relative flex w-1.5 h-1.5">
              <span className="absolute inline-flex w-full h-full rounded-full opacity-50 animate-ping" style={{ background: status.color }} />
              <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: status.color }} />
            </span>
          )}
          {status.label}
        </span>
      </div>
      <div className="text-[11px] text-[#475569] leading-snug mb-2 line-clamp-2">{integration.purpose}</div>
      <div className="flex items-center gap-1.5 flex-wrap mb-2 text-[10px]">
        <span className="inline-flex items-center gap-0.5 px-1 rounded font-bold tracking-[0.1em] uppercase"
          style={{ background: `${category.color}10`, color: category.color, border: `1px solid ${category.color}26` }}>
          {category.label}
        </span>
        {integration.dataIn.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[#059669]">
            <ArrowDown className="w-2.5 h-2.5" /> {integration.dataIn.length} in
          </span>
        )}
        {integration.dataOut.length > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[#2563EB]">
            <ArrowUp className="w-2.5 h-2.5" /> {integration.dataOut.length} out
          </span>
        )}
      </div>
      {refAgents.length > 0 && (
        <div className="flex items-center gap-1 pt-2 border-t border-slate-100 text-[9.5px]">
          <Bot className="w-2.5 h-2.5 text-[#7C3AED]" />
          <span className="text-[#64748B]">Used by</span>
          {refAgents.slice(0, 2).map((a, i) => (
            <span key={a.id} style={{ color: a.accent }} className="font-bold">
              {a.name.split(" ")[0]}{i < Math.min(refAgents.length, 2) - 1 ? "," : ""}
            </span>
          ))}
          {refAgents.length > 2 && <span className="text-[#94A3B8]">+{refAgents.length - 2}</span>}
        </div>
      )}
    </button>
  );
}

function IntegrationDrawer({ integration, onClose }: { integration: Integration; onClose: () => void }) {
  const status = STATUS_META[integration.status];
  const category = CATEGORY_META[integration.category];
  const refAgents = AGENTS.filter((a) => integration.usedBy.includes(a.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 40 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 36 }}
        className="h-full w-full md:w-[540px] bg-white shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 sticky top-0 z-10 bg-white">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${integration.accent}14`, border: `1px solid ${integration.accent}30` }}
          >
            <span className="text-[13px] font-bold" style={{ color: integration.accent }}>{integration.name[0]}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[14px] font-bold text-[#0F172A] leading-tight">{integration.name}</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
                style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
                {status.label}
              </span>
            </div>
            <div className="text-[11px] text-[#64748B]">{integration.vendor} · {category.label}</div>
          </div>
          <button type="button" onClick={onClose} className="text-[13px] text-slate-400 hover:text-slate-700 px-2">✕</button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">Purpose</div>
            <div className="text-[12.5px] text-[#334155] leading-relaxed">{integration.purpose}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DataFlow label="Data in" icon={ArrowDown} color="#059669" items={integration.dataIn} />
            <DataFlow label="Data out" icon={ArrowUp} color="#2563EB" items={integration.dataOut} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cadence" value={integration.cadence} />
            <Field label="Auth" value={integration.authMethod} />
          </div>

          <div>
            <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1.5">Setup steps</div>
            <ol className="space-y-2">
              {integration.setupSteps.map((s, i) => (
                <li key={i} className="text-[11.5px] text-[#334155] leading-relaxed flex items-start gap-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0 mt-0.5"
                    style={{ background: integration.accent }}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>

          {integration.envKey && (
            <div className="rounded-lg p-3" style={{ background: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.18)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Key className="w-3 h-3 text-[#2563EB]" />
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#2563EB]">Vercel env var</span>
              </div>
              <code className="font-mono text-[11px] text-[#0F172A]">{integration.envKey}</code>
            </div>
          )}

          {refAgents.length > 0 && (
            <div>
              <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1.5">Agents using this</div>
              <div className="flex flex-wrap gap-1.5">
                {refAgents.map((a) => (
                  <Link key={a.id} href={`/agents/${a.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-bold hover:opacity-80"
                    style={{ background: `${a.accent}10`, color: a.accent, border: `1px solid ${a.accent}30` }}>
                    <Bot className="w-2.5 h-2.5" />
                    {a.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {integration.docUrl && (
              <Link href={integration.docUrl} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-bold text-[#2563EB] hover:underline"
                style={{ background: "#FFFFFF", border: "1px solid rgba(37,99,235,0.25)" }}>
                <ArrowRight className="w-3 h-3" /> Read runbook
              </Link>
            )}
            {integration.status === "connected" ? (
              <button type="button" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Connection healthy
              </button>
            ) : (
              <button type="button" className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${integration.accent}, ${integration.accent}CC)` }}>
                <ExternalLink className="w-3.5 h-3.5" /> Start connection
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DataFlow({ label, icon: Icon, color, items }: { label: string; icon: React.ElementType; color: string; items: string[] }) {
  return (
    <div className="rounded-lg p-3" style={{ background: `${color}06`, border: `1px solid ${color}22` }}>
      <div className="flex items-center gap-1 mb-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color }}>{label}</span>
      </div>
      {items.length === 0 ? (
        <div className="text-[10.5px] text-[#94A3B8] italic">none</div>
      ) : (
        <ul className="space-y-0.5">
          {items.map((i) => (
            <li key={i} className="text-[10.5px] text-[#334155]">• {i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">{label}</div>
      <div className="text-[11.5px] text-[#0F172A] font-semibold leading-snug">{value}</div>
    </div>
  );
}
