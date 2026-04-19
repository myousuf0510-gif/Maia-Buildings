// Work orders + Dispatch Agent scoring.

import { PORTFOLIO_DATA } from "./portfolio";
import { WORKER_POOL, TRADE_META, type Worker, type Trade } from "./workers";

export type WorkOrderStatus =
  | "new"              // just arrived, not yet scored
  | "scoring"          // Dispatch Agent actively scoring candidates
  | "proposed"         // candidate recommended, awaiting approval (if below auto-assign threshold)
  | "assigned"         // auto-assigned or approved
  | "in_progress"      // worker en route / on site
  | "completed"
  | "blocked"          // compliance or missing skill
  | "escalated";       // no eligible worker — posted to open market

export type Urgency = "emergency" | "urgent" | "routine" | "scheduled";

export interface WorkOrder {
  id: string;
  buildingId: string;
  unit?: string;
  trade: Trade;
  urgency: Urgency;
  title: string;
  description: string;
  submittedAt: string;    // ISO
  submittedBy: string;    // tenant / staff / automated
  slaHours: number;
  estHours: number;
  status: WorkOrderStatus;
  assigneeId?: string;
  assignedAt?: string;
  autoAssigned?: boolean;
  score?: number;         // winning candidate's score
  rationale?: string;     // why MAIA picked them
}

// Deterministic RNG
function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TICKET_TEMPLATES: { trade: Trade; urgency: Urgency; title: string; desc: string; sla: number; est: number }[] = [
  { trade: "plumbing",            urgency: "emergency",   title: "Water leak ceiling",                desc: "Tenant reports water coming through living room ceiling from unit above.", sla: 1,  est: 2.5 },
  { trade: "plumbing",            urgency: "urgent",      title: "Toilet won't flush",                desc: "Bathroom toilet clogged, multiple plungers attempted.",                    sla: 4,  est: 1.0 },
  { trade: "plumbing",            urgency: "routine",     title: "Faucet dripping",                   desc: "Kitchen faucet has slow drip; cartridge replacement likely needed.",       sla: 48, est: 0.75 },
  { trade: "electrical",          urgency: "urgent",      title: "Breaker tripping repeatedly",       desc: "Kitchen breaker tripping when microwave + kettle run simultaneously.",     sla: 8,  est: 1.5 },
  { trade: "electrical",          urgency: "routine",     title: "Outlet not working",                desc: "Living room wall outlet has no power; GFCI test needed.",                   sla: 48, est: 1.0 },
  { trade: "hvac",                urgency: "emergency",   title: "No heat · unit",                    desc: "Tenant reports no heat — thermostat reads 14°C. Winter conditions.",        sla: 2,  est: 2.0 },
  { trade: "hvac",                urgency: "urgent",      title: "HVAC grinding noise",               desc: "Common area air handler making grinding sound.",                            sla: 8,  est: 2.5 },
  { trade: "hvac",                urgency: "scheduled",   title: "Quarterly HVAC service",            desc: "Scheduled preventive maintenance on rooftop units.",                       sla: 168, est: 4.0 },
  { trade: "general_maintenance", urgency: "routine",     title: "Door hinge loose",                  desc: "Unit front door hinge loose; needs tightening or replacement.",            sla: 48, est: 0.5 },
  { trade: "general_maintenance", urgency: "routine",     title: "Tile cracked in lobby",             desc: "Two floor tiles cracked near lobby entrance; replacement needed.",         sla: 72, est: 2.0 },
  { trade: "painting",            urgency: "scheduled",   title: "Unit repaint post-turnover",        desc: "Unit vacating; standard turnover repaint (walls + trim).",                sla: 72, est: 14  },
  { trade: "flooring",            urgency: "scheduled",   title: "LVP replacement post-turnover",     desc: "Unit vacating; luxury vinyl plank flooring replacement 540 sqft.",         sla: 120, est: 18 },
  { trade: "locksmith",           urgency: "urgent",      title: "Tenant locked out",                 desc: "Tenant locked out of unit; needs emergency lockout service.",              sla: 1,  est: 0.5 },
  { trade: "pest_control",        urgency: "urgent",      title: "Roaches reported · Unit",           desc: "Tenant reports cockroach sightings in kitchen.",                            sla: 24, est: 1.5 },
  { trade: "cleaning",            urgency: "scheduled",   title: "Turnover deep clean",               desc: "Unit vacating; full turnover clean including appliances + carpets.",        sla: 48, est: 6.0 },
  { trade: "cleaning",            urgency: "routine",     title: "Common area weekly clean",          desc: "Standard weekly lobby + hallway cleaning.",                                 sla: 24, est: 3.5 },
  { trade: "landscaping",         urgency: "scheduled",   title: "Spring cleanup",                    desc: "Seasonal lawn cleanup + shrub trimming.",                                   sla: 120, est: 5.0 },
  { trade: "appliance",           urgency: "urgent",      title: "Fridge not cooling",                desc: "Tenant reports refrigerator not maintaining temperature.",                 sla: 8,  est: 1.75 },
  { trade: "appliance",           urgency: "routine",     title: "Dishwasher install",                desc: "New dishwasher needs installation after tenant's own failed.",              sla: 72, est: 1.5 },
  { trade: "fire_safety",         urgency: "scheduled",   title: "Fire alarm annual inspection",      desc: "Annual fire alarm system inspection required by Ontario Fire Code.",       sla: 168, est: 6.0 },
  { trade: "elevator",            urgency: "urgent",      title: "Elevator stuck between floors",     desc: "Elevator #2 stuck between floors 6 and 7; fire dept notified.",            sla: 1,  est: 3.0 },
  { trade: "elevator",            urgency: "scheduled",   title: "Monthly elevator maintenance",      desc: "Scheduled monthly maintenance per TSSA requirements.",                      sla: 168, est: 2.5 },
  { trade: "roofing",             urgency: "urgent",      title: "Roof leak reported",                desc: "Water stain spreading on top-floor unit ceiling after heavy rain.",        sla: 8,  est: 4.0 },
];

