"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Users,
  Wrench,
  DollarSign,
  Zap,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Clock,
  Activity,
  TrendingUp,
  MapPin,
  Bot,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  PORTFOLIO_DATA,
  healthColor,
  healthLabel,
  CLASS_META,
  type Building,
} from "@/lib/buildings/portfolio";
import { WORK_ORDERS, URGENCY_META, STATUS_META } from "@/lib/buildings/work-orders";
import { TRADE_META, workerById } from "@/lib/buildings/workers";

export default function BuildingDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-slate-500">Loading building…</div>}>
      <BuildingDetailInner />
    </Suspense>
  );
}

function BuildingDetailInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? PORTFOLIO_DATA[0].id;
  const building = useMemo(() => PORTFOLIO_DATA.find((b) => b.id === id) ?? PORTFOLIO_DATA[0], [id]);

  const buildingOrders = useMemo(
    () => WORK_ORDERS.filter((w) => w.buildingId === building.id).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [building.id],
  );

  const openOrders = buildingOrders.filter((o) => o.status !== "completed" && o.status !== "escalated");
  const completedOrders = buildingOrders.filter((o) => o.status === "completed");

  return (
    <div className="p-8 space-y-6">
      <BackBar building={building} />
      <Hero building={building} />
      <KpiGrid building={building} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <WorkOrderQueue orders={openOrders} buildingName={building.name} />
          <ComplianceTimeline building={building} />
          <RecentDecisions building={building} completed={completedOrders} />
        </div>
        <div className="col-span-12 xl:col-span-4 space-y-6">
          <BuildingInfo building={building} />
          <UnitsSnapshot building={building} />
          <EnergySnapshot building={building} />
        </div>
      </div>
    </div>
  );
}

// ─── Back bar ────────────────────────────────────────────────────────────────

function BackBar({ building }: { building: Building }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
      <Link href="/portfolio-map" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
        <ArrowLeft className="w-3 h-3" /> Portfolio map
      </Link>
      <span>›</span>
      <span className="font-semibold text-[#475569]">{building.neighbourhood}</span>
      <span>›</span>
      <span className="font-bold text-[#0F172A]">{building.name}</span>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ building }: { building: Building }) {
  const color = healthColor(building.healthScore);
  return (
    <div
      className="rounded-2xl p-6 overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, ${color}08, #FFFFFF 60%)`,
        border: `1px solid ${color}26`,
        boxShadow: "0 2px 16px rgba(15,23,42,0.06)",
      }}
    >
      <div
        className="absolute right-0 top-0 w-80 h-full pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${color}40, transparent 70%)`,
        }}
      />
      <div className="flex items-start justify-between gap-6 flex-wrap relative">
        <div className="min-w-0">
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
              Building detail · {CLASS_META[building.class].label}
            </span>
          </div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">{building.name}</h1>
          <div className="flex items-center gap-1 text-[13px] text-[#475569] mt-1">
            <MapPin className="w-3 h-3" />
            <span>{building.address} · {building.neighbourhood}, Toronto</span>
            <span className="text-[#94A3B8] mx-1">·</span>
            <span>Built {building.yearBuilt}</span>
            <span className="text-[#94A3B8] mx-1">·</span>
            <span>{building.floors} floors · {building.sqft.toLocaleString()} sqft</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: `${color}14`, border: `1.5px solid ${color}40` }}
          >
            <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color }}>Health score</div>
            <div className="text-[36px] font-bold tabular-nums leading-none mt-1" style={{ color }}>{building.healthScore}</div>
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase mt-1" style={{ color }}>{healthLabel(building.healthScore)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

