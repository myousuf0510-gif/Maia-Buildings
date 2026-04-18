"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Bot, Clock, Tag, ExternalLink } from "lucide-react";
import { KNOWLEDGE_DOCS, CATEGORY_META } from "@/lib/buildings/knowledge";
import { AGENTS } from "@/lib/platform/registry";
import { use } from "react";

export default function KnowledgeDocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const doc = KNOWLEDGE_DOCS.find((d) => d.id === id);
  if (!doc) return notFound();
  const meta = CATEGORY_META[doc.category];
  const refAgents = AGENTS.filter((a) => doc.referencedBy.includes(a.id));

  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      {/* Back bar */}
      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
        <Link href="/knowledge" className="inline-flex items-center gap-1 text-[#2563EB] hover:underline">
          <ArrowLeft className="w-3 h-3" /> Knowledge hub
        </Link>
        <span>›</span>
        <span className="font-semibold text-[#475569]">{meta.label}</span>
      </div>

      {/* Hero */}
      <div
        className="rounded-2xl p-6"
        style={{ background: `linear-gradient(135deg, ${meta.color}08, #FFFFFF 60%)`, border: `1px solid ${meta.color}26` }}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.14em] uppercase"
            style={{ background: `${meta.color}12`, color: meta.color, border: `1px solid ${meta.color}30` }}>
            <span>{meta.icon}</span>
            {meta.label}
          </span>
          {doc.jurisdiction && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-[0.12em] uppercase"
              style={{ background: "rgba(15,23,42,0.04)", color: "#475569", border: "1px solid rgba(15,23,42,0.08)" }}>
              {doc.jurisdiction}
            </span>
          )}
          <span className="text-[11px] font-mono text-[#64748B]">{doc.version}</span>
          <span className="text-[11px] text-[#94A3B8]">·</span>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B]">
            <Clock className="w-3 h-3" /> Updated {doc.lastUpdated}
          </span>
        </div>
        <h1 className="text-[26px] font-bold text-[#0F172A] tracking-tight leading-tight mb-1">{doc.title}</h1>
        <p className="text-[13px] text-[#475569] leading-relaxed max-w-3xl">{doc.summary}</p>

        <div className="flex items-center gap-2 flex-wrap mt-3">
          <Tag className="w-3 h-3 text-slate-400" />
          {doc.tags.map((t) => (
            <span key={t} className="px-1.5 py-0.5 rounded text-[10px]"
              style={{ background: "rgba(15,23,42,0.04)", color: "#64748B", border: "1px solid rgba(15,23,42,0.06)" }}>
              #{t}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <article
        className="rounded-2xl p-8 prose-kb"
        style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}
      >
        <Markdown source={doc.body} />
      </article>

      {/* Agents referencing */}
      {refAgents.length > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.04), rgba(37,99,235,0.03))", border: "1px solid rgba(124,58,237,0.22)" }}
        >
          <div className="flex items-center gap-1.5 mb-3">
            <Bot className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#7C3AED]">
              Agents referencing this doc
            </span>
            <span className="ml-auto text-[10px] text-[#94A3B8]">{refAgents.length} {refAgents.length === 1 ? "agent" : "agents"}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {refAgents.map((a) => (
              <Link
                key={a.id}
                href={`/agents/${a.id}`}
                className="rounded-xl p-3 transition-all hover:shadow-md"
                style={{ background: "#FFFFFF", border: `1px solid ${a.accent}28` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${a.accent}14`, border: `1px solid ${a.accent}30` }}
                  >
                    <Bot className="w-3.5 h-3.5" style={{ color: a.accent }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold text-[#0F172A] truncate">{a.name}</div>
                    <div className="text-[9.5px] text-[#94A3B8]">{a.cadence}</div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-300" />
                </div>
                <div className="text-[10.5px] text-[#475569] leading-snug line-clamp-2">{a.purpose}</div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <style jsx global>{`
        .prose-kb p { font-size: 13.5px; line-height: 1.75; color: #334155; margin-bottom: 1em; }
        .prose-kb strong { color: #0F172A; font-weight: 700; }
        .prose-kb ul, .prose-kb ol { margin-left: 1.2em; margin-bottom: 1em; }
        .prose-kb li { font-size: 13px; line-height: 1.65; color: #475569; margin-bottom: 0.25em; }
        .prose-kb code { background: rgba(37,99,235,0.08); color: #2563EB; padding: 1px 4px; border-radius: 4px; font-size: 11.5px; font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .prose-kb h1, .prose-kb h2, .prose-kb h3 { color: #0F172A; font-weight: 700; margin-top: 1.4em; margin-bottom: 0.5em; }
        .prose-kb table { width: 100%; font-size: 12px; border-collapse: collapse; margin: 1em 0; }
        .prose-kb th { background: rgba(15,23,42,0.04); padding: 6px 10px; text-align: left; color: #0F172A; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; }
        .prose-kb td { padding: 6px 10px; border-top: 1px solid rgba(15,23,42,0.06); color: #475569; }
      `}</style>
    </div>
  );
}

// Tiny markdown-ish renderer: handles paragraphs, **bold**, - lists, backtick code, and | tables |
function Markdown({ source }: { source: string }) {
  // Split by double newline for paragraph/table blocks
  const blocks = source.split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        // Table
        if (trimmed.startsWith("|") && trimmed.includes("\n|")) {
          const rows = trimmed.split("\n").map((r) => r.trim()).filter(Boolean);
          const headers = rows[0].split("|").map((c) => c.trim()).filter(Boolean);
          const dataRows = rows.slice(2).map((r) => r.split("|").map((c) => c.trim()).filter((c, idx, arr) => idx !== arr.length - 1 || c !== ""));
          return (
            <table key={i}>
              <thead><tr>{headers.map((h, hi) => <th key={hi} dangerouslySetInnerHTML={{ __html: renderInline(h) }} />)}</tr></thead>
              <tbody>
                {dataRows.map((row, ri) => (
                  <tr key={ri}>{row.map((cell, ci) => <td key={ci} dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />)}</tr>
                ))}
              </tbody>
            </table>
          );
        }
        // List
        if (/^(\d+\.\s|\-\s|\*\s)/m.test(trimmed)) {
          const isOrdered = /^\d+\.\s/.test(trimmed);
          const items = trimmed.split("\n").map((l) => l.replace(/^(\d+\.\s|\-\s|\*\s)/, "").trim()).filter(Boolean);
          const Tag = isOrdered ? "ol" : "ul";
          return (
            <Tag key={i}>
              {items.map((it, ii) => <li key={ii} dangerouslySetInnerHTML={{ __html: renderInline(it) }} />)}
            </Tag>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(trimmed) }} />;
      })}
    </>
  );
}

function renderInline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}
