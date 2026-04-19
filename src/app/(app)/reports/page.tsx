"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  ArrowRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Wallet,
  Zap,
  Wrench,
  Home,
} from "lucide-react";
import { PORTFOLIO_DATA, portfolioTotals, healthColor } from "@/lib/buildings/portfolio";
import { ARREARS } from "@/lib/buildings/arrears";
import { WORK_ORDERS } from "@/lib/buildings/work-orders";

type Period = "mtd" | "qtd" | "ytd" | "ttm";

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("qtd");
  const [exported, setExported] = useState(false);

  const totals = useMemo(() => portfolioTotals(), []);

  // Monthly revenue trend (last 12 months)
  const revTrend = useMemo(() => buildRevenueTrend(totals.monthlyRevenue), [totals.monthlyRevenue]);
  const noiTrend = useMemo(() => buildNoiTrend(revTrend), [revTrend]);

  // Arrears aging buckets
  const aging = useMemo(() => {
    const b = { lt7: 0, d7_14: 0, d14_30: 0, d30_60: 0, gt60: 0 };
    for (const a of ARREARS) {
      if (a.daysOverdue < 7) b.lt7 += a.balance;
      else if (a.daysOverdue < 14) b.d7_14 += a.balance;
      else if (a.daysOverdue < 30) b.d14_30 += a.balance;
      else if (a.daysOverdue < 60) b.d30_60 += a.balance;
      else b.gt60 += a.balance;
    }
    return b;
  }, []);
  const agingTotal = aging.lt7 + aging.d7_14 + aging.d14_30 + aging.d30_60 + aging.gt60;

  // Opex breakdown (synthesised)
  const annualRev = totals.monthlyRevenue * 12;
  const opex = {
    labor:       Math.round(annualRev * 0.18),
    maintenance: Math.round(annualRev * 0.12),
    utilities:   Math.round(annualRev * 0.09),
    insurance:   Math.round(annualRev * 0.04),
    propertyTax: Math.round(annualRev * 0.07),
    management:  Math.round(annualRev * 0.035),
    other:       Math.round(annualRev * 0.025),
  };
  const totalOpex = Object.values(opex).reduce((s, v) => s + v, 0);
  const noi = annualRev - totalOpex;

  // Top buildings by revenue
  const topRevenue = useMemo(
    () => [...PORTFOLIO_DATA].sort((a, b) => b.monthlyRevenue - a.monthlyRevenue).slice(0, 10),
    [],
  );
  // Bottom by health
  const bottomHealth = useMemo(
    () => [...PORTFOLIO_DATA].sort((a, b) => a.healthScore - b.healthScore).slice(0, 10),
    [],
  );

  // Work order spend estimate
  const woSpend = useMemo(() => {
    return WORK_ORDERS.reduce((s, o) => s + o.estHours * 120, 0); // rough $/hr
  }, []);

  const handleExport = () => {
    const rows: string[] = [];
    rows.push(["period", "revenue", "opex", "noi"].join(","));
    revTrend.forEach((r, i) => {
      rows.push([r.month, r.revenue, Math.round(r.revenue * 0.45), Math.round(r.revenue * 0.55)].join(","));
      void i;
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maia-financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="p-8 space-y-6">
      <Hero totals={totals} period={period} onPeriod={setPeriod} onExport={handleExport} exported={exported} annualRev={annualRev} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Annual revenue"    value={`$${(annualRev / 1_000_000).toFixed(1)}M`} sub="rent under management" accent="#2563EB" />
        <Kpi label="NOI"               value={`$${(noi / 1_000_000).toFixed(1)}M`}       sub={`${Math.round((noi / annualRev) * 100)}% margin`} accent="#10B981" />
        <Kpi label="Total opex"        value={`$${(totalOpex / 1_000_000).toFixed(1)}M`} sub={`${Math.round((totalOpex / annualRev) * 100)}% of revenue`} accent="#F59E0B" />
        <Kpi label="Arrears balance"   value={`$${(agingTotal / 1000).toFixed(0)}K`}     sub={`${ARREARS.length} tenants`} accent="#DC2626" />
        <Kpi label="Work order spend"  value={`$${(woSpend / 1000).toFixed(0)}K`}        sub="last 72h of orders" accent="#7C3AED" />
        <Kpi label="Occupancy"         value={`${totals.occupancyPct}%`}                  sub="portfolio weighted" accent="#0891B2" live />
      </div>

      {/* Revenue trend */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8">
          <RevenueChart trend={revTrend} noi={noiTrend} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <OpexBreakdown opex={opex} totalOpex={totalOpex} />
        </div>
      </div>

      {/* Arrears aging + top/bottom */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4">
          <AgingCard aging={aging} total={agingTotal} />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <BuildingLeaderboard title="Top revenue contributors" items={topRevenue} accent="#10B981" metric="monthlyRevenue" />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <BuildingLeaderboard title="Buildings under pressure" items={bottomHealth} accent="#EF4444" metric="healthScore" />
        </div>
      </div>
    </div>
  );
}

function Hero({ totals, period, onPeriod, onExport, exported, annualRev }: {
  totals: ReturnType<typeof portfolioTotals>;
  period: Period;
  onPeriod: (p: Period) => void;
  onExport: () => void;
  exported: boolean;
  annualRev: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #10B981, #0891B2)", boxShadow: "0 2px 6px rgba(16,185,129,0.3)" }}
        >
          <DollarSign className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #10B981, #0891B2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Portfolio financial reports · {totals.buildingCount} buildings
        </span>
      </div>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
            ${(annualRev / 1_000_000).toFixed(1)}M under management
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
            Revenue trends, NOI margin, opex breakdown, arrears aging, per-building performance.
            Export to CSV for accounting or board reporting.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <PeriodPills value={period} onChange={onPeriod} />
          <button type="button" onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold text-white transition-all"
            style={{
              background: exported ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #2563EB, #7C3AED)",
              boxShadow: exported ? "0 2px 8px rgba(16,185,129,0.3)" : "0 2px 8px rgba(37,99,235,0.3)",
            }}>
            {exported ? <><CheckCircle2 className="w-3.5 h-3.5" /> Exported</> : <><Download className="w-3.5 h-3.5" /> Export CSV</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PeriodPills({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  const opts: { k: Period; l: string }[] = [
    { k: "mtd", l: "MTD" }, { k: "qtd", l: "QTD" }, { k: "ytd", l: "YTD" }, { k: "ttm", l: "TTM" },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}>
      {opts.map((o) => {
        const active = o.k === value;
        return (
          <button key={o.k} type="button" onClick={() => onChange(o.k)}
            className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}>
            {active && (
              <motion.span layoutId="rep-period" className="absolute inset-0 rounded-lg"
                style={{ background: "linear-gradient(135deg, #0F172A, #334155)" }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }} />
            )}
            <span className="relative">{o.l}</span>
          </button>
        );
      })}
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

// ─── Revenue chart (SVG bars + NOI line) ───────────────────────────────────

function RevenueChart({ trend, noi }: { trend: { month: string; revenue: number }[]; noi: { month: string; value: number }[] }) {
  const W = 600, H = 260, pad = 28;
  const maxRev = Math.max(...trend.map((r) => r.revenue)) * 1.1;
  const barW = (W - pad * 2) / trend.length * 0.6;
  const stepX = (W - pad * 2) / trend.length;

  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Revenue & NOI · last 12 months</div>
          <div className="text-[10.5px] text-[#64748B]">Monthly rent collected vs. net operating income</div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <LegendDot color="#2563EB" label="Revenue" />
          <LegendDot color="#10B981" label="NOI" />
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
        {/* gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={pad} y1={pad + (H - pad * 2) * (1 - t)} x2={W - pad} y2={pad + (H - pad * 2) * (1 - t)} stroke="rgba(15,23,42,0.06)" strokeWidth="1" />
        ))}
        {/* bars */}
        {trend.map((r, i) => {
          const h = (r.revenue / maxRev) * (H - pad * 2);
          const x = pad + i * stepX + (stepX - barW) / 2;
          const y = H - pad - h;
          return (
            <g key={r.month}>
              <rect x={x} y={y} width={barW} height={h} rx={3} fill="url(#revGrad)" opacity="0.9" />
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={9} fill="#94A3B8" fontFamily="'JetBrains Mono', monospace">{r.month}</text>
            </g>
          );
        })}
        {/* NOI line */}
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="2"
          points={noi.map((n, i) => {
            const x = pad + i * stepX + stepX / 2;
            const y = pad + (H - pad * 2) * (1 - n.value / maxRev);
            return `${x},${y}`;
          }).join(" ")}
        />
        {/* NOI dots */}
        {noi.map((n, i) => {
          const x = pad + i * stepX + stepX / 2;
          const y = pad + (H - pad * 2) * (1 - n.value / maxRev);
          return <circle key={i} cx={x} cy={y} r="3" fill="#10B981" />;
        })}
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.55" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[#475569] font-medium">{label}</span>
    </span>
  );
}

// ─── Opex breakdown ────────────────────────────────────────────────────────

function OpexBreakdown({ opex, totalOpex }: { opex: Record<string, number>; totalOpex: number }) {
  const rows: { key: string; label: string; icon: React.ElementType; color: string }[] = [
    { key: "labor",       label: "Labour & payroll",   icon: Wallet,   color: "#2563EB" },
    { key: "maintenance", label: "Maintenance & R&M",  icon: Wrench,   color: "#F59E0B" },
    { key: "utilities",   label: "Utilities & energy", icon: Zap,      color: "#10B981" },
    { key: "propertyTax", label: "Property tax",       icon: Home,     color: "#7C3AED" },
    { key: "insurance",   label: "Insurance",          icon: CheckCircle2, color: "#0891B2" },
    { key: "management",  label: "Management fees",    icon: Building2, color: "#EC4899" },
    { key: "other",       label: "Other opex",         icon: DollarSign, color: "#64748B" },
  ];
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="text-[13px] font-bold text-[#0F172A] mb-1">Opex breakdown · annualised</div>
      <div className="text-[10.5px] text-[#64748B] mb-4">$
        {(totalOpex / 1_000_000).toFixed(1)}M across the portfolio</div>
      <div className="space-y-2">
        {rows.map((r) => {
          const v = opex[r.key];
          const pct = (v / totalOpex) * 100;
          return (
            <div key={r.key}>
              <div className="flex items-center gap-2 mb-0.5 text-[11px]">
                <r.icon className="w-3 h-3" style={{ color: r.color }} />
                <span className="font-semibold text-[#334155]">{r.label}</span>
                <span className="ml-auto font-mono font-bold text-[#0F172A]">${(v / 1000).toFixed(0)}K</span>
                <span className="text-[9.5px] text-[#94A3B8] w-10 text-right">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.06)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: r.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Arrears aging card ────────────────────────────────────────────────────

function AgingCard({ aging, total }: { aging: { lt7: number; d7_14: number; d14_30: number; d30_60: number; gt60: number }; total: number }) {
  const buckets = [
    { k: "lt7",    l: "< 7 days",  v: aging.lt7,    c: "#10B981" },
    { k: "d7_14",  l: "7–14 days", v: aging.d7_14,  c: "#F59E0B" },
    { k: "d14_30", l: "14–30 d",   v: aging.d14_30, c: "#D97706" },
    { k: "d30_60", l: "30–60 d",   v: aging.d30_60, c: "#DC2626" },
    { k: "gt60",   l: "> 60 days", v: aging.gt60,   c: "#991B1B" },
  ];
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
        <div className="text-[13px] font-bold text-[#0F172A]">Arrears aging</div>
        <Link href="/arrears-intelligence" className="ml-auto text-[10.5px] font-bold text-[#2563EB] hover:underline">
          Full intel →
        </Link>
      </div>
      <div className="text-[20px] font-bold tabular-nums text-rose-600 leading-tight">
        ${(total / 1000).toFixed(0)}K
      </div>
      <div className="text-[10.5px] text-[#64748B] mb-4">total balance owed · RTA-compliant escalations pending</div>
      <div className="space-y-2">
        {buckets.map((b) => {
          const pct = total === 0 ? 0 : (b.v / total) * 100;
          return (
            <div key={b.k}>
              <div className="flex items-center gap-2 mb-0.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: b.c }} />
                <span className="font-semibold text-[#475569]">{b.l}</span>
                <span className="ml-auto font-mono tabular-nums text-[#0F172A]">${(b.v / 1000).toFixed(1)}K</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.05)" }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.c }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Building leaderboard ──────────────────────────────────────────────────

function BuildingLeaderboard({ title, items, accent, metric }: {
  title: string;
  items: typeof PORTFOLIO_DATA;
  accent: string;
  metric: "monthlyRevenue" | "healthScore";
}) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <div className="text-[12px] font-bold text-[#0F172A]">{title}</div>
        <Link href="/portfolio-map" className="ml-auto text-[10px] font-bold text-[#2563EB] hover:underline">Map →</Link>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((b, i) => (
          <Link key={b.id} href={`/building-detail?id=${b.id}`} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors">
            <span className="text-[10px] font-mono text-[#94A3B8] w-5">#{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[11.5px] font-bold text-[#0F172A] truncate">{b.name}</div>
              <div className="text-[10px] text-[#64748B] truncate">{b.neighbourhood} · {b.units}u</div>
            </div>
            {metric === "monthlyRevenue" ? (
              <div className="text-right">
                <div className="text-[12px] font-bold tabular-nums text-[#0F172A]">${(b.monthlyRevenue / 1000).toFixed(0)}K</div>
                <div className="text-[9.5px] text-[#94A3B8]">mo. revenue</div>
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold tabular-nums"
                style={{ background: `${healthColor(b.healthScore)}14`, color: healthColor(b.healthScore), border: `1px solid ${healthColor(b.healthScore)}30` }}>
                {b.healthScore}
              </div>
            )}
            <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Data helpers ──────────────────────────────────────────────────────────

function buildRevenueTrend(currentMonthly: number): { month: string; revenue: number }[] {
  const now = new Date();
  const trend: { month: string; revenue: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const growth = 1 - (i * 0.006);
    const seasonality = 1 + Math.sin(d.getMonth() / 12 * Math.PI * 2) * 0.02;
    const rev = Math.round(currentMonthly * growth * seasonality);
    trend.push({
      month: d.toLocaleString("en", { month: "short" }).toUpperCase(),
      revenue: rev,
    });
  }
  return trend;
}

function buildNoiTrend(revTrend: { month: string; revenue: number }[]): { month: string; value: number }[] {
  return revTrend.map((r) => ({ month: r.month, value: Math.round(r.revenue * 0.55) }));
}

void TrendingUp; void TrendingDown;