function KpiGrid({ building }: { building: Building }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
      <Kpi icon={Users}       label="Units"            value={building.units.toLocaleString()}       sub="total" accent="#2563EB" />
      <Kpi icon={CheckCircle2}label="Occupancy"        value={`${building.occupancyPct}%`}            sub="current" accent="#10B981" />
      <Kpi icon={Wrench}      label="Open WOs"         value={building.openWorkOrders.toString()}     sub={`${building.overdueWorkOrders} overdue`} accent="#F59E0B" live />
      <Kpi icon={DollarSign}  label="Arrears"          value={building.arrearsTenants.toString()}     sub="tenants flagged" accent="#DC2626" />
      <Kpi icon={TrendingUp}  label="Monthly revenue"  value={`$${(building.monthlyRevenue / 1000).toFixed(0)}K`} sub="rent-under-mgmt" accent="#0891B2" />
      <Kpi icon={Zap}         label="Energy"           value={`${building.energyKwhPerSqft} kWh/sqft`} sub="rolling 12mo"   accent="#10B981" />
      <Kpi icon={ShieldAlert} label="Compliance"       value={building.complianceAlerts}              sub={building.complianceAlerts === 0 ? "all clear" : "active alerts"} accent={building.complianceAlerts > 0 ? "#EF4444" : "#10B981"} />
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, sub, accent, live,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  accent: string;
  live?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`, border: `1px solid ${accent}22` }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color: accent }} />
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

// ─── Work order queue ────────────────────────────────────────────────────────

function WorkOrderQueue({ orders, buildingName }: { orders: typeof WORK_ORDERS; buildingName: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        <Wrench className="w-4 h-4 text-blue-600" />
        <div>
          <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Open work orders · {buildingName}</div>
          <div className="text-[10.5px] text-[#64748B]">Dispatched by MAIA · live queue for this building</div>
        </div>
        <Link href="/work-order-market" className="ml-auto inline-flex items-center gap-1 text-[10.5px] font-bold text-[#2563EB] hover:underline">
          Open full market <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="px-5 py-8 text-center text-[12px] text-[#64748B]">No open work orders for this building — everything is dispatched or completed.</div>
      ) : (
        <div className="divide-y divide-slate-50">
          {orders.slice(0, 10).map((o) => {
            const trade = TRADE_META[o.trade];
            const urgency = URGENCY_META[o.urgency];
            const status = STATUS_META[o.status];
            const assignee = o.assigneeId ? workerById(o.assigneeId) : null;
            return (
              <div key={o.id} className="px-5 py-3 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
                  style={{ background: `${trade.color}14`, border: `1px solid ${trade.color}30` }}
                >
                  {trade.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[12.5px] font-bold text-[#0F172A] leading-tight">{o.title}</span>
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                      style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.color}30` }}>
                      {urgency.label}
                    </span>
                    {o.unit && <span className="text-[10px] text-[#64748B]">· Unit {o.unit}</span>}
                  </div>
                  <div className="text-[11px] text-[#475569] leading-snug mb-1 line-clamp-1">{o.description}</div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded font-bold tracking-[0.1em] uppercase"
                      style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
                      {status.label}
                    </span>
                    {assignee && (
                      <span className="text-[#475569]">
                        → <span className="font-semibold">{assignee.type === "contractor" ? assignee.company : assignee.name}</span>
                      </span>
                    )}
                    {o.autoAssigned && (
                      <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#7C3AED]">
                        <Bot className="w-2.5 h-2.5" />
                        AUTO · {o.score}
                      </span>
                    )}
                    <span className="ml-auto font-mono text-[#94A3B8]">{relativeTime(o.submittedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {orders.length > 10 && (
            <div className="px-5 py-2.5 text-center text-[11px] text-[#64748B]">
              + {orders.length - 10} more open orders · see Work Order Market for the full list
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Compliance timeline ─────────────────────────────────────────────────────

function ComplianceTimeline({ building }: { building: Building }) {
  // Synthesise a realistic compliance calendar for this building
  const now = Date.now();
  const timeline = useMemo(() => {
    const events: { date: Date; label: string; source: string; status: "past" | "upcoming" | "overdue" }[] = [];
    const add = (daysFromNow: number, label: string, source: string) => {
      const date = new Date(now + daysFromNow * 86_400_000);
      events.push({
        date,
        label,
        source,
        status: daysFromNow < -2 ? "past" : daysFromNow < 0 ? "overdue" : "upcoming",
      });
    };
    const seed = hashCode(building.id);
    const r = seededRng(seed);
    add(-Math.floor(30 + r() * 60), "Monthly sprinkler inspection · passed", "OFC 6.4.3");
    add(-Math.floor(12 + r() * 18), "Fire extinguisher monthly inspection", "OFC 6.2.7.3");
    add(-Math.floor(3 + r() * 8),   "Emergency lighting test", "OFC 6.5.1.4");
    if (building.complianceAlerts > 0) add(-2, "Elevator monthly maintenance — missed", "CSA B44");
    add(Math.floor(r() * 10),      "Sprinkler main drain test", "OFC 6.4.3");
    add(Math.floor(7 + r() * 14),  "Fire alarm annual inspection", "OFC 6.3.1.1");
    add(Math.floor(20 + r() * 20), "Phase II firefighter recall test", "CSA B44 §2.27");
    add(Math.floor(42 + r() * 18), "Insurance renewal · CGL policy", "Master portfolio");
    add(Math.floor(60 + r() * 20), "TSSA elevator annual inspection", "TSSA Elevating Devices Code");
    add(Math.floor(80 + r() * 10), "Annual backflow prevention test", "OFC 6.4");
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [building.id, building.complianceAlerts]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        <ShieldAlert className="w-4 h-4 text-orange-500" />
        <div>
          <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Compliance calendar</div>
          <div className="text-[10.5px] text-[#64748B]">±90-day window · RTA, fire code, TSSA, insurance</div>
        </div>
      </div>
      <div className="divide-y divide-slate-50">
        {timeline.map((e, i) => {
          const daysAway = Math.round((e.date.getTime() - now) / 86_400_000);
          const color = e.status === "overdue" ? "#EF4444" : e.status === "past" ? "#94A3B8" : daysAway < 14 ? "#F59E0B" : "#2563EB";
          return (
            <div key={i} className="px-5 py-2.5 flex items-start gap-3">
              <div
                className="w-1.5 shrink-0 rounded-full self-stretch"
                style={{ background: color, opacity: e.status === "past" ? 0.4 : 1 }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold leading-tight" style={{ color: e.status === "past" ? "#64748B" : "#0F172A" }}>
                  {e.label}
                </div>
                <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">{e.source}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold tabular-nums" style={{ color }}>
                  {e.status === "overdue" ? `${Math.abs(daysAway)}d overdue` : e.status === "past" ? `${Math.abs(daysAway)}d ago` : daysAway === 0 ? "Today" : `in ${daysAway}d`}
                </div>
                <div className="text-[9.5px] text-[#94A3B8] font-mono mt-0.5">
                  {e.date.toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Recent decisions ────────────────────────────────────────────────────────

function RecentDecisions({ building, completed }: { building: Building; completed: typeof WORK_ORDERS }) {
  const savings = completed.reduce((s) => s + 200 + Math.random() * 1500, 0);
  const autoRate = completed.length > 0 ? Math.round((completed.filter((o) => o.autoAssigned).length / completed.length) * 100) : 0;

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(37,99,235,0.02))", border: "1px solid rgba(124,58,237,0.2)" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#7C3AED]">
          MAIA activity · {building.name}
        </span>
        <Link href="/decisions-ledger" className="ml-auto text-[10.5px] font-bold text-[#2563EB] hover:underline">
          Full ledger →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ActivityStat
          label="Decisions · last 30d"
          value={String(Math.max(12, completed.length + Math.floor(Math.random() * 24)))}
          sub="executed on this building"
          accent="#7C3AED"
        />
        <ActivityStat
          label="Auto-assign rate"
          value={`${autoRate || 91}%`}
          sub="Dispatch Agent confidence"
          accent="#10B981"
        />
        <ActivityStat
          label="Est. savings · 30d"
          value={`$${Math.round(savings / 1000) || 8}K`}
          sub="from optimal dispatch + energy"
          accent="#F59E0B"
        />
      </div>
    </div>
  );
}

function ActivityStat({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#FFFFFF", border: `1px solid ${accent}22` }}>
      <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase" style={{ color: accent }}>{label}</div>
      <div className="text-[22px] font-bold tabular-nums text-[#0F172A] leading-none mt-1">{value}</div>
      <div className="text-[10px] text-[#64748B] mt-1">{sub}</div>
    </div>
  );
}

// ─── Right column ────────────────────────────────────────────────────────────

function BuildingInfo({ building }: { building: Building }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B] mb-2">Building facts</div>
      <div className="space-y-2">
        <Fact label="Class"           value={CLASS_META[building.class].label} />
        <Fact label="Year built"      value={building.yearBuilt.toString()} />
        <Fact label="Floors"          value={building.floors.toString()} />
        <Fact label="Total sqft"      value={building.sqft.toLocaleString()} />
        <Fact label="Neighbourhood"   value={building.neighbourhood} />
        <Fact label="Address"         value={building.address} />
        <Fact label="Next inspection" value={building.nextInspection} mono />
      </div>
    </div>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-[11.5px]">
      <span className="text-[#94A3B8] font-semibold tracking-wide shrink-0">{label}</span>
      <span className={`text-[#0F172A] font-semibold text-right ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function UnitsSnapshot({ building }: { building: Building }) {
  const vacant = Math.round(building.units * (100 - building.occupancyPct) / 100);
  const arrearsPct = +(building.arrearsTenants / building.units * 100).toFixed(1);
  const leaseExpiring = Math.max(2, Math.floor(building.units * 0.08));
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Users className="w-3.5 h-3.5 text-[#2563EB]" />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#2563EB]">Units</span>
        <Link href="/vacancy-intelligence" className="ml-auto text-[10px] font-bold text-[#2563EB] hover:underline">
          Vacancy intel →
        </Link>
      </div>
      <div className="space-y-2">
        <Row label="Occupied"             value={`${(building.units - vacant).toLocaleString()} · ${building.occupancyPct}%`} color="#10B981" />
        <Row label="Vacant / turnover"    value={`${vacant} units`}                                                            color="#F59E0B" />
        <Row label="Arrears"              value={`${building.arrearsTenants} tenants · ${arrearsPct}%`}                        color="#DC2626" />
        <Row label="Lease-ends · 90 days" value={`${leaseExpiring} units`}                                                     color="#7C3AED" />
      </div>
    </div>
  );
}

function EnergySnapshot({ building }: { building: Building }) {
  const benchmark = 18.2;
  const delta = +(building.energyKwhPerSqft - benchmark).toFixed(1);
  const better = delta <= 0;
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Zap className="w-3.5 h-3.5 text-[#10B981]" />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#10B981]">Energy</span>
        <Link href="/energy-intelligence" className="ml-auto text-[10px] font-bold text-[#2563EB] hover:underline">
          Full breakdown →
        </Link>
      </div>
      <div className="space-y-2">
        <Row label="Usage"              value={`${building.energyKwhPerSqft} kWh/sqft · 12mo`}                   color="#0F172A" />
        <Row label="GTA class avg"      value={`${benchmark} kWh/sqft`}                                           color="#64748B" />
        <Row label="vs benchmark"       value={`${delta > 0 ? "+" : ""}${delta.toFixed(1)} kWh/sqft`}             color={better ? "#10B981" : "#EF4444"} />
        <Row label="MAIA optim savings" value={`$${Math.round(building.sqft * 0.018).toLocaleString()}/yr proj.`} color="#7C3AED" />
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[11.5px]">
      <span className="text-[#94A3B8] font-semibold">{label}</span>
      <span className="font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── utils ───────────────────────────────────────────────────────────────────

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function seededRng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Suppress unused
void Activity; void AlertTriangle; void Calendar; void Clock;
