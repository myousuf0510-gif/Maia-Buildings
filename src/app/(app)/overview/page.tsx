"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Wrench,
  DollarSign,
  Zap,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowRight,
  Bot,
  Radio,
  Users,
  AlertOctagon,
  CheckCircle2,
  Sparkles,
  FileText,
} from "lucide-react";
import { PORTFOLIO_DATA, portfolioTotals, healthColor, healthLabel } from "@/lib/buildings/portfolio";
import { AGENTS } from "@/lib/platform/registry";

// ─── Live ticker content ─────────────────────────────────────────────────────

type TickerDot = "red" | "orange" | "blue" | "green";
const DOT_COLORS: Record<TickerDot, string> = {
  red: "#EF4444", orange: "#F59E0B", blue: "#2563EB", green: "#10B981",
};

function buildTicker(): { id: number; dot: TickerDot; text: string }[] {
  const d = (offset: number) => {
    const dd = new Date(); dd.setDate(dd.getDate() + offset);
    return dd.toLocaleString("en", { weekday: "short", month: "short", day: "numeric" });
  };
  const pool: { dot: TickerDot; text: string }[] = [
    { dot: "red",    text: `Flooding alert · 842 Bay St Unit 1404 — Apex Plumbing dispatched (ETA 18 min)` },
    { dot: "orange", text: `Fire alarm inspection due ${d(8)} · 140 Queen St · LCI Fire Safety pre-booked` },
    { dot: "blue",   text: `Vacancy forecast: 12 units turning over in the next 30 days` },
    { dot: "green",  text: `Energy savings +$4,280 this week · 22 buildings tightened setpoints overnight` },
    { dot: "red",    text: `Contractor WSIB lapsed · Hydro Electric Inc. — 3 pending assignments blocked` },
    { dot: "orange", text: `7 tenants trending delinquent · RTA-compliant soft reminders drafted` },
    { dot: "blue",   text: `Dispatch Agent auto-assigned 47 work orders today · 91% acceptance rate` },
    { dot: "green",  text: `Weekly portfolio briefing ready · covers arrears, vacancy, energy, compliance` },
    { dot: "orange", text: `Turnover pipeline bottleneck — painters booked solid through ${d(10)}` },
    { dot: "blue",   text: `Peer benchmark: energy $/sqft 8% below GTA class average` },
    { dot: "green",  text: `N1 notice generated for 14 units · 90-day rent adjustment window on track` },
    { dot: "red",    text: `Elevator #3 at 622 Lorne Park — TSSA inspection overdue by 4 days` },
    { dot: "orange", text: `Monthly sprinkler inspection coming up for 18 buildings next week` },
    { dot: "green",  text: `HVAC contract bid received · $38K below incumbent on 4-building package` },
    { dot: "blue",   text: `Tenant satisfaction NPS ticked up to 47 across residential portfolio` },
    { dot: "red",    text: `Broken boiler · 228 Dundas St W — backup heat deployed, part on order` },
    { dot: "orange", text: `Insurance renewal in 22 days · portfolio-wide policy under review` },
    { dot: "green",  text: `12 lease renewals signed this week at guideline increase` },
    { dot: "blue",   text: `Occupancy forecast: 94.2% next quarter · +0.6 pts vs current` },
    { dot: "orange", text: `Overdue work orders crossed 42 threshold — Dispatch Agent re-prioritizing` },
  ];
  return pool.map((p, i) => ({ id: i + 1, ...p }));
}

// ─── Intel feed ──────────────────────────────────────────────────────────────

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "INFO";
interface IntelItem {
  id: number;
  time: string;
  severity: Severity;
  category: string;
  text: string;
  href: string;
}

