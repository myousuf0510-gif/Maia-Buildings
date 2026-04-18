"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench,
  Radio,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bot,
  ArrowRight,
  Zap,
  Shield,
  Activity,
  Filter as FilterIcon,
  X,
} from "lucide-react";
import { WORK_ORDERS, URGENCY_META, STATUS_META, scoreCandidates, type WorkOrder } from "@/lib/buildings/work-orders";
import { WORKER_POOL, TRADE_META, workerById, type Worker } from "@/lib/buildings/workers";
import { PORTFOLIO_DATA } from "@/lib/buildings/portfolio";

export default function WorkOrderMarketPage() {
  const [orders, setOrders] = useState<WorkOrder[]>(() => WORK_ORDERS);
  const [selectedId, setSelectedId] = useState<string | null>(orders[0]?.id ?? null);
  const [filter, setFilter] = useState<"all" | "emergency" | "urgent" | "open" | "completed">("all");
  const [tick, setTick] = useState(0);

  // Live feel: nudge one new order in every 12–20s
  useEffect(() => {
    const spawn = () => {
      setOrders((prev) => {
        const seed = prev[prev.length - 1];
        if (!seed) return prev;
        const fresh: WorkOrder = {
          ...seed,
          id: `wo-live-${Date.now()}`,
          submittedAt: new Date().toISOString(),
          status: "scoring",
          assigneeId: undefined,
          score: undefined,
          rationale: undefined,
          assignedAt: undefined,
          autoAssigned: undefined,
        };
        return [fresh, ...prev].slice(0, 80);
      });
      setTick((t) => t + 1);
    };
    let timer = 0;
    const schedule = () => {
      const delay = 12_000 + Math.random() * 8_000;
      timer = window.setTimeout(() => {
        spawn();
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter === "all") return true;
      if (filter === "emergency") return o.urgency === "emergency";
      if (filter === "urgent") return o.urgency === "urgent";
      if (filter === "open") return o.status === "new" || o.status === "scoring" || o.status === "proposed" || o.status === "assigned" || o.status === "in_progress";
      if (filter === "completed") return o.status === "completed";
      return true;
    });
  }, [orders, filter]);

  const selected = orders.find((o) => o.id === selectedId) ?? filtered[0] ?? null;

  const kpis = useMemo(() => {
    const total = orders.length;
    const autoAssigned = orders.filter((o) => o.autoAssigned).length;
    const blocked = orders.filter((o) => o.status === "blocked").length;
    const escalated = orders.filter((o) => o.status === "escalated").length;
    const avgScore = orders.filter((o) => o.score).reduce((s, o) => s + (o.score ?? 0), 0) / Math.max(1, orders.filter((o) => o.score).length);
    return { total, autoAssigned, blocked, escalated, avgScore: Math.round(avgScore) };
  }, [orders]);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} tick={tick} />

      <div className="flex items-center gap-3 flex-wrap">
        <FilterPills filter={filter} onFilter={setFilter} total={orders.length} />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-5">
          <OrderList orders={filtered} selectedId={selected?.id ?? null} onSelect={(id) => setSelectedId(id)} />
        </div>
        <div className="col-span-12 xl:col-span-7">
          {selected ? <OrderDetail order={selected} /> : <EmptyState />}
        </div>
      </div>
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ kpis, tick }: { kpis: { total: number; autoAssigned: number; blocked: number; escalated: number; avgScore: number }; tick: number }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
        >
          <Wrench className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Work Order Market · Dispatch Agent · live auto-assign
          {tick > 0 && <span className="ml-2 font-mono opacity-70">+{tick}</span>}
        </span>
      </div>
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
            Every work order, auto-dispatched to the right worker
          </h1>
          <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
            Dispatch Agent scores employees + contractors on skill, availability, cost, fairness, and compliance — then auto-assigns when the top candidate clears 80.
            Below that, it proposes. Every decision is logged in the Decisions Ledger.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Work orders"     value={kpis.total}                        sub="last 72h"            accent="#2563EB" icon={Wrench} live />
        <Stat label="Auto-assigned"   value={kpis.autoAssigned}                 sub={`${Math.round((kpis.autoAssigned / Math.max(1, kpis.total)) * 100)}% auto rate`} accent="#10B981" icon={Zap} />
        <Stat label="Avg score"       value={kpis.avgScore}                     sub="of 100"              accent="#7C3AED" icon={Activity} />
        <Stat label="Blocked"         value={kpis.blocked}                      sub="compliance gate"     accent="#F59E0B" icon={Shield} />
        <Stat label="Escalated"       value={kpis.escalated}                    sub="no eligible match"   accent="#DC2626" icon={AlertOctagon} />
      </div>
    </div>
  );
}

