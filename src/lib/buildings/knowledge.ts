// MAIA Buildings — Knowledge Hub.
// The documentation MAIA agents read when they reason. Real content for real
// operations: Ontario regulations, Royal York SOPs, emergency protocols,
// tenant communication templates, integration playbooks.

export type DocCategory =
  | "regulation"    // Ontario RTA, Fire Code, TSSA
  | "sop"           // Royal York internal SOPs
  | "emergency"     // emergency response playbooks
  | "template"      // tenant communication templates
  | "integration"   // integration playbooks (Yardi, BMS, etc.)
  | "agent_playbook"; // how each agent reasons

export interface KnowledgeDoc {
  id: string;
  category: DocCategory;
  title: string;
  summary: string;
  body: string;             // markdown-ish
  version: string;
  lastUpdated: string;      // ISO
  jurisdiction?: string;
  referencedBy: string[];   // agent ids that cite this
  tags: string[];
  wordCount: number;
}

const DOCS: KnowledgeDoc[] = [
  // ─── Regulations ──────────────────────────────────────────────────────────
  {
    id: "on-rta-overview",
    category: "regulation",
    title: "Ontario Residential Tenancies Act — operator's summary",
    summary: "Practical summary of the RTA provisions Royal York operates under: entry, arrears, notices, rent increases, termination.",
    jurisdiction: "ON-CA",
    version: "2026-Q2",
    lastUpdated: "2026-04-02",
    tags: ["rta", "ontario", "tenancy", "eviction", "N4", "N5", "N1", "entry"],
    referencedBy: ["arrears_sentinel", "compliance_sentinel", "turnover_orchestrator"],
    wordCount: 1_840,
    body: `
**Scope.** Applies to residential tenancies in Ontario. Covers entry, notices,
rent increases, termination, and dispute resolution through the Landlord and
Tenant Board (LTB).

**Entry (s.27).** Landlord must give 24-hour written notice for non-emergency
entry. Notice must state the reason, day, and a time between 8:00 and 20:00.
Emergency entry (imminent danger, tenant consent, abandonment) is an exception.

**Rent due + arrears.**
- Rent is due on the day specified in the lease.
- N4 notice for non-payment may only be issued on the day *after* rent is due
  (s.59). It gives the tenant 14 days to pay; paying in full voids the notice.
- After day 14 without payment, the landlord may file an L1 application with
  the LTB.
- The tenant may pay at any time before the hearing and stop the eviction
  (unless they've done so in the prior 6 months — void rule).

**Rent increases (s.116, s.120).**
- Minimum 90 days notice using form N1.
- Cannot exceed the annual guideline unless LTB grants an above-guideline
  increase (AGI) for capital work or utility cost pass-through.
- Only one increase in any 12-month period.
- Units built after 2018 are exempt from the guideline (post-2018 carve-out).

**Termination by tenant (s.44).**
- 60 days notice minimum on month-to-month; notice period aligned to rent
  period-end.
- 28 days for weekly tenancies.

**Termination by landlord.**
- N4 — non-payment (s.59). 14-day cure window.
- N5 — persistent late payment (s.62, 63). First N5 is void-able with fix.
- N6 — illegal act / serious damage (s.63, 65). 10/20-day.
- N7 — wilful damage / impairs safety (s.66). 10-day.
- N12 — personal/purchaser use (s.48, 49). 60-day + compensation required.
- N13 — demolition/conversion/major repairs (s.50). 120-day + compensation.

**Vital services (s.21).**
Heat, electricity, fuel, gas, hot and cold water. Interruption triggers
emergency-response obligations. Minimum heat threshold applies (20°C Sep 1 –
Jun 15 in municipalities that adopted the bylaw, which includes Toronto).

**How MAIA applies this.** Arrears Sentinel never auto-sends an N4 — it
drafts and holds for human approval. Compliance Sentinel blocks any proposed
landlord entry that would violate the 24-hour notice rule. All communication
templates referencing N-notices are generated with the correct form numbers
and effective dates.
`.trim(),
  },
  {
    id: "on-fire-code",
    category: "regulation",
    title: "Ontario Fire Code — inspection cadence cheat sheet",
    summary: "What needs inspecting, how often, and who can do it. Sourced from OFC 2021 rev.",
    jurisdiction: "ON-CA",
    version: "2021-rev",
    lastUpdated: "2026-03-18",
    tags: ["fire code", "inspection", "sprinkler", "alarm", "extinguisher"],
    referencedBy: ["compliance_sentinel"],
    wordCount: 920,
    body: `
**Fire alarm system (OFC 6.3.1).**
- Annual inspection + test by a qualified technician.
- Monthly visual check by building staff.
- Record in the building fire safety log.

**Sprinkler system (OFC 6.4).**
- Quarterly inspection (gauges, control valves, water-flow alarms).
- Annual main drain test + alarm test.
- 5-year internal inspection of the main + obstructed investigation.

**Emergency lighting (OFC 6.5).**
- Monthly 30-second functional test.
- Annual full-duration test (90-minute drain).

**Portable extinguishers (OFC 6.2.7).**
- Monthly visual inspection.
- Annual maintenance + hydrostatic test every 5 or 12 years depending on
  type.

**Standpipe + hose (OFC 6.6).**
- Annual inspection + flow test.
- 5-year hydrostatic test.

**Fire safety plan.**
- Must be on-site, reviewed annually.
- Includes egress plan, tenant notification procedure, fire warden roles.

**Vital-service interaction.** A shut-down of fire alarm, sprinkler, or
standpipe beyond 4h requires a Fire Watch (trained person continuously
patrolling) and notification to the Chief Fire Official.

**How MAIA applies this.** Compliance Sentinel auto-books inspections at
building + system granularity. The ±90-day horizon surfaces every overdue or
upcoming inspection with the OFC citation attached.
`.trim(),
  },
  {
    id: "tssa-elevator",
    category: "regulation",
    title: "TSSA Elevating Devices — maintenance + inspection",
    summary: "Ontario elevator regulatory requirements administered by the Technical Standards and Safety Authority.",
    jurisdiction: "ON-CA",
    version: "CSA B44 / O. Reg. 209/01",
    lastUpdated: "2026-02-11",
    tags: ["tssa", "elevator", "CSA B44", "safety"],
    referencedBy: ["compliance_sentinel"],
    wordCount: 640,
    body: `
**Licensing.** Every elevating device requires a TSSA licence and annual
inspection.

**Routine maintenance.** Monthly maintenance by a licensed elevator mechanic.
Log kept in the machine room + digital copy uploaded to MAIA.

**Phase II firefighter recall.** Monthly test that elevator recalls to the
designated level when fire alarm activates (CSA B44 §2.27).

**5-year load test.** Full-load test + safety device verification on a 5-year
cycle.

**Entrapment.** Any entrapment must be reported to TSSA within 24 hours if
an injury occurred. All entrapments logged internally.

**Shut-down.** Elevator shut-downs >48h (non-emergency) require tenant
notification if they are the primary accessible route.

**How MAIA applies this.** Compliance Sentinel maintains the per-elevator
maintenance log, flags missed monthly PMs as Critical, and dispatches the
licensed mechanic pool (TSSA Elevator Co. in the directory) through the
Dispatch Agent.
`.trim(),
  },

  // ─── SOPs ──────────────────────────────────────────────────────────────────
  {
    id: "sop-work-order-intake",
    category: "sop",
    title: "SOP · Work order intake → acknowledgement → dispatch",
    summary: "The Royal York standard for every work order from submission to assignee on-site.",
    version: "v4.2",
    lastUpdated: "2026-03-04",
    tags: ["sop", "work order", "dispatch", "sla"],
    referencedBy: ["dispatch_agent", "work_order_market"],
    wordCount: 1_120,
    body: `
**Intake channels.** Tenant app, tenant phone, building manager, preventive
maintenance cron, emergency line. Every intake is normalised into the
\`ry_work_orders\` record.

**Acknowledgement SLA.**
- Emergency: ≤15 min (tenant-facing acknowledgement via app + SMS)
- Urgent: ≤2 business hours
- Routine: ≤4 business hours
- Scheduled: next business day

**Triage rules.**
- Life-safety + property-damaging (flooding, gas, fire, no-heat in winter) →
  emergency, auto-escalate to on-call mechanic and manager.
- Vital-service interruption (RTA s.21) → auto-emergency even if tenant
  submitted as "routine".
- Child present / accessibility → bump severity by one tier.

**Dispatch rules (Dispatch Agent).**
1. Filter worker pool by trade match.
2. Filter by active license + insurance + WSIB (hard gate).
3. Score by availability, cost, fairness, quality (see Dispatch Scoring doc).
4. Auto-assign when top score ≥80, otherwise propose for human approval.
5. Fairness: no single contractor exceeds 25% of monthly volume.

**Escalation.**
- No eligible worker → Work Order Market (public posting) within 10 min.
- Market unfilled after 30 min for emergency, 4h for urgent → building
  manager is notified and can approve a rate exception or reach outside the
  normal pool.

**Completion.**
- Tech marks complete in-app with photo + notes.
- Tenant satisfaction prompt (1–5) within 24h.
- Quality audit triggered if rating ≤3 or if random 20% sample hits this
  work order.

**How MAIA applies this.** Dispatch Agent + Work Order Market implement the
scoring and SLA rules. Outcome Observer records tenant satisfaction +
quality audit results in the Decisions Ledger.
`.trim(),
  },
  {
    id: "sop-turnover-pipeline",
    category: "sop",
    title: "SOP · Unit turnover pipeline",
    summary: "Target 14-day unit flip: notice → inspection → repair → paint → clean → listed → showings → leased.",
    version: "v3.1",
    lastUpdated: "2026-02-22",
    tags: ["turnover", "vacancy", "flip", "leasing"],
    referencedBy: ["turnover_orchestrator", "vacancy_watcher"],
    wordCount: 880,
    body: `
**Target window.** 14 calendar days from key turn-in to new tenant move-in.
Each day over target is an estimated $60–110 in holding cost depending on
unit.

**Critical path (normal case).**
1. **Notice received** (day -60 typical) — tenant gives N9 / verbal notice.
2. **Pre-move-out inspection** (day -14) — staff walk-through, flag repairs.
3. **Repair** (day 1–3) — trades scheduled. Dispatch Agent prioritises
   in-house plumbers / electricians / general maintenance first.
4. **Paint** (day 3–7) — full-wall neutral, trim touch-up.
5. **Clean** (day 7–9) — deep clean, carpets/LVP, appliance interiors.
6. **Listed** (day 8) — unit posted on Royal York's lease portal with
   photos shot by in-house photographer.
7. **Showings** (day 8–12) — self-guided tours enabled.
8. **Leased** (day 12–14) — application approved, lease signed, keys cut.

**Parallel work.** Paint + clean can overlap with repair on non-overlapping
areas. Listing photos shot before final clean touch-up.

**Bottleneck flags.**
- Painters booked solid → offer contract painter from the directory.
- Flooring delivery delay → check alternate supplier (Flooring Experts GTA).
- Inspection sign-off delay → escalate to building manager.

**How MAIA applies this.** Turnover Orchestrator sequences the work orders,
flags bottlenecks, and publishes the listing when the pipeline enters the
"clean" stage.
`.trim(),
  },
  {
    id: "sop-tenant-complaint-triage",
    category: "sop",
    title: "SOP · Tenant complaint triage",
    summary: "Three-tier triage: maintenance, neighbour dispute, habitability. Each has a distinct SLA and escalation path.",
    version: "v2.8",
    lastUpdated: "2026-01-14",
    tags: ["tenant", "complaint", "habitability", "triage"],
    referencedBy: ["dispatch_agent"],
    wordCount: 680,
    body: `
**Tier 1 · Maintenance.** Anything breaking in the unit or common area.
Route directly into the work order pipeline.

**Tier 2 · Neighbour dispute.** Noise, smell, pet, parking. Two strikes:
warning letter (templated), then mediation via building manager. LTB N5
territory if pattern continues.

**Tier 3 · Habitability.** Pests, mould, no heat, water quality, major
structural. These are RTA s.21 territory — vital service failure. Auto-
emergency work order + tenant acknowledgement within 1 hour.

**Empathy first.** Every tenant-facing acknowledgement opens with
"We hear you and we're on it" phrasing. Sterility scores in tenant NPS
drop 8 pts when confirmations sound robotic.
`.trim(),
  },

  // ─── Emergency response ───────────────────────────────────────────────────
  {
    id: "emerg-flooding",
    category: "emergency",
    title: "Emergency · Unit flooding response",
    summary: "First 60 minutes: isolate, mitigate, document. Common-cause checklist + rebuild flow.",
    version: "v5.0",
    lastUpdated: "2026-03-30",
    tags: ["emergency", "flooding", "water damage", "mitigation"],
    referencedBy: ["dispatch_agent", "work_order_market"],
    wordCount: 540,
    body: `
**Minute 0–5 · Locate + isolate.** Source of water. Main shut-off location
per unit is logged in the building facts. Shut off water to unit + unit
above.

**Minute 5–15 · Mitigate.** Wet-vac deployed from the on-site kit. Open
windows if outside temp >5°C for evaporative drying. Photo everything.

**Minute 15–60 · Dispatch.** Apex Plumbing on-call (primary) or Dominion
Trades (secondary). Verify licence/insurance/WSIB before dispatch
(Dispatch Agent auto-handles).

**Hour 1+ · Restoration.** Moisture meter readings every 24h for 7 days.
Drywall cuts at affected junctions. Content inventory logged if tenant
belongings damaged (insurance claim prep).

**Escalation.** If the source is from a unit above that refused access,
follow RTA s.27 (24-hour entry notice) unless imminent danger — then entry
is permitted without notice, document justification contemporaneously.
`.trim(),
  },
  {
    id: "emerg-no-heat-winter",
    category: "emergency",
    title: "Emergency · No heat (winter)",
    summary: "RTA s.21 vital service. Winter response template + contractor escalation.",
    version: "v4.4",
    lastUpdated: "2026-02-02",
    tags: ["emergency", "heat", "winter", "rta s.21", "vital service"],
    referencedBy: ["dispatch_agent", "compliance_sentinel"],
    wordCount: 480,
    body: `
**Threshold.** Toronto bylaw: 20°C September 1 – June 15. Below that reading
with furnace/boiler failure = vital service interruption.

**Response.**
1. Deploy portable heater kit within 30 minutes (onsite with building
   manager).
2. Dispatch HVAC tech (ClimateCare HVAC primary, Northwind Heating
   secondary).
3. If >4 hours to repair, hotel voucher offered to affected tenants
   (Marriott partnership codes in the comms template).
4. Tenant communication at each milestone: acknowledged, ETA, tech on-site,
   restored.

**Documentation.** Incident logged in Decisions Ledger with timestamps.
Compliance Sentinel checks for recurring no-heat events on the same unit —
three in a 12-month window triggers a boiler/furnace replacement
recommendation.
`.trim(),
  },

  // ─── Tenant comms templates ──────────────────────────────────────────────
  {
    id: "tmpl-n4-cover",
    category: "template",
    title: "Template · N4 notice cover message",
    summary: "RTA-compliant plain-language cover communication that accompanies the formal N4 form.",
    version: "v2.1",
    lastUpdated: "2026-03-15",
    tags: ["template", "n4", "arrears", "communication"],
    referencedBy: ["arrears_sentinel"],
    wordCount: 190,
    body: `
Hello {{tenant_first_name}},

This message is to let you know that we've served you a Notice to End a
Tenancy Early for Non-payment of Rent (the N4 form you'll find attached).

**What this means.**
- The form gives you **14 days from today ({{termination_date}}) to pay
  the balance of $\{\{balance_owed\}\}** and stop the eviction process.
- Paying in full within that window automatically voids the notice.
- If you pay anything less or nothing, we may apply to the Landlord and
  Tenant Board for an eviction order.

**We'd rather work it out.** If you're facing a short-term hardship, call
or reply to set up a payment plan — we'll review options the same day.

Balance due: **$\{\{balance_owed\}\}**
Payment options: online portal, e-transfer, cheque at the office.

— Royal York Property Management
`.trim(),
  },
  {
    id: "tmpl-entry-notice",
    category: "template",
    title: "Template · 24-hour entry notice (RTA s.27)",
    summary: "Plain-language 24-hour entry notice complying with RTA s.27.",
    version: "v1.7",
    lastUpdated: "2026-02-28",
    tags: ["template", "entry", "rta s.27"],
    referencedBy: ["compliance_sentinel"],
    wordCount: 140,
    body: `
Hello {{tenant_first_name}},

We're letting you know — at least 24 hours in advance — that we'll need to
enter your unit at **{{address}}** for the reason below.

**When:** {{entry_date}} between {{entry_window}} (as required by the
Residential Tenancies Act, s.27, we've scheduled this between 8 a.m. and
8 p.m.).

**Reason:** {{reason}}

**Who's entering:** {{entry_party}} (ID available on request).

You don't need to be home. Please secure any pets or valuables. If this
time doesn't work, reply to suggest a better day — we have flexibility
with most non-urgent entries.

— Royal York Property Management
`.trim(),
  },

  // ─── Integration playbooks ───────────────────────────────────────────────
  {
    id: "integ-yardi-voyager",
    category: "integration",
    title: "Integration · Yardi Voyager",
    summary: "How Royal York's existing Yardi Voyager data flows into MAIA: tenants, leases, rent roll, work orders.",
    version: "v1.0",
    lastUpdated: "2026-04-01",
    tags: ["integration", "yardi", "rent roll", "tenants"],
    referencedBy: ["arrears_sentinel", "vacancy_watcher", "dispatch_agent"],
    wordCount: 620,
    body: `
**Direction.** Yardi → MAIA (primary), MAIA → Yardi (work orders).

**Data pulled from Yardi.**
- Tenants, units, leases, rent roll, arrears balance, payment history.
- Work orders already in Yardi (for history + de-duplication).
- Property master data.

**Sync cadence.** Every 30 minutes via Yardi Web Services (SOAP). Real-time
on rent payment events via webhook (opt-in; falls back to polling if the
webhook is not available).

**Data pushed to Yardi.**
- New work orders created in MAIA.
- Work order status updates (assigned, completed).
- Assignee identity (linked to Yardi's vendor record).

**Mapping.**
- Yardi unit code → \`ry_buildings.id + unit\`.
- Yardi tenant code → \`ry_tenants.id\`.
- Yardi vendor code → \`ry_workers.id\` where type="contractor".

**Auth.** Yardi Web Services username + password per property or per
database. Stored in Vercel secrets as \`YARDI_API_USER\` + \`YARDI_API_PASS\`.

**Edge cases.**
- Yardi's rent roll sometimes posts a same-day pay that doesn't hit
  Arrears Sentinel's snapshot — the 30-min reconciliation fixes this.
- Vendor cost sync requires Yardi's AP module.
`.trim(),
  },
  {
    id: "integ-stripe",
    category: "integration",
    title: "Integration · Stripe (rent collection)",
    summary: "Rent payment processing and webhooks that drive Arrears Sentinel.",
    version: "v1.2",
    lastUpdated: "2026-03-10",
    tags: ["integration", "stripe", "payments", "rent"],
    referencedBy: ["arrears_sentinel"],
    wordCount: 340,
    body: `
**What Stripe does for MAIA.**
- Card + ACH / pre-authorised debit for rent.
- Webhooks fire on every payment success, failure, or dispute.
- Arrears Sentinel subscribes to \`charge.succeeded\`, \`charge.failed\`,
  \`charge.dispute.created\`.

**Auth.** Restricted API key in \`STRIPE_SECRET_KEY\`. Webhook signing
secret in \`STRIPE_WEBHOOK_SECRET\`.

**Payment-to-arrears state transitions.**
- \`charge.succeeded\` → tenant arrears balance decremented + payment history
  updated → Arrears Sentinel re-scores risk.
- \`charge.failed\` → arrears balance reconciled with Yardi → risk re-scored.
- \`charge.dispute.created\` → tenant flagged for manual review, auto-escalation
  paused.
`.trim(),
  },
  {
    id: "integ-bms",
    category: "integration",
    title: "Integration · BMS (Johnson Controls / Siemens Desigo)",
    summary: "Building Management System integration for live HVAC, lighting, and equipment telemetry.",
    version: "v0.9 · pilot",
    lastUpdated: "2026-03-22",
    tags: ["integration", "bms", "johnson controls", "siemens", "hvac", "iot"],
    referencedBy: ["energy_optimizer"],
    wordCount: 410,
    body: `
**Supported systems.** Johnson Controls Metasys, Siemens Desigo CC,
Honeywell WEBs — all via BACnet/IP or their native REST/MQTT gateways.

**Data in.** Setpoints, zone temperatures, supply/return, runtime,
equipment alarms, sub-metered energy.

**Data out.** Setpoint override commands from Energy Optimizer. Always
scoped to comfort-band + occupancy guardrails defined in the Rules engine.

**Cadence.** Telemetry polled every 5 minutes. Overrides applied on the
Optimizer's recommendation cycle (every 5 min during TOU peak, every 15
min off-peak).

**Auth.** Per-building API credentials. Stored as
\`BMS_<BUILDING_ID>_CREDENTIALS\` in Vercel secrets.

**Guardrails.**
- No setpoint command can violate the comfort band (default 2°C tolerance).
- No more than 4°C drift from occupied setpoint when unoccupied.
- Override history logged to the Decisions Ledger.

**Pilot status.** 6 of 47 buildings on full BMS integration. The remaining
41 fall back to a simpler occupancy-driven schedule that still captures
~65% of the available savings.
`.trim(),
  },

  // ─── Agent playbooks ──────────────────────────────────────────────────────
  {
    id: "playbook-dispatch-agent",
    category: "agent_playbook",
    title: "Playbook · Dispatch Agent",
    summary: "How Dispatch Agent reasons end-to-end: inputs, scoring, fairness, blocking, escalation.",
    version: "v2.3",
    lastUpdated: "2026-04-10",
    tags: ["dispatch", "agent", "scoring", "fairness"],
    referencedBy: ["dispatch_agent"],
    wordCount: 1_060,
    body: `
**Goal.** For every new work order, select the best worker from the unified
pool (employees + contractors) or escalate to the Work Order Market.

**Inputs.**
- Work order: building, unit, trade, urgency, description, SLA.
- Worker pool: trade match, active assignments, hourly cost, rating,
  SLA hit-rate, home base, availability, compliance state.
- Portfolio rules: fairness rotation policy, contractor caps, skill
  requirements, cost guardrails.

**Scoring.** Each eligible candidate scored 0–100 across 5 weighted
factors:

| Factor | Weight (urgent/emergency) | Weight (routine/scheduled) | Interpretation |
|--|--|--|--|
| Skill | 0.22 | 0.20 | Trade match precision (sub-skill bonus if applicable). |
| Availability | 0.26 | 0.18 | 100 if available now; dropping fast with active load. |
| Cost | 0.12 | 0.28 | Lower loaded $/hr → higher score. Employee bonus +3. |
| Fairness | 0.14 | 0.22 | Penalises workers above expected share of monthly volume. |
| Quality | 0.26 | 0.12 | Blend of rating (70%) + SLA hit-rate (30%). |

Urgency shifts the weights: emergency prefers skill + quality + speed;
routine prefers cost + fairness.

**Hard gates.**
- Contractor must have valid CGL insurance ≥$2M.
- Contractor must have current WSIB clearance.
- All workers must have valid trade license.
- Missing any → score forced to 0 and candidate flagged \`blocked\`.

**Auto-assign threshold.** If top candidate ≥ 80 and the score gap to #2 is
≥ 6 pts, auto-assign. Otherwise propose (human approval required).

**Fairness rotation.**
- No contractor can exceed 25% of monthly work-order volume by trade.
- Seniority-blended Hybrid policy: candidates ordered by
  (fairness × seniority × availability). Purely rotation-based orderings
  available as alternatives.

**Escalation path.**
1. No eligible candidate → post to Work Order Market (public pool).
2. No fill after 30 min (emergency) or 4h (urgent) → notify building manager.
3. Manager can approve rate exception or reach outside the pool.

**Audit.** Every assignment writes the ranked candidate list + factor
breakdown to \`ry_work_order_offers\` — an auditable history for fairness
challenges.
`.trim(),
  },
  {
    id: "playbook-arrears-sentinel",
    category: "agent_playbook",
    title: "Playbook · Arrears Sentinel",
    summary: "How Arrears Sentinel scores delinquency risk and generates RTA-compliant escalations.",
    version: "v1.9",
    lastUpdated: "2026-04-08",
    tags: ["arrears", "agent", "rta", "collections"],
    referencedBy: ["arrears_sentinel"],
    wordCount: 820,
    body: `
**Goal.** Score each tenant's delinquency risk (30/60/90 day horizon) and
execute the RTA-compliant escalation path — with human approval at each
legally significant step.

**Inputs.**
- Payment history: last 24 months of on-time / late / missed.
- Tenure, lease age, rent-to-income (if available).
- Current balance, days overdue.
- Prior N4 / N5 / L1 history.

**Scoring.** Gradient-boosted decision tree (shadow-deployed, v0.9).
Features: days overdue, missed-payment count (last 12 / last 24), late-
payment count, tenure, rent change at last renewal, prior N4 count.
Output: delinquency probability at 30 / 60 / 90 days + top features.

**Escalation path.**
1. **Current.** Monitoring only. No action.
2. **Day 2–3 · Soft reminder.** Email + app notification. Template
   \`tmpl-arrears-soft-reminder\`.
3. **Day 4–14 · N4 drafted.** RTA §59 compliant. Draft waits for human
   approval. Balance, termination date, and contact info filled from the
   rent roll.
4. **Day 15+ · N4 served.** 14-day payment window begins.
5. **Day 15 + 14 · LTB application (L1).** If unpaid, MAIA prepares the
   application packet for manual review + filing.
6. **Payment plan.** An alternative path: tenant + manager agree on
   installment schedule; risk score continues tracking.

**Human-in-the-loop.**
- MAIA **never** auto-sends an N4 or L1.
- Soft reminders can be auto-sent when configured in \`configs/arrears\`
  (default: on).
- Payment plans always require human sign-off.

**Why RTA compliance matters.** A procedurally flawed notice (wrong form,
wrong date calculation, missing required wording) is void — the clock
resets. MAIA's templates bake in form-number correctness, date math, and
mandatory language.
`.trim(),
  },
  {
    id: "playbook-energy-optimizer",
    category: "agent_playbook",
    title: "Playbook · Energy & Utility Optimizer",
    summary: "Continuous HVAC + lighting optimisation against occupancy and utility rates, bounded by comfort guardrails.",
    version: "v1.4",
    lastUpdated: "2026-03-30",
    tags: ["energy", "hvac", "optimization", "comfort"],
    referencedBy: ["energy_optimizer"],
    wordCount: 720,
    body: `
**Goal.** Minimise utility cost while keeping every zone inside its comfort
band.

**Inputs.**
- BMS telemetry: setpoints, actuals, runtime, alarms.
- Occupancy forecast (per zone, per hour).
- Ontario TOU rate schedule (on / mid / off-peak).
- Weather forecast (outdoor temp drives cooling/heating load).

**Decision loop.**
1. Look 4 hours ahead.
2. For each zone, given forecasted occupancy and outdoor temp, pick a
   setpoint schedule that minimises projected kWh × rate.
3. Respect guardrails: comfort band (2°C default), maximum unoccupied
   drift (4°C default), no cycling HVAC more than X times per hour.
4. Write the schedule to the BMS via the appropriate protocol.

**Guardrails.**
- Comfort band never violated.
- Health-critical units (children, seniors on file) get tighter comfort
  bands configured in per-unit exceptions.
- Any change > 2°C from prior setpoint requires a cool-down / ramp window.

**Savings attribution.** Every actioned recommendation records projected
$/kWh saved and the actual measurement 24h later (Outcome Observer closes
the loop). Drift between projection and reality feeds the model for
weekly re-calibration.
`.trim(),
  },
];

