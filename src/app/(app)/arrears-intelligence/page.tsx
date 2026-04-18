"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  DollarSign,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Scale,
  ArrowRight,
  Search,
  Shield,
} from "lucide-react";
import { ARREARS, ARREARS_STAGE_META, type ArrearsStage } from "@/lib/buildings/arrears";

export default function ArrearsIntelligencePage() {
  const [stage, setStage] = useState<ArrearsStage | "all" | "high_risk">("all");
  const [search, setSearch] = useState("");

  const kpis = useMemo(() => {
    const total = ARREARS.length;
    const highRisk = ARREARS.filter((a) => a.riskScore >= 70).length;
    const totalBalance = ARREARS.reduce((s, a) => s + a.balance, 0);
    const overdue30 = ARREARS.filter((a) => a.daysOverdue > 30).length;
    const ltb = ARREARS.filter((a) => a.stage === "ltb_filed").length;
    const avgDaysOverdue = Math.round(ARREARS.reduce((s, a) => s + a.daysOverdue, 0) / total);
    return { total, highRisk, totalBalance, overdue30, ltb, avgDaysOverdue };
  }, []);

  const filtered = useMemo(() => {
    return ARREARS.filter((a) => {
      if (stage === "high_risk" && a.riskScore < 70) return false;
      if (stage !== "all" && stage !== "high_risk" && a.stage !== stage) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.tenant.toLowerCase().includes(q) && !a.buildingName.toLowerCase().includes(q) && !a.unit.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [stage, search]);

  return (
    <div className="p-8 space-y-6">
      <Hero kpis={kpis} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Kpi label="Tenants flagged"     value={kpis.total}                                 sub="active cases"          accent="#DC2626" live />
        <Kpi label="High risk"           value={kpis.highRisk}                              sub=">70 risk score"         accent="#EF4444" />
        <Kpi label="Total balance"       value={`$${(kpis.totalBalance / 1000).toFixed(0)}K`} sub="across portfolio"      accent="#F59E0B" />
        <Kpi label="Overdue > 30 days"   value={kpis.overdue30}                             sub="N4 territory"           accent="#D97706" />
        <Kpi label="LTB filed"           value={kpis.ltb}                                   sub="formal proceedings"     accent="#991B1B" />
        <Kpi label="Avg days overdue"    value={`${kpis.avgDaysOverdue}d`}                  sub="across flagged"         accent="#7C3AED" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <StageFilters value={stage} onChange={setStage} />
        <div
          className="flex items-center gap-2 flex-1 min-w-[240px] px-3 py-2 rounded-xl"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
        >
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tenant, unit, building…"
            className="flex-1 bg-transparent outline-none text-[12px] text-[#0F172A] placeholder-slate-400"
          />
          <span className="text-[10.5px] text-[#94A3B8] shrink-0">
            <span className="font-bold text-[#0F172A] tabular-nums">{filtered.length}</span> shown
          </span>
        </div>
      </div>

      <RtaCompliance />

      <TenantList tenants={filtered} />
    </div>
  );
}

function Hero({ kpis }: { kpis: { highRisk: number; totalBalance: number } }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md"
          style={{ background: "linear-gradient(135deg, #DC2626, #F59E0B)", boxShadow: "0 2px 6px rgba(220,38,38,0.3)" }}
        >
          <DollarSign className="w-2.5 h-2.5 text-white" />
        </span>
        <span
          className="text-[10px] font-bold tracking-[0.22em] uppercase"
          style={{
            background: "linear-gradient(90deg, #DC2626, #F59E0B)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Arrears Sentinel · RTA-compliant collections
        </span>
      </div>
      <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
        Every tenant at risk, every N4 drafted, every escalation path mapped
      </h1>
      <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">
        {kpis.highRisk} tenants at high risk · ${(kpis.totalBalance / 1000).toFixed(0)}K total balance across the portfolio.
        Every escalation follows the Ontario RTA timeline — soft reminder → N4 notice → LTB filing — with MAIA drafts waiting on your approval.
      </p>
    </div>
  );
}

function Kpi({ label, value, sub, accent, live }: { label: string; value: string | number; sub: string; accent: string; live?: boolean }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: `linear-gradient(135deg, ${accent}06 0%, #FFFFFF 60%)`, border: `1px solid ${accent}22` }}
    >
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

function StageFilters({ value, onChange }: { value: ArrearsStage | "all" | "high_risk"; onChange: (s: ArrearsStage | "all" | "high_risk") => void }) {
  const tabs: { key: ArrearsStage | "all" | "high_risk"; label: string; color: string }[] = [
    { key: "all",            label: "All",              color: "#0F172A" },
    { key: "high_risk",      label: "High risk",        color: "#EF4444" },
    { key: "reminder_sent",  label: "Reminder sent",    color: "#F59E0B" },
    { key: "n4_drafted",     label: "N4 drafted",       color: "#D97706" },
    { key: "n4_served",      label: "N4 served",        color: "#DC2626" },
    { key: "ltb_filed",      label: "LTB filed",        color: "#991B1B" },
    { key: "payment_plan",   label: "Payment plan",     color: "#7C3AED" },
  ];
  return (
    <div
      className="inline-flex items-center gap-1 p-1 rounded-xl flex-wrap"
      style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.06)" }}
    >
      {tabs.map((t) => {
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
                layoutId="arr-filter"
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

function RtaCompliance() {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.05), rgba(124,58,237,0.04))", border: "1px solid rgba(37,99,235,0.22)" }}
    >
      <div className="flex items-center gap-1.5 mb-3">
        <Shield className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-blue-700">
          RTA-compliant escalation path · Ontario
        </span>
        <Link href="/rules" className="ml-auto text-[10.5px] font-bold text-[#2563EB] hover:underline">
          Full rule pack →
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <Step num={1} title="Day 1" body="Rent due. No action yet." accent="#64748B" />
        <Step num={2} title="Day 2–3" body="Soft reminder (email + app notification)." accent="#F59E0B" />
        <Step num={3} title="Day 4–14" body="N4 notice drafted by MAIA for your approval. RTA §59 compliant." accent="#D97706" />
        <Step num={4} title="Day 14+" body="14-day payment window closes. LTB application ready if needed." accent="#DC2626" />
        <Step num={5} title="Ongoing" body="Payment plans, LTB hearings, or case closed." accent="#7C3AED" />
      </div>
    </div>
  );
}

function Step({ num, title, body, accent }: { num: number; title: string; body: string; accent: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#FFFFFF", border: `1px solid ${accent}26` }}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: accent }}>{num}</span>
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase" style={{ color: accent }}>{title}</span>
      </div>
      <div className="text-[11px] text-[#475569] leading-snug">{body}</div>
    </div>
  );
}

function TenantList({ tenants }: { tenants: typeof ARREARS }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}
    >
      <div className="px-5 py-3 border-b border-slate-100 flex items-center">
        <span className="text-[12px] font-bold text-[#0F172A]">Tenants flagged · sorted by risk</span>
        <span className="ml-auto text-[10px] text-[#94A3B8]">{tenants.length} total</span>
      </div>
      <div className="divide-y divide-slate-50">
        {tenants.map((a) => {
          const stageMeta = ARREARS_STAGE_META[a.stage];
          const riskColor = a.riskScore >= 70 ? "#EF4444" : a.riskScore >= 45 ? "#F59E0B" : "#64748B";
          return (
            <div key={a.id} className="px-5 py-3 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[14px] font-bold tabular-nums"
                  style={{ background: `${riskColor}14`, color: riskColor, border: `1px solid ${riskColor}35` }}
                  title={`${a.riskScore}% delinquency risk · 30-day horizon`}
                >
                  {a.riskScore}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <Link href={`/building-detail?id=${a.buildingId}`} className="text-[12.5px] font-bold text-[#0F172A] leading-tight hover:underline">
                      {a.tenant}
                    </Link>
                    <span className="text-[10px] text-[#64748B]">Unit {a.unit}</span>
                    <span className="text-[10px] text-[#94A3B8]">·</span>
                    <span className="text-[10.5px] text-[#475569] truncate max-w-xs">{a.buildingName}</span>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.1em] uppercase"
                      style={{ background: stageMeta.bg, color: stageMeta.color, border: `1px solid ${stageMeta.color}30` }}>
                      {stageMeta.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#475569] mb-1.5">
                    Tenure {a.tenure} · ${a.rent}/mo rent · {a.daysOverdue === 0 ? "current" : `${a.daysOverdue} days overdue`}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
                    <PaymentHistoryBar history={a.paymentHistory} />
                    <span className="text-[#64748B]">
                      <span className="font-bold text-[#0F172A]">Next:</span> {a.nextAction}
                    </span>
                    <span className="text-[#94A3B8] font-mono">{a.nextActionDue}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[14px] font-bold tabular-nums text-[#DC2626]">${a.balance.toLocaleString()}</div>
                  <div className="text-[10px] text-[#64748B]">owed</div>
                  <div className="mt-1 flex gap-1 justify-end">
                    {a.stage === "n4_drafted" && (
                      <button className="px-2 py-1 rounded-md text-[10px] font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                        Review N4
                      </button>
                    )}
                    {(a.stage === "reminder_sent" || a.stage === "current") && (
                      <button className="px-2 py-1 rounded-md text-[10px] font-bold text-[#475569]"
                        style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.1)" }}>
                        Contact
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentHistoryBar({ history }: { history: ("paid_on_time" | "paid_late" | "missed")[] }) {
  const COLOR = {
    paid_on_time: "#10B981",
    paid_late:    "#F59E0B",
    missed:       "#EF4444",
  };
  return (
    <div className="inline-flex items-center gap-0.5" title="Last 12 months payment history">
      {history.map((h, i) => (
        <span key={i} className="w-1.5 h-2.5 rounded-sm" style={{ background: COLOR[h] }} />
      ))}
    </div>
  );
}

void AlertOctagon; void AlertTriangle; void Clock; void FileText; void Scale; void ArrowRight; void CheckCircle2;
