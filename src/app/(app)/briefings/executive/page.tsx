"use client";

import { useEffect, useState } from "react";
import { FileText, Sparkles, Loader2, RefreshCw, Clock, CheckCircle2, FlaskConical } from "lucide-react";
import type { GeneratedBriefing } from "@/lib/agents/briefing";

export default function ExecutiveBriefingPage() {
  const [briefing, setBriefing] = useState<GeneratedBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLatest = async (opts?: { keepIfMissing?: boolean }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/briefings/latest");
      const data = await res.json();
      if (data.briefing) setBriefing(data.briefing);
      else if (!opts?.keepIfMissing) setBriefing(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateNow = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/briefings/generate", { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Generation failed");
      } else {
        if (data.briefing) setBriefing(data.briefing);
        await loadLatest({ keepIfMissing: true });
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    loadLatest();
  }, []);

  return (
    <div className="px-8 py-8 max-w-[920px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
              Platform
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Executive Briefing
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-[-0.02em] text-slate-900 mb-1 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-blue-600" />
            Weekly Executive Briefing
          </h1>
          <p className="text-[13.5px] text-slate-500 max-w-2xl leading-relaxed">
            One-page summary of MAIA's workforce decisions, outcomes, and dollar impact.
            Auto-generated Monday at 12:00 UTC. Use "Generate Now" to refresh on demand.
          </p>
        </div>

        <button
          type="button"
          onClick={generateNow}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Generate Now
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {loading && !briefing && (
        <div className="solid-card p-12 text-center text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3 text-blue-500" />
          <div className="text-[13px]">Loading latest briefing…</div>
        </div>
      )}

      {!loading && !briefing && (
        <div className="solid-card p-10 text-center">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <div className="text-[15px] font-bold text-slate-900 mb-1">
            No briefing generated yet
          </div>
          <div className="text-[12.5px] text-slate-500 mb-5 max-w-md mx-auto">
            Click <b>Generate Now</b> to produce the first briefing from your current
            Supabase data. It takes ~3 seconds.
          </div>
          <button
            type="button"
            onClick={generateNow}
            disabled={generating}
            className="btn-primary inline-flex items-center gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate first briefing
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 px-3.5 py-2.5 rounded-xl text-[12px]"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#991B1B",
          }}>
          {error}
        </div>
      )}

      {briefing && (
        <article
          className="solid-card p-9"
          style={{ background: "#FFFFFF" }}
        >
          <SourcePill source={briefing.source} generatedAt={briefing.generated_at} />
          <StatsRow stats={briefing.stats} />
          <div className="mt-6 border-t border-slate-100 pt-6">
            <Markdown md={briefing.summary_md} />
          </div>
        </article>
      )}
    </div>
  );
}

function SourcePill({ source, generatedAt }: { source: "claude" | "template"; generatedAt: string }) {
  const claude = source === "claude";
  return (
    <div className="flex items-center gap-3 mb-4 text-[11px]">
      {claude ? (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold uppercase tracking-[0.12em]"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.22)", color: "#059669" }}
        >
          <Sparkles className="w-2.5 h-2.5" />
          Claude · live reasoning
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold uppercase tracking-[0.12em]"
          style={{ background: "rgba(107,114,128,0.08)", border: "1px solid rgba(107,114,128,0.18)", color: "#6B7280" }}
        >
          <FlaskConical className="w-2.5 h-2.5" />
          Template · add ANTHROPIC_API_KEY for live Claude
        </span>
      )}
      <span className="inline-flex items-center gap-1.5 text-slate-500">
        <Clock className="w-2.5 h-2.5" />
        Generated{" "}
        <span className="font-mono">
          {new Date(generatedAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </span>
    </div>
  );
}

function StatsRow({ stats }: { stats: GeneratedBriefing["stats"] }) {
  const acceptance = Math.round(stats.acceptance_rate * 100);
  const effectiveness = Math.round(stats.effectiveness_rate * 100);
  const savingsK = Math.round(stats.estimated_savings / 1000);
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
      <Stat label="Decisions" value={String(stats.total_decisions)} />
      <Stat label="Acceptance" value={`${acceptance}%`} accent="blue" />
      <Stat label="Effective Outcomes" value={`${effectiveness}%`} accent="green" />
      <Stat
        label="Est. Savings"
        value={`$${savingsK}K`}
        accent="green"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue" | "green";
}) {
  const accentColor =
    accent === "blue" ? "#2563EB" : accent === "green" ? "#059669" : "#0F172A";
  return (
    <div
      className="px-3.5 py-2.5 rounded-xl"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(15,23,42,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="text-[18px] font-bold tabular-nums leading-tight mt-0.5"
        style={{ color: accentColor, letterSpacing: "-0.02em" }}>
        {value}
      </div>
    </div>
  );
}

/**
 * Tiny, safe-ish markdown renderer — good enough for the briefing's headers,
 * paragraphs, bullets, and bold. Not a general-purpose Markdown engine.
 */
function Markdown({ md }: { md: string }) {
  const lines = md.split(/\n/);
  const blocks: React.ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length === 0) return;
    blocks.push(
      <p
        key={blocks.length}
        className="text-[13.5px] text-slate-700 leading-[1.75] mb-4"
      >
        {renderInline(para.join(" "))}
      </p>,
    );
    para = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={blocks.length} className="space-y-1.5 mb-4 pl-4">
        {list.map((li, i) => (
          <li key={i} className="text-[13px] text-slate-700 leading-relaxed list-disc">
            {renderInline(li)}
          </li>
        ))}
      </ul>,
    );
    list = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushPara();
      flushList();
      blocks.push(
        <h3 key={blocks.length} className="text-[13px] font-bold text-slate-900 tracking-tight mt-5 mb-2">
          {line.slice(4)}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push(
        <h2 key={blocks.length} className="text-[15px] font-bold text-slate-900 tracking-tight mt-6 mb-2.5 pb-1 border-b border-slate-100">
          {line.slice(3)}
        </h2>,
      );
    } else if (line.startsWith("# ")) {
      flushPara();
      flushList();
      blocks.push(
        <h1 key={blocks.length} className="text-[22px] font-bold text-slate-900 tracking-tight mb-4 mt-0">
          {line.slice(2)}
        </h1>,
      );
    } else if (line.startsWith("- ")) {
      flushPara();
      list.push(line.slice(2));
    } else if (line === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  return <div>{blocks}</div>;
}

function renderInline(s: string): React.ReactNode {
  // **bold**, *italic*, `code` — minimal
  const parts: React.ReactNode[] = [];
  let buf = s;
  let key = 0;
  const boldRe = /\*\*([^*]+)\*\*/g;
  const segments: { text: string; bold?: boolean }[] = [];
  let last = 0;
  for (let m; (m = boldRe.exec(buf)); ) {
    if (m.index > last) segments.push({ text: buf.slice(last, m.index) });
    segments.push({ text: m[1], bold: true });
    last = m.index + m[0].length;
  }
  if (last < buf.length) segments.push({ text: buf.slice(last) });
  for (const seg of segments) {
    if (seg.bold) parts.push(<strong key={key++} className="font-semibold text-slate-900">{seg.text}</strong>);
    else parts.push(<span key={key++}>{seg.text}</span>);
  }
  return parts;
}