export const KNOWLEDGE_DOCS: KnowledgeDoc[] = DOCS;

export const CATEGORY_META: Record<DocCategory, { label: string; color: string; icon: string }> = {
  regulation:     { label: "Regulation",        color: "#DC2626", icon: "⚖️" },
  sop:            { label: "Standard procedure", color: "#2563EB", icon: "📋" },
  emergency:      { label: "Emergency response", color: "#EA580C", icon: "🚨" },
  template:       { label: "Template",           color: "#7C3AED", icon: "✉️" },
  integration:    { label: "Integration",        color: "#0891B2", icon: "🔌" },
  agent_playbook: { label: "Agent playbook",     color: "#10B981", icon: "🤖" },
};

export function docsByAgent(agentId: string): KnowledgeDoc[] {
  return KNOWLEDGE_DOCS.filter((d) => d.referencedBy.includes(agentId));
}

export function knowledgeStats() {
  const byCategory: Record<DocCategory, number> = {
    regulation: 0, sop: 0, emergency: 0, template: 0, integration: 0, agent_playbook: 0,
  };
  for (const d of KNOWLEDGE_DOCS) byCategory[d.category]++;
  const totalWords = KNOWLEDGE_DOCS.reduce((s, d) => s + d.wordCount, 0);
  return {
    total: KNOWLEDGE_DOCS.length,
    byCategory,
    totalWords,
    avgWords: Math.round(totalWords / KNOWLEDGE_DOCS.length),
  };
}
