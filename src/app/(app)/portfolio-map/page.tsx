"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Map as MapIcon,
  Building2,
  Filter as FilterIcon,
  ArrowRight,
  Search,
} from "lucide-react";
import {
  PORTFOLIO_DATA,
  portfolioTotals,
  healthColor,
  healthLabel,
  CLASS_META,
  type BuildingClass,
} from "@/lib/buildings/portfolio";

type HealthBucket = "all" | "healthy" | "watch" | "critical";

// GTA bounding box tuned for the portfolio
const BOUNDS = {
  west: -79.80,
  east: -78.90,
  south: 43.40,
  north: 43.92,
};

function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng - BOUNDS.west) / (BOUNDS.east - BOUNDS.west)) * w;
  const y = ((BOUNDS.north - lat) / (BOUNDS.north - BOUNDS.south)) * h;
  return { x, y };
}

export default function PortfolioMapPage() {
  const totals = useMemo(() => portfolioTotals(), []);
  const [bucket, setBucket] = useState<HealthBucket>("all");
  const [classFilter, setClassFilter] = useState<BuildingClass | "all">("all");
  const [search, setSearch] = useState("");
  const [hoverId, setHoverId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return PORTFOLIO_DATA.filter((b) => {
      if (bucket === "healthy" && b.healthScore < 75) return false;
      if (bucket === "watch" && !(b.healthScore < 75 && b.healthScore >= 55)) return false;
      if (bucket === "critical" && b.healthScore >= 55) return false;
      if (classFilter !== "all" && b.class !== classFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.name.toLowerCase().includes(q) && !b.neighbourhood.toLowerCase().includes(q) && !b.address.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [bucket, classFilter, search]);

  const hovered = filtered.find((b) => b.id === hoverId) ?? null;

  return (
    <div className="p-8 space-y-6">
      <Hero totals={totals} />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <HealthFilter bucket={bucket} onBucket={setBucket} totals={totals} />
        <ClassFilter value={classFilter} onChange={setClassFilter} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search building, address, neighbourhood…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            Showing <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> of {PORTFOLIO_DATA.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-9">
          <MapCanvas buildings={filtered} hoverId={hoverId} onHover={setHoverId} hovered={hovered} />
        </div>
        <div className="col-span-12 xl:col-span-3">
          <BuildingList buildings={filtered} hoverId={hoverId} onHover={setHoverId} />
        </div>
      </div>
    </div>
  );
}

function Hero({ totals }: { totals: ReturnType<typeof portfolioTotals> }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
        >
          <MapIcon className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Portfolio map · {totals.buildingCount} buildings · live health
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Every Royal York building, scored in real time
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        Each pin is a building. Color = health score (composite of occupancy, arrears, open work orders, compliance).
        Hover to preview, click to drill in. {totals.critical} critical · {totals.watch} on watchlist · {totals.healthy} healthy.
      </p>
    </div>
  );
}

function HealthFilter({
  bucket, onBucket, totals,
}: {
  bucket: HealthBucket;
  onBucket: (b: HealthBucket) => void;
  totals: ReturnType<typeof portfolioTotals>;
}) {
  const tabs: { key: HealthBucket; label: string; color: string; count: number }[] = [
    { key: "all",      label: "All",      color: "#0F172A", count: totals.buildingCount },
    { key: "healthy",  label: "Healthy",  color: "#10B981", count: totals.healthy },
    { key: "watch",    label: "Watch",    color: "#F59E0B", count: totals.watch },
    { key: "critical", label: "Critical", color: "#EF4444", count: totals.critical },
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {tabs.map((t) => {
        const active = t.key === bucket;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onBucket(t.key)}
            className="relative px-2.5 py-1.5 text-[11px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="pm-health-filter"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}CC)`, boxShadow: `0 2px 8px ${t.color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">
              {t.label} <span className="opacity-70 ml-0.5 tabular-nums">{t.count}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ClassFilter({
  value, onChange,
}: {
  value: BuildingClass | "all";
  onChange: (c: BuildingClass | "all") => void;
}) {
  const opts: (BuildingClass | "all")[] = ["all", "multifamily_hirise", "multifamily_lowrise", "class_a_office", "class_b_office", "mixed_use"];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      {opts.map((c) => {
        const active = c === value;
        const label = c === "all" ? "All classes" : CLASS_META[c].label;
        const color = c === "all" ? "#0F172A" : CLASS_META[c].color;
        return (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
            style={{ color: active ? "#FFFFFF" : "#475569" }}
          >
            {active && (
              <motion.span
                layoutId="pm-class-filter"
                className="absolute inset-0 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Map canvas ──────────────────────────────────────────────────────────────

function MapCanvas({
  buildings, hoverId, onHover, hovered,
}: {
  buildings: typeof PORTFOLIO_DATA;
  hoverId: string | null;
  onHover: (id: string | null) => void;
  hovered: typeof PORTFOLIO_DATA[number] | null;
}) {
  const W = 1100;
  const H = 620;

  return (
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 flex items-center gap-2 border-b border-slate-100">
        <MapIcon className="w-4 h-4 text-blue-600" />
        <div className="text-[12.5px] font-bold text-[#0F172A]">Greater Toronto Area · {buildings.length} buildings</div>
        <span className="ml-auto inline-flex items-center gap-3 text-[10px] text-[#64748B]">
          <LegendDot color="#10B981" label="Healthy ≥75" />
          <LegendDot color="#F59E0B" label="Watch 55–74" />
          <LegendDot color="#EF4444" label="Critical &lt;55" />
        </span>
      </div>

      <div className="relative" style={{ background: "linear-gradient(180deg, #F0F9FF 0%, #F8FAFF 100%)" }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
          {/* Decorative "map" grid */}
          <defs>
            <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M 44 0 L 0 0 0 44" fill="none" stroke="rgba(37,99,235,0.05)" strokeWidth="1" />
            </pattern>
            <radialGradient id="lakeOntario" cx="50%" cy="100%" r="60%">
              <stop offset="0%" stopColor="rgba(37,99,235,0.22)" />
              <stop offset="100%" stopColor="rgba(37,99,235,0.04)" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width={W} height={H} fill="url(#grid)" />
          {/* Lake Ontario indicator */}
          <rect x="0" y={H * 0.82} width={W} height={H * 0.18} fill="url(#lakeOntario)" />
          <text x={W - 20} y={H - 14} textAnchor="end" fontSize="11" fontWeight="600" fill="rgba(37,99,235,0.45)" fontFamily="Inter, system-ui">
            LAKE ONTARIO
          </text>
          {/* 401 corridor guide */}
          <line x1="0" y1={H * 0.32} x2={W} y2={H * 0.32} stroke="rgba(37,99,235,0.08)" strokeWidth="1" strokeDasharray="4 4" />
          <text x="12" y={H * 0.32 - 6} fontSize="9" fontWeight="600" fill="rgba(37,99,235,0.4)" fontFamily="Inter, system-ui">
            401 CORRIDOR
          </text>

          {/* Building pins */}
          {buildings.map((b) => {
            const { x, y } = project(b.lat, b.lng, W, H);
            const c = healthColor(b.healthScore);
            const isHover = hoverId === b.id;
            const radius = isHover ? 12 : 7;
            return (
              <g
                key={b.id}
                onMouseEnter={() => onHover(b.id)}
                onMouseLeave={() => onHover(null)}
                style={{ cursor: "pointer" }}
              >
                {/* outer pulse ring for critical */}
                {b.healthScore < 55 && (
                  <circle cx={x} cy={y} r="14" fill="none" stroke={c} strokeWidth="1.5" opacity="0.3">
                    <animate attributeName="r" from="10" to="18" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.5" to="0" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle cx={x} cy={y} r={radius + 2} fill="#FFFFFF" />
                <circle cx={x} cy={y} r={radius} fill={c} opacity={isHover ? 1 : 0.88} />
                <circle cx={x} cy={y} r={radius - 3} fill="#FFFFFF" opacity="0.4" />
              </g>
            );
          })}
        </svg>

        {/* Hover card */}
        {hovered && (
          <Link
            href={`/building-detail?id=${hovered.id}`}
            className="absolute pointer-events-auto"
            style={{
              left: `min(max(${project(hovered.lng, hovered.lat, 1, 1).x * 100}%, 8%), 72%)`,
              top: `min(max(${project(hovered.lat, hovered.lng, 1, 1).y * 100}%, 4%), 76%)`,
              transform: "translate(14px, -10px)",
            }}
          >
            <BuildingCard building={hovered} />
          </Link>
        )}
      </div>
    </div>
  );
}

function BuildingCard({ building }: { building: typeof PORTFOLIO_DATA[number] }) {
  const c = healthColor(building.healthScore);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12 }}
      className="w-[260px] rounded-xl"
      style={{
        background: "#0F172A",
        border: `1px solid ${c}55`,
        boxShadow: `0 12px 32px rgba(15,23,42,0.35), 0 0 0 1px ${c}30`,
      }}
    >
      <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-white leading-tight truncate">{building.name}</div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">{building.address} · {building.neighbourhood}</div>
        </div>
        <div
          className="w-9 h-9 rounded-md flex items-center justify-center text-[12px] font-bold tabular-nums shrink-0"
          style={{ background: `${c}22`, color: c, border: `1px solid ${c}55` }}
        >
          {building.healthScore}
        </div>
      </div>
      <div className="px-3 pb-2 grid grid-cols-2 gap-1.5 text-[10px]">
        <Stat label="Units" value={building.units.toString()} />
        <Stat label="Occupancy" value={`${building.occupancyPct}%`} />
        <Stat label="Open work orders" value={building.openWorkOrders.toString()} accent={building.overdueWorkOrders > 0 ? "#F59E0B" : undefined} />
        <Stat label="Arrears" value={building.arrearsTenants.toString()} accent={building.arrearsTenants > 5 ? "#EF4444" : undefined} />
      </div>
      <div className="px-3 py-2 border-t border-slate-700 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.02)" }}>
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: c }}>
          {healthLabel(building.healthScore)}
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300">
          Open building <ArrowRight className="w-2.5 h-2.5" />
        </span>
      </div>
    </motion.div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md p-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="text-[9px] text-slate-400 font-semibold tracking-[0.1em] uppercase">{label}</div>
      <div className="text-[12px] font-bold text-white tabular-nums leading-tight" style={{ color: accent ?? "#FFFFFF" }}>{value}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[#475569]">{label}</span>
    </span>
  );
}

// ─── Building list (sidebar) ─────────────────────────────────────────────────

function BuildingList({
  buildings, hoverId, onHover,
}: {
  buildings: typeof PORTFOLIO_DATA;
  hoverId: string | null;
  onHover: (id: string | null) => void;
}) {
  const sorted = [...buildings].sort((a, b) => a.healthScore - b.healthScore);
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-[12px] font-bold text-[#0F172A]">Buildings · worst first</div>
        <div className="text-[10px] text-[#94A3B8]">Hover a row to highlight on the map</div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 620 }}>
        {sorted.map((b) => {
          const c = healthColor(b.healthScore);
          const active = hoverId === b.id;
          return (
            <Link
              key={b.id}
              href={`/building-detail?id=${b.id}`}
              onMouseEnter={() => onHover(b.id)}
              onMouseLeave={() => onHover(null)}
              className="block px-4 py-2.5 border-b border-slate-50 transition-colors"
              style={{ background: active ? "#F8FAFC" : undefined }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[10.5px] font-bold tabular-nums"
                  style={{ background: `${c}14`, color: c, border: `1px solid ${c}30` }}
                >
                  {b.healthScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-bold text-[#0F172A] truncate leading-tight">{b.name}</div>
                  <div className="text-[10px] text-[#64748B] truncate">
                    {b.neighbourhood} · {b.units}u · {CLASS_META[b.class].label}
                  </div>
                </div>
                <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

void Building2;
