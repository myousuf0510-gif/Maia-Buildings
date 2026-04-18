"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Hammer,
  Wrench,
  Download,
  CheckCircle2,
  Calendar,
  Search,
  ArrowRight,
} from "lucide-react";
import { PORTFOLIO_DATA } from "@/lib/buildings/portfolio";
import { WORK_ORDERS, URGENCY_META } from "@/lib/buildings/work-orders";
import { TRADE_META, workerById } from "@/lib/buildings/workers";

export default function MaintenanceRecommendationsPage() {
  const [search, setSearch] = useState("");
  const [exported, setExported] = useState(false);

  const weekOrders = useMemo(() => {
    // Work orders expected this week (next 7 days) or not yet completed
    return WORK_ORDERS.filter((o) => o.status !== "completed" && o.status !== "escalated");
  }, []);

  const byBuilding = useMemo(() => {
    const map = new Map<string, typeof WORK_ORDERS>();
    for (const o of weekOrders) {
      if (!map.has(o.buildingId)) map.set(o.buildingId, []);
      map.get(o.buildingId)!.push(o);
    }
    return map;
  }, [weekOrders]);

  const buildings = useMemo(() => {
    return PORTFOLIO_DATA
      .filter((b) => byBuilding.has(b.id))
      .sort((a, b) => (byBuilding.get(b.id)?.length ?? 0) - (byBuilding.get(a.id)?.length ?? 0));
  }, [byBuilding]);

  const filtered = useMemo(() => {
    if (!search) return buildings;
    const q = search.toLowerCase();
    return buildings.filter((b) =>
      b.name.toLowerCase().includes(q) || b.neighbourhood.toLowerCase().includes(q),
    );
  }, [buildings, search]);

  const kpis = useMemo(() => {
    const total = weekOrders.length;
    const emergency = weekOrders.filter((o) => o.urgency === "emergency").length;
    const urgent = weekOrders.filter((o) => o.urgency === "urgent").length;
    const estHours = weekOrders.reduce((s, o) => s + o.estHours, 0);
    return { total, emergency, urgent, buildings: byBuilding.size, estHours: Math.round(estHours) };
  }, [weekOrders, byBuilding]);

  const handleExport = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      week_total: kpis.total,
      buildings: buildings.map((b) => ({
        id: b.id,
        name: b.name,
        work_orders: byBuilding.get(b.id),
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maia-maintenance-plan-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} onExport={handleExport} exported={exported} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <Kpi label="Work orders · week"   value={kpis.total}     sub="scheduled + open"   accent="#2563EB" />
        <Kpi label="Emergency"            value={kpis.emergency} sub="life-safety"        accent="#DC2626" />
        <Kpi label="Urgent"               value={kpis.urgent}    sub="24–48h SLA"         accent="#F59E0B" />
        <Kpi label="Buildings"            value={kpis.buildings} sub="with open work"     accent="#7C3AED" />
        <Kpi label="Est. labour hours"    value={`${kpis.estHours}h`} sub="cross all trades" accent="#10B981" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search building, neighbourhood…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> buildings
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((b) => (
          <BuildingBlock key={b.id} building={b} orders={byBuilding.get(b.id) ?? []} />
        ))}
      </div>
    </div>
  );
}

function Hero({ kpis, onExport, exported }: { kpis: { total: number; buildings: number }; onExport: () => void; exported: boolean }) {
  return (
    <div className="flex items-end justify-between gap-6 flex-wrap">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #EC4899, #7C3AED)", boxShadow: "0 2px 6px rgba(236,72,153,0.3)" }}
          >
            <Hammer className="w-2.5 h-2.5 text-white" />
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{
              background: "linear-gradient(90deg, #EC4899, #7C3AED)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Maintenance recommendations · this week
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          Every work order for the week, clustered by building
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
          {kpis.total} work orders across {kpis.buildings} buildings · dispatched, pending, or scheduled.
          Export directly to your CMMS, or let Dispatch Agent run the week.
        </p>
      </div>

      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11.5px] font-bold tracking-wide text-white transition-all"
        style={{
          background: exported ? "linear-gradient(135deg, #10B981, #059669)" : "linear-gradient(135deg, #2563EB, #7C3AED)",
          boxShadow: exported ? "0 2px 8px rgba(16,185,129,0.3)" : "0 2px 8px rgba(37,99,235,0.3)",
        }}
      >
        {exported ? <><CheckCircle2 className="w-3.5 h-3.5" /> Exported</> : <><Download className="w-3.5 h-3.5" /> Export plan (JSON)</>}
      </button>
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

function BuildingBlock({ building, orders }: { building: typeof PORTFOLIO_DATA[number]; orders: typeof WORK_ORDERS }) {
  const emergency = orders.filter((o) => o.urgency === "emergency").length;
  const urgent = orders.filter((o) => o.urgency === "urgent").length;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <Link href={`/building-detail?id=${building.id}`} className="block px-5 py-3 border-b border-slate-100 hover:bg-[#F8FAFC] transition-colors">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-[#0F172A] leading-tight">{building.name}</div>
            <div className="text-[10.5px] text-[#64748B] truncate">{building.address} · {building.neighbourhood}</div>
          </div>
          <div className="flex items-center gap-2 text-[10.5px]">
            {emergency > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold tracking-[0.1em] uppercase"
                style={{ background: "rgba(239,68,68,0.1)", color: "#DC2626", border: "1px solid rgba(239,68,68,0.25)" }}>
                {emergency} emergency
              </span>
            )}
            {urgent > 0 && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-bold tracking-[0.1em] uppercase"
                style={{ background: "rgba(245,158,11,0.1)", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)" }}>
                {urgent} urgent
              </span>
            )}
            <span className="font-bold text-[#0F172A] tabular-nums">{orders.length}</span>
            <span className="text-[#94A3B8]">work orders</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </div>
      </Link>
      <div className="divide-y divide-slate-50">
        {orders.slice(0, 6).map((o) => {
          const trade = TRADE_META[o.trade];
          const urg = URGENCY_META[o.urgency];
          const assignee = o.assigneeId ? workerById(o.assigneeId) : undefined;
          return (
            <div key={o.id} className="px-5 py-2.5 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[13px]"
                style={{ background: `${trade.color}14`, border: `1px solid ${trade.color}30` }}
              >
                {trade.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px] font-bold text-[#0F172A]">{o.title}</span>
                  {o.unit && <span className="text-[10px] text-[#64748B]">· Unit {o.unit}</span>}
                  <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: urg.bg, color: urg.color, border: `1px solid ${urg.color}30` }}>
                    {urg.label}
                  </span>
                  {o.autoAssigned && (
                    <span className="inline-flex items-center gap-0.5 text-[9.5px] font-bold text-[#7C3AED]">
                      AUTO · {o.score}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#64748B] mt-0.5">
                  {assignee ? <>→ <span className="font-semibold text-[#475569]">{assignee.type === "contractor" ? assignee.company : assignee.name}</span></> : "Unassigned"}
                  <span className="mx-1.5">·</span>
                  <span>{o.estHours}h est</span>
                  <span className="mx-1.5">·</span>
                  <span>SLA {o.slaHours}h</span>
                </div>
              </div>
            </div>
          );
        })}
        {orders.length > 6 && (
          <div className="px-5 py-2 text-center text-[10.5px] text-[#64748B]">
            + {orders.length - 6} more work orders in this building
          </div>
        )}
      </div>
    </div>
  );
}

void Wrench;
