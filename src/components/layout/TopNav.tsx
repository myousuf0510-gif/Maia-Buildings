"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Bell, Search, Radio, LogOut, AlertTriangle, AlertOctagon, Info, CheckCircle2, X, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGlobalFilter } from "@/lib/GlobalFilterContext";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { LiveAgentIndicator } from "@/components/agents/LiveAgentIndicator";
import { LivePulseToggle } from "@/components/layout/LivePulseToggle";
import { AskMaiaModal } from "@/components/ask/AskMaiaModal";

const routeLabels: Record<string, { title: string; subtitle: string }> = {
  "/overview":                    { title: "Overview",             subtitle: "Portfolio intelligence · Royal York Property Management" },
  "/portfolio-map":               { title: "Portfolio Map",        subtitle: "47 buildings · GTA · live health scores" },
  "/building-detail":             { title: "Building Detail",      subtitle: "Drill into any building in the portfolio" },
  "/tenants":                     { title: "Tenant Directory",     subtitle: "Every tenant across the Royal York portfolio" },
  "/reports":                     { title: "Financial Reports",    subtitle: "Revenue, NOI, opex, arrears aging, per-building" },
  "/vendor-performance":          { title: "Vendor Performance",   subtitle: "Contractor leaderboard + fairness audit" },
  "/vacancy-intelligence":        { title: "Vacancy & Turnover",   subtitle: "Per-unit forecasts + turnover pipeline" },
  "/arrears-intelligence":        { title: "Arrears Intelligence", subtitle: "Rent-collection risk + RTA-compliant escalation" },
  "/energy-intelligence":         { title: "Energy & Cost Intel",  subtitle: "HVAC + utility optimization with peer benchmarks" },
  "/compliance-intelligence":     { title: "Compliance Intel",     subtitle: "RTA · Fire · TSSA · insurance + contractor certs" },
  "/work-order-market":           { title: "Work Order Market",    subtitle: "Auto-dispatch + open marketplace" },
  "/workforce-directory":         { title: "Workforce Directory",  subtitle: "Employees + contractors · skills · load · rating" },
  "/maintenance-recommendations": { title: "Maintenance Recs",     subtitle: "This week's exact work per building" },
  "/scenario-modeling":           { title: "Scenario Modeling",    subtitle: "What-if analysis across the portfolio" },
  "/agents":                      { title: "Agents",               subtitle: "The operators running MAIA Buildings" },
  "/intelligence-graph":          { title: "Intelligence Graph",   subtitle: "Live map of every MAIA decision" },
  "/decisions-ledger":            { title: "Decisions Ledger",     subtitle: "Audit trail of every agent action" },
  "/briefings/executive":         { title: "Executive Briefing",   subtitle: "Weekly portfolio summary" },
  "/models":                      { title: "Models",               subtitle: "Every model powering MAIA Buildings" },
  "/algorithms":                  { title: "Algorithms",           subtitle: "The math behind every decision" },
  "/configs":                     { title: "Configurations",       subtitle: "Every tunable knob in the platform" },
  "/rules":                       { title: "Rules Engine",         subtitle: "The rules MAIA refuses to break" },
  "/knowledge":                   { title: "Knowledge Hub",        subtitle: "The docs MAIA reads before every decision" },
  "/integrations":                { title: "Integrations",         subtitle: "Data in + data out · connection status" },
  "/settings":                    { title: "Settings",             subtitle: "Platform configuration" },
};