function buildIntelFeed(): IntelItem[] {
  const now = new Date();
  const hm = (minsAgo: number) => {
    const t = new Date(now.getTime() - minsAgo * 60_000);
    return t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };
  const rows: Omit<IntelItem, "id">[] = [
    { time: hm(2),    severity: "CRITICAL", category: "EMERGENCY",  text: "FLOODING · 842 Bay St, Unit 1404 — Apex Plumbing dispatched · ETA 18 min",           href: "/work-order-market" },
    { time: hm(5),    severity: "HIGH",     category: "DISPATCH",   text: "AUTO-ASSIGN 23 work orders matched in last hour · 94% within-SLA",                   href: "/work-order-market" },
    { time: hm(11),   severity: "MEDIUM",   category: "VACANCY",    text: "TURNOVER PIPELINE · 12 units vacating in 30d — 3 painter bottlenecks flagged",       href: "/vacancy-intelligence" },
    { time: hm(19),   severity: "HIGH",     category: "ARREARS",    text: "7 TENANTS · 45+ day arrears — RTA-compliant N4 notices drafted for review",         href: "/arrears-intelligence" },
    { time: hm(26),   severity: "INFO",     category: "ENERGY",     text: "ENERGY SAVINGS · $4,280 this week · 22 buildings tightened overnight setpoints",    href: "/energy-intelligence" },
    { time: hm(38),   severity: "HIGH",     category: "COMPLIANCE", text: "CONTRACTOR WSIB LAPSED · Hydro Electric Inc. — 3 pending dispatches blocked",        href: "/compliance-intelligence" },
    { time: hm(52),   severity: "MEDIUM",   category: "COMPLIANCE", text: "FIRE INSPECTION · 140 Queen St due in 8 days — LCI Fire Safety pre-booked",          href: "/compliance-intelligence" },
    { time: hm(68),   severity: "INFO",     category: "BRIEFING",   text: "WEEKLY BRIEFING READY · Claude finished portfolio summary in 38s",                    href: "/briefings/executive" },
    { time: hm(82),   severity: "HIGH",     category: "ARREARS",    text: "ARREARS UPTICK · 47 total (+6 WoW) concentrated in 3 buildings",                     href: "/arrears-intelligence" },
    { time: hm(101),  severity: "MEDIUM",   category: "DISPATCH",   text: "FAIRNESS AUDIT · All contractor groups within 15pt tolerance, 0 flags 30d",          href: "/work-order-market" },
    { time: hm(124),  severity: "HIGH",     category: "OVERDUE",    text: "OVERDUE WORK ORDERS · 42 total — Dispatch Agent re-prioritizing",                    href: "/work-order-market" },
    { time: hm(158),  severity: "INFO",     category: "COST",       text: "HVAC CONTRACT BID · $38K below incumbent on 4-building package",                     href: "/energy-intelligence" },
    { time: hm(195),  severity: "MEDIUM",   category: "VACANCY",    text: "LEASE RENEWALS · 12 signed this week at guideline increase",                         href: "/vacancy-intelligence" },
    { time: hm(236),  severity: "CRITICAL", category: "EMERGENCY",  text: "BOILER DOWN · 228 Dundas St W — backup heat deployed, part ETA 24h",                 href: "/work-order-market" },
    { time: hm(292),  severity: "INFO",     category: "BENCHMARK",  text: "ENERGY $/SQFT · Portfolio 8% below GTA class average",                                href: "/energy-intelligence" },
    { time: hm(355),  severity: "HIGH",     category: "COMPLIANCE", text: "ELEVATOR TSSA · 622 Lorne Park Elevator #3 overdue by 4 days",                        href: "/compliance-intelligence" },
    { time: hm(430),  severity: "MEDIUM",   category: "COMPLIANCE", text: "SPRINKLER CYCLE · 18 buildings due next week — inspections batch-booked",            href: "/compliance-intelligence" },
    { time: hm(520),  severity: "INFO",     category: "DISPATCH",   text: "DISPATCH TODAY · 47 auto-assigned · 91% acceptance rate",                             href: "/work-order-market" },
  ];
  return rows.map((r, i) => ({ ...r, id: i + 1 }));
}

