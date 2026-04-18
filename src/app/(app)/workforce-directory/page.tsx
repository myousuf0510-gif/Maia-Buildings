"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter as FilterIcon,
  Shield,
  AlertTriangle,
  Star,
  ArrowRight,
} from "lucide-react";
import { WORKER_POOL, TRADE_META, type Worker, type Trade } from "@/lib/buildings/workers";

type TypeFilter = "all" | "employee" | "contractor";

export default function WorkforceDirectoryPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [tradeFilter, setTradeFilter] = useState<Trade | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return WORKER_POOL.filter((w) => {
      if (typeFilter !== "all" && w.type !== typeFilter) return false;
      if (tradeFilter !== "all" && !w.trades.includes(tradeFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!w.name.toLowerCase().includes(q) && !(w.company ?? "").toLowerCase().includes(q) && !w.homeBase.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [typeFilter, tradeFilter, search]);

  const kpis = useMemo(() => {
    const total = WORKER_POOL.length;
    const employees = WORKER_POOL.filter((w) => w.type === "employee").length;
    const contractors = WORKER_POOL.filter((w) => w.type === "contractor").length;
    const available = WORKER_POOL.filter((w) => w.availableNow).length;
    const complianceIssues = WORKER_POOL.filter((w) => !w.licenseValid || !w.insuranceValid || !w.wsibValid).length;
    const avgRating = +(WORKER_POOL.reduce((s, w) => s + w.rating, 0) / total).toFixed(2);
    return { total, employees, contractors, available, complianceIssues, avgRating };
  }, []);

  const usedTrades = useMemo(
    () => Array.from(new Set(WORKER_POOL.flatMap((w) => w.trades))),
    [],
  );

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="flex items-center gap-3 flex-wrap">
        <TypePills value={typeFilter} onChange={setTypeFilter} employees={kpis.employees} contractors={kpis.contractors} total={kpis.total} />
        <TradePills value={tradeFilter} onChange={setTradeFilter} trades={usedTrades} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, home base…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> of {WORKER_POOL.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((w) => (
          <WorkerCard key={w.id} worker={w} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[13px] text-[#64748B]">
          No workers match this filter.
        </div>
      )}
    </div>
  );
}

function Hero({ kpis }: { kpis: { total: number; employees: number; contractors: number; available: number; complianceIssues: number; avgRating: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
        >
          <Users className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Workforce directory · {kpis.employees} employees · {kpis.contractors} contractors
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Every worker MAIA can dispatch
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        In-house maintenance team + vetted contractor pool. Skills, availability, rating, and compliance status — all used by Dispatch Agent at assignment time.
      </p>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total pool"          value={kpis.total}             accent="#2563EB" />
        <Stat label="Employees"           value={kpis.employees}         accent="#10B981" />
        <Stat label="Contractors"         value={kpis.contractors}       accent="#7C3AED" />
        <Stat label="Available now"       value={kpis.available}         accent="#F59E0B" live />
        <Stat label="Compliance issues"   value={kpis.complianceIssues}  accent={kpis.complianceIssues > 0 ? "#DC2626" : "#10B981"} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent, live }: { label: string; value: number; accent: string; live?: boolean }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`, border: `1px solid ${accent}22` }}
    >
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
    </div>
  );
}

function TypePills({ value, onChange, employees, contractors, total }: { value: TypeFilter; onChange: (v: TypeFilter) => void; employees: number; contractors: number; total: number }) {
  const tabs: { key: TypeFilter; label: string; count: number; color: string }[] = [
    { key: "all",        label: "All",         count: total,       color: "#0F172A" },
    { key: "employee",   label: "Employees",   count: employees,   color: "#2563EB" },
    { key: "contractor", label: "Contractors", count: contractors, color: "#7C3AED" },
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="wf-type-filter"
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

function TradePills({ value, onChange, trades }: { value: Trade | "all"; onChange: (v: Trade | "all") => void; trades: Trade[] }) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      <button
        type="button"
        onClick={() => onChange("all")}
        className="relative px-2 py-1 text-[10.5px] font-semibold rounded-lg"
        style={{ color: value === "all" ? "#FFFFFF" : "#475569" }}
      >
        {value === "all" && (
          <motion.span
            layoutId="wf-trade-filter"
            className="absolute inset-0 rounded-lg"
            style={{ background: "linear-gradient(135deg, #0F172A, #0F172ACC)" }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          />
        )}
        <span className="relative">All trades</span>
      </button>
      {trades.map((t) => {
        const active = t === value;
        const meta = TRADE_META[t];
        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="relative px-2 py-1 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="wf-trade-filter"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`, boxShadow: `0 2px 8px ${meta.color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">
              <span className="mr-0.5">{meta.icon}</span>
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Worker card ─────────────────────────────────────────────────────────────

function WorkerCard({ worker }: { worker: Worker }) {
  const hasComplianceIssue = !worker.licenseValid || !worker.insuranceValid || !worker.wsibValid;

  return (
    <div
      className="rounded-2xl p-4 transition-all hover:shadow-md"
      style={{
        background: "#FFFFFF",
        border: hasComplianceIssue ? "1px solid rgba(239,68,68,0.35)" : `1px solid rgba(15,23,42,0.06)`,
        boxShadow: "0 2px 16px rgba(15,23,42,0.04)",
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[16px]"
          style={{ background: `${worker.accent}14`, border: `1px solid ${worker.accent}30` }}
        >
          {worker.type === "employee" ? "👤" : "🔧"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5 flex-wrap">
            <span className="text-[13px] font-bold text-[#0F172A] leading-tight">
              {worker.type === "contractor" ? worker.company : worker.name}
            </span>
            {worker.availableNow && (
              <span className="relative flex w-1.5 h-1.5 ml-0.5">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
                <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="inline-flex items-center gap-0.5 px-1 rounded font-bold tracking-[0.1em] uppercase"
              style={{
                background: worker.type === "employee" ? "rgba(37,99,235,0.08)" : "rgba(124,58,237,0.08)",
                color: worker.type === "employee" ? "#2563EB" : "#7C3AED",
                border: `1px solid ${worker.type === "employee" ? "rgba(37,99,235,0.2)" : "rgba(124,58,237,0.2)"}`,
              }}>
              {worker.type}
            </span>
            <span className="text-[#94A3B8]">{worker.homeBase}</span>
            {worker.badges?.map((b) => (
              <span key={b} className="inline-flex items-center gap-0.5 px-1 rounded font-bold tracking-[0.1em] uppercase"
                style={{
                  background: b.includes("LAPSED") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
                  color: b.includes("LAPSED") ? "#DC2626" : "#059669",
                  border: `1px solid ${b.includes("LAPSED") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                }}>
                {b.includes("LAPSED") && <AlertTriangle className="w-2 h-2" />}
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="flex items-center gap-0.5 text-[13px] font-bold text-[#0F172A] tabular-nums">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {worker.rating.toFixed(1)}
          </div>
          <div className="text-[9.5px] text-[#94A3B8]">{worker.slaHitRatePct}% SLA</div>
        </div>
      </div>

      {/* Trades */}
      <div className="flex flex-wrap gap-1 mb-3">
        {worker.trades.map((t) => {
          const meta = TRADE_META[t];
          return (
            <span key={t} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{ background: `${meta.color}10`, color: meta.color, border: `1px solid ${meta.color}26` }}>
              <span className="text-[11px]">{meta.icon}</span>
              {meta.label}
            </span>
          );
        })}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2 mb-3 text-center">
        <MiniStat label="Load" value={worker.activeAssignments.toString()} />
        <MiniStat label="MoM jobs" value={worker.completionsThisMonth.toString()} />
        <MiniStat label="$/hr" value={`$${worker.hourlyRate}`} />
        <MiniStat label="Available" value={worker.availableNow ? "Now" : "Soon"} accent={worker.availableNow ? "#10B981" : "#64748B"} />
      </div>

      {/* Compliance row */}
      {worker.type === "contractor" && (
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          <ComplianceChip label="License"  ok={worker.licenseValid} />
          <ComplianceChip label="CGL ins." ok={worker.insuranceValid} />
          <ComplianceChip label="WSIB"     ok={worker.wsibValid} />
          {worker.licenseExpires && (
            <span className="ml-auto text-[#94A3B8]">
              License exp. {worker.licenseExpires}
            </span>
          )}
        </div>
      )}
      {worker.type === "employee" && (
        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
          <Shield className="w-2.5 h-2.5 text-emerald-500" />
          <span>Insurance + WSIB · covered by Royal York</span>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md p-1.5" style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.05)" }}>
      <div className="text-[9px] text-[#94A3B8] font-semibold tracking-[0.08em] uppercase">{label}</div>
      <div className="text-[12px] font-bold tabular-nums leading-tight" style={{ color: accent ?? "#0F172A" }}>{value}</div>
    </div>
  );
}

function ComplianceChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-[0.1em] uppercase"
      style={{
        background: ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
        color: ok ? "#059669" : "#DC2626",
        border: `1px solid ${ok ? "rgba(16,185,129,0.22)" : "rgba(239,68,68,0.25)"}`,
      }}>
      {label} {ok ? "✓" : "✕"}
    </span>
  );
}

void ArrowRight;