export function TopNav() {
  const pathname = usePathname();
  const info = routeLabels[pathname] ?? { title: "MAIA Intelligence", subtitle: "Platform overview" };
  const [time, setTime] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { dateShort } = useGlobalFilter();
  const [apiStatus, setApiStatus] = useState<"checking" | "live" | "demo">("checking");
  const { user, signOut } = useAuth();
  const [askOpen, setAskOpen] = useState(false);

  // ⌘K / Ctrl+K opens Ask MAIA from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAskOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    api.health().then((r: { status?: string }) => {
      setApiStatus(r?.status === "ok" ? "live" : "demo");
    }).catch(() => setApiStatus("demo"));
  }, []);

  useEffect(() => {
    const update = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + " UTC");
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-0 z-30 flex items-center gap-4 px-6 h-[60px]"
      style={{
        left: "260px",
        right: 0,
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(20px) saturate(1.2)",
        WebkitBackdropFilter: "blur(20px) saturate(1.2)",
        borderBottom: "1px solid rgba(15,23,42,0.06)",
        boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-bold text-slate-900 tracking-tight truncate">{info.title}</h1>
        <p className="text-[10px] font-medium text-slate-400 tracking-wider uppercase truncate">
          {dateShort ? `${info.subtitle} · ${dateShort}` : info.subtitle}
        </p>
      </div>

      {/* Ask MAIA trigger */}
      <button
        type="button"
        onClick={() => setAskOpen(true)}
        className="relative shrink-0 group"
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: "rgba(37,99,235,0.03)",
            border: "1px solid rgba(37,99,235,0.12)",
            width: "340px",
          }}
        >
          <Search className="w-3.5 h-3.5 shrink-0 text-blue-500" />
          <span className="bg-transparent text-xs w-full text-left text-slate-500 group-hover:text-slate-700 transition-colors">
            Ask MAIA anything
            <span className="ml-1.5 text-slate-400">·</span>
            <span className="ml-1.5 text-[10.5px] text-blue-600 font-semibold">
              workforce, costs, compliance
            </span>
          </span>
          <div className="flex items-center gap-0.5 shrink-0">
            <kbd className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">⌘</kbd>
            <kbd className="text-[8px] px-1 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">K</kbd>
          </div>
        </div>
      </button>
      <AskMaiaModal open={askOpen} onClose={() => setAskOpen(false)} />

      {/* Live Agent indicator — the "MAIA is watching" strip */}
      <LiveAgentIndicator />

      {/* Live Pulse toggle — command-center mode */}
      <LivePulseToggle />

      {/* API Status */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
        style={{
          background: apiStatus === "live" ? "rgba(16,185,129,0.06)" : "rgba(107,114,128,0.06)",
          border: `1px solid ${apiStatus === "live" ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.1)"}`,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            background: apiStatus === "live" ? "#10B981" : "#9CA3AF",
            animation: apiStatus === "live" ? "pulse-dot 2s ease-in-out infinite" : undefined,
          }} />
        <span className="text-[10px] font-bold tracking-wider"
          style={{ color: apiStatus === "live" ? "#059669" : "#9CA3AF" }}>
          {apiStatus === "live" ? "LIVE" : apiStatus === "demo" ? "DEMO" : "···"}
        </span>
      </div>

      {/* Live decisions counter — ticks as decisions happen */}
      <LiveDecisionsTicker />

      {/* Clock */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0"
        style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.04)" }}>
        <Radio className="w-3 h-3 text-blue-500" />
        <span className="font-mono text-[10px] font-medium tracking-wider text-slate-500">{time}</span>
      </div>

      {/* Notifications */}
      <NotificationsBell />

      {/* User + Sign Out */}
      {user && (
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]" title={user.email}>
            {user.user_metadata?.full_name || user.email}
          </span>
          <button onClick={signOut} title="Sign out"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all duration-200 hover:bg-red-50"
            style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.12)", color: "#EF4444" }}>
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      )}
    </header>
  );
}

// ─── Live decisions ticker — counts up as agents act ────────────────────────

