"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter as FilterIcon,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Home,
} from "lucide-react";
import {
  TENANTS,
  STATUS_META,
  PAYMENT_META,
  type TenancyStatus,
  type PaymentStatus,
} from "@/lib/buildings/tenants";

export default function TenantsPage() {
  const [statusFilter, setStatusFilter] = useState<TenancyStatus | "all">("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 40;

  const filtered = useMemo(() => {
    return TENANTS.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (paymentFilter !== "all" && t.paymentStatus !== paymentFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.name.toLowerCase().includes(q) && !t.buildingName.toLowerCase().includes(q) &&
            !t.unit.toLowerCase().includes(q) && !t.neighbourhood.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [statusFilter, paymentFilter, search]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const kpis = useMemo(() => {
    const total = TENANTS.length;
    const onTime = TENANTS.filter((t) => t.paymentStatus === "on_time").length;
    const arrears = TENANTS.filter((t) => t.paymentStatus === "arrears").length;
    const late = TENANTS.filter((t) => t.paymentStatus === "late").length;
    const renewing = TENANTS.filter((t) => t.status === "renewing" || t.status === "vacating").length;
    const monthlyRent = TENANTS.reduce((s, t) => s + t.monthlyRent, 0);
    return { total, onTime, arrears, late, renewing, monthlyRent };
  }, []);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Tenants in directory" value={kpis.total.toLocaleString()} sub="residential units"  accent="#2563EB" />
        <Kpi label="Paying on time"       value={kpis.onTime.toLocaleString()}  sub={`${Math.round((kpis.onTime / kpis.total) * 100)}% of roster`} accent="#10B981" />
        <Kpi label="Late payments"        value={kpis.late.toLocaleString()}    sub="this cycle"        accent="#F59E0B" />
        <Kpi label="In arrears"           value={kpis.arrears.toLocaleString()} sub="RTA watch"         accent="#DC2626" />
        <Kpi label="Renewal / vacate"     value={kpis.renewing.toLocaleString()} sub="next 90 days"    accent="#7C3AED" />
        <Kpi label="Monthly rent roll"    value={`$${(kpis.monthlyRent / 1_000_000).toFixed(2)}M`}    sub="from this sample" accent="#0891B2" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <StatusPills value={statusFilter} onChange={setStatusFilter} />
        <PaymentPills value={paymentFilter} onChange={setPaymentFilter} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search name, unit, building…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length.toLocaleString()}</span> of {TENANTS.length.toLocaleString()}
          </span>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
      >
        <div className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr_0.8fr_0.4fr] gap-3 px-5 py-3 border-b border-slate-100"
          style={{ background: "rgba(15,23,42,0.02)" }}>
          <HeaderCell>Tenant</HeaderCell>
          <HeaderCell>Unit · Building</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Payment</HeaderCell>
          <HeaderCell>Rent / Lease</HeaderCell>
          <HeaderCell>Tenure</HeaderCell>
          <HeaderCell></HeaderCell>
        </div>
        <div className="divide-y divide-slate-50">
          {paged.map((t) => {
            const status = STATUS_META[t.status];
            const payment = PAYMENT_META[t.paymentStatus];
            return (
              <Link
                key={t.id}
                href={`/building-detail?id=${t.buildingId}`}
                className="grid grid-cols-[1.6fr_1fr_1fr_0.8fr_1fr_0.8fr_0.4fr] gap-3 px-5 py-3 items-center hover:bg-[#F8FAFC] transition-colors"
              >
                <div>
                  <div className="text-[12.5px] font-bold text-[#0F172A]">{t.name}</div>
                  <div className="text-[10px] text-[#94A3B8] flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {t.phone}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-[#0F172A]">Unit {t.unit}</div>
                  <div className="text-[10px] text-[#64748B] truncate">{t.buildingName}</div>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: status.bg, color: status.color, border: `1px solid ${status.color}30` }}>
                    {status.label}
                  </span>
                </div>
                <div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                    style={{ background: payment.bg, color: payment.color, border: `1px solid ${payment.color}30` }}>
                    {t.paymentStatus === "arrears" && <AlertTriangle className="w-2.5 h-2.5" />}
                    {t.paymentStatus === "on_time" && <CheckCircle2 className="w-2.5 h-2.5" />}
                    {payment.label}
                  </span>
                </div>
                <div>
                  <div className="text-[12px] font-bold tabular-nums text-[#0F172A]">${t.monthlyRent.toLocaleString()}</div>
                  <div className="text-[9.5px] text-[#94A3B8] font-mono">expires {t.leaseEndDate}</div>
                </div>
                <div>
                  <div className="text-[11.5px] font-bold text-[#0F172A]">{t.tenure}</div>
                  <div className="text-[9.5px] text-[#94A3B8] font-mono">since {t.moveInDate.slice(0,7)}</div>
                </div>
                <div className="text-right">
                  <ArrowRight className="w-3 h-3 text-slate-300 inline-block" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-[#64748B]">
            Showing <span className="font-bold text-[#0F172A] tabular-nums">{page * PAGE_SIZE + 1}–{Math.min(filtered.length, (page + 1) * PAGE_SIZE)}</span> of {filtered.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-2.5 py-1 rounded-md font-bold disabled:opacity-40"
              style={{ background: "rgba(15,23,42,0.04)", color: "#475569" }}
            >
              ← Prev
            </button>
            <span className="text-[#64748B] font-mono">{page + 1} / {totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-2.5 py-1 rounded-md font-bold disabled:opacity-40"
              style={{ background: "rgba(15,23,42,0.04)", color: "#475569" }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({ kpis }: { kpis: { total: number; arrears: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
        >
          <Users className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #2563EB, #7C3AED)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Tenant Directory · {kpis.total.toLocaleString()} active tenancies
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Everyone renting from Royal York
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        {kpis.total.toLocaleString()} current tenants across the portfolio. Filter by lease status or payment standing.
        Click any row to open the building detail. Export for compliance or reporting.
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

function StatusPills({ value, onChange }: { value: TenancyStatus | "all"; onChange: (v: TenancyStatus | "all") => void }) {
  const tabs: { key: TenancyStatus | "all"; label: string; color: string }[] = [
    { key: "all",            label: "All statuses",  color: "#0F172A" },
    { key: "current",        label: "Current",       color: "#10B981" },
    { key: "new",            label: "New",           color: "#2563EB" },
    { key: "renewing",       label: "Renewing",      color: "#0891B2" },
    { key: "vacating",       label: "Vacating",      color: "#F59E0B" },
    { key: "month_to_month", label: "M2M",           color: "#7C3AED" },
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      <FilterIcon className="w-3 h-3 text-slate-400 ml-1.5 mr-0.5" />
      {tabs.map((t) => (
        <Pill key={t.key} active={t.key === value} onClick={() => onChange(t.key)} color={t.color} label={t.label} layoutId="ten-status" />
      ))}
    </div>
  );
}

function PaymentPills({ value, onChange }: { value: PaymentStatus | "all"; onChange: (v: PaymentStatus | "all") => void }) {
  const tabs: { key: PaymentStatus | "all"; label: string; color: string }[] = [
    { key: "all",       label: "Any payment",  color: "#0F172A" },
    { key: "on_time",   label: "On time",      color: "#10B981" },
    { key: "late",      label: "Late",         color: "#F59E0B" },
    { key: "arrears",   label: "Arrears",      color: "#DC2626" },
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {tabs.map((t) => (
        <Pill key={t.key} active={t.key === value} onClick={() => onChange(t.key)} color={t.color} label={t.label} layoutId="ten-payment" />
      ))}
    </div>
  );
}

function Pill({ active, onClick, color, label, layoutId }: { active: boolean; onClick: () => void; color: string; label: string; layoutId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative px-2.5 py-1.5 text-[10.5px] font-semibold rounded-lg"
      style={{ color: active ? "#FFFFFF" : "#475569" }}
    >
      {active && (
        <motion.span
          layoutId={layoutId}
          className="absolute inset-0 rounded-lg"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)`, boxShadow: `0 2px 8px ${color}40` }}
          transition={{ type: "spring", stiffness: 360, damping: 30 }}
        />
      )}
      <span className="relative">{label}</span>
    </button>
  );
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">{children}</div>
  );
}

void Mail; void DollarSign; void Home;
