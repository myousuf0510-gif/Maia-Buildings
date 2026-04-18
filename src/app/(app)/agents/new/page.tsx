"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShieldAlert,
  TrendingUp,
  Check,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { AGENT_TEMPLATES, MOCK_AGENTS } from "@/lib/agents/mock";
import type { AgentTemplate, AutonomyLevel } from "@/lib/agents/types";

const TYPE_ICONS: Record<AgentTemplate["type"], React.ComponentType<{ className?: string }>> = {
  fatigue_guardian: ShieldAlert,
  compliance_sentinel: ShieldAlert,
  demand_watcher: TrendingUp,
};

export default function NewAgentPage() {
  return (
    <Suspense fallback={null}>
      <NewAgentPageInner />
    </Suspense>
  );
}

function NewAgentPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preselected = searchParams.get("template") as AgentTemplate["type"] | null;

  const initialTpl = preselected
    ? AGENT_TEMPLATES.find((t) => t.type === preselected)
    : null;

  const [selected, setSelected] = useState<AgentTemplate | null>(initialTpl ?? null);
  const [step, setStep] = useState<1 | 2 | 3>(initialTpl ? 2 : 1);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>(initialTpl?.default_autonomy ?? 1);
  const [dryRun, setDryRun] = useState(true);

  const deployedTypes = new Set(
    MOCK_AGENTS.filter((a) => a.status === "active").map((a) => a.type),
  );

  return (
    <div className="px-8 py-8 max-w-[1000px] mx-auto">
      <Link
        href="/agents"
        className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 mb-5 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Agents
      </Link>

      <div className="mb-6">
        <h1 className="text-[28px] font-bold tracking-[-0.02em] text-slate-900 mb-1">
          New Agent
        </h1>
        <p className="text-[14px] text-slate-500 max-w-xl">
          Deploy an autonomous operator in three steps: pick a template,
          configure guardrails, review and deploy.
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3 mb-8">
        <Step n={1} label="Template" active={step >= 1} done={step > 1} />
        <StepDivider />
        <Step n={2} label="Configure" active={step >= 2} done={step > 2} />
        <StepDivider />
        <Step n={3} label="Review" active={step >= 3} done={false} />
      </div>

      {/* Step 1 — template */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AGENT_TEMPLATES.map((tpl) => {
            const Icon = TYPE_ICONS[tpl.type];
            const isDeployed = deployedTypes.has(tpl.type);
            return (
              <button
                key={tpl.type}
                type="button"
                onClick={() => {
                  setSelected(tpl);
                  setAutonomy(tpl.default_autonomy);
                  setStep(2);
                }}
                className="solid-card text-left p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.08) 100%)",
                      border: "1px solid rgba(37,99,235,0.14)",
                    }}
                  >
                    <Icon className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[14px] font-bold text-slate-900">
                        {tpl.label}
                      </div>
                      {isDeployed && (
                        <span className="badge badge-green text-[9px]">DEPLOYED</span>
                      )}
                    </div>
                    <div className="text-[12px] text-slate-500 mt-0.5">
                      {tpl.tagline}
                    </div>
                  </div>
                </div>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  {tpl.description}
                </p>
              </button>
            );
          })}
          <div
            className="solid-card p-5 opacity-60 cursor-not-allowed"
            style={{ borderStyle: "dashed" }}
          >
            <div className="text-[14px] font-bold text-slate-700 mb-1">Custom Agent</div>
            <div className="text-[12px] text-slate-500">Build from scratch — coming soon.</div>
          </div>
        </div>
      )}

      {/* Step 2 — configure */}
      {step === 2 && selected && (
        <div className="space-y-5">
          <div className="solid-card p-5">
            <h2 className="text-[15px] font-bold text-slate-900 mb-1">
              {selected.label}
            </h2>
            <p className="text-[12.5px] text-slate-500 mb-4">
              Default triggers and actions loaded from the template.
              Adjust guardrails below.
            </p>

            <Section label="Autonomy Level">
              <div className="space-y-2">
                {([0, 1, 2, 3] as const).map((level) => (
                  <AutonomyOption
                    key={level}
                    level={level}
                    selected={autonomy === level}
                    onSelect={() => setAutonomy(level)}
                  />
                ))}
              </div>
            </Section>

            <Section label="Dry-Run Mode">
              <button
                type="button"
                onClick={() => setDryRun((v) => !v)}
                className="flex items-center gap-3 w-full text-left p-3 rounded-xl transition-colors"
                style={{
                  background: dryRun ? "rgba(245,158,11,0.06)" : "rgba(15,23,42,0.02)",
                  border: `1px solid ${dryRun ? "rgba(245,158,11,0.18)" : "rgba(15,23,42,0.06)"}`,
                }}
              >
                <div
                  className="w-10 h-6 rounded-full relative transition-colors shrink-0"
                  style={{ background: dryRun ? "#F59E0B" : "rgba(15,23,42,0.12)" }}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: dryRun ? "18px" : "2px" }}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {dryRun ? "Dry-run ON (recommended for first 14 days)" : "Live actions enabled"}
                  </div>
                  <div className="text-[11.5px] text-slate-500 mt-0.5">
                    {dryRun
                      ? "Agent will propose but never execute. You can see exactly what it would have done — trust it first."
                      : "Agent will execute within guardrails after human approval."}
                  </div>
                </div>
              </button>
            </Section>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                Review
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — review */}
      {step === 3 && selected && (
        <div className="solid-card p-6">
          <div className="flex items-center gap-3 mb-5">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-[17px] font-bold text-slate-900">Ready to deploy</h2>
          </div>

          <ReviewRow label="Template">{selected.label}</ReviewRow>
          <ReviewRow label="Autonomy">
            {autonomyLabel(autonomy)}
          </ReviewRow>
          <ReviewRow label="Dry-Run">{dryRun ? "Enabled" : "Disabled"}</ReviewRow>
          <ReviewRow label="Jurisdiction">
            {selected.default_config.guardrails.jurisdiction}
          </ReviewRow>
          <ReviewRow label="Triggers">
            {selected.default_config.triggers.length} configured
          </ReviewRow>
          <ReviewRow label="Actions">
            {selected.default_config.actions.length} configured
          </ReviewRow>

          {!dryRun && autonomy >= 2 && (
            <div
              className="mt-4 p-3.5 rounded-xl flex items-start gap-2.5"
              style={{
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.22)",
              }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-[12px] text-amber-900 leading-relaxed">
                <span className="font-semibold">Heads up:</span> you've chosen
                higher autonomy without dry-run. Recommended to run in dry-run
                for 14 days to validate decisions before executing.
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-5 mt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => router.push("/agents")}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Deploy Agent
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all"
        style={{
          background: done ? "#2563EB" : active ? "#FFFFFF" : "rgba(15,23,42,0.04)",
          color: done ? "#FFFFFF" : active ? "#2563EB" : "#94A3B8",
          border: `1px solid ${done ? "#2563EB" : active ? "#2563EB" : "rgba(15,23,42,0.08)"}`,
          boxShadow: active && !done ? "0 0 0 3px rgba(37,99,235,0.12)" : undefined,
        }}
      >
        {done ? <Check className="w-3.5 h-3.5" /> : n}
      </div>
      <span
        className="text-[12.5px] font-semibold transition-colors"
        style={{ color: active ? "#0F172A" : "#94A3B8" }}
      >
        {label}
      </span>
    </div>
  );
}

function StepDivider() {
  return <div className="flex-1 h-[1px] bg-slate-200" />;
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 mb-2.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function AutonomyOption({
  level,
  selected,
  onSelect,
}: {
  level: AutonomyLevel;
  selected: boolean;
  onSelect: () => void;
}) {
  const labels: Record<AutonomyLevel, { title: string; desc: string; warn?: boolean }> = {
    0: {
      title: "Suggest only",
      desc: "Propose actions. Human must act. Safest — slowest.",
    },
    1: {
      title: "Approve → Execute",
      desc: "Propose + wait for approval → execute. Recommended.",
    },
    2: {
      title: "Execute with fallback",
      desc: "Execute reversible actions, escalate edge cases.",
      warn: true,
    },
    3: {
      title: "Fully autonomous",
      desc: "Execute everything within guardrails. Opt-in, not default.",
      warn: true,
    },
  };
  const cfg = labels[level];

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all"
      style={{
        background: selected ? "rgba(37,99,235,0.05)" : "rgba(15,23,42,0.02)",
        border: `1px solid ${selected ? "rgba(37,99,235,0.22)" : "rgba(15,23,42,0.06)"}`,
      }}
    >
      <div
        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: selected ? "#2563EB" : "#FFFFFF",
          border: `1px solid ${selected ? "#2563EB" : "rgba(15,23,42,0.18)"}`,
        }}
      >
        {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
      </div>
      <div className="flex-1">
        <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
          {cfg.title}
          {cfg.warn && <span className="badge badge-amber text-[9px]">ADVANCED</span>}
        </div>
        <div className="text-[11.5px] text-slate-500 mt-0.5">{cfg.desc}</div>
      </div>
    </button>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 text-[13px]">
      <span className="text-slate-500 font-medium">{label}</span>
      <span className="font-semibold text-slate-900">{children}</span>
    </div>
  );
}

function autonomyLabel(level: AutonomyLevel): string {
  return ["Suggest only", "Approve → Execute", "Execute with fallback", "Fully autonomous"][level];
}
