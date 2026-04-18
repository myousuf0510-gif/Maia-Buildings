"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  FileText,
} from "lucide-react";
import { PORTFOLIO_DATA } from "@/lib/buildings/portfolio";
import { WORKER_POOL } from "@/lib/buildings/workers";

type Lane = "fire" | "rta" | "tssa" | "insurance" | "contractor";
type Severity = "critical" | "high" | "medium" | "low";

interface ComplianceEvent {
  id: string;
  lane: Lane;
  severity: Severity;
  daysFromNow: number;
  title: string;
  subject: string;        // building name or contractor name
  subjectId?: string;     // link target
  rule: string;
  autoBookable: boolean;
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateCompliance(): ComplianceEvent[] {
  const rng = mulberry32(2_025_048);
  const events: ComplianceEvent[] = [];
  PORTFOLIO_DATA.forEach((b, i) => {
    // Past + future compliance events per building
    const fireAnnual = Math.floor(-40 + rng() * 130);
    events.push({
      id: `fire-${b.id}`,
      lane: "fire",
      severity: fireAnnual < 0 ? "low" : fireAnnual < 14 ? "high" : fireAnnual < 45 ? "medium" : "low",
      daysFromNow: fireAnnual,
      title: "Fire alarm annual inspection",
      subject: b.name,
      subjectId: b.id,
      rule: "OFC 6.3.1.1",
      autoBookable: true,
    });
    const sprinkler = Math.floor(-10 + rng() * 40);
    events.push({
      id: `spr-${b.id}`,
      lane: "fire",
      severity: sprinkler < 0 ? "low" : sprinkler < 7 ? "high" : "medium",
      daysFromNow: sprinkler,
      title: "Sprinkler quarterly inspection",
      subject: b.name,
      subjectId: b.id,
      rule: "OFC 6.4.3",
      autoBookable: true,
    });
    const elevator = Math.floor(-30 + rng() * 120);
    if (b.floors >= 4) {
      events.push({
        id: `tssa-${b.id}`,
        lane: "tssa",
        severity: elevator < 0 ? "high" : elevator < 14 ? "medium" : "low",
        daysFromNow: elevator,
        title: `Elevator TSSA annual inspection · ${b.floors > 10 ? "Elevator #1 + #2" : "Elevator #1"}`,
        subject: b.name,
        subjectId: b.id,
        rule: "TSSA Elevating Devices Code",
        autoBookable: true,
      });
    }
    if (i % 5 === 0) {
      events.push({
        id: `ins-${b.id}`,
        lane: "insurance",
        severity: "high",
        daysFromNow: Math.floor(20 + rng() * 40),
        title: "CGL insurance renewal",
        subject: b.name,
        subjectId: b.id,
        rule: "Master portfolio policy",
        autoBookable: false,
      });
    }
  });

  // Contractor cert expiries — pull directly from worker pool
  WORKER_POOL.filter((w) => w.type === "contractor").forEach((w) => {
    if (!w.insuranceValid || !w.wsibValid || !w.licenseValid) {
      events.push({
        id: `cert-${w.id}`,
        lane: "contractor",
        severity: "critical",
        daysFromNow: -2,
        title: `${!w.wsibValid ? "WSIB" : !w.insuranceValid ? "CGL Insurance" : "Trade license"} LAPSED · ${w.company ?? w.name}`,
        subject: w.company ?? w.name,
        rule: "Royal York contractor policy",
        autoBookable: false,
      });
    } else if (w.licenseExpires) {
      const daysOut = Math.round((new Date(w.licenseExpires).getTime() - Date.now()) / 86_400_000);
      if (daysOut < 60) {
        events.push({
          id: `cert-${w.id}`,
          lane: "contractor",
          severity: daysOut < 14 ? "high" : "medium",
          daysFromNow: daysOut,
          title: `Trade license renewal · ${w.company ?? w.name}`,
          subject: w.company ?? w.name,
          rule: "OCOT / ESA / TSSA",
          autoBookable: false,
        });
      }
    }
  });

  // RTA: synthetic portfolio-level obligations
  events.push({
    id: "rta-n4-cycle",
    lane: "rta",
    severity: "high",
    daysFromNow: 4,
    title: "N4 14-day payment windows closing · 3 units",
    subject: "Portfolio",
    rule: "RTA s.59",
    autoBookable: false,
  });
  events.push({
    id: "rta-n1-window",
    lane: "rta",
    severity: "medium",
    daysFromNow: 18,
    title: "N1 90-day rent increase window opens · 14 units",
    subject: "Portfolio",
    rule: "RTA s.116, s.120",
    autoBookable: false,
  });

  events.sort((a, b) => a.daysFromNow - b.daysFromNow);
  return events;
}

const EVENTS = generateCompliance();

const LANE_META: Record<Lane, { label: string; color: string }> = {
  fire:        { label: "Fire / life safety", color: "#EA580C" },
  rta:         { label: "RTA",                color: "#DC2626" },
  tssa:        { label: "TSSA · Elevator",    color: "#2563EB" },
  insurance:   { label: "Insurance",          color: "#7C3AED" },
  contractor:  { label: "Contractor certs",   color: "#0891B2" },
};

const SEV_META: Record<Severity, { color: string; label: string; bg: string }> = {
  critical: { color: "#DC2626", label: "Critical", bg: "rgba(220,38,38,0.1)" },
  high:     { color: "#F59E0B", label: "High",     bg: "rgba(245,158,11,0.1)" },
  medium:   { color: "#2563EB", label: "Medium",   bg: "rgba(37,99,235,0.08)" },
  low:      { color: "#64748B", label: "Low",      bg: "rgba(100,116,139,0.08)" },
};

export default function ComplianceIntelligencePage() {
  const [laneFilter, setLaneFilter] = useState<Lane | "all">("all");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const kpis = useMemo(() => {
    const total = EVENTS.length;
    const overdue = EVENTS.filter((e) => e.daysFromNow < 0 && e.severity !== "low").length;
    const thisWeek = EVENTS.filter((e) => e.daysFromNow >= 0 && e.daysFromNow <= 7).length;
    const critical = EVENTS.filter((e) => e.severity === "critical").length;
    const autoBookable = EVENTS.filter((e) => e.autoBookable && e.daysFromNow > 0).length;
    return { total, overdue, thisWeek, critical, autoBookable };
  }, []);

  const filtered = useMemo(() => {
    return EVENTS.filter((e) => {
      if (laneFilter !== "all" && e.lane !== laneFilter) return false;
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      return true;
    });
  }, [laneFilter, severityFilter]);

  const past = filtered.filter((e) => e.daysFromNow < 0);
  const today = filtered.filter((e) => e.daysFromNow === 0);
  const soon = filtered.filter((e) => e.daysFromNow > 0 && e.daysFromNow <= 14);
  const later = filtered.filter((e) => e.daysFromNow > 14);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Kpi label="Active obligations"  value={kpis.total}        sub="rolling ±90 day"      accent="#2563EB" />
        <Kpi label="Overdue"             value={kpis.overdue}      sub="needs resolution"     accent="#DC2626" live />
        <Kpi label="Due this week"       value={kpis.thisWeek}     sub="next 7 days"          accent="#F59E0B" />
        <Kpi label="Critical severity"   value={kpis.critical}     sub="blocked or lapsed"    accent="#991B1B" />
        <Kpi label="Auto-bookable"       value={kpis.autoBookable} sub="MAIA can schedule"    accent="#10B981" />
      </div>

      <Filters lane={laneFilter} onLane={setLaneFilter} sev={severityFilter} onSev={setSeverityFilter} />

      <div className="space-y-6">
        {past.length > 0 && <Section title="Overdue" subtitle="Past due date — immediate action required" events={past} accent="#DC2626" />}
        {today.length > 0 && <Section title="Today" subtitle="Scheduled obligations on the calendar today" events={today} accent="#F59E0B" />}
        {soon.length > 0 && <Section title="Next 14 days" subtitle="Scheduled or forecasted obligations" events={soon} accent="#2563EB" />}
        {later.length > 0 && <Section title="Later this quarter" subtitle="Further-out planning horizon" events={later} accent="#64748B" />}
      </div>
    </div>
  );
}

