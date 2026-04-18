"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { MOCK_AGENTS, MOCK_RUNS, eventsForRun } from "./mock";
import type { AgentEvent, EventType } from "./types";

export type LedgerSource = "supabase" | "mock";

export interface LedgerEventRow extends AgentEvent {
  agent_name?: string;
  staff_name?: string;
}

export interface LedgerFilters {
  eventTypes?: EventType[]; // if set, restrict to these
  actors?: string[];        // if set, restrict to these
  agentIds?: string[];      // if set, restrict to these
  fromISO?: string;
  toISO?: string;
  searchText?: string;
}

export interface LedgerData {
  events: LedgerEventRow[];
  totals: {
    all: number;
    byType: Record<string, number>;
    byActor: Record<string, number>;
    byAgent: Record<string, number>;
    firstAt?: string;
    lastAt?: string;
    uniqueActors: number;
    uniqueRuns: number;
  };
}

/**
 * Hook — loads ledger events. Supabase first, mock fallback.
 * Re-runs when filters change.
 */
export function useLedger(filters: LedgerFilters): {
  data: LedgerData;
  source: LedgerSource;
  loading: boolean;
  refresh: () => void;
} {
  const [data, setData] = useState<LedgerData>(() => buildFromMock(filters));
  const [source, setSource] = useState<LedgerSource>("mock");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Try Supabase
      try {
        const sb = createClient();
        let q = sb
          .from("maia_agent_events")
          .select(
            "id, run_id, agent_id, org_id, timestamp, event_type, actor, payload",
          )
          .order("timestamp", { ascending: false })
          .limit(500);

        if (filters.eventTypes?.length) q = q.in("event_type", filters.eventTypes);
        if (filters.actors?.length) q = q.in("actor", filters.actors);
        if (filters.agentIds?.length) q = q.in("agent_id", filters.agentIds);
        if (filters.fromISO) q = q.gte("timestamp", filters.fromISO);
        if (filters.toISO) q = q.lte("timestamp", filters.toISO);

        const { data: rows, error } = await q;
        if (!error && rows && rows.length > 0) {
          // Load agent names once for enrichment
          const { data: agents } = await sb
            .from("maia_agents")
            .select("id, name");
          const agentNames = new Map<string, string>();
          (agents ?? []).forEach((a) =>
            agentNames.set(a.id as string, a.name as string),
          );

          // Need run → staff_name for enrichment. Pull just the runs referenced.
          const runIds = Array.from(new Set(rows.map((r) => r.run_id)));
          const staffByRun = new Map<string, string>();
          if (runIds.length > 0) {
            const { data: runs } = await sb
              .from("maia_agent_runs")
              .select("id, trigger_payload")
              .in("id", runIds);
            (runs ?? []).forEach((r) => {
              const p = (r.trigger_payload ?? {}) as Record<string, unknown>;
              const name = (p.staff_name as string) ?? "";
              if (name) staffByRun.set(r.id as string, name);
            });
          }

          let enriched: LedgerEventRow[] = rows.map((e) => ({
            ...(e as unknown as AgentEvent),
            agent_name: agentNames.get(e.agent_id as string),
            staff_name: staffByRun.get(e.run_id as string),
          }));

          // Client-side filter for free-text search (across actor, agent, event, payload)
          if (filters.searchText) {
            const q = filters.searchText.toLowerCase();
            enriched = enriched.filter((e) =>
              JSON.stringify(e).toLowerCase().includes(q),
            );
          }

          if (!cancelled) {
            setData(computeTotals(enriched));
            setSource("supabase");
            setLoading(false);
          }
          return;
        }
      } catch {}

      // Mock fallback
      if (!cancelled) {
        setData(buildFromMock(filters));
        setSource("mock");
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    JSON.stringify(filters), // eslint-disable-line react-hooks/exhaustive-deps
    tick,
  ]);

  return {
    data,
    source,
    loading,
    refresh: () => setTick((v) => v + 1),
  };
}

function buildFromMock(filters: LedgerFilters): LedgerData {
  // Derive events from mock runs
  const agentNames = new Map<string, string>();
  MOCK_AGENTS.forEach((a) => agentNames.set(a.id, a.name));

  const all: LedgerEventRow[] = [];
  for (const run of MOCK_RUNS) {
    const events = eventsForRun(run.id);
    for (const ev of events) {
      all.push({
        ...ev,
        agent_name: agentNames.get(run.agent_id),
        staff_name: run.trigger_payload.staff_name as string | undefined,
      });
    }
  }

  let filtered = all.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  if (filters.eventTypes?.length) {
    filtered = filtered.filter((e) =>
      filters.eventTypes!.includes(e.event_type),
    );
  }
  if (filters.actors?.length) {
    filtered = filtered.filter((e) => filters.actors!.includes(e.actor));
  }
  if (filters.fromISO) {
    const fromT = new Date(filters.fromISO).getTime();
    filtered = filtered.filter(
      (e) => new Date(e.timestamp).getTime() >= fromT,
    );
  }
  if (filters.toISO) {
    const toT = new Date(filters.toISO).getTime();
    filtered = filtered.filter(
      (e) => new Date(e.timestamp).getTime() <= toT,
    );
  }
  if (filters.searchText) {
    const q = filters.searchText.toLowerCase();
    filtered = filtered.filter((e) =>
      JSON.stringify(e).toLowerCase().includes(q),
    );
  }

  return computeTotals(filtered.slice(0, 500));
}

function computeTotals(events: LedgerEventRow[]): LedgerData {
  const byType: Record<string, number> = {};
  const byActor: Record<string, number> = {};
  const byAgent: Record<string, number> = {};
  let firstAt: string | undefined;
  let lastAt: string | undefined;
  const actors = new Set<string>();
  const runs = new Set<string>();

  for (const e of events) {
    byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
    byActor[e.actor] = (byActor[e.actor] ?? 0) + 1;
    if (e.agent_name) {
      byAgent[e.agent_name] = (byAgent[e.agent_name] ?? 0) + 1;
    }
    actors.add(e.actor);
    runs.add(e.run_id);
    if (!firstAt || e.timestamp < firstAt) firstAt = e.timestamp;
    if (!lastAt || e.timestamp > lastAt) lastAt = e.timestamp;
  }

  return {
    events,
    totals: {
      all: events.length,
      byType,
      byActor,
      byAgent,
      firstAt,
      lastAt,
      uniqueActors: actors.size,
      uniqueRuns: runs.size,
    },
  };
}

// ─── CSV export ─────────────────────────────────────────────────────────

export function toCSV(events: LedgerEventRow[]): string {
  const header = [
    "timestamp",
    "event_type",
    "actor",
    "agent_name",
    "agent_id",
    "run_id",
    "staff_name",
    "payload",
  ];
  const lines = [header.join(",")];
  for (const e of events) {
    lines.push(
      [
        e.timestamp,
        e.event_type,
        csvEscape(e.actor),
        csvEscape(e.agent_name ?? ""),
        e.agent_id,
        e.run_id,
        csvEscape(e.staff_name ?? ""),
        csvEscape(e.payload ? JSON.stringify(e.payload) : ""),
      ].join(","),
    );
  }
  return lines.join("\n");
}

function csvEscape(s: string): string {
  if (s == null) return "";
  const needsQuotes = /[",\n]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
