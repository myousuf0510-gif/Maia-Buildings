"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Home,
  Search,
} from "lucide-react";
import { VACATING_UNITS, LEASE_EXPIRIES, STAGE_META, type TurnoverStage } from "@/lib/buildings/vacancy";

export default function VacancyIntelligencePage() {
  const [stageFilter, setStageFilter] = useState<TurnoverStage | "all">("all");
  const [search, setSearch] = useState("");

  const kpis = useMemo(() => {
    const inFlight = VACATING_UNITS.length;
    const bottlenecks = VACATING_UNITS.filter((u) => u.bottleneck).length;
    const nextRenewals = LEASE_EXPIRIES.filter((l) => {
      const d = new Date(l.expiresOn).getTime();
      const today = Date.now();
      return d - today < 30 * 86_400_000;
    }).length;
    const atRisk = LEASE_EXPIRIES.filter((l) => l.renewalProbability < 0.45).length;
    const projectedLift = VACATING_UNITS.reduce((s, u) => s + (u.projectedRent - u.currentRent), 0);
    const avgFlipDays = Math.round(VACATING_UNITS.reduce((s, u) => s + u.expectedFlipDays, 0) / Math.max(1, inFlight));
    return { inFlight, bottlenecks, nextRenewals, atRisk, projectedLift, avgFlipDays };
  }, []);

  const filteredVacating = useMemo(() => {
    return VACATING_UNITS.filter((u) => {
      if (stageFilter !== "all" && u.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!u.buildingName.toLowerCase().includes(q) && !u.unit.toLowerCase().includes(q) && !u.tenant.toLowerCase().includes(q) && !u.neighbourhood.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stageFilter, search]);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Units turning over" value={kpis.inFlight} sub="pipeline live" accent="#F59E0B" live />
        <Kpi label="Bottlenecks" value={kpis.bottlenecks} sub="needs intervention" accent="#EF4444" />
        <Kpi label="Avg flip days" value={`${kpis.avgFlipDays}d`} sub="target 14d" accent="#7C3AED" />
        <Kpi label="Renewals · next 30d" value={kpis.nextRenewals} sub="under review" accent="#2563EB" />
        <Kpi label="At-risk renewals" value={kpis.atRisk} sub="<45% probability" accent="#DC2626" />
        <Kpi label="Projected rent lift" value={`+$${(kpis.projectedLift / 1000).toFixed(1)}K/mo`} sub="from flips" accent="#10B981" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <StagePills value={stageFilter} onChange={setStageFilter} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search unit, building, tenant, neighbourhood…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filteredVacating.length}</span> of {VACATING_UNITS.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <TurnoverPipeline units={filteredVacating} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <LeaseExpiriesPanel />
        </div>
      </div>
    </div>
  );
}

function Hero({ kpis }: { kpis: { inFlight: number; bottlenecks: number; projectedLift: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #F59E0B, #7C3AED)", boxShadow: "0 2px 6px rgba(245,158,11,0.3)" }}
        >
          <TrendingDown className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #F59E0B, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Vacancy & Turnover Watcher · live
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Every unit turning over, every lease expiring, every bottleneck flagged
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        {kpis.inFlight} units in flight · {kpis.bottlenecks} with bottleneck trades. Projected rent lift from this wave of flips:
        <span className="font-bold text-[#10B981]"> +${(kpis.projectedLift / 1000).toFixed(1)}K/mo</span>.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, accent, live }: { label: string; value: string | number; sub: string; accent: string; live?: boolean }) {
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
      <div className="text-[10px] text-[#64748B] mt-0.5">{sub}</div>
    </div>
  );
}

function StagePills({ value, onChange }: { value: TurnoverStage | "all"; onChange: (s: TurnoverStage | "all") => void }) {
  const stages = Object.entries(STAGE_META).sort((a, b) => a[1].order - b[1].order);
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <button
        type="button"
        onClick={() => onChange("all")}
        className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg"
        style={{ color: value === "all" ? "#FFFFFF" : "#475569" }}
      >
        {value === "all" && (
          <motion.span
            layoutId="vac-stage-filter"
            className="absolute inset-0 rounded-lg"
            style={{ background: "linear-gradient(135deg, #0F172A, #0F172ACC)" }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          />
        )}
        <span className="relative">All stages</span>
      </button>
      {stages.map(([key, meta]) => {
        const active = key === value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key as TurnoverStage)}
            className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="vac-stage-filter"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}CC)`, boxShadow: `0 2px 8px ${meta.color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TurnoverPipeline({ units }: { units: typeof VACATING_UNITS }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Turnover pipeline</div>
        <div className="text-[10.5px] text-[#64748B]">Every vacating unit, current stage, expected flip time, projected rent lift</div>
      </div>
      <div className="divide-y divide-slate-50">
        {units.map((u) => {
          const stage = STAGE_META[u.stage];
          const rentLift = u.projectedRent - u.currentRent;
          const liftPct = +(rentLift / u.currentRent * 100).toFixed(1);
          return (
            <Link key={u.id} href={`/building-detail?id=${u.buildingId}`} className="block px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${stage.color}14`, border: `1px solid ${stage.color}30` }}
                >
                  <Home className="w-4 h-4" style={{ color: stage.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[12.5px] font-bold text-[#0F172A]">Unit {u.unit}</span>
                    <span className="text-[10px] text-[#64748B]">·</span>
                    <span className="text-[11px] text-[#475569] truncate">{u.buildingName}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                      style={{ background: `${stage.color}12`, color: stage.color, border: `1px solid ${stage.color}30` }}>
                      {stage.label}
                    </span>
                    {u.bottleneck && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.25)" }}>
                        <AlertTriangle className="w-2 h-2" />
                        {u.bottleneck}
                      </span>
                    )}
                  </div>
                  <div className="text-[10.5px] text-[#64748B] mb-1">
                    {u.tenant} vacating · notice {u.daysSinceNotice}d ago · key turnover on {u.vacateDate}
                  </div>
                  <PipelineBar current={u.stage} />
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-[#10B981]">
                    <TrendingUp className="w-3 h-3" />
                    +${rentLift.toLocaleString()}/mo · {liftPct}%
                  </div>
                  <div className="text-[10px] text-[#64748B]">${u.currentRent} → ${u.projectedRent}</div>
                  <div className="text-[9.5px] text-[#94A3B8]">{u.expectedFlipDays}d est. flip</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PipelineBar({ current }: { current: TurnoverStage }) {
  const stages = Object.entries(STAGE_META).sort((a, b) => a[1].order - b[1].order);
  const currentOrder = STAGE_META[current].order;
  return (
    <div className="flex items-center gap-0.5 w-full">
      {stages.map(([key, meta]) => {
        const completed = meta.order <= currentOrder;
        return (
          <span
            key={key}
            className="flex-1 h-1 rounded-full"
            style={{ background: completed ? meta.color : "rgba(15,23,42,0.08)", opacity: completed ? 1 : 1 }}
            title={meta.label}
          />
        );
      })}
    </div>
  );
}

function LeaseExpiriesPanel() {
  const next = LEASE_EXPIRIES.slice(0, 14);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
          <span className="text-[12px] font-bold text-[#0F172A]">Lease expiries</span>
          <span className="ml-auto text-[10px] text-[#94A3B8]">{LEASE_EXPIRIES.length} total</span>
        </div>
        <div className="text-[10px] text-[#64748B]">Sorted by expiry date · renewal probability visible</div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 780 }}>
        <div className="divide-y divide-slate-50">
          {next.map((l, i) => {
            const daysAway = Math.round((new Date(l.expiresOn).getTime() - Date.now()) / 86_400_000);
            const probColor = l.renewalProbability >= 0.7 ? "#10B981" : l.renewalProbability >= 0.45 ? "#F59E0B" : "#EF4444";
            return (
              <Link key={i} href={`/building-detail?id=${l.buildingId}`} className="block px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11.5px] font-bold text-[#0F172A]">Unit {l.unit}</span>
                  <span className="text-[10px] text-[#94A3B8] truncate flex-1">{l.buildingName}</span>
                </div>
                <div className="text-[10px] text-[#64748B] mb-1">
                  {l.tenant} · {l.tenure} · ${l.currentRent}/mo
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${l.renewalProbability * 100}%`, background: probColor }} />
                  </div>
                  <span className="text-[9.5px] font-bold tabular-nums shrink-0" style={{ color: probColor }}>
                    {Math.round(l.renewalProbability * 100)}%
                  </span>
                  <span className="text-[9.5px] font-mono tabular-nums text-[#94A3B8] shrink-0">
                    {daysAway > 0 ? `${daysAway}d` : "due"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

void CheckCircle2; void ArrowRight;