function Hero({ kpis }: { kpis: { critical: number; overdue: number; total: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #EA580C, #DC2626)", boxShadow: "0 2px 6px rgba(234,88,12,0.3)" }}
        >
          <ShieldAlert className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #EA580C, #DC2626)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Compliance Sentinel · ±90 day horizon
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Every statutory deadline, on one timeline
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        {kpis.overdue > 0 && (
          <>
            <span className="font-bold text-rose-600">{kpis.overdue} overdue</span> ·{" "}
          </>
        )}
        {kpis.critical} critical ·{" "}
        <span className="font-bold text-[#0F172A]">{kpis.total}</span> total obligations tracked across fire code, RTA,
        TSSA, insurance, and contractor credentials.
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

function Filters({
  lane, onLane, sev, onSev,
}: {
  lane: Lane | "all"; onLane: (l: Lane | "all") => void;
  sev: Severity | "all"; onSev: (s: Severity | "all") => void;
}) {
  const lanes: (Lane | "all")[] = ["all", "fire", "rta", "tssa", "insurance", "contractor"];
  const sevs: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <PillGroup id="lane" opts={lanes.map((l) => ({ key: l, label: l === "all" ? "All lanes" : LANE_META[l].label, color: l === "all" ? "#0F172A" : LANE_META[l].color }))} value={lane} onChange={onLane} />
      <PillGroup id="sev" opts={sevs.map((s) => ({ key: s, label: s === "all" ? "All severity" : SEV_META[s].label, color: s === "all" ? "#0F172A" : SEV_META[s].color }))} value={sev} onChange={onSev} />
    </div>
  );
}

function PillGroup<T extends string>({
  id, opts, value, onChange,
}: { id: string; opts: { key: T; label: string; color: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
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
                layoutId={`comp-filter-${id}`}
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
  );
}

function Section({ title, subtitle, events, accent }: { title: string; subtitle: string; events: ComplianceEvent[]; accent: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-3 flex items-center gap-2 border-b border-slate-100" style={{ background: `${accent}04` }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
        <div>
          <div className="text-[12.5px] font-bold text-[#0F172A] leading-tight">{title}</div>
          <div className="text-[10.5px] text-[#64748B]">{subtitle}</div>
        </div>
        <span className="ml-auto text-[10.5px] text-[#94A3B8]">{events.length} {events.length === 1 ? "event" : "events"}</span>
      </div>
      <div className="divide-y divide-slate-50">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ComplianceEvent }) {
  const lane = LANE_META[event.lane];
  const sev = SEV_META[event.severity];
  const when =
    event.daysFromNow < 0 ? `${Math.abs(event.daysFromNow)}d overdue` :
    event.daysFromNow === 0 ? "Today" :
    `in ${event.daysFromNow}d`;

  const body = (
    <div className="flex items-start gap-3">
      <div className="w-1 shrink-0 rounded-full self-stretch" style={{ background: sev.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="text-[12.5px] font-bold text-[#0F172A] leading-tight">{event.title}</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
            style={{ background: sev.bg, color: sev.color, border: `1px solid ${sev.color}30` }}>
            {event.severity === "critical" && <AlertOctagon className="w-2.5 h-2.5" />}
            {sev.label}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
            style={{ background: `${lane.color}10`, color: lane.color, border: `1px solid ${lane.color}26` }}>
            {lane.label}
          </span>
        </div>
        <div className="text-[11px] text-[#475569] mb-0.5">
          {event.subject}{event.subjectId ? "" : ""} · {event.rule}
        </div>
        {event.autoBookable && event.daysFromNow > 0 && (
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#7C3AED]">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Auto-bookable · MAIA can schedule remediation
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[11.5px] font-bold tabular-nums" style={{ color: sev.color }}>{when}</div>
      </div>
    </div>
  );

  return event.subjectId ? (
    <Link href={`/building-detail?id=${event.subjectId}`} className="block px-5 py-2.5 hover:bg-[#F8FAFC] transition-colors">
      {body}
    </Link>
  ) : (
    <div className="px-5 py-2.5">{body}</div>
  );
}

void AlertTriangle; void Calendar; void ArrowRight; void FileText;
