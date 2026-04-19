"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Star,
  Scale,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter as FilterIcon,
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react";
import { WORKER_POOL, TRADE_META, type Trade } from "@/lib/buildings/workers";
import { WORK_ORDERS } from "@/lib/buildings/work-orders";

interface VendorStats {
  companyName: string;
  tradeList: Trade[];
  techCount: number;
  rating: number;
  slaHitRate: number;
  jobsCompleted: number;
  monthlyVolume: number;
  monthlyShareRank: number;
  avgHourlyRate: number;
  compliance: "ok" | "lapsed";
  badges: string[];
  firstTech: string;
}

export default function VendorPerformancePage() {
  const [tradeFilter, setTradeFilter] = useState<Trade | "all">("all");
  const [search, setSearch] = useState("");

  // Aggregate contractors into vendor rows
  const vendors = useMemo(() => {
    const byCompany = new Map<string, typeof WORKER_POOL>();
    for (const w of WORKER_POOL) {
      if (w.type !== "contractor" || !w.company) continue;
      if (!byCompany.has(w.company)) byCompany.set(w.company, []);
      byCompany.get(w.company)!.push(w);
    }
    const arr: VendorStats[] = [];
    byCompany.forEach((techs) => {
      if (techs.length === 0) return;
      const lead = techs[0];
      const tradeList = Array.from(new Set(techs.flatMap((t) => t.trades)));
      const rating = +(techs.reduce((s, t) => s + t.rating, 0) / techs.length).toFixed(2);
      const slaHitRate = Math.round(techs.reduce((s, t) => s + t.slaHitRatePct, 0) / techs.length);
      const avgHourlyRate = Math.round(techs.reduce((s, t) => s + t.hourlyRate, 0) / techs.length);
      const jobsCompleted = techs.reduce((s, t) => s + t.completionsThisMonth, 0);
      const hasLapse = techs.some((t) => !t.insuranceValid || !t.wsibValid || !t.licenseValid);
      const badges = Array.from(new Set(techs.flatMap((t) => t.badges ?? [])));
      arr.push({
        companyName: lead.company!,
        tradeList,
        techCount: techs.length,
        rating,
        slaHitRate,
        jobsCompleted,
        monthlyVolume: jobsCompleted,
        monthlyShareRank: 0, // will backfill after sort
        avgHourlyRate,
        compliance: hasLapse ? "lapsed" : "ok",
        badges,
        firstTech: lead.id,
      });
    });
    arr.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    arr.forEach((v, i) => { v.monthlyShareRank = i + 1; });
    return arr;
  }, []);

  const totalVolume = vendors.reduce((s, v) => s + v.jobsCompleted, 0);
  const topVendorShare = vendors[0] ? vendors[0].jobsCompleted / Math.max(1, totalVolume) : 0;

  const filtered = useMemo(() => {
    return vendors.filter((v) => {
      if (tradeFilter !== "all" && !v.tradeList.includes(tradeFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!v.companyName.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [vendors, tradeFilter, search]);

  const kpis = useMemo(() => {
    const total = vendors.length;
    const topRated = vendors.filter((v) => v.rating >= 4.7).length;
    const lapsed = vendors.filter((v) => v.compliance === "lapsed").length;
    const fairnessFlags = vendors.filter((v) => v.jobsCompleted / Math.max(1, totalVolume) > 0.25).length;
    const totalSpend = WORK_ORDERS.reduce((s, o) => s + o.estHours * 120, 0);
    return { total, topRated, lapsed, fairnessFlags, totalSpend };
  }, [vendors, totalVolume]);

  const allTrades = useMemo(
    () => Array.from(new Set(vendors.flatMap((v) => v.tradeList))),
    [vendors],
  );

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} topShare={topVendorShare} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Active vendors"       value={kpis.total}                                        sub="contractor pool"    accent="#2563EB" />
        <Kpi label="Top-rated (≥4.7★)"    value={kpis.topRated}                                     sub="preferred tier"     accent="#10B981" />
        <Kpi label="Compliance lapsed"    value={kpis.lapsed}                                       sub="dispatch blocked"   accent="#DC2626" />
        <Kpi label="Fairness flags"       value={kpis.fairnessFlags}                                sub=">25% monthly share"  accent="#F59E0B" />
        <Kpi label="Monthly spend"        value={`$${(kpis.totalSpend / 1000).toFixed(0)}K`}        sub="est. from jobs"     accent="#7C3AED" />
        <Kpi label="Top vendor share"     value={`${Math.round(topVendorShare * 100)}%`}            sub="of monthly volume"   accent="#0891B2" />
      </div>

      <FairnessBanner topShare={topVendorShare} />

      <div className="flex items-center gap-3 flex-wrap">
        <TradeFilter value={tradeFilter} onChange={setTradeFilter} trades={allTrades} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendor…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> shown
          </span>
        </div>
      </div>

      <VendorTable vendors={filtered} totalVolume={totalVolume} />
    </div>
  );
}

function Hero({ kpis, topShare }: { kpis: { total: number; fairnessFlags: number }; topShare: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #7C3AED, #0EA5E9)", boxShadow: "0 2px 6px rgba(124,58,237,0.3)" }}
        >
          <Users className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #7C3AED, #0EA5E9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Vendor performance · fairness audit
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Who MAIA dispatched — and how they performed
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        {kpis.total} active vendors in the pool. Rotation is policy-driven — no vendor should exceed 25% of monthly volume.
        {kpis.fairnessFlags > 0 && <> <span className="font-bold text-amber-600">{kpis.fairnessFlags} fairness flag{kpis.fairnessFlags === 1 ? "" : "s"}</span> currently active.</>}
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: string | number; sub: string; accent: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`, border: `1px solid ${accent}22` }}>
      <div className="text-[9px] font-bold tracking-[0.14em] uppercase mb-1" style={{ color: accent }}>{label}</div>
      <div className="text-[20px] font-bold tabular-nums leading-tight text-[#0F172A]">{value}</div>
      <div className="text-[10px] text-[#64748B] mt-0.5">{sub}</div>
    </div>
  );
}

function FairnessBanner({ topShare }: { topShare: number }) {
  const pct = Math.round(topShare * 100);
  const ok = topShare < 0.25;
  return (
    <div
      className="rounded-2xl p-5 flex items-start gap-3"
      style={{
        background: ok ? "rgba(16,185,129,0.04)" : "rgba(245,158,11,0.06)",
        border: `1px solid ${ok ? "rgba(16,185,129,0.22)" : "rgba(245,158,11,0.3)"}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: ok ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.14)", border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.35)"}` }}
      >
        <Scale className="w-5 h-5" style={{ color: ok ? "#10B981" : "#F59E0B" }} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: ok ? "#059669" : "#B45309" }}>
            Fairness audit · live
          </span>
          <span className="ml-auto text-[11px] font-mono text-[#64748B]">rolling 30-day window</span>
        </div>
        <div className="text-[14px] font-bold text-[#0F172A] mb-1">
          {ok ? `Top vendor at ${pct}% of volume — within the 25% policy cap.` : `Top vendor at ${pct}% — above the 25% cap. Review rotation policy.`}
        </div>
        <div className="text-[11.5px] text-[#64748B] leading-relaxed">
          MAIA enforces rotation across the full vendor pool by policy. If a single vendor exceeds 25% of monthly work-order volume in any trade, the Dispatch Agent re-weights the fairness factor for the following month.
          {!ok && <> <Link href="/configs" className="font-bold text-[#2563EB] hover:underline">Review policy →</Link></>}
        </div>
      </div>
    </div>
  );
}

function TradeFilter({ value, onChange, trades }: { value: Trade | "all"; onChange: (v: Trade | "all") => void; trades: Trade[] }) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      <Pill active={value === "all"} onClick={() => onChange("all")} color="#0F172A" label="All trades" />
      {trades.map((t) => (
        <Pill key={t} active={value === t} onClick={() => onChange(t)} color={TRADE_META[t].color} label={`${TRADE_META[t].icon} ${TRADE_META[t].label}`} />
      ))}
    </div>
  );
}

function Pill({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
      style={{ color: active ? "#FFFFFF" : "#475569" }}
    >
      {active && (
        <motion.span
          layoutId="vp-trade"
          className="absolute inset-0 rounded-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

function VendorTable({ vendors, totalVolume }: { vendors: VendorStats[]; totalVolume: number }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="grid grid-cols-[0.3fr_2fr_1.2fr_0.8fr_1fr_1fr_0.6fr_0.4fr] gap-3 px-5 py-3 border-b border-slate-100"
        style={{ background: "rgba(15,23,42,0.02)" }}>
        <HeaderCell>#</HeaderCell>
        <HeaderCell>Vendor</HeaderCell>
        <HeaderCell>Trades</HeaderCell>
        <HeaderCell>Rating</HeaderCell>
        <HeaderCell>SLA · Cost</HeaderCell>
        <HeaderCell>Monthly share</HeaderCell>
        <HeaderCell>Compliance</HeaderCell>
        <HeaderCell></HeaderCell>
      </div>
      <div className="divide-y divide-slate-50">
        {vendors.map((v) => {
          const share = v.jobsCompleted / Math.max(1, totalVolume);
          const sharePct = Math.round(share * 100);
          const shareBad = share > 0.25;
          const ratingColor = v.rating >= 4.7 ? "#10B981" : v.rating >= 4.4 ? "#F59E0B" : "#64748B";
          return (
            <div key={v.companyName} className="grid grid-cols-[0.3fr_2fr_1.2fr_0.8fr_1fr_1fr_0.6fr_0.4fr] gap-3 px-5 py-3 items-center hover:bg-[#F8FAFC] transition-colors">
              <div className="text-[11px] font-mono text-[#94A3B8]">#{v.monthlyShareRank}</div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[12.5px] font-bold text-[#0F172A]">{v.companyName}</div>
                  {v.badges.map((b) => (
                    <span key={b} className="inline-flex items-center gap-0.5 px-1 rounded text-[8.5px] font-bold tracking-[0.12em] uppercase"
                      style={{
                        background: b.includes("LAPSED") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
                        color: b.includes("LAPSED") ? "#DC2626" : "#059669",
                        border: `1px solid ${b.includes("LAPSED") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
                      }}>
                      {b}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5">{v.techCount} tech{v.techCount === 1 ? "" : "s"} · {v.jobsCompleted} jobs this month</div>
              </div>
              <div className="flex flex-wrap gap-1">
                {v.tradeList.slice(0, 3).map((t) => (
                  <span key={t} className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9.5px] font-semibold"
                    style={{ background: `${TRADE_META[t].color}12`, color: TRADE_META[t].color, border: `1px solid ${TRADE_META[t].color}26` }}>
                    {TRADE_META[t].icon} {TRADE_META[t].label}
                  </span>
                ))}
                {v.tradeList.length > 3 && (
                  <span className="text-[9.5px] text-[#94A3B8]">+{v.tradeList.length - 3}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" style={{ color: ratingColor, fill: ratingColor }} />
                <span className="text-[12px] font-bold tabular-nums" style={{ color: ratingColor }}>{v.rating.toFixed(1)}</span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-[#0F172A] tabular-nums">{v.slaHitRate}% · ${v.avgHourlyRate}/h</div>
                <div className="text-[9.5px] text-[#94A3B8]">SLA hit · avg rate</div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, sharePct * 3)}%`, background: shareBad ? "#F59E0B" : "#2563EB" }} />
                  </div>
                  <span className="text-[11px] font-bold tabular-nums" style={{ color: shareBad ? "#B45309" : "#0F172A" }}>{sharePct}%</span>
                </div>
                {shareBad && <div className="text-[9px] text-amber-600 mt-0.5">↑ above 25% cap</div>}
              </div>
              <div>
                {v.compliance === "ok" ? (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: "rgba(16,185,129,0.08)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    Current
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.25)" }}>
                    <AlertTriangle className="w-2.5 h-2.5" />
                    Lapsed
                  </span>
                )}
              </div>
              <div className="text-right">
                <Link href="/workforce-directory" className="inline-block text-slate-300 hover:text-[#2563EB]">
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">{children}</div>
  );
}

void Shield; void Clock; void TrendingUp; void DollarSign;
