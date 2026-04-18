"use client";

import {
  Lock, Shield, Cpu, Activity, Layers, AlertTriangle,
  Zap, Map, Database, FileText, Settings, Globe,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Cpu, Activity, Layers, AlertTriangle, Zap, Map, Database, FileText, Settings, Globe, Shield, Lock,
};

interface ComingSoonProps {
  title: string;
  subtitle?: string;
  iconName?: string;
  phase?: string;
  eta?: string;
  accentColor?: string;
  features?: string[];
}

export function ComingSoon({
  title,
  subtitle = "This intelligence module is currently being initialized.",
  iconName = "Cpu",
  phase = "PHASE 2",
  eta,
  accentColor = "#2563EB",
  features = [],
}: ComingSoonProps) {
  const Icon = ICONS[iconName] ?? Cpu;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
      <div className="text-center max-w-lg animate-scale-in">

        {/* Icon */}
        <div className="relative mx-auto w-28 h-28 mb-8">
          <div
            className="relative w-28 h-28 rounded-3xl flex items-center justify-center"
            style={{
              background: `${accentColor}0f`,
              border: `1px solid ${accentColor}30`,
              boxShadow: `0 4px 24px ${accentColor}18`,
            }}
          >
            <Icon className="w-12 h-12" style={{ color: accentColor }} />
          </div>
        </div>

        {/* Phase badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4"
          style={{ background: `${accentColor}0f`, border: `1px solid ${accentColor}30` }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: accentColor, animation: "pulse-dot 2s ease-in-out infinite" }}
          />
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: accentColor }}>
            {phase}
          </span>
          {eta && (
            <span className="text-[9px] font-semibold text-[#94A3B8] ml-1">ETA: {eta}</span>
          )}
        </div>

        <h1 className="text-3xl font-bold text-[#0F172A] mb-3 tracking-tight">{title}</h1>
        <p className="text-sm font-medium text-[#475569] leading-relaxed mb-6">{subtitle}</p>

        {/* Status card */}
        <div
          className="rounded-2xl p-5 mb-6 text-left"
          style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            <span className="text-[10px] font-bold text-[#F59E0B] tracking-[0.2em] uppercase">Module Status</span>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Core Architecture", status: "COMPLETE",     color: "#10B981" },
              { label: "Data Pipeline",     status: "IN PROGRESS",  color: "#F59E0B" },
              { label: "AI Models",         status: "INITIALIZING", color: accentColor },
              { label: "UI Interface",      status: "SCHEDULED",    color: "#94A3B8" },
            ].map(({ label, status, color }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#475569]">{label}</span>
                <span className="font-bold tracking-wide" style={{ color }}>{status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-[9px] font-semibold text-[#94A3B8] mb-1.5">
              <span>MODULE INITIALIZATION</span>
              <span>34%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#F1F5F9]">
              <div
                className="h-full rounded-full w-[34%]"
                style={{ background: `linear-gradient(90deg, ${accentColor}, #0891B2)` }}
              />
            </div>
          </div>
        </div>

        {features.length > 0 && (
          <div
            className="text-left rounded-2xl p-4 mb-6"
            style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
          >
            <div className="text-[9px] font-bold text-[#94A3B8] tracking-[0.2em] uppercase mb-3">
              Planned Capabilities
            </div>
            <div className="space-y-2">
              {features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-xs font-medium text-[#475569]">
                  <Shield className="w-3 h-3 shrink-0" style={{ color: accentColor }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] text-[#94A3B8]">
          <Lock className="w-3 h-3" />
          <span className="tracking-wider uppercase font-semibold">Restricted Access — Alpha Clearance Required</span>
        </div>
      </div>
    </div>
  );
}
