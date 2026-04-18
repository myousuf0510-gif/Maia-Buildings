"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import {
  MOCK_AGENTS,
  MOCK_RUNS,
  AGENT_TEMPLATES,
  metricsForAgent as mockMetricsForAgent,
} from "./mock";
import type { Agent, AgentRun, AgentMetrics } from "./types";

export type DataSource = "supabase" | "mock";

/**
 * Client-side data layer for MAIA Agents.
 * Tries Supabase first, falls back to mock data silently.
 * Exposes `source` so the UI can show a small "Supabase · Live" vs "Demo mock" chip.
 */

async function fetchAgentsFromSupabase(): Promise<Agent[] | null> {
  try {
    const sb = createClient();
    const { data, error } = await sb
      .from("maia_agents")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return null;
    if (!data || data.length === 0) return null;
    return data as unknown as Agent[];
  } catch {
    return null;
  }
}

async function fetchRunsFromSupabase(agentId?: string): Promise<AgentRun[] | null> {
  try {
    const sb = createClient();
    let query = sb
      .from("maia_agent_runs")
      .select("*")
      .order("triggered_at", { ascending: false });
    if (agentId) query = query.eq("agent_id", agentId);
    const { data, error } = await query;
    if (error) return null;
    if (!data) return null;
    return data as unknown as AgentRun[];
  } catch {
    return null;
  }
}

// ── Hooks ────────────────────────────────────────────────────────────────