function generateOrders(): WorkOrder[] {
  const rng = mulberry32(1_618_033);
  const orders: WorkOrder[] = [];
  const now = Date.now();
  const count = 240;  // active + recent orders across the full portfolio
  for (let i = 0; i < count; i++) {
    const tpl = TICKET_TEMPLATES[Math.floor(rng() * TICKET_TEMPLATES.length)];
    const building = PORTFOLIO_DATA[Math.floor(rng() * PORTFOLIO_DATA.length)];
    // Timestamp weighted toward recent
    const hoursAgo = Math.floor(Math.pow(rng(), 1.4) * 72);
    const submittedAt = new Date(now - hoursAgo * 3600_000).toISOString();

    // Unit number for residential
    const unit = building.class.startsWith("multifamily")
      ? `${Math.floor(1 + rng() * (building.floors - 1))}${String(Math.floor(1 + rng() * 20)).padStart(2, "0")}`
      : undefined;

    const statusRoll = rng();
    let status: WorkOrderStatus;
    if (hoursAgo < 1 && statusRoll < 0.3) status = "new";
    else if (hoursAgo < 2 && statusRoll < 0.4) status = "scoring";
    else if (statusRoll < 0.05) status = "blocked";
    else if (statusRoll < 0.12) status = "escalated";
    else if (statusRoll < 0.2) status = "proposed";
    else if (statusRoll < 0.55) status = "assigned";
    else if (statusRoll < 0.78) status = "in_progress";
    else status = "completed";

    orders.push({
      id: `wo-${String(i + 1).padStart(4, "0")}`,
      buildingId: building.id,
      unit,
      trade: tpl.trade,
      urgency: tpl.urgency,
      title: tpl.title,
      description: tpl.desc,
      submittedAt,
      submittedBy: rng() > 0.3 ? "Tenant" : rng() > 0.5 ? "Building manager" : "Preventive maintenance",
      slaHours: tpl.sla,
      estHours: tpl.est,
      status,
    });
  }

  // Sort newest first
  orders.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  // Assign winning scored candidate for orders that should have one
  for (const o of orders) {
    if (o.status === "assigned" || o.status === "in_progress" || o.status === "completed" || o.status === "proposed") {
      const ranked = scoreCandidates(o);
      if (ranked.length > 0) {
        const winner = ranked[0];
        o.assigneeId = winner.worker.id;
        o.score = winner.score;
        o.rationale = winner.rationale;
        o.assignedAt = new Date(new Date(o.submittedAt).getTime() + (2 + rng() * 18) * 60_000).toISOString();
        o.autoAssigned = winner.score >= 80;
      }
    }
  }

  return orders;
}

// ─── Dispatch scoring ────────────────────────────────────────────────────────

export interface CandidateScore {
  worker: Worker;
  score: number;
  factors: {
    skill: number;
    availability: number;
    cost: number;
    fairness: number;
    quality: number;
  };
  blocked?: string;
  rationale: string;
}