function Stat({ label, value, sub, accent, icon: Icon, live }: { label: string; value: string | number; sub: string; accent: string; icon: React.ElementType; live?: boolean }) {
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

function FilterPills({ filter, onFilter, total }: { filter: string; onFilter: (f: "all" | "emergency" | "urgent" | "open" | "completed") => void; total: number }) {
  const tabs: { key: "all" | "emergency" | "urgent" | "open" | "completed"; label: string; color: string }[] = [
    { key: "all",       label: "All",       color: "#0F172A" },
    { key: "emergency", label: "Emergency", color: "#EF4444" },
    { key: "urgent",    label: "Urgent",    color: "#F59E0B" },
    { key: "open",      label: "Open",      color: "#2563EB" },
    { key: "completed", label: "Completed", color: "#64748B" },
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      {tabs.map((t) => {
        const active = t.key === filter;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onFilter(t.key)}
            className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="wom-filter"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`, boxShadow: `0 2px 8px ${t.color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
      <span className="ml-2 text-[10px] text-[#64748B] mr-1">{total} total</span>
    </div>
  );
}

// ─── Order list ──────────────────────────────────────────────────────────────

function OrderList({ orders, selectedId, onSelect }: { orders: WorkOrder[]; selectedId: string | null; onSelect: (id: string) => void }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        <Radio className="w-3.5 h-3.5 text-rose-500" />
        <div className="text-[12px] font-bold text-[#0F172A]">Live queue</div>
        <span className="ml-auto text-[10px] text-[#94A3B8]">{orders.length} shown</span>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 740 }}>
        <AnimatePresence initial={false}>
          {orders.map((o) => (
            <motion.div
              key={o.id}
              layout
              initial={{ opacity: 0, x: -8, backgroundColor: "rgba(37,99,235,0.08)" }}
              animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255,255,255,0)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <OrderRow order={o} selected={o.id === selectedId} onSelect={() => onSelect(o.id)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function OrderRow({ order, selected, onSelect }: { order: WorkOrder; selected: boolean; onSelect: () => void }) {
  const building = PORTFOLIO_DATA.find((b) => b.id === order.buildingId);
  const assignee = order.assigneeId ? workerById(order.assigneeId) : undefined;
  const urgency = URGENCY_META[order.urgency];
  const status = STATUS_META[order.status];
  const trade = TRADE_META[order.trade];
  const timeAgo = relativeTime(order.submittedAt);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left px-4 py-3 border-b border-slate-50 transition-colors"
      style={{ background: selected ? "rgba(37,99,235,0.04)" : "#FFFFFF", borderLeft: selected ? "3px solid #2563EB" : "3px solid transparent" }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
          style={{ background: `${trade.color}14`, border: `1px solid ${trade.color}30` }}
          title={trade.label}
        >
          {trade.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[12px] font-bold text-[#0F172A] leading-tight">{order.title}</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
              style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.color}30` }}>
              {urgency.label}
            </span>
          </div>
          <div className="text-[10.5px] text-[#64748B] truncate mb-0.5">
            {building?.name} · {order.unit ? `Unit ${order.unit}` : "Common area"}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
              style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
              {order.status === "in_progress" && <Activity className="w-2 h-2" />}
              {order.status === "assigned" && <CheckCircle2 className="w-2 h-2" />}
              {order.status === "blocked" && <AlertOctagon className="w-2 h-2" />}
              {status.label}
            </span>
            {assignee && (
              <span className="text-[10px] text-[#475569]">
                → <span className="font-semibold">{assignee.type === "contractor" ? assignee.company : assignee.name}</span>
              </span>
            )}
            {order.autoAssigned && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#7C3AED]">
                <Bot className="w-2.5 h-2.5" />
                AUTO · {order.score}
              </span>
            )}
            <span className="ml-auto text-[10px] text-[#94A3B8] font-mono">{timeAgo}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Order detail ────────────────────────────────────────────────────────────

function OrderDetail({ order }: { order: WorkOrder }) {
  const building = PORTFOLIO_DATA.find((b) => b.id === order.buildingId);
  const assignee = order.assigneeId ? workerById(order.assigneeId) : undefined;
  const urgency = URGENCY_META[order.urgency];
  const status = STATUS_META[order.status];
  const trade = TRADE_META[order.trade];
  const candidates = useMemo(() => scoreCandidates(order).slice(0, 6), [order.id]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100" style={{ background: `linear-gradient(90deg, ${trade.color}08, transparent 60%)` }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.14em] uppercase"
                style={{ background: urgency.bg, color: urgency.color, border: `1px solid ${urgency.color}30` }}>
                {order.urgency === "emergency" && <AlertOctagon className="w-2.5 h-2.5" />}
                {urgency.label}
              </span>
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: trade.color }}>{trade.label}</span>
              <span className="text-[10px] text-[#94A3B8]">·</span>
              <span className="text-[10px] text-[#94A3B8]">Submitted by {order.submittedBy}</span>
            </div>
            <h2 className="text-[18px] font-bold text-[#0F172A] leading-tight">{order.title}</h2>
            <div className="text-[11.5px] text-[#64748B] mt-0.5">
              {building?.name} · {order.unit ? `Unit ${order.unit}` : "Common area"} · SLA {order.slaHours}h · est. {order.estHours}h
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-[0.12em] uppercase shrink-0"
            style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
            {status.label}
          </span>
        </div>
        <div className="text-[12px] text-[#475569] leading-relaxed">{order.description}</div>
      </div>

      {/* Current assignment */}
      {assignee && (
        <div className="px-5 py-4 border-b border-slate-100" style={{ background: "rgba(16,185,129,0.03)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-emerald-700">
              {order.autoAssigned ? "Auto-assigned by Dispatch Agent" : "Assigned"}
            </span>
          </div>
          <WorkerLine worker={assignee} score={order.score} rationale={order.rationale} winning />
        </div>
      )}

      {/* Candidate list */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-3">
          <Bot className="w-3 h-3 text-[#7C3AED]" />
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#7C3AED]">
            Dispatch candidates · scored
          </span>
          <span className="ml-auto text-[10px] text-[#94A3B8]">{candidates.length} of {WORKER_POOL.filter((w) => w.trades.includes(order.trade)).length} eligible</span>
        </div>
        <div className="space-y-2">
          {candidates.map((c, i) => (
            <WorkerLine
              key={c.worker.id}
              worker={c.worker}
              score={c.score}
              rationale={c.rationale}
              blocked={c.blocked}
              rank={i + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkerLine({
  worker, score, rationale, blocked, rank, winning,
}: {
  worker: Worker;
  score?: number;
  rationale?: string;
  blocked?: string;
  rank?: number;
  winning?: boolean;
}) {
  const scoreColor = !score ? "#94A3B8" : score >= 80 ? "#10B981" : score >= 65 ? "#F59E0B" : "#EF4444";
  return (
    <div
      className="rounded-lg p-3 flex items-start gap-3"
      style={{
        background: winning ? "rgba(16,185,129,0.06)" : "#FFFFFF",
        border: winning ? "1px solid rgba(16,185,129,0.35)" : blocked ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 font-bold"
        style={{
          background: `${worker.accent}14`,
          color: worker.accent,
          border: `1px solid ${worker.accent}30`,
        }}
      >
        {worker.type === "employee" ? "👤" : "🔧"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          {rank && <span className="text-[9.5px] font-bold text-[#94A3B8] tabular-nums">#{rank}</span>}
          <span className="text-[12px] font-bold text-[#0F172A]">{worker.type === "contractor" ? worker.company : worker.name}</span>
          <span className="inline-flex items-center gap-1 px-1 rounded text-[9px] font-bold tracking-[0.12em] uppercase"
            style={{
              background: worker.type === "employee" ? "rgba(37,99,235,0.08)" : "rgba(124,58,237,0.08)",
              color: worker.type === "employee" ? "#2563EB" : "#7C3AED",
              border: `1px solid ${worker.type === "employee" ? "rgba(37,99,235,0.2)" : "rgba(124,58,237,0.2)"}`,
            }}>
            {worker.type}
          </span>
          {worker.badges?.map((badge) => (
            <span key={badge} className="inline-flex items-center gap-0.5 px-1 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
              style={{
                background: badge.includes("LAPSED") ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.08)",
                color: badge.includes("LAPSED") ? "#DC2626" : "#059669",
                border: `1px solid ${badge.includes("LAPSED") ? "rgba(239,68,68,0.25)" : "rgba(16,185,129,0.25)"}`,
              }}>
              {badge}
            </span>
          ))}
        </div>
        <div className="text-[10.5px] text-[#475569] leading-snug mb-1">
          {rationale ?? `${worker.rating.toFixed(1)}★ · ${worker.slaHitRatePct}% SLA · ${worker.completionsThisMonth} jobs this month · $${worker.hourlyRate}/hr`}
        </div>
        {blocked && (
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold"
            style={{ background: "rgba(239,68,68,0.08)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.22)" }}>
            <X className="w-2.5 h-2.5" />
            BLOCKED · {blocked}
          </div>
        )}
      </div>
      {score !== undefined && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[13px] font-bold tabular-nums"
          style={{
            background: `${scoreColor}14`,
            color: scoreColor,
            border: `1px solid ${scoreColor}35`,
          }}
        >
          {score}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl p-10 text-center"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div className="text-[13px] text-[#64748B]">Select a work order to see dispatch scoring.</div>
    </div>
  );
}

// ─── utils ───────────────────────────────────────────────────────────────────

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

void AlertTriangle; void Clock; void ArrowRight; void Link;
