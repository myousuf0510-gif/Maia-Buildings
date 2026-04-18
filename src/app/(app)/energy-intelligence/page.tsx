"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap,
  TrendingDown,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Gauge,
} from "lucide-react";
import { PORTFOLIO_DATA, portfolioTotals, healthColor } from "@/lib/buildings/portfolio";

const GTA_CLASS_AVG_KWH_SQFT = 18.2;   // rolling 12mo peer benchmark
const BLENDED_RATE_PER_KWH = 0.145;    // $ blended TOU + delivery

interface Opportunity {
  id: string;
  title: string;
  building: string;
  buildingId: string;
  category: "setpoint" | "schedule" | "equipment" | "contract" | "retrofit";
  effort: "LOW" | "MEDIUM" | "HIGH";
  monthlySaving: number;
  annualSaving: number;
  rationale: string;
  tier: "quick" | "ongoing";
  accent: string;
}

function generateOpportunities(): Opportunity[] {
  const out: Opportunity[] = [];
  PORTFOLIO_DATA.forEach((b, i) => {
    const overBaseline = b.energyKwhPerSqft - GTA_CLASS_AVG_KWH_SQFT;
    if (overBaseline > 1.5 && out.length < 14) {
      out.push({
        id: `opp-${i}-set`,
        title: `Tighten overnight HVAC setpoints · ${b.name}`,
        building: b.name,
        buildingId: b.id,
        category: "setpoint",
        effort: "LOW",
        monthlySaving: Math.round(b.sqft * 0.0038),
        annualSaving: Math.round(b.sqft * 0.046),
        rationale: `${b.energyKwhPerSqft} kWh/sqft vs ${GTA_CLASS_AVG_KWH_SQFT} baseline. Widening unoccupied drift band from 2°C to 4°C captures off-peak savings.`,
        tier: "quick",
        accent: "#10B981",
      });
    }
    if (b.class === "multifamily_hirise" && i % 3 === 0) {
      out.push({
        id: `opp-${i}-sched`,
        title: `Amenity scheduling · ${b.name}`,
        building: b.name,
        buildingId: b.id,
        category: "schedule",
        effort: "LOW",
        monthlySaving: Math.round(b.units * 4.8),
        annualSaving: Math.round(b.units * 57.6),
        rationale: "Pool pump + gym HVAC running outside occupancy windows. 63% of energy waste is in off-hours.",
        tier: "quick",
        accent: "#0891B2",
      });
    }
    if (b.yearBuilt < 1995 && i % 4 === 0) {
      out.push({
        id: `opp-${i}-eq`,
        title: `Common-area LED retrofit · ${b.name}`,
        building: b.name,
        buildingId: b.id,
        category: "retrofit",
        effort: "MEDIUM",
        monthlySaving: Math.round(b.sqft * 0.0018),
        annualSaving: Math.round(b.sqft * 0.022),
        rationale: "Hallways + stairwells still on T8 fluorescent. LED swap pays back in ~14 months at current rates.",
        tier: "ongoing",
        accent: "#F59E0B",
      });
    }
  });
  // Add a portfolio-wide contract opportunity
  out.unshift({
    id: "opp-contract-hvac",
    title: "Consolidate HVAC service · 4-building package bid",
    building: "Portfolio",
    buildingId: PORTFOLIO_DATA[0].id,
    category: "contract",
    effort: "MEDIUM",
    monthlySaving: 3_167,
    annualSaving: 38_000,
    rationale: "ClimateCare HVAC bid $38K below incumbent on a 4-building package. Fairness audit clean. Switch saves 18% vs current.",
    tier: "ongoing",
    accent: "#7C3AED",
  });
  return out.slice(0, 20);
}

const OPPS = generateOpportunities();