export function scoreCandidates(order: WorkOrder): CandidateScore[] {
  const candidates = WORKER_POOL
    .filter((w) => w.trades.includes(order.trade))
    .map((w) => scoreOne(w, order));
  // Sort by score descending
  return candidates.sort((a, b) => b.score - a.score);
}

function scoreOne(w: Worker, order: WorkOrder): CandidateScore {
  // Block gates first
  let blocked: string | undefined;
  if (w.type === "contractor") {
    if (!w.insuranceValid) blocked = "CGL insurance lapsed";
    else if (!w.wsibValid) blocked = "WSIB clearance lapsed";
  }
  if (!w.licenseValid) blocked = "Trade license lapsed";

  // Factor scoring 0–100 each
  const skill = 100; // all candidates already filtered to skill match; weight later if sub-skills matter
  const availability = w.availableNow ? 100 - Math.min(80, w.activeAssignments * 22) : 30;
  // Cost: lower rate = higher score. Employees tend to win here vs contractors.
  const costRange = 220 - 40; // loose bounds
  const cost = Math.max(10, Math.min(100, 100 - ((w.hourlyRate - 40) / costRange) * 100));
  const fairness = 100 - Math.min(60, w.completionsThisMonth * 1.8); // heavy load → lower fairness score
  const quality = (w.rating / 5) * 70 + (w.slaHitRatePct / 100) * 30;

  // Weights — prefer skill + quality for urgent, cost + fairness for routine
  const urgentWeights = { skill: 0.22, availability: 0.26, cost: 0.12, fairness: 0.14, quality: 0.26 };
  const routineWeights = { skill: 0.20, availability: 0.18, cost: 0.28, fairness: 0.22, quality: 0.12 };
  const w_ = order.urgency === "emergency" || order.urgency === "urgent" ? urgentWeights : routineWeights;

  let score = Math.round(
    skill * w_.skill +
    availability * w_.availability +
    cost * w_.cost +
    fairness * w_.fairness +
    quality * w_.quality,
  );

  // Employee preference bonus when comparable
  if (w.type === "employee") score += 3;
  // Top-rated contractor bonus
  if (w.badges?.includes("Top rated")) score += 2;

  if (blocked) score = 0;

  const rationale = buildRationale(w, order, { skill, availability, cost, fairness, quality });

  return {
    worker: w,
    score,
    factors: { skill, availability, cost, fairness, quality },
    blocked,
    rationale,
  };
}

function buildRationale(
  w: Worker,
  o: WorkOrder,
  factors: { skill: number; availability: number; cost: number; fairness: number; quality: number },
): string {
  const bits: string[] = [];
  bits.push(w.type === "employee" ? "In-house (cost-optimal)" : `Contractor · ${w.company}`);
  if (o.urgency === "emergency" || o.urgency === "urgent") {
    bits.push(w.availableNow ? "available now" : "will be available shortly");
  }
  if (w.rating >= 4.7) bits.push(`${w.rating.toFixed(1)}★ rating`);
  else if (w.rating >= 4.3) bits.push(`${w.rating.toFixed(1)}★`);
  if (w.slaHitRatePct >= 95) bits.push(`${w.slaHitRatePct}% SLA hit rate`);
  bits.push(`${TRADE_META[o.trade].label.toLowerCase()} specialist`);
  if (factors.fairness < 60) bits.push("high load — fairness penalty applied");
  return bits.join(" · ");
}

export const WORK_ORDERS = generateOrders();

export const URGENCY_META: Record<Urgency, { label: string; color: string; bg: string }> = {
  emergency: { label: "Emergency", color: "#DC2626", bg: "rgba(239,68,68,0.1)" },
  urgent:    { label: "Urgent",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  routine:   { label: "Routine",   color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  scheduled: { label: "Scheduled", color: "#64748B", bg: "rgba(100,116,139,0.08)" },
};

export const STATUS_META: Record<WorkOrderStatus, { label: string; color: string; bg: string }> = {
  new:          { label: "New",           color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  scoring:      { label: "Scoring",       color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  proposed:     { label: "Proposed",      color: "#D97706", bg: "rgba(245,158,11,0.1)" },
  assigned:     { label: "Assigned",      color: "#059669", bg: "rgba(16,185,129,0.08)" },
  in_progress:  { label: "In progress",   color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  completed:    { label: "Completed",     color: "#64748B", bg: "rgba(100,116,139,0.08)" },
  blocked:      { label: "Blocked",       color: "#DC2626", bg: "rgba(239,68,68,0.1)" },
  escalated:    { label: "Escalated",     color: "#EA580C", bg: "rgba(234,88,12,0.1)" },
};