export function useAgents() {
  const [data, setData] = useState<Agent[]>(MOCK_AGENTS);
  const [source, setSource] = useState<DataSource>("mock");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supa = await fetchAgentsFromSupabase();
      if (cancelled) return;
      if (supa) {
        setData(supa);
        setSource("supabase");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  // Subscribe to agent-table changes — refetch when something changes
  useRealtimeOn("maia_agents", () => setTick((v) => v + 1));

  return { data, source, loading };
}

export function useAgent(id: string) {
  const [data, setData] = useState<Agent | null>(
    MOCK_AGENTS.find((a) => a.id === id) ?? null,
  );
  const [source, setSource] = useState<DataSource>("mock");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient();
        const { data: row, error } = await sb
          .from("maia_agents")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (!error && row) {
          setData(row as unknown as Agent);
          setSource("supabase");
        }
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  return { data, source, loading };
}

export function useAgentRuns(agentId: string) {
  const [data, setData] = useState<AgentRun[]>(
    MOCK_RUNS.filter((r) => r.agent_id === agentId),
  );
  const [source, setSource] = useState<DataSource>("mock");
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supa = await fetchRunsFromSupabase(agentId);
      if (cancelled) return;
      if (supa && supa.length > 0) {
        setData(supa);
        setSource("supabase");
      } else {
        // keep mock default
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [agentId, tick]);

  // Subscribe to real-time run changes for this agent
  useRealtimeOn(
    "maia_agent_runs",
    () => setTick((v) => v + 1),
    agentId ? { filter: `agent_id=eq.${agentId}` } : undefined,
  );

  return { data, setData, source, loading, refresh };
}

// ── Mutations ────────────────────────────────────────────────────────────

export async function approveRun(
  runId: string,
  approverName: string,
): Promise<{ ok: boolean; source: DataSource }> {
  try {
    const sb = createClient();
    const nowIso = new Date().toISOString();
    const executedIso = new Date(Date.now() + 2_500).toISOString();
    const { error } = await sb
      .from("maia_agent_runs")
      .update({
        status: "executed",
        approved_by: approverName,
        approved_at: nowIso,
        executed_at: executedIso,
      })
      .eq("id", runId);
    if (error) return { ok: true, source: "mock" };

    // Write events
    const { data: run } = await sb
      .from("maia_agent_runs")
      .select("agent_id, org_id")
      .eq("id", runId)
      .maybeSingle();
    if (run) {
      await sb.from("maia_agent_events").insert([
        {
          run_id: runId,
          agent_id: run.agent_id,
          org_id: run.org_id,
          timestamp: nowIso,
          event_type: "approved",
          actor: approverName,
        },
        {
          run_id: runId,
          agent_id: run.agent_id,
          org_id: run.org_id,
          timestamp: executedIso,
          event_type: "executed",
          actor: "MAIA",
        },
      ]);
    }
    return { ok: true, source: "supabase" };
  } catch {
    return { ok: true, source: "mock" };
  }
}

export async function rejectRun(
  runId: string,
  approverName: string,
): Promise<{ ok: boolean; source: DataSource }> {
  try {
    const sb = createClient();
    const nowIso = new Date().toISOString();
    const { error } = await sb
      .from("maia_agent_runs")
      .update({
        status: "rejected",
        approved_by: approverName,
        approved_at: nowIso,
      })
      .eq("id", runId);
    if (error) return { ok: true, source: "mock" };

    const { data: run } = await sb
      .from("maia_agent_runs")
      .select("agent_id, org_id")
      .eq("id", runId)
      .maybeSingle();
    if (run) {
      await sb.from("maia_agent_events").insert({
        run_id: runId,
        agent_id: run.agent_id,
        org_id: run.org_id,
        timestamp: nowIso,
        event_type: "rejected",
        actor: approverName,
      });
    }
    return { ok: true, source: "supabase" };
  } catch {
    return { ok: true, source: "mock" };
  }
}

// ── Metrics — derived from runs ──────────────────────────────────────────

export function computeMetrics(runs: AgentRun[], agentId: string): AgentMetrics {
  // Filter to this agent
  const agentRuns = runs.filter((r) => r.agent_id === agentId);
  if (agentRuns.length === 0) {
    // Fall back to the mock computation
    return mockMetricsForAgent(agentId);
  }

  const executed = agentRuns.filter((r) => r.status === "executed");
  const rejected = agentRuns.filter((r) => r.status === "rejected");
  const pending = agentRuns.filter(
    (r) => r.status === "proposed" || r.status === "notified",
  );
  const withOutcome = agentRuns.filter((r) => r.outcome);

  const acceptanceRate =
    executed.length + rejected.length > 0
      ? executed.length / (executed.length + rejected.length)
      : 0;

  const times = agentRuns
    .map((r) => r.response_time_seconds)
    .filter((x): x is number => typeof x === "number");
  const avgResponse =
    times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  const savings = executed.reduce(
    (a, r) => a + Number(r.estimated_savings ?? 0),
    0,
  );
  const effective = withOutcome.filter((r) => r.outcome?.effective).length;
  const effectivenessRate =
    withOutcome.length > 0 ? effective / withOutcome.length : 0;

  return {
    total_runs: agentRuns.length,
    acceptance_rate: acceptanceRate,
    avg_response_seconds: Math.round(avgResponse),
    estimated_savings: Math.round(savings),
    pending_review: pending.length,
    effectiveness_rate: effectivenessRate,
  };
}

// ── Seed — one-click populate Supabase with mock data ───────────────────

export async function seedFromMock(): Promise<{
  ok: boolean;
  agents?: number;
  runs?: number;
  error?: string;
}> {
  try {
    const sb = createClient();

    // Check if agents exist already
    const { data: existing } = await sb
      .from("maia_agents")
      .select("id")
      .limit(1);
    if (existing && existing.length > 0) {
      return { ok: false, error: "Data already exists. Clear tables before reseeding." };
    }

    // Insert agents
    const { error: aErr } = await sb.from("maia_agents").insert(
      MOCK_AGENTS.map((a) => ({
        id: a.id,
        org_id: a.org_id,
        name: a.name,
        type: a.type,
        status: a.status,
        autonomy: a.autonomy,
        description: a.description,
        config: a.config,
        created_by: a.created_by,
        created_at: a.created_at,
        deployed_at: a.deployed_at ?? null,
      })),
    );
    if (aErr) return { ok: false, error: `Agents: ${aErr.message}` };

    // Insert runs (only Fatigue Guardian has runs in mock)
    const runsPayload = MOCK_RUNS.map((r) => ({
      id: r.id,
      agent_id: r.agent_id,
      org_id: MOCK_AGENTS[0].org_id,
      triggered_at: r.triggered_at,
      trigger_type: r.trigger_type,
      trigger_payload: r.trigger_payload,
      reasoning: r.reasoning,
      proposed_action: r.proposed_action,
      counterfactual: r.counterfactual,
      status: r.status,
      confidence_score: r.confidence_score,
      approved_by: r.approved_by ?? null,
      approved_at: r.approved_at ?? null,
      executed_at: r.executed_at ?? null,
      outcome: r.outcome ?? null,
      affected_staff_ids: r.affected_staff_ids,
      estimated_savings: r.estimated_savings,
      response_time_seconds: r.response_time_seconds ?? null,
    }));

    // Insert in chunks of 50 to stay under any request size limits
    for (let i = 0; i < runsPayload.length; i += 50) {
      const chunk = runsPayload.slice(i, i + 50);
      const { error: rErr } = await sb.from("maia_agent_runs").insert(chunk);
      if (rErr) return { ok: false, error: `Runs (chunk ${i}): ${rErr.message}` };
    }

    return { ok: true, agents: MOCK_AGENTS.length, runs: MOCK_RUNS.length };
  } catch (e) {
    return { ok: false, error: String((e as Error).message ?? e) };
  }
}

export { AGENT_TEMPLATES };

// ── Realtime helper ──────────────────────────────────────────────────────
// A subscription that silently no-ops when Realtime isn't enabled on the
// table. Avoids breaking the UI for anyone who hasn't toggled Realtime in
// Supabase Dashboard → Database → Replication.

function useRealtimeOn(
  table: "maia_agents" | "maia_agent_runs" | "maia_agent_events",
  onChange: () => void,
  extras?: { filter?: string },
) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    const sb = createClient();
    const channelName = `${table}${extras?.filter ? `:${extras.filter}` : ""}`;
    const channel = sb
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(extras?.filter ? { filter: extras.filter } : {}),
        },
        () => cbRef.current(),
      )
      .subscribe();
    return () => {
      try {
        sb.removeChannel(channel);
      } catch {}
    };
  }, [table, extras?.filter]);
}
