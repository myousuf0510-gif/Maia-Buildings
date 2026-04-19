"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  LayoutDashboard,
  Map,
  Building2,
  TrendingDown,
  Wrench,
  Users,
  DollarSign,
  Zap,
  ShieldAlert,
  Hammer,
  Layers,
  Brain,
  Cpu,
  Code,
  FlaskConical,
  Settings,
  ChevronRight,
  Bot,
  Network,
  FileText,
  Newspaper,
  BookOpen,
  Plug,
  UserSquare,
  BarChart3,
  Award,
} from "lucide-react";

const navItems = [
  {
    section: "CORE",
    items: [
      { href: "/overview", icon: LayoutDashboard, label: "Overview", badge: "LIVE" },
    ],
  },
  {
    section: "INTELLIGENCE",
    subsections: [
      {
        title: "PORTFOLIO",
        items: [
          { href: "/portfolio-map", icon: Map, label: "Portfolio Map", badge: "LIVE" },
          { href: "/building-detail", icon: Building2, label: "Building Detail" },
          { href: "/tenants", icon: UserSquare, label: "Tenants" },
          { href: "/reports", icon: BarChart3, label: "Financial Reports" },
        ],
      },
      {
        title: "INVESTIGATE",
        items: [
          { href: "/vacancy-intelligence", icon: TrendingDown, label: "Vacancy Intel" },
          { href: "/arrears-intelligence", icon: DollarSign, label: "Arrears Intel" },
          { href: "/energy-intelligence", icon: Zap, label: "Energy & Cost Intel" },
          { href: "/compliance-intelligence", icon: ShieldAlert, label: "Compliance Intel" },
        ],
      },
      {
        title: "DISPATCH",
        items: [
          { href: "/work-order-market", icon: Wrench, label: "Work Order Market", badge: "LIVE" },
          { href: "/workforce-directory", icon: Users, label: "Workforce Directory" },
          { href: "/vendor-performance", icon: Award, label: "Vendor Performance" },
          { href: "/maintenance-recommendations", icon: Hammer, label: "Maintenance Recs" },
        ],
      },
      {
        title: "MODEL",
        items: [
          { href: "/scenario-modeling", icon: Layers, label: "Scenario Modeling" },
        ],
      },
    ],
  },
  {
    section: "PLATFORM",
    subsections: [
      {
        title: "INTELLIGENCE LAB",
        items: [
          { href: "/agents", icon: Bot, label: "Agents" },
          { href: "/intelligence-graph", icon: Network, label: "Intelligence Graph", badge: "LIVE" },
          { href: "/decisions-ledger", icon: FileText, label: "Decisions Ledger" },
          { href: "/briefings/executive", icon: Newspaper, label: "Executive Briefing" },
          { href: "/knowledge", icon: BookOpen, label: "Knowledge Hub" },
          { href: "/integrations", icon: Plug, label: "Integrations" },
          { href: "/models", icon: Brain, label: "Models" },
          { href: "/algorithms", icon: Cpu, label: "Algorithms" },
          { href: "/configs", icon: Code, label: "Configurations" },
          { href: "/rules", icon: FlaskConical, label: "Rules Engine" },
        ],
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      { href: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name || "Moe Yousuf";
  const displayEmail = user?.email || "moe@maiaintelligence.io";
  const avatarInitial = displayName[0]?.toUpperCase() ?? "M";

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] z-40 flex flex-col"
      style={{
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(24px) saturate(1.3)",
        WebkitBackdropFilter: "blur(24px) saturate(1.3)",
        borderRight: "1px solid rgba(15,23,42,0.06)",
        boxShadow: "4px 0 32px rgba(0,0,0,0.03)",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center pt-6 pb-4 px-5">
        <div
          className="w-full rounded-2xl px-4 py-4 flex justify-center"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.82) 100%)",
            border: "1px solid rgba(15,23,42,0.06)",
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
          }}
        >
          <Image
            src="/maia-logo.jpg"
            alt="MAIA Intelligence"
            width={180}
            height={54}
            priority
            className="h-auto w-auto max-w-[170px]"
          />
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md"
          style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(37,99,235,0.15)" }}>
          <span className="w-1 h-1 rounded-full bg-blue-600" />
          <span className="text-[9px] font-bold tracking-[0.18em] uppercase"
            style={{ background: "linear-gradient(90deg, #2563EB, #7C3AED)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            For Buildings
          </span>
        </div>
      </div>

      {/* System Status */}
      <div className="mx-4 mb-3 px-3 py-2 rounded-xl flex items-center gap-2"
        style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.1)" }}>
        <span className="relative flex items-center justify-center w-2 h-2">
          <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-40"
            style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[9px] font-semibold text-emerald-600 tracking-[0.1em] uppercase">
          Intelligence Active
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,0,0,0.1) transparent" }}>
        {navItems.map((section) => (
          <div key={section.section} className="mb-5">
            <div className="px-2.5 mb-2 text-[9px] font-bold uppercase tracking-[0.14em]"
              style={{ color: "#94A3B8" }}>
              {section.section}
            </div>

            {section.items ? (
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const { href, icon: Icon, label } = item;
                  const badge = "badge" in item ? item.badge : undefined;
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <Link key={href} href={href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 group"
                      style={active ? {
                        background: "rgba(37,99,235,0.06)",
                        color: "#1E40AF",
                        borderLeft: "2.5px solid #2563EB",
                        paddingLeft: "10px",
                      } : {
                        color: "#475569",
                      }}
                    >
                      <Icon className="w-[15px] h-[15px] shrink-0 transition-colors"
                        style={{ color: active ? "#2563EB" : "#94A3B8" }} />
                      <span className="flex-1 truncate">{label}</span>
                      {badge === "LIVE" && (
                        <span className="badge-green text-[8px] py-0">LIVE</span>
                      )}
                      {badge && badge !== "LIVE" && (
                        <span className="badge-red text-[8px] w-4 h-4 rounded-full flex items-center justify-center p-0">{badge}</span>
                      )}
                      {active && <ChevronRight className="w-3 h-3 text-blue-500 opacity-60" />}
                    </Link>
                  );
                })}
              </div>
            ) : section.subsections ? (
              <div>
                {section.subsections.map((sub) => (
                  <div key={sub.title} className="mb-3">
                    <div className="px-2.5 mb-1.5 text-[8px] font-semibold uppercase tracking-[0.12em]"
                      style={{ color: "#CBD5E1" }}>
                      {sub.title}
                    </div>
                    <div className="space-y-0.5">
                      {sub.items.map((item) => {
                        const { href, icon: Icon, label } = item;
                        const badge = "badge" in item ? item.badge : undefined;
                        const active = pathname === href || pathname.startsWith(href + "/");
                        return (
                          <Link key={href} href={href}
                            className="flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[12.5px] font-medium transition-all duration-150 group"
                            style={active ? {
                              background: "rgba(37,99,235,0.06)",
                              color: "#1E40AF",
                              borderLeft: "2.5px solid #2563EB",
                              paddingLeft: "10px",
                            } : {
                              color: "#64748B",
                            }}
                          >
                            <Icon className="w-[14px] h-[14px] shrink-0"
                              style={{ color: active ? "#2563EB" : "#94A3B8" }} />
                            <span className="flex-1 truncate">{label}</span>
                            {badge && (
                              <span className="badge-red text-[8px] w-4 h-4 rounded-full flex items-center justify-center p-0">{badge}</span>
                            )}
                            {active && <ChevronRight className="w-3 h-3 text-blue-500 opacity-60" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </nav>

      {/* User — clickable, routes to profile/settings */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(15,23,42,0.06)" }}>
        <Link
          href="/settings"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:shadow-sm"
          style={{
            background: pathname === "/settings" ? "rgba(37,99,235,0.08)" : "rgba(15,23,42,0.02)",
            border: pathname === "/settings" ? "1px solid rgba(37,99,235,0.3)" : "1px solid rgba(15,23,42,0.04)",
          }}
        >
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)" }}>
            {avatarInitial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-900 truncate">{displayName}</div>
            <div className="text-[9px] text-slate-500 truncate">{displayEmail}</div>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Online" />
        </Link>
      </div>

      <style>{`
        nav::-webkit-scrollbar { width: 3px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 99px; }
        nav::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.15); }
      `}</style>
    </aside>
  );
}