const SEV_COLOR: Record<Severity, string> = {
  CRITICAL: "#EF4444",
  HIGH: "#F59E0B",
  MEDIUM: "#2563EB",
  INFO: "#10B981",
};

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const totals = useMemo(() => portfolioTotals(), []);
  const ticker = useMemo(() => buildTicker(), []);
  const tickerDurationSec = Math.max(70, ticker.length * 6);

  const topHealthiest = useMemo(
    () => [...PORTFOLIO_DATA].sort((a, b) => b.healthScore - a.healthScore).slice(0, 3),
    [],
  );
  const topAtRisk = useMemo(
    () => [...PORTFOLIO_DATA].sort((a, b) => a.healthScore - b.healthScore).slice(0, 5),
    [],
  );

  return (
    <div className="p-8 space-y-6">
      <Hero totals={totals} />

      {/* Ticker */}
      <div
        className="rounded-xl flex items-center overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid #E2E8F0",
          borderBottom: "2px solid #2563EB",
          height: "40px",
          boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(37,99,235,0.06)",
        }}
      >
        <div
          className="shrink-0 flex items-center gap-1.5 pl-4 pr-3"
          style={{ borderRight: "1px solid #E2E8F0", height: "100%" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#2563EB", animation: "pulse-dot 1.5s ease-in-out infinite" }}
          />
          <span className="text-[9px] font-black tracking-[0.2em] text-[#2563EB] uppercase">LIVE</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track" style={{ animationDuration: `${tickerDurationSec}s` }}>
            {[0, 1].map((copy) => (
              <div key={copy} className="flex items-center shrink-0">
                {ticker.map((item, i) => (
                  <div key={`${copy}-${i}`} className="flex items-center shrink-0">
                    {i > 0 && <span style={{ color: "#CBD5E1", margin: "0 16px", fontSize: "13px" }}>·</span>}
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: DOT_COLORS[item.dot], marginRight: "8px" }}
                    />
                    <span className="whitespace-nowrap" style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A" }}>
                      {item.text}
                    </span>
                  </div>
                ))}
                <span style={{ color: "#CBD5E1", margin: "0 24px", fontSize: "13px" }}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <KpiCard label="Buildings"         value={totals.buildingCount}                           sub="portfolio"               icon={Building2}   accent="#2563EB" />
        <KpiCard label="Units"             value={totals.unitCount.toLocaleString()}              sub="residential + office"   icon={Users}       accent="#7C3AED" />
        <KpiCard label="Occupancy"         value={`${totals.occupancyPct}%`}                      sub={`${totals.healthy} healthy buildings`} icon={CheckCircle2} accent="#10B981" />
        <KpiCard label="Work orders"       value={totals.openWorkOrders.toLocaleString()}         sub={`${totals.overdueWorkOrders} overdue`}  icon={Wrench}      accent="#F59E0B" live />
        <KpiCard label="Arrears"           value={totals.arrearsTenants.toLocaleString()}         sub="tenants flagged"         icon={DollarSign}  accent="#DC2626" />
        <KpiCard label="Monthly revenue"   value={`$${(totals.monthlyRevenue / 1_000_000).toFixed(1)}M`} sub="rent under mgmt"   icon={TrendingUp}  accent="#0891B2" />
        <KpiCard label="Compliance"        value={totals.complianceAlerts}                        sub={`${totals.complianceAlerts === 0 ? "all clear" : "active alerts"}`} icon={ShieldAlert} accent="#EC4899" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Intel feed */}
        <div className="col-span-12 lg:col-span-8">
          <IntelFeed />
        </div>
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <BuildingShortlist title="Top of watchlist" subtitle="Lowest health scores — attention today" items={topAtRisk} accent="#EF4444" />
          <BuildingShortlist title="Portfolio leaders" subtitle="Highest health scores this week" items={topHealthiest} accent="#10B981" />
        </div>
      </div>

      {/* Agent roster */}
      <AgentRoster />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ totals }: { totals: ReturnType<typeof portfolioTotals> }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
        >
          <Building2 className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          MAIA for Buildings · {totals.buildingCount} properties · live
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Royal York portfolio — everything happening right now
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        {totals.buildingCount} buildings · {totals.unitCount.toLocaleString()} units · {totals.occupancyPct}% occupancy ·
        ${(totals.monthlyRevenue / 1_000_000).toFixed(1)}M monthly rent under management.
        MAIA is watching every building, dispatching every work order, flagging every risk.
      </p>
    </div>
  );
}

