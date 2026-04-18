"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Clock,
  Zap,
  Filter as FilterIcon,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertTriangle,
  Bot,
  Search,
  ArrowRight,
} from "lucide-react";
import { AGENTS } from "@/lib/platform/registry";
import { WORK_ORDERS } from "@/lib/buildings/work-orders";
import { PORTFOLIO_DATA } from "@/lib/buildings/portfolio";
import { workerById, TRADE_META } from "@/lib/buildings/workers";
import { ARREARS, ARREARS_STAGE_META } from "@/lib/buildings/arrears";
import { VACATING_UNITS, STAGE_META } from "@/lib/buildings/vacancy";

type EventType =
  | "triggered" | "analyzed" | "proposed" | "approved" | "rejected"
  | "executed" | "outcome_observed" | "escalated" | "blocked";

interface LedgerEvent {
  id: string;
  timestamp: string;           // ISO
  agentId: string;
  agentName: string;
  agentAccent: string;
  eventType: EventType;
  title: string;
  detail: string;
  actor: string;               // "MAIA" or human
  buildingId?: string;
  buildingName?: string;
  savingsUsd?: number;
  reasoning?: string[];        // chain-of-thought
  href?: string;               // drill-in URL
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

function buildLedger(): LedgerEvent[] {
  const events: LedgerEvent[] = [];
  const rng = mulberry32(9_182_361);
  const now = Date.now();

  // ── Dispatch Agent events from real work orders ────────────────────────
  const dispatchAgent = AGENTS.find((a) => a.id === "dispatch_agent")!;
  for (const wo of WORK_ORDERS.slice(0, 30)) {
    if (!wo.assigneeId) continue;
    const building = PORTFOLIO_DATA.find((b) => b.id === wo.buildingId);
    const worker = workerById(wo.assigneeId);
    const trade = TRADE_META[wo.trade];
    if (wo.autoAssigned) {
      events.push({
        id: `d-${wo.id}`,
        timestamp: wo.assignedAt ?? wo.submittedAt,
        agentId: dispatchAgent.id,
        agentName: dispatchAgent.name,
        agentAccent: dispatchAgent.accent,
        eventType: "executed",
        title: `Auto-assigned · ${wo.title}`,
        detail: `${building?.name} → ${worker?.type === "contractor" ? worker.company : worker?.name} · score ${wo.score}`,
        actor: "MAIA",
        buildingId: wo.buildingId,
        buildingName: building?.name,
        savingsUsd: wo.urgency === "emergency" ? 420 : 180,
        reasoning: [
          `Received ${wo.urgency} ${trade.label.toLowerCase()} work order`,
          `Filtered 142 workers → ${rng() > 0.5 ? 6 : 4} eligible candidates`,
          `Hard gates passed: license + insurance + WSIB all current`,
          `Top candidate score ${wo.score} (≥ 80 auto-assign threshold)`,
          `Fairness check: worker within monthly volume cap`,
          `Assignment written to ry_work_order_assignments`,
        ],
        href: "/work-order-market",
      });
    } else {
      events.push({
        id: `d-${wo.id}`,
        timestamp: wo.assignedAt ?? wo.submittedAt,
        agentId: dispatchAgent.id,
        agentName: dispatchAgent.name,
        agentAccent: dispatchAgent.accent,
        eventType: "proposed",
        title: `Proposed · ${wo.title}`,
        detail: `${building?.name} · awaiting approval · score ${wo.score}`,
        actor: "MAIA",
        buildingId: wo.buildingId,
        buildingName: building?.name,
        reasoning: [
          `Received ${wo.urgency} work order`,
          `Top candidate score ${wo.score} (below 80 auto threshold)`,
          `Human approval requested`,
        ],
        href: "/work-order-market",
      });
    }
  }

  // ── Arrears Sentinel events ──────────────────────────────────────────────
  const arrearsAgent = AGENTS.find((a) => a.id === "arrears_sentinel")!;
  for (const t of ARREARS.slice(0, 18)) {
    const building = PORTFOLIO_DATA.find((b) => b.id === t.buildingId);
    const stage = ARREARS_STAGE_META[t.stage];
    const hoursAgo = Math.floor(rng() * 96);
    events.push({
      id: `a-${t.id}`,
      timestamp: new Date(now - hoursAgo * 3_600_000).toISOString(),
      agentId: arrearsAgent.id,
      agentName: arrearsAgent.name,
      agentAccent: arrearsAgent.accent,
      eventType: t.stage === "n4_drafted" ? "proposed" : t.stage === "current" ? "analyzed" : "executed",
      title: `${stage.label} · Unit ${t.unit}`,
      detail: `${t.tenant} · $${t.balance.toLocaleString()} balance · ${t.daysOverdue}d overdue · risk ${t.riskScore}`,
      actor: "MAIA",
      buildingId: t.buildingId,
      buildingName: building?.name,
      reasoning: [
        `Scored ${t.tenant} delinquency risk at ${t.riskScore} / 100`,
        `Top features: ${t.daysOverdue}d overdue, ${t.paymentHistory.filter((h) => h === "missed").length} missed in 12mo`,
        `RTA-compliant escalation path: ${stage.label}`,
        t.stage === "n4_drafted" ? `N4 draft awaits human approval per playbook` : `Action executed`,
      ],
      href: "/arrears-intelligence",
    });
  }

  // ── Energy Optimizer events ──────────────────────────────────────────────
  const energyAgent = AGENTS.find((a) => a.id === "energy_optimizer")!;
  PORTFOLIO_DATA.slice(0, 12).forEach((b, i) => {
    const hoursAgo = Math.floor(rng() * 48);
    events.push({
      id: `e-${b.id}-${i}`,
      timestamp: new Date(now - hoursAgo * 3_600_000).toISOString(),
      agentId: energyAgent.id,
      agentName: energyAgent.name,
      agentAccent: energyAgent.accent,
      eventType: "executed",
      title: `HVAC setpoint adjusted · ${b.name}`,
      detail: `Overnight drift widened 2°C → 4°C during off-peak TOU window`,
      actor: "MAIA",
      buildingId: b.id,
      buildingName: b.name,
      savingsUsd: Math.round(b.sqft * 0.0038 * (0.7 + rng() * 0.6)),
      reasoning: [
        `Forecast: zone unoccupied 23:00–05:30 based on access-control history`,
        `TOU rate window: off-peak 19:00–07:00 @ $0.076/kWh`,
        `Comfort guardrail: 4°C max drift respected`,
        `BMS command written via Metasys API`,
      ],
      href: "/energy-intelligence",
    });
  });

  // ── Compliance Sentinel events ───────────────────────────────────────────
  const complianceAgent = AGENTS.find((a) => a.id === "compliance_sentinel")!;
  PORTFOLIO_DATA.slice(0, 8).forEach((b, i) => {
    const hoursAgo = Math.floor(6 + rng() * 120);
    events.push({
      id: `c-${b.id}-${i}`,
      timestamp: new Date(now - hoursAgo * 3_600_000).toISOString(),
      agentId: complianceAgent.id,
      agentName: complianceAgent.name,
      agentAccent: complianceAgent.accent,
      eventType: i % 3 === 0 ? "escalated" : "executed",
      title: i % 3 === 0 ? `Compliance alert · ${b.name}` : `Auto-booked fire alarm inspection · ${b.name}`,
      detail: i % 3 === 0
        ? `Elevator monthly PM overdue · TSSA risk`
        : `LCI Fire Safety booked for day 34, OFC 6.3.1.1 compliant`,
      actor: "MAIA",
      buildingId: b.id,
      buildingName: b.name,
      reasoning: [
        `±90-day compliance horizon scanned`,
        `Next required action: ${i % 3 === 0 ? "elevator monthly PM" : "fire alarm annual"}`,
        `Eligible contractors validated against rule pack`,
        i % 3 === 0 ? `Overdue — escalated to building manager` : `Auto-booking scheduled`,
      ],
      href: "/compliance-intelligence",
    });
  });

  // ── Vacancy Watcher events ───────────────────────────────────────────────
  const vacancyAgent = AGENTS.find((a) => a.id === "vacancy_watcher")!;
  VACATING_UNITS.slice(0, 8).forEach((u, i) => {
    const hoursAgo = Math.floor(2 + rng() * 72);
    events.push({
      id: `v-${u.id}`,
      timestamp: new Date(now - hoursAgo * 3_600_000).toISOString(),
      agentId: vacancyAgent.id,
      agentName: vacancyAgent.name,
      agentAccent: vacancyAgent.accent,
      eventType: "analyzed",
      title: `Vacancy flagged · Unit ${u.unit}`,
      detail: `${u.buildingName} · ${STAGE_META[u.stage].label} · projected rent lift +$${u.projectedRent - u.currentRent}`,
      actor: "MAIA",
      buildingId: u.buildingId,
      buildingName: u.buildingName,
      reasoning: [
        `Tenant notice received ${u.daysSinceNotice} days ago`,
        `Expected flip time ${u.expectedFlipDays} days · target 14`,
        `Projected re-rent: $${u.projectedRent} (vs $${u.currentRent} current)`,
        u.bottleneck ? `Bottleneck flagged: ${u.bottleneck}` : `Pipeline healthy`,
      ],
      href: "/vacancy-intelligence",
    });
    void i;
  });

  // ── Briefing + Turnover + Outcome synthesised events ─────────────────────
  const briefingAgent = AGENTS.find((a) => a.id === "briefing_composer")!;
  events.push({
    id: "b-weekly-1",
    timestamp: new Date(now - 28 * 3_600_000).toISOString(),
    agentId: briefingAgent.id,
    agentName: briefingAgent.name,
    agentAccent: briefingAgent.accent,
    eventType: "executed",
    title: `Weekly portfolio briefing generated`,
    detail: `Claude Haiku 4.5 · 38s generation · covers 47 buildings`,
    actor: "MAIA",
    reasoning: [
      `Pulled 7 days of agent activity from Decisions Ledger`,
      `Aggregated by domain: vacancy, arrears, work-order throughput, energy, compliance`,
      `Claude Haiku composed narrative from structured summary`,
      `Published to /briefings/executive`,
    ],
    href: "/briefings/executive",
  });

  const turnoverAgent = AGENTS.find((a) => a.id === "turnover_orchestrator")!;
  events.push({
    id: "t-pipeline-1",
    timestamp: new Date(now - 14 * 3_600_000).toISOString(),
    agentId: turnoverAgent.id,
    agentName: turnoverAgent.name,
    agentAccent: turnoverAgent.accent,
    eventType: "executed",
    title: `Turnover pipeline updated · 12 units`,
    detail: `3 units advanced to Listed · 2 bottleneck trades flagged`,
    actor: "MAIA",
    reasoning: [
      `Critical-path recomputed for each in-flight unit`,
      `Dispatch Agent confirmed trade assignments`,
      `Listings auto-published on clean-stage completion`,
    ],
    href: "/vacancy-intelligence",
  });

  // Sort newest first
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return events;
}

const LEDGER = buildLedger();

const EVENT_META: Record<EventType, { label: string; color: string; icon: React.ElementType }> = {
  triggered:        { label: "Triggered",    color: "#2563EB", icon: Zap },
  analyzed:         { label: "Analyzed",     color: "#7C3AED", icon: Sparkles },
  proposed:         { label: "Proposed",     color: "#D97706", icon: AlertTriangle },
  approved:         { label: "Approved",     color: "#059669", icon: CheckCircle2 },
  rejected:         { label: "Rejected",     color: "#DC2626", icon: XCircle },
  executed:         { label: "Executed",     color: "#10B981", icon: CheckCircle2 },
  outcome_observed: { label: "Outcome",      color: "#0891B2", icon: CheckCircle2 },
  escalated:        { label: "Escalated",    color: "#EA580C", icon: AlertTriangle },
  blocked:          { label: "Blocked",      color: "#DC2626", icon: XCircle },
};

export default function DecisionsLedgerPage() {
  const [agentFilter, setAgentFilter] = useState<string | "all">("all");
  const [eventFilter, setEventFilter] = useState<EventType | "all">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return LEDGER.filter((e) => {
      if (agentFilter !== "all" && e.agentId !== agentFilter) return false;
      if (eventFilter !== "all" && e.eventType !== eventFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.detail.toLowerCase().includes(q) && !(e.buildingName ?? "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [agentFilter, eventFilter, search]);

  const kpis = useMemo(() => {
    const total = LEDGER.length;
    const executed = LEDGER.filter((e) => e.eventType === "executed").length;
    const proposed = LEDGER.filter((e) => e.eventType === "proposed").length;
    const escalated = LEDGER.filter((e) => e.eventType === "escalated").length;
    const saved = LEDGER.reduce((s, e) => s + (e.savingsUsd ?? 0), 0);
    return { total, executed, proposed, escalated, saved };
  }, []);

  const handleExport = () => {
    const csv = [
      ["timestamp", "agent", "event", "title", "detail", "building", "actor", "savings_usd"].join(","),
      ...filtered.map((e) => [
        e.timestamp,
        e.agentName,
        e.eventType,
        `"${e.title.replace(/"/g, '""')}"`,
        `"${e.detail.replace(/"/g, '""')}"`,
        e.buildingName ?? "",
        e.actor,
        e.savingsUsd ?? "",
      ].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maia-decisions-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} onExport={handleExport} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Kpi label="Total decisions"  value={kpis.total}                                     sub="all agents · last 7d"   accent="#2563EB" />
        <Kpi label="Executed"         value={kpis.executed}                                  sub={`${Math.round((kpis.executed / kpis.total) * 100)}% of volume`} accent="#10B981" />
        <Kpi label="Proposed"         value={kpis.proposed}                                  sub="awaiting approval"      accent="#F59E0B" />
        <Kpi label="Escalated"        value={kpis.escalated}                                 sub="human-in-loop"          accent="#EA580C" />
        <Kpi label="Saved (est)"      value={`$${(kpis.saved / 1000).toFixed(1)}K`}          sub="from exec'd decisions"  accent="#059669" live />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <AgentPills value={agentFilter} onChange={setAgentFilter} events={LEDGER} />
        <EventPills value={eventFilter} onChange={setEventFilter} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, building…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> of {LEDGER.length}
          </span>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
        <div className="divide-y divide-slate-50">
          {filtered.map((e) => (
            <EventRow key={e.id} event={e} expanded={expanded === e.id} onToggle={() => setExpanded(expanded === e.id ? null : e.id)} />
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[13px] text-[#64748B]">No decisions match this filter.</div>
      )}
    </div>
  );
}

function Hero({ kpis, onExport }: { kpis: { total: number; saved: number }; onExport: () => void }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #0891B2)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
          >
            <FileText className="w-2.5 h-2.5 text-white" />
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{
              background: "linear-gradient(90deg, #2563EB, #0891B2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Decisions Ledger · append-only audit log
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          Every agent decision, every outcome, every rationale
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
          {kpis.total} decisions logged · ${(kpis.saved / 1000).toFixed(1)}K in est. savings this week.
          Click any entry to see MAIA&apos;s reasoning chain. Export filtered rows to CSV for audit.
        </p>
      </div>
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide text-white transition-all"
        style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
      >
        <Download className="w-3.5 h-3.5" /> Export CSV
      </button>
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

function AgentPills({ value, onChange, events }: { value: string | "all"; onChange: (v: string | "all") => void; events: LedgerEvent[] }) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) m.set(e.agentId, (m.get(e.agentId) ?? 0) + 1);
    return m;
  }, [events]);
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      <PillBtn active={value === "all"} onClick={() => onChange("all")} color="#0F172A" label="All" count={events.length} />
      {AGENTS.filter((a) => counts.has(a.id)).map((a) => (
        <PillBtn key={a.id} active={value === a.id} onClick={() => onChange(a.id)} color={a.accent} label={a.name.split(" ")[0]} count={counts.get(a.id) ?? 0} />
      ))}
    </div>
  );
}

function EventPills({ value, onChange }: { value: EventType | "all"; onChange: (v: EventType | "all") => void }) {
  const types: (EventType | "all")[] = ["all", "executed", "proposed", "analyzed", "escalated"];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {types.map((t) => {
        const label = t === "all" ? "All events" : EVENT_META[t].label;
        const color = t === "all" ? "#0F172A" : EVENT_META[t].color;
        return <PillBtn key={t} active={value === t} onClick={() => onChange(t)} color={color} label={label} />;
      })}
    </div>
  );
}

function PillBtn({ active, onClick, color, label, count }: { active: boolean; onClick: () => void; color: string; label: string; count?: number }) {
  return (
    <button type="button" onClick={onClick} className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
      style={{ color: active ? "#FFFFFF" : "#475569" }}>
      {active && (
        <motion.span layoutId="dl-filter" className="absolute inset-0 rounded-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }} />
      )}
      <span className="relative">{label}{count !== undefined && <span className="opacity-70 ml-0.5 tabular-nums">{count}</span>}</span>
    </button>
  );
}

function EventRow({ event, expanded, onToggle }: { event: LedgerEvent; expanded: boolean; onToggle: () => void }) {
  const meta = EVENT_META[event.eventType];
  const Icon = meta.icon;
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-3 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${event.agentAccent}14`, border: `1px solid ${event.agentAccent}30` }}
        >
          <Bot className="w-3.5 h-3.5" style={{ color: event.agentAccent }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-[12px] font-bold text-[#0F172A]">{event.title}</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
              style={{ background: `${meta.color}10`, color: meta.color, border: `1px solid ${meta.color}26` }}>
              <Icon className="w-2.5 h-2.5" />
              {meta.label}
            </span>
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: event.agentAccent }}>{event.agentName}</span>
          </div>
          <div className="text-[11px] text-[#475569] leading-snug">{event.detail}</div>
        </div>
        <div className="text-right shrink-0">
          {event.savingsUsd && event.savingsUsd > 0 && (
            <div className="text-[11px] font-bold tabular-nums text-[#059669]">+${event.savingsUsd}</div>
          )}
          <div className="text-[9.5px] text-[#94A3B8] font-mono mt-0.5">{relativeTime(event.timestamp)}</div>
        </div>
      </button>
      {expanded && (
        <div className="px-5 pb-4 pl-16" style={{ background: "rgba(15,23,42,0.015)" }}>
          {event.reasoning && (
            <div className="mb-2">
              <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1.5">Reasoning chain</div>
              <ol className="space-y-1">
                {event.reasoning.map((r, i) => (
                  <li key={i} className="text-[11.5px] text-[#334155] leading-relaxed flex items-start gap-2">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[9.5px] font-bold text-white shrink-0 mt-0.5"
                      style={{ background: event.agentAccent }}>{i + 1}</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2">
            {event.href && (
              <Link href={event.href} className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#2563EB] hover:underline">
                Open surface <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            )}
            <Link href={`/agents/${event.agentId}`} className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#7C3AED] hover:underline">
              Agent detail <ArrowRight className="w-2.5 h-2.5" />
            </Link>
            {event.buildingId && (
              <Link href={`/building-detail?id=${event.buildingId}`} className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#0891B2] hover:underline">
                Building <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function relativeTime(iso: string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const s = Math.floor(delta / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

void Clock;
