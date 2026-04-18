"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { Agent, AgentRun } from "@/lib/agents/types";

/**
 * IntelligenceGraph — D3 force-directed network of the entire decisions ecosystem.
 *
 * Nodes:
 *   agent    — MAIA agents (large, center of gravity)
 *   run      — individual decisions (medium, status-colored)
 *   staff    — affected workers (small, role-colored)
 *   outcome  — observed outcome (tiny, effective/ineffective)
 *
 * Edges: agent → run → staff and run → outcome
 *
 * Interactions: drag, zoom, pan, hover, click-to-inspect.
 */

export type GraphNode = {
  id: string;
  label: string;
  kind: "agent" | "run" | "staff" | "outcome";
  status?: string;
  confidence?: number;
  effective?: boolean;
  fatigue?: number;
  agentType?: string;
  size: number;
  color: string;
  // d3 mutates these
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
};

export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
  kind: "agent_run" | "run_staff" | "run_outcome";
  strength?: number;
};

const KIND_COLORS = {
  agent:   "#2563EB",
  run:     "#7C3AED",
  staff:   "#0891B2",
  outcome: "#10B981",
};

export function IntelligenceGraph({
  agents,
  runs,
  width = 1200,
  height = 720,
}: {
  agents: Agent[];
  runs: AgentRun[];
  width?: number;
  height?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const { nodes, links } = useMemo(
    () => buildGraph(agents, runs),
    [agents, runs],
  );

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Root container for zoom/pan
    const root = svg.append("g").attr("class", "root");

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on("zoom", (event) => {
        root.attr("transform", event.transform);
      });
    svg.call(zoom);

    // Fit-to-view on mount
    const initialTransform = d3.zoomIdentity.translate(width / 2, height / 2);
    svg.call(zoom.transform, initialTransform);

    // Arrow marker for directional hints
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 14)
      .attr("refY", 0)
      .attr("markerWidth", 4)
      .attr("markerHeight", 4)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "rgba(15,23,42,0.25)");

    // Links
    const link = root
      .append("g")
      .attr("class", "links")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) => {
        if (d.kind === "agent_run") return "rgba(37,99,235,0.2)";
        if (d.kind === "run_staff") return "rgba(8,145,178,0.22)";
        return "rgba(16,185,129,0.3)";
      })
      .attr("stroke-width", (d) => {
        if (d.kind === "agent_run") return 1.2;
        if (d.kind === "run_staff") return 0.8;
        return 1.0;
      });

    // Nodes
    const nodeG = root
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("cursor", "pointer")
      .call(drag() as unknown as (sel: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown>) => void);

    // Node halo (subtle glow per kind)
    nodeG
      .append("circle")
      .attr("class", "halo")
      .attr("r", (d) => d.size * 2.2)
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.08);

    // Node core
    nodeG
      .append("circle")
      .attr("class", "core")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => d.color)
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", (d) => (d.kind === "agent" ? 2.5 : 1.5))
      .attr("filter", (d) => (d.kind === "agent" ? "url(#agent-glow)" : null));

    // Inner dot for contrast on larger nodes
    nodeG
      .filter((d) => d.size > 8)
      .append("circle")
      .attr("r", (d) => d.size * 0.35)
      .attr("fill", "#FFFFFF")
      .attr("opacity", 0.85);

    // Labels for agents + bigger staff nodes
    nodeG
      .filter((d) => d.kind === "agent" || (d.kind === "staff" && d.size >= 6))
      .append("text")
      .attr("dy", (d) => d.size + 14)
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => (d.kind === "agent" ? 11 : 9.5))
      .attr("font-weight", (d) => (d.kind === "agent" ? 700 : 500))
      .attr("fill", "#0F172A")
      .attr("paint-order", "stroke")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 3)
      .text((d) => d.label);

    // Glow filter for agents
    const defs = svg.select("defs");
    const glow = defs
      .append("filter")
      .attr("id", "agent-glow")
      .attr("x", "-50%")
      .attr("y", "-50%")
      .attr("width", "200%")
      .attr("height", "200%");
    glow
      .append("feGaussianBlur")
      .attr("stdDeviation", 6)
      .attr("result", "blur");
    const merge = glow.append("feMerge");
    merge.append("feMergeNode").attr("in", "blur");
    merge.append("feMergeNode").attr("in", "SourceGraphic");

    // Interactions
    nodeG
      .on("mouseenter", function (_, d) {
        setHoveredNode(d);
        d3.select(this).select<SVGCircleElement>("circle.core").attr("r", d.size * 1.25);
      })
      .on("mouseleave", function (_, d) {
        setHoveredNode(null);
        d3.select(this).select<SVGCircleElement>("circle.core").attr("r", d.size);
      })
      .on("click", (_, d) => setSelectedNode(d));

    // Simulation
    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((l) => {
            if (l.kind === "agent_run") return 120;
            if (l.kind === "run_staff") return 60;
            return 30;
          })
          .strength((l) => l.strength ?? 0.3),
      )
      .force(
        "charge",
        d3
          .forceManyBody<GraphNode>()
          .strength((d) => {
            if (d.kind === "agent") return -550;
            if (d.kind === "run") return -85;
            return -30;
          }),
      )
      .force("collision", d3.forceCollide<GraphNode>().radius((d) => d.size * 1.3 + 2))
      .force("center", d3.forceCenter(0, 0).strength(0.02))
      .alpha(1)
      .alphaDecay(0.018);

    sim.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x ?? 0)
        .attr("y1", (d) => (d.source as GraphNode).y ?? 0)
        .attr("x2", (d) => (d.target as GraphNode).x ?? 0)
        .attr("y2", (d) => (d.target as GraphNode).y ?? 0);
      nodeG.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    // Drag behavior
    function drag() {
      return d3
        .drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
    }

    return () => {
      sim.stop();
    };
  }, [nodes, links, width, height]);

  return (
    <div className="relative solid-card overflow-hidden" style={{ height }}>
      <svg ref={svgRef} width="100%" height="100%" style={{ display: "block" }} />

      {/* Legend */}
      <div
        className="absolute top-4 left-4 px-3.5 py-2.5 rounded-xl"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(15,23,42,0.08)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        }}
      >
        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">
          Legend
        </div>
        <div className="space-y-1.5 text-[11px]">
          <LegendRow color={KIND_COLORS.agent} size={10} label="Agent" count={nodes.filter((n) => n.kind === "agent").length} />
          <LegendRow color={KIND_COLORS.run} size={7} label="Decision" count={nodes.filter((n) => n.kind === "run").length} />
          <LegendRow color={KIND_COLORS.staff} size={5} label="Staff" count={nodes.filter((n) => n.kind === "staff").length} />
          <LegendRow color={KIND_COLORS.outcome} size={3.5} label="Outcome" count={nodes.filter((n) => n.kind === "outcome").length} />
        </div>
      </div>

      {/* Zoom affordance */}
      <div
        className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg font-mono text-[10px] text-slate-500"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(15,23,42,0.06)",
        }}
      >
        scroll to zoom · drag to pan · drag nodes to reposition
      </div>

      {/* Hover tooltip */}
      {hoveredNode && !selectedNode && (
        <div
          className="absolute top-4 right-4 px-3 py-2 rounded-lg text-[11.5px] pointer-events-none max-w-[280px]"
          style={{
            background: "rgba(15,23,42,0.92)",
            backdropFilter: "blur(10px)",
            color: "#F8FAFC",
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          <div className="font-bold mb-0.5">{hoveredNode.label}</div>
          <div className="text-[10px] text-slate-300 uppercase tracking-wider">
            {hoveredNode.kind}
            {hoveredNode.status && ` · ${hoveredNode.status}`}
          </div>
          {hoveredNode.confidence !== undefined && (
            <div className="text-[10px] text-slate-400 mt-1">
              confidence {Math.round(hoveredNode.confidence * 100)}%
            </div>
          )}
        </div>
      )}

      {/* Selected node detail panel */}
      {selectedNode && (
        <div
          className="absolute top-4 right-4 w-[320px] rounded-xl animate-fade-in"
          style={{
            background: "rgba(255,255,255,0.98)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(15,23,42,0.08)",
            boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
          }}
        >
          <div
            className="px-4 py-3 flex items-center gap-2.5 border-b border-slate-100"
            style={{ background: selectedNode.color, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
          >
            <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">
                {selectedNode.kind}
              </div>
              <div className="text-[13px] font-bold text-white truncate">
                {selectedNode.label}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="w-6 h-6 rounded grid place-items-center text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              ×
            </button>
          </div>
          <div className="p-4 space-y-2.5 text-[11.5px]">
            {selectedNode.kind === "agent" && (
              <>
                <DetailRow label="Type">{selectedNode.agentType}</DetailRow>
                <DetailRow label="Status">{selectedNode.status}</DetailRow>
              </>
            )}
            {selectedNode.kind === "run" && (
              <>
                <DetailRow label="Status">{selectedNode.status}</DetailRow>
                {selectedNode.confidence !== undefined && (
                  <DetailRow label="Confidence">
                    {Math.round(selectedNode.confidence * 100)}%
                  </DetailRow>
                )}
                <DetailRow label="Run ID">
                  <span className="font-mono">{selectedNode.id}</span>
                </DetailRow>
              </>
            )}
            {selectedNode.kind === "staff" && (
              <>
                <DetailRow label="Staff ID">
                  <span className="font-mono text-[10px]">{selectedNode.id}</span>
                </DetailRow>
                {selectedNode.fatigue !== undefined && (
                  <DetailRow label="Fatigue">{selectedNode.fatigue}</DetailRow>
                )}
              </>
            )}
            {selectedNode.kind === "outcome" && (
              <DetailRow label="Effective">
                {selectedNode.effective ? "Yes" : "No"}
              </DetailRow>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Graph construction ─────────────────────────────────────────────────

function buildGraph(agents: Agent[], runs: AgentRun[]) {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const seenStaff = new Set<string>();

  // Agents — central large nodes
  for (const a of agents) {
    nodes.push({
      id: a.id,
      label: a.name,
      kind: "agent",
      status: a.status,
      agentType: a.type,
      size: a.status === "active" ? 22 : 13,
      color: KIND_COLORS.agent,
    });
  }

  // Take the most recent ~40 runs for a viewable graph
  const recentRuns = runs.slice(0, 40);

  for (const r of recentRuns) {
    // Run node — color-coded by status
    const statusColor =
      r.status === "executed"
        ? "#10B981"
        : r.status === "rejected"
          ? "#EF4444"
          : r.status === "proposed" || r.status === "notified"
            ? "#F59E0B"
            : "#94A3B8";
    nodes.push({
      id: r.id,
      label: (r.trigger_payload.staff_name as string) ?? r.id,
      kind: "run",
      status: r.status,
      confidence: r.confidence_score,
      size: 7,
      color: statusColor,
    });
    links.push({ source: r.agent_id, target: r.id, kind: "agent_run", strength: 0.6 });

    // Staff node — cluster runs affecting same person
    for (const staffId of r.affected_staff_ids ?? []) {
      if (!seenStaff.has(staffId)) {
        seenStaff.add(staffId);
        const staffName =
          (r.trigger_payload.staff_name as string) ?? staffId.slice(0, 8);
        nodes.push({
          id: `staff-${staffId}`,
          label: staffName,
          kind: "staff",
          fatigue: r.trigger_payload.fatigue_score as number | undefined,
          size: 6,
          color: KIND_COLORS.staff,
        });
      }
      links.push({
        source: r.id,
        target: `staff-${staffId}`,
        kind: "run_staff",
        strength: 0.8,
      });
    }

    // Outcome node — only for runs with observed outcomes
    if (r.outcome) {
      const outcomeId = `outcome-${r.id}`;
      nodes.push({
        id: outcomeId,
        label: r.outcome.effective ? "Effective" : "Neutral",
        kind: "outcome",
        effective: r.outcome.effective,
        size: 3.5,
        color: r.outcome.effective ? "#10B981" : "#94A3B8",
      });
      links.push({ source: r.id, target: outcomeId, kind: "run_outcome", strength: 0.5 });
    }
  }

  return { nodes, links };
}

function LegendRow({
  color,
  size,
  label,
  count,
}: {
  color: string;
  size: number;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="rounded-full"
        style={{ width: size * 1.6, height: size * 1.6, background: color }}
      />
      <span className="text-slate-700 font-medium">{label}</span>
      <span className="font-mono text-slate-400 tabular-nums text-[10px]">
        {count}
      </span>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 w-[70px] shrink-0">
        {label}
      </span>
      <span className="text-slate-700 flex-1">{children}</span>
    </div>
  );
}