// ─── KPI cards ───────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, accent, live,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  accent: string;
  live?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`,
        border: `1px solid ${accent}22`,
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color: accent }} />
        <span className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>
          {label}
        </span>
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

// ─── Intel feed ──────────────────────────────────────────────────────────────

function IntelFeed() {
  const [items, setItems] = useState(() => buildIntelFeed().slice(0, 10));
  const [flashId, setFlashId] = useState<number | null>(null);

  // Simulate the stream: rotate a new item in every 17–22s.
  useEffect(() => {
    const pool = buildIntelFeed();
    let idx = items.length % pool.length;
    const timer = setInterval(() => {
      const next = pool[idx % pool.length];
      const fresh = {
        ...next,
        id: Date.now(),
        time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
      };
      setItems((prev) => [fresh, ...prev.slice(0, 9)]);
      setFlashId(fresh.id);
      idx++;
      setTimeout(() => setFlashId(null), 2800);
    }, 17_000 + Math.random() * 5_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        <Radio className="w-4 h-4 text-rose-500" />
        <div>
          <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Intelligence feed</div>
          <div className="text-[10.5px] text-[#64748B]">Live events from every MAIA agent across the portfolio</div>
        </div>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold text-[#10B981]">
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
            <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </span>
          LIVE
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, x: -8, backgroundColor: "rgba(37,99,235,0.08)" }}
              animate={{ opacity: 1, x: 0, backgroundColor: flashId === it.id ? "rgba(37,99,235,0.04)" : "rgba(255,255,255,0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link href={it.href} className="block px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[10px] text-[#94A3B8] tabular-nums w-12 shrink-0 mt-0.5">{it.time}</span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.12em] uppercase shrink-0 mt-0.5"
                    style={{ background: `${SEV_COLOR[it.severity]}14`, color: SEV_COLOR[it.severity], border: `1px solid ${SEV_COLOR[it.severity]}30` }}
                  >
                    {it.severity}
                  </span>
                  <span className="text-[9.5px] font-bold tracking-[0.12em] uppercase text-[#94A3B8] shrink-0 mt-0.5 w-20">
                    {it.category}
                  </span>
                  <div className="text-[12px] text-[#0F172A] leading-snug flex-1">{it.text}</div>
                  <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mt-0.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Building shortlist ──────────────────────────────────────────────────────

function BuildingShortlist({
  title, subtitle, items, accent,
}: {
  title: string;
  subtitle: string;
  items: typeof PORTFOLIO_DATA;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
          <span className="text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: accent }}>{title}</span>
        </div>
        <div className="text-[11px] text-[#64748B] mt-0.5">{subtitle}</div>
      </div>
      <div className="divide-y divide-slate-50">
        {items.map((b) => (
          <Link
            key={b.id}
            href={`/building-detail?id=${b.id}`}
            className="block px-4 py-2.5 hover:bg-[#F8FAFC] transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10.5px] font-bold tabular-nums shrink-0"
                style={{ background: `${healthColor(b.healthScore)}14`, color: healthColor(b.healthScore), border: `1px solid ${healthColor(b.healthScore)}30` }}
              >
                {b.healthScore}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-[#0F172A] truncate leading-tight">{b.name}</div>
                <div className="text-[10px] text-[#64748B] truncate">
                  {b.neighbourhood} · {b.units} units · {healthLabel(b.healthScore)}
                </div>
              </div>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Agent roster ────────────────────────────────────────────────────────────

function AgentRoster() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Bot className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#7C3AED]">
              Agent roster · {AGENTS.length} live
            </span>
          </div>
          <div className="text-[16px] font-bold text-[#0F172A] tracking-tight">The agents running this portfolio</div>
        </div>
        <Link href="/agents" className="inline-flex items-center gap-1 text-[10.5px] font-bold tracking-wide uppercase text-[#2563EB] hover:text-[#1D4ED8]">
          Open agent view <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {AGENTS.map((a) => (
          <Link
            key={a.id}
            href={a.feedsPages[0] ?? "/agents"}
            className="rounded-xl p-3 transition-all hover:shadow-md"
            style={{ background: `${a.accent}06`, border: `1px solid ${a.accent}22` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${a.accent}14`, border: `1px solid ${a.accent}30` }}
              >
                <Bot className="w-3.5 h-3.5" style={{ color: a.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-[#0F172A] truncate leading-tight">{a.name}</div>
                <div className="text-[9.5px] text-[#94A3B8]">Last run · {a.lastRun}</div>
              </div>
              {a.status === "live" && (
                <span className="relative flex w-1.5 h-1.5">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-50 animate-ping" />
                  <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </span>
              )}
            </div>
            <div className="text-[10.5px] text-[#475569] leading-snug line-clamp-2">{a.purpose}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Suppress lint for imports that may read as unused
void AlertOctagon; void Activity; void TrendingDown; void Sparkles; void FileText; void Zap;