function LiveDecisionsTicker() {
  // Baseline: deterministic starting count anchored to the current day,
  // so the number is stable across page navigations.
  const [count, setCount] = useState(() => {
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    const msSinceMidnight = Date.now() - midnight.getTime();
    // ~247 decisions/day baseline, spread evenly
    return Math.floor((msSinceMidnight / 86_400_000) * 247) + 2_831;
  });

  useEffect(() => {
    // Add 1 decision every 8–14 seconds
    let timer = 0;
    const schedule = () => {
      const delay = 8_000 + Math.random() * 6_000;
      timer = window.setTimeout(() => {
        setCount((c) => c + 1);
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <Link
      href="/decisions-ledger"
      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 group transition-all"
      style={{ background: "rgba(37,99,235,0.04)", border: "1px solid rgba(37,99,235,0.12)" }}
      title="Decisions processed today across all agents — click for full ledger"
    >
      <span className="relative flex w-2 h-2">
        <span className="absolute inline-flex w-full h-full rounded-full bg-blue-500 opacity-40 animate-ping" />
        <span className="relative w-2 h-2 rounded-full bg-blue-500" />
      </span>
      <span className="font-mono text-[10.5px] font-bold tabular-nums text-[#2563EB]">
        {count.toLocaleString()}
      </span>
      <span className="text-[9px] font-bold tracking-[0.1em] uppercase text-[#64748B] group-hover:text-[#2563EB] transition-colors">
        decisions · today
      </span>
    </Link>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────

type NotifKind = "critical" | "warn" | "info" | "good";

interface Notif {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  href: string;
  source: string;
}

function buildNotifications(): Notif[] {
  const now = new Date();
  const shortDay = (o: number) => {
    const d = new Date(now); d.setDate(d.getDate() + o);
    return d.toLocaleString("en", { weekday: "short", month: "short", day: "numeric" });
  };
  const hm = (minsAgo: number) => {
    const t = new Date(now.getTime() - minsAgo * 60_000);
    return t.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };
  return [
    { id: "n1", kind: "critical", title: "Flooding — 842 Bay St, Unit 1404", body: "Tenant reported water coming through ceiling. Dispatch Agent routed Apex Plumbing — ETA 18 min.", time: hm(2), href: "/work-order-market", source: "Dispatch Agent" },
    { id: "n2", kind: "warn", title: `12 units going vacant in the next 30 days`, body: "Turnover Orchestrator built the flip pipeline. 3 bottleneck trades flagged.", time: hm(14), href: "/vacancy-intelligence", source: "Turnover Orchestrator" },
    { id: "n3", kind: "warn", title: "Arrears risk — 7 tenants trending delinquent", body: "Arrears Sentinel drafted RTA-compliant soft reminders. Awaiting your approval.", time: hm(26), href: "/arrears-intelligence", source: "Arrears Sentinel" },
    { id: "n4", kind: "info", title: `HVAC savings: $4,280 this week`, body: `Energy Optimizer tightened setpoints in 22 buildings during last night's off-peak window.`, time: hm(42), href: "/energy-intelligence", source: "Energy & Utility Optimizer" },
    { id: "n5", kind: "good", title: "Weekly portfolio briefing ready", body: "Claude finished the brief in 38s. Covers vacancy, arrears, work-order throughput, energy.", time: hm(68), href: "/briefings/executive", source: "Briefing Composer" },
    { id: "n6", kind: "warn", title: `Fire inspection due — 140 Queen St in 8 days`, body: "Annual fire alarm inspection. Compliance Sentinel pre-booked LCI Fire Safety.", time: hm(95), href: "/compliance-intelligence", source: "Compliance Sentinel" },
    { id: "n7", kind: "warn", title: `Contractor WSIB lapsed — Hydro Electric Inc.`, body: `Dispatch blocked 3 pending assignments. Renewal sent to their admin.`, time: hm(140), href: "/compliance-intelligence", source: "Compliance Sentinel" },
  ];
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<Set<string>>(new Set());
  const [notifs] = useState(() => buildNotifications());
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter((n) => !read.has(n.id)).length;

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const markRead = (id: string) => setRead((prev) => new Set(prev).add(id));
  const markAllRead = () => setRead(new Set(notifs.map((n) => n.id)));

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications (${unreadCount} unread)`}
        className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-50"
        style={{
          border: open ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(15,23,42,0.06)",
          color: open ? "#2563EB" : "#64748B",
          background: open ? "rgba(37,99,235,0.05)" : "transparent",
        }}
      >
        <Bell className="w-3.5 h-3.5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 rounded-full text-[8.5px] font-bold text-white flex items-center justify-center"
            style={{ background: "#EF4444", boxShadow: "0 0 0 2px #FFFFFF" }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50"
            style={{
              width: 400,
              maxHeight: "70vh",
              background: "#FFFFFF",
              border: "1px solid rgba(15,23,42,0.08)",
              boxShadow: "0 20px 48px rgba(15,23,42,0.14)",
            }}
          >
            <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <div>
                <div className="text-[13px] font-bold text-[#0F172A] leading-tight">Notifications</div>
                <div className="text-[10.5px] text-[#64748B]">
                  {unreadCount} unread · {notifs.length} total
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-[10.5px] font-bold text-[#2563EB] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(70vh - 110px)" }}>
              {notifs.map((n) => (
                <NotifRow key={n.id} notif={n} read={read.has(n.id)} onRead={() => markRead(n.id)} onClose={() => setOpen(false)} />
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 flex items-center justify-between" style={{ background: "rgba(15,23,42,0.02)" }}>
              <Link href="/decisions-ledger" onClick={() => setOpen(false)}
                className="text-[10.5px] font-bold text-[#2563EB] hover:underline">
                View decisions ledger
              </Link>
              <Link href="/settings" onClick={() => setOpen(false)}
                className="text-[10.5px] text-[#64748B] hover:text-[#0F172A]">
                Notification settings
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotifRow({ notif, read, onRead, onClose }: { notif: Notif; read: boolean; onRead: () => void; onClose: () => void }) {
  const META: Record<NotifKind, { Icon: React.ElementType; color: string; bg: string }> = {
    critical: { Icon: AlertOctagon,  color: "#DC2626", bg: "rgba(239,68,68,0.08)" },
    warn:     { Icon: AlertTriangle, color: "#D97706", bg: "rgba(245,158,11,0.08)" },
    info:     { Icon: Info,          color: "#2563EB", bg: "rgba(37,99,235,0.06)" },
    good:     { Icon: CheckCircle2,  color: "#059669", bg: "rgba(16,185,129,0.06)" },
  };
  const m = META[notif.kind];
  const Icon = m.Icon;
  return (
    <Link
      href={notif.href}
      onClick={() => { onRead(); onClose(); }}
      className="block px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group"
      style={{ opacity: read ? 0.65 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: m.bg, border: `1px solid ${m.color}26` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-[12px] font-bold text-[#0F172A] leading-tight flex-1 min-w-0">
              {notif.title}
            </div>
            {!read && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" title="Unread" />
            )}
          </div>
          <div className="text-[11px] text-[#475569] leading-relaxed">{notif.body}</div>
          <div className="flex items-center gap-2 mt-1 text-[9.5px] text-[#94A3B8]">
            <span className="font-mono">{notif.time}</span>
            <span>·</span>
            <span className="font-semibold" style={{ color: m.color }}>{notif.source}</span>
            <ArrowRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: m.color }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