export default function EnergyIntelligencePage() {
  const [view, setView] = useState<"opps" | "buildings">("opps");

  const kpis = useMemo(() => {
    const totals = portfolioTotals();
    const sqftTotal = totals.sqftTotal;
    const avgKwhPerSqft = +(PORTFOLIO_DATA.reduce((s, b) => s + b.energyKwhPerSqft * b.sqft, 0) / sqftTotal).toFixed(1);
    const annualKwh = sqftTotal * avgKwhPerSqft;
    const annualSpend = annualKwh * BLENDED_RATE_PER_KWH;
    const vsBenchmark = +((avgKwhPerSqft - GTA_CLASS_AVG_KWH_SQFT) / GTA_CLASS_AVG_KWH_SQFT * 100).toFixed(1);
    const totalAnnualSaving = OPPS.reduce((s, o) => s + o.annualSaving, 0);
    return {
      sqftTotal,
      avgKwhPerSqft,
      annualSpend,
      vsBenchmark,
      totalAnnualSaving,
      buildingsAbove: PORTFOLIO_DATA.filter((b) => b.energyKwhPerSqft > GTA_CLASS_AVG_KWH_SQFT).length,
    };
  }, []);

  const quick = OPPS.filter((o) => o.tier === "quick");
  const ongoing = OPPS.filter((o) => o.tier === "ongoing");
  const sortedBuildings = useMemo(() => [...PORTFOLIO_DATA].sort((a, b) => b.energyKwhPerSqft - a.energyKwhPerSqft), []);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Annual spend"    value={`$${(kpis.annualSpend / 1_000_000).toFixed(2)}M`} sub="portfolio utilities" accent="#2563EB" />
        <Kpi label="kWh/sqft"        value={kpis.avgKwhPerSqft.toString()}                     sub="weighted avg"         accent="#7C3AED" />
        <Kpi label="vs GTA avg"      value={`${kpis.vsBenchmark > 0 ? "+" : ""}${kpis.vsBenchmark}%`} sub={`baseline ${GTA_CLASS_AVG_KWH_SQFT}`} accent={kpis.vsBenchmark > 0 ? "#EF4444" : "#10B981"} />
        <Kpi label="Above benchmark" value={kpis.buildingsAbove}                               sub="buildings flagged"    accent="#F59E0B" />
        <Kpi label="Opportunities"   value={OPPS.length}                                       sub="ranked by impact"     accent="#10B981" />
        <Kpi label="Potential saving" value={`$${(kpis.totalAnnualSaving / 1000).toFixed(0)}K`} sub="annualised"           accent="#059669" live />
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl" style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}>
        {([
          { key: "opps", label: "Savings opportunities", color: "#10B981" },
          { key: "buildings", label: "Per-building performance", color: "#2563EB" },
        ] as const).map((t) => {
          const active = t.key === view;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setView(t.key)}
              className="relative px-3 py-1.5 text-[11.5px] font-semibold rounded-lg"
              style={{ color: active ? "#FFFFFF" : "#475569" }}
            >
              {active && (
                <motion.span
                  layoutId="energy-view"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`, boxShadow: `0 2px 8px ${t.color}40` }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          );
        })}
      </div>

      {view === "opps" ? (
        <>
          <Opportunities title="Quick wins · low effort" items={quick} />
          <Opportunities title="Ongoing · medium / high effort" items={ongoing} />
        </>
      ) : (
        <BuildingTable buildings={sortedBuildings} />
      )}
    </div>
  );
}

function Hero({ kpis }: { kpis: { annualSpend: number; vsBenchmark: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #10B981, #0891B2)", boxShadow: "0 2px 6px rgba(16,185,129,0.3)" }}
        >
          <Zap className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #10B981, #0891B2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Energy & Utility Optimizer · live
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        ${(kpis.annualSpend / 1_000_000).toFixed(2)}M on utilities — here&apos;s where to find the leaks
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        Portfolio energy intensity is{" "}
        <span className="font-bold" style={{ color: kpis.vsBenchmark > 0 ? "#EF4444" : "#10B981" }}>
          {kpis.vsBenchmark > 0 ? `${kpis.vsBenchmark}% above` : `${Math.abs(kpis.vsBenchmark)}% below`}
        </span>{" "}
        the GTA class average. Opportunities are ranked by annual saving vs. effort to execute.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, accent, live }: { label: string; value: string | number; sub: string; accent: string; live?: boolean }) {
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

function Opportunities({ title, items }: { title: string; items: Opportunity[] }) {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <div className="flex-1">
          <div className="text-[13px] font-bold text-[#0F172A] leading-tight">{title}</div>
          <div className="text-[10.5px] text-[#64748B]">{items.length} opportunities · applied {applied.size} of {items.length}</div>
        </div>
        <span className="text-[10.5px] text-[#64748B]">
          Annual: <span className="font-bold tabular-nums text-emerald-600">
            ${items.reduce((s, o) => s + o.annualSaving, 0).toLocaleString()}
          </span>
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
        {items.map((o) => {
          const isApplied = applied.has(o.id);
          return (
            <div
              key={o.id}
              className="rounded-xl p-3 transition-all"
              style={{
                background: isApplied ? `${o.accent}08` : `linear-gradient(135deg, ${o.accent}04, #FFFFFF 60%)`,
                border: isApplied ? `1.5px solid ${o.accent}55` : `1px solid ${o.accent}22`,
              }}
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                  style={{ background: `${o.accent}14`, color: o.accent, border: `1px solid ${o.accent}30` }}>
                  {o.effort}
                </span>
                <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[#94A3B8]">{o.category}</span>
              </div>
              <div className="text-[12.5px] font-bold text-[#0F172A] leading-tight mb-1">{o.title}</div>
              <div className="text-[10.5px] text-[#64748B] leading-snug mb-2 line-clamp-3">{o.rationale}</div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[18px] font-bold tabular-nums" style={{ color: o.accent }}>
                  ${o.annualSaving.toLocaleString()}
                </span>
                <span className="text-[9.5px] text-[#94A3B8]">/yr · ${o.monthlySaving.toLocaleString()}/mo</span>
              </div>
              <button
                type="button"
                onClick={() => setApplied((p) => { const n = new Set(p); if (n.has(o.id)) n.delete(o.id); else n.add(o.id); return n; })}
                className="w-full inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[10.5px] font-bold tracking-wide transition-all"
                style={{
                  background: isApplied ? `linear-gradient(135deg, ${o.accent}22, ${o.accent}11)` : `linear-gradient(135deg, ${o.accent}, ${o.accent}CC)`,
                  color: isApplied ? o.accent : "#FFFFFF",
                  border: isApplied ? `1px solid ${o.accent}55` : "1px solid transparent",
                }}
              >
                {isApplied ? <><CheckCircle2 className="w-3 h-3" /> Applied</> : <>Apply <ArrowRight className="w-3 h-3" /></>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BuildingTable({ buildings }: { buildings: typeof PORTFOLIO_DATA }) {
  const max = Math.max(...buildings.map((b) => b.energyKwhPerSqft));
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
        <Gauge className="w-3.5 h-3.5 text-[#2563EB]" />
        <span className="text-[12.5px] font-bold text-[#0F172A]">Per-building energy performance</span>
        <span className="ml-auto text-[10px] text-[#94A3B8]">Sorted by intensity · highest first</span>
      </div>
      <div className="divide-y divide-slate-50">
        {buildings.map((b) => {
          const overBy = +(b.energyKwhPerSqft - GTA_CLASS_AVG_KWH_SQFT).toFixed(1);
          const color = overBy > 3 ? "#EF4444" : overBy > 1 ? "#F59E0B" : "#10B981";
          const annual = Math.round(b.sqft * b.energyKwhPerSqft * BLENDED_RATE_PER_KWH);
          const width = (b.energyKwhPerSqft / max) * 100;
          return (
            <Link key={b.id} href={`/building-detail?id=${b.id}`} className="block px-5 py-2.5 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: healthColor(b.healthScore) }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[12px] font-bold text-[#0F172A] truncate">{b.name}</span>
                    <span className="text-[10px] text-[#64748B]">{b.sqft.toLocaleString()} sqft</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
                  </div>
                </div>
                <div className="text-right shrink-0 w-20">
                  <div className="text-[12.5px] font-bold tabular-nums text-[#0F172A]">{b.energyKwhPerSqft}</div>
                  <div className="text-[9.5px] text-[#94A3B8]">kWh/sqft</div>
                </div>
                <div className="text-right shrink-0 w-24">
                  <div className="text-[12px] font-bold tabular-nums" style={{ color }}>
                    {overBy > 0 ? "+" : ""}{overBy}
                  </div>
                  <div className="text-[9.5px] text-[#94A3B8]">vs benchmark</div>
                </div>
                <div className="text-right shrink-0 w-28">
                  <div className="text-[12px] font-bold tabular-nums text-[#0F172A]">${(annual / 1000).toFixed(0)}K</div>
                  <div className="text-[9.5px] text-[#94A3B8]">annual spend</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

void TrendingDown; void TrendingUp; void DollarSign;
