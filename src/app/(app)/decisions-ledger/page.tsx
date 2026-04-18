"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Database,
  Clock,
  User,
  Zap,
  Filter as FilterIcon,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import {
  useLedger,
  toCSV,
  downloadCSV,
  type LedgerFilters,
  type LedgerEventRow,
} from "@/lib/agents/ledger";
import type { EventType } from "@/lib/agents/types";

const ALL_EVENT_TYPES: EventType[] = [
  "triggered",
  "analyzed",
  "proposed",
  "notified",
  "approved",
  "rejected",
  "executed",
  "outcome_observed",
  "expired",
  "failed",
];

const EVENT_META: Record<
  EventType,
  { label: string; color: string; bg: string; border: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  triggered:        { label: "Triggered",        color: "#2563EB", bg: "rgba(37,99,235,0.06)",  border: "rgba(37,99,235,0.15)",  Icon: Zap },
  analyzed:         { label: "Analyzed",         color: "#7C3AED", bg: "rgba(124,58,237,0.06)", border: "rgba(124,58,237,0.15)", Icon: Sparkles },
  proposed:         { label: "Proposed",         color: "#D97706", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", Icon: AlertCircle },
  notified:         { label: "Notified",         color: "#D97706", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.18)", Icon: AlertCircle },
  approved:         { label: "Approved",         color: "#059669", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)",  Icon: CheckCircle2 },
  rejected:         { label: "Rejected",         color: "#DC2626", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.18)",  Icon: XCircle },
  executed:         { label: "Executed",         color: "#059669", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)",  Icon: CheckCircle2 },
  outcome_observed: { label: "Outcome",          color: "#0891B2", bg: "rgba(8,145,178,0.06)",  border: "rgba(8,145,178,0.18)",  Icon: CheckCircle2 },
  expired:          { label: "Expired",          color: "#6B7280", bg: "rgba(107,114,128,0.06)",border: "rgba(107,114,128,0.16)",Icon: Clock },
  failed:           { label: "Failed",           color: "#DC2626", bg: "rgba(239,68,68,0.06)",  border: "rgba(239,68,68,0.18)",  Icon: XCircle },
};

const PAGE_SIZE = 50;

export default function DecisionsLedgerPage() {
  const [filters, setFilters] = useState<LedgerFilters>({});
  const [page, setPage] = useState(0);
  const { data, source, loading } = useLedger(filters);

  const pageEvents = useMemo(
    () => data.events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE),
    [data.events, page],
  );
  const totalPages = Math.max(1, Math.ceil(data.events.length / PAGE_SIZE));

  const availableActors = useMemo(
    () =>
      Array.from(new Set(data.events.map((e) => e.actor).filter(Boolean))).sort(),
    [data.events],
  );

  const exportCSV = () => {
    const filename = `maia-decisions-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, toCSV(data.events));
  };

  return (
    <div className="px-8 py-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
            Platform
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Compliance & Audit
          </span>
          <SourceBadge source={source} loading={loading} />
        </div>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em] text-slate-900 mb-1 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-600" />
              Decisions Ledger
            </h1>
            <p className="text-[14px] text-slate-500 max-w-2xl leading-relaxed">
              Every MAIA decision, approval, rejection, execution, and observed outcome —
              append-only, cryptographically ordered, compliance-ready. Filter, inspect, and
              export for audit.
            </p>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            disabled={data.events.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV ({data.events.length})
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Stat label="Total Events" value={data.totals.all.toLocaleString()} accent="blue" />
        <Stat label="Unique Decisions" value={data.totals.uniqueRuns.toLocaleString()} />
        <Stat label="Actors" value={data.totals.uniqueActors.toLocaleString()} />
        <Stat
          label="First Event"
          value={
            data.totals.firstAt
              ? new Date(data.totals.firstAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
        />
        <Stat
          label="Last Event"
          value={
            data.totals.lastAt
              ? new Date(data.totals.lastAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "—"
          }
          accent="green"
        />
      </div>

      {/* Filters */}
      <div
        className="mb-4 p-4 rounded-xl"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(15,23,42,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <FilterIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
            Filters
          </span>
          {(filters.eventTypes?.length ||
            filters.actors?.length ||
            filters.searchText) && (
            <button
              type="button"
              onClick={() => {
                setFilters({});
                setPage(0);
              }}
              className="ml-auto text-[10.5px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear all
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Event type chips */}
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 w-[70px] pt-1.5 shrink-0">
              Event
            </span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {ALL_EVENT_TYPES.map((t) => {
                const meta = EVENT_META[t];
                const active = filters.eventTypes?.includes(t) ?? false;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setPage(0);
                      setFilters((f) => {
                        const set = new Set(f.eventTypes ?? []);
                        if (set.has(t)) set.delete(t);
                        else set.add(t);
                        return {
                          ...f,
                          eventTypes: set.size > 0 ? Array.from(set) : undefined,
                        };
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-[0.1em] transition-all"
                    style={{
                      color: active ? "#FFFFFF" : meta.color,
                      background: active ? meta.color : meta.bg,
                      border: `1px solid ${active ? meta.color : meta.border}`,
                    }}
                  >
                    <meta.Icon className="w-2.5 h-2.5" />
                    {meta.label}
                    <span
                      className="font-mono"
                      style={{ opacity: 0.65 }}
                    >
                      {data.totals.byType[t] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actor filter */}
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 w-[70px] pt-1.5 shrink-0">
              Actor
            </span>
            <div className="flex flex-wrap gap-1.5 flex-1">
              {availableActors.map((a) => {
                const active = filters.actors?.includes(a) ?? false;
                const isMaia = a === "MAIA";
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setPage(0);
                      setFilters((f) => {
                        const set = new Set(f.actors ?? []);
                        if (set.has(a)) set.delete(a);
                        else set.add(a);
                        return {
                          ...f,
                          actors: set.size > 0 ? Array.from(set) : undefined,
                        };
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10.5px] font-medium transition-all"
                    style={{
                      background: active
                        ? isMaia
                          ? "#2563EB"
                          : "#0F172A"
                        : "rgba(15,23,42,0.04)",
                      color: active ? "#FFFFFF" : "#475569",
                      border: `1px solid ${active ? "transparent" : "rgba(15,23,42,0.08)"}`,
                    }}
                  >
                    {isMaia ? <Sparkles className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {a}
                    <span
                      className="font-mono text-[9.5px]"
                      style={{ opacity: 0.65 }}
                    >
                      {data.totals.byActor[a] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400 w-[70px] shrink-0">
              Search
            </span>
            <input
              type="text"
              placeholder="Search events, staff names, run IDs, payloads…"
              value={filters.searchText ?? ""}
              onChange={(e) => {
                setPage(0);
                setFilters((f) => ({
                  ...f,
                  searchText: e.target.value || undefined,
                }));
              }}
              className="flex-1 px-3 py-1.5 rounded-lg text-[12px] focus:outline-none focus:border-blue-400"
              style={{
                background: "#FAFBFC",
                border: "1px solid rgba(15,23,42,0.08)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Event table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(15,23,42,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: "2px solid #F1F5F9" }}>
              <Th>When</Th>
              <Th>Event</Th>
              <Th>Actor</Th>
              <Th>Agent</Th>
              <Th>Staff</Th>
              <Th>Run</Th>
              <Th>Payload</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {pageEvents.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="text-center py-14 text-slate-500">
                  <div className="text-[13px] font-medium mb-1">No events match</div>
                  <div className="text-[11.5px]">Try clearing filters or broadening the search.</div>
                </td>
              </tr>
            )}
            {loading && pageEvents.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-14 text-slate-500">
                  <div className="text-[13px]">Loading ledger…</div>
                </td>
              </tr>
            )}
            {pageEvents.map((e, i) => (
              <EventRow key={e.id + i} event={e} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data.events.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-[11.5px] text-slate-500">
          <span>
            Showing{" "}
            <span className="font-mono font-semibold text-slate-700">
              {page * PAGE_SIZE + 1}–
              {Math.min((page + 1) * PAGE_SIZE, data.events.length)}
            </span>{" "}
            of{" "}
            <span className="font-mono font-semibold text-slate-700">
              {data.events.length}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="btn-secondary !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-mono px-2">
              page {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="btn-secondary !py-1.5 !px-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Compliance footer note */}
      <div
        className="mt-8 flex items-start gap-3 px-4 py-3 rounded-xl text-[12px] text-slate-600"
        style={{
          background: "rgba(37,99,235,0.03)",
          border: "1px solid rgba(37,99,235,0.1)",
        }}
      >
        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Audit-grade ledger:</span>{" "}
          Events are append-only — rows cannot be updated or deleted by clients (enforced at the database layer). Every
          operational decision leaves a permanent trail: the triggering signal, MAIA's reasoning, the human approval, the
          executed action, and the observed outcome. Export any filtered view as CSV for third-party compliance review.
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left px-4 py-2.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400 whitespace-nowrap">
      {children}
    </th>
  );
}

function EventRow({ event }: { event: LedgerEventRow }) {
  const meta = EVENT_META[event.event_type];
  const isMaia = event.actor === "MAIA";
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <tr
        onClick={() => setExpanded((v) => !v)}
        className="cursor-pointer hover:bg-slate-50/70 transition-colors"
        style={{ borderBottom: "1px solid rgba(15,23,42,0.04)" }}
      >
        <td className="px-4 py-2.5 whitespace-nowrap">
          <div className="font-mono text-[10.5px] text-slate-500">
            {new Date(event.timestamp).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
        </td>
        <td className="px-4 py-2.5">
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-[0.1em]"
            style={{
              color: meta.color,
              background: meta.bg,
              border: `1px solid ${meta.border}`,
            }}
          >
            <meta.Icon className="w-2.5 h-2.5" />
            {meta.label}
          </span>
        </td>
        <td className="px-4 py-2.5 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-700">
            {isMaia ? (
              <Sparkles className="w-3 h-3 text-blue-500" />
            ) : (
              <User className="w-3 h-3 text-slate-400" />
            )}
            <span className={isMaia ? "font-semibold text-blue-700" : "font-medium"}>
              {event.actor}
            </span>
          </span>
        </td>
        <td className="px-4 py-2.5 text-[11.5px] text-slate-600 whitespace-nowrap">
          {event.agent_name ?? "—"}
        </td>
        <td className="px-4 py-2.5 text-[11.5px] text-slate-600 whitespace-nowrap">
          {event.staff_name ?? "—"}
        </td>
        <td className="px-4 py-2.5">
          <Link
            href={`/agents/${event.agent_id}?run=${event.run_id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-mono text-[10.5px] text-blue-600 hover:underline"
          >
            {event.run_id}
          </Link>
        </td>
        <td className="px-4 py-2.5 text-[10.5px] text-slate-500 max-w-[260px]">
          <span className="font-mono line-clamp-1">
            {event.payload ? JSON.stringify(event.payload).slice(0, 120) : "—"}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right">
          <ChevronRight
            className={`w-3.5 h-3.5 text-slate-300 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        </td>
      </tr>
      {expanded && event.payload && (
        <tr style={{ background: "rgba(15,23,42,0.015)" }}>
          <td colSpan={8} className="px-4 py-3">
            <pre
              className="text-[10.5px] font-mono leading-relaxed whitespace-pre-wrap"
              style={{
                background: "#0F172A",
                color: "#A5F3FC",
                padding: "12px 14px",
                borderRadius: "8px",
                overflow: "auto",
                maxWidth: "100%",
              }}
            >
              {JSON.stringify(event.payload, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
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
      className="px-4 py-3 rounded-xl"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(15,23,42,0.06)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <div className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div
        className="text-[18px] font-bold tabular-nums leading-tight mt-1"
        style={{ color: accentColor, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
    </div>
  );
}

function SourceBadge({
  source,
  loading,
}: {
  source: "supabase" | "mock";
  loading: boolean;
}) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-[0.12em] border border-slate-200 text-slate-500 bg-slate-50">
        Loading
      </span>
    );
  }
  return source === "supabase" ? (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-[0.12em]"
      style={{
        background: "rgba(16,185,129,0.08)",
        border: "1px solid rgba(16,185,129,0.22)",
        color: "#059669",
      }}
    >
      <Database className="w-2.5 h-2.5" />
      Supabase · Live
    </span>
  ) : (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9.5px] font-bold uppercase tracking-[0.12em]"
      style={{
        background: "rgba(107,114,128,0.08)",
        border: "1px solid rgba(107,114,128,0.18)",
        color: "#6B7280",
      }}
    >
      <Database className="w-2.5 h-2.5" />
      Demo · Mock
    </span>
  );
}
