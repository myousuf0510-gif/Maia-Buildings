// MAIA Agents — seed data for demo mode.
// Generates a realistic-looking Fatigue Guardian with 247 historical runs
// showing the distribution of proposed → approved → executed → outcome-observed.

import type {
  Agent,
  AgentRun,
  AgentEvent,
  AgentMetrics,
  AgentTemplate,
  AgentType,
  RunStatus,
  Driver,
} from './types';

const ORG_ID = '00000000-0000-0000-0000-000000000001'; // Toronto Pearson aviation
const MANAGER_NAMES = [
  'Sarah Chen',
  'David Okafor',
  'Priya Sharma',
  'Marcus Reid',
  'Elena Volkov',
];

const STAFF_POOL: { id: string; name: string }[] = [
  { id: 'staff-martinez-j', name: 'James Martinez' },
  { id: 'staff-nguyen-a', name: 'Anh Nguyen' },
  { id: 'staff-patel-r', name: 'Ravi Patel' },
  { id: 'staff-kim-s', name: 'Sunhee Kim' },
  { id: 'staff-diaz-l', name: 'Lucia Diaz' },
  { id: 'staff-okafor-t', name: 'Tomi Okafor' },
  { id: 'staff-brown-m', name: 'Marcus Brown' },
  { id: 'staff-ahmad-y', name: 'Yusuf Ahmad' },
  { id: 'staff-white-d', name: 'Dana White' },
  { id: 'staff-chen-w', name: 'Wei Chen' },
  { id: 'staff-johnson-k', name: 'Keisha Johnson' },
  { id: 'staff-sato-h', name: 'Hiro Sato' },
  { id: 'staff-garcia-r', name: 'Rafael Garcia' },
  { id: 'staff-anand-n', name: 'Neha Anand' },
  { id: 'staff-walker-b', name: 'Brianna Walker' },
  { id: 'staff-singh-a', name: 'Arjun Singh' },
];

// Deterministic PRNG so demo is stable across reloads
function mulberry32(seed: number) {
  let t = seed;
  return function () {
    t = (t + 0x6d2b79f5) | 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

const DRIVER_LIBRARY: Omit<Driver, 'weight'>[] = [
  { label: '6 consecutive shifts worked', evidence: 'shift history last 14d' },
  { label: 'Rest period 9.2h below 11h minimum', evidence: 'ON-CA labour law' },
  { label: 'Night→morning rotation gap detected', evidence: 'shift rotation model' },
  { label: 'Fatigue score +34% week-over-week', evidence: 'fatigue score trend' },
  { label: 'Historical overtime pattern flagged', evidence: 'OT analytics' },
  { label: 'No scheduled leave in 42d', evidence: 'time off records' },
  { label: 'Third dispatch failed in same 72h', evidence: 'incident log' },
  { label: 'Weather stress factor elevated', evidence: 'weather signals' },
  { label: 'Peer absences increased coverage load', evidence: 'dept roster' },
];

const FATIGUE_GUARDIAN: Agent = {
  id: 'agent-fatigue-guardian',
  org_id: ORG_ID,
  name: 'Fatigue Guardian',
  type: 'fatigue_guardian',
  status: 'active',
  autonomy: 1, // Approve → Execute
  description:
    'Monitors staff fatigue scores, consecutive shifts, and rest-period compliance. Proposes reassignments to prevent compliance violations and critical fatigue thresholds.',
  config: {
    triggers: [
      { type: 'fatigue_threshold_breach', threshold: 70 },
      { type: 'consecutive_shifts_breach', threshold: 5 },
      { type: 'rest_period_violation' },
    ],
    actions: [
      { type: 'propose_reassignment' },
      { type: 'notify_manager', channel: 'in_app' },
    ],
    guardrails: {
      jurisdiction: 'ON-CA',
      max_decisions_per_hour: 3,
      require_human_approval_if: ['tier_1_employee', 'cost_delta_over_500'],
      off_hours_autonomy: 'suggest_only',
      dry_run: false,
    },
    scope: { all_departments: true },
  },
  created_by: 'user-moe',
  created_at: '2026-04-02T09:12:44Z',
  deployed_at: '2026-04-02T14:30:00Z',
};

const COMPLIANCE_SENTINEL: Agent = {
  id: 'agent-compliance-sentinel',
  org_id: ORG_ID,
  name: 'Compliance Sentinel',
  type: 'compliance_sentinel',
  status: 'draft',
  autonomy: 0,
  description:
    'Watches for labour-law violations across all 9 jurisdictions. Flags breaches in real-time and proposes corrective actions.',
  config: {
    triggers: [
      { type: 'rest_period_violation' },
      { type: 'certification_expiring', window: '30d' },
    ],
    actions: [
      { type: 'notify_manager', channel: 'in_app' },
      { type: 'propose_rest_period' },
    ],
    guardrails: {
      jurisdiction: 'ON-CA',
      max_decisions_per_hour: 10,
      require_human_approval_if: ['always'],
      dry_run: true,
    },
    scope: { all_departments: true },
  },
  created_by: 'user-moe',
  created_at: '2026-04-10T11:00:00Z',
};

const DEMAND_WATCHER: Agent = {
  id: 'agent-demand-watcher',
  org_id: ORG_ID,
  name: 'Demand Watcher',
  type: 'demand_watcher',
  status: 'draft',
  autonomy: 0,
  description:
    'Cross-references internal scheduled capacity with external demand signals (flight delays, weather, events). Proposes staffing adjustments before the gap opens.',
  config: {
    triggers: [{ type: 'coverage_gap' }, { type: 'cost_spike' }],
    actions: [
      { type: 'propose_backup_staff' },
      { type: 'notify_manager', channel: 'in_app' },
    ],
    guardrails: {
      jurisdiction: 'ON-CA',
      max_decisions_per_hour: 5,
      require_human_approval_if: ['always'],
      dry_run: true,
    },
    scope: { all_departments: true },
  },
  created_by: 'user-moe',
  created_at: '2026-04-12T09:30:00Z',
};

export const MOCK_AGENTS: Agent[] = [
  FATIGUE_GUARDIAN,
  COMPLIANCE_SENTINEL,
  DEMAND_WATCHER,
];

// --- Run generator ----------------------------------------------------------

function generateRun(index: number): AgentRun {
  // Distribute 247 runs over the last 15 days
  const msInDay = 86_400_000;
  const daysAgo = (247 - index) * (15 / 247);
  const triggeredAt = new Date(Date.now() - daysAgo * msInDay - rand() * 3600_000);

  const staff = pick(STAFF_POOL);
  const fatigueScore = 70 + Math.floor(rand() * 26); // 70..95
  const isJM = staff.id === 'staff-martinez-j';
  const isCritical = fatigueScore >= 82;

  // Status distribution:
  //   ~73% executed, ~5% rejected, ~3% expired, ~4% failed, rest pending (proposed/notified)
  // Most recent ~4 items are pending review — the "3 waiting for you" hook
  let status: RunStatus;
  let approvedAt: string | null = null;
  let executedAt: string | null = null;
  let approvedBy: string | null = null;
  let responseTimeSeconds: number | null = null;

  const recent = index >= 243; // last 4 runs = pending
  if (recent) {
    status = index === 246 ? 'notified' : 'proposed';
  } else {
    const r = rand();
    if (r < 0.04) status = 'expired';
    else if (r < 0.09) status = 'rejected';
    else if (r < 0.12) status = 'failed';
    else status = 'executed';
  }

  if (status === 'executed' || status === 'rejected') {
    approvedBy = pick(MANAGER_NAMES);
    responseTimeSeconds = Math.floor(30 + rand() * 870); // 30s..15m
    approvedAt = new Date(
      new Date(triggeredAt).getTime() + responseTimeSeconds * 1000,
    ).toISOString();
    if (status === 'executed') {
      executedAt = new Date(
        new Date(approvedAt).getTime() + 2000 + rand() * 4000,
      ).toISOString();
    }
  }

  // Reasoning — pick 3 drivers with assigned weights that sum ~1
  const driverPicks = [...DRIVER_LIBRARY]
    .sort(() => rand() - 0.5)
    .slice(0, 3);
  const weights = [0.42, 0.31, 0.27];
  const drivers: Driver[] = driverPicks.map((d, i) => ({
    ...d,
    weight: weights[i],
  }));

  const fatigueDelta = -(8 + Math.floor(rand() * 12)); // −8..−20
  const costDelta = rand() < 0.7 ? 0 : -(100 + Math.floor(rand() * 900));

  // Suggest a plausible shift reassignment
  const fromShift = pick(['Night Ramp', 'Evening Gate', 'Night Cargo', 'Graveyard Baggage']);
  const toShift = pick(['Morning Gate', 'Midday Baggage', 'Afternoon Cargo', 'Morning Ramp']);

  const proposedActionDescription = `Reassign ${staff.name} from ${fromShift} (${formatDate(triggeredAt, 24)}) → ${toShift} (${formatDate(triggeredAt, 48)}). Projected fatigue relief: ${fatigueDelta} pts.`;

  const conf = 0.75 + rand() * 0.24;

  const run: AgentRun = {
    id: `run-${String(index).padStart(4, '0')}`,
    agent_id: FATIGUE_GUARDIAN.id,
    triggered_at: triggeredAt.toISOString(),
    trigger_type: isCritical ? 'fatigue_threshold_breach' : 'consecutive_shifts_breach',
    trigger_payload: {
      staff_id: staff.id,
      staff_name: staff.name,
      fatigue_score: fatigueScore,
      threshold: isCritical ? 70 : 5,
    },
    reasoning: {
      chain_of_thought: [
        `${staff.name} crossed fatigue threshold ${fatigueScore}/100.`,
        `Cross-referenced shift history (last 14d) and rest-period compliance.`,
        `Checked ON-CA labour law: rest period shortfall detected.`,
        `Ran 3 reassignment scenarios against coverage model.`,
        `Selected highest-impact, zero-cost option.`,
      ],
      drivers,
      sources: [
        'shift history (last 14d)',
        'fatigue_scores table',
        'ON-CA labour law engine',
        'coverage model v2.4',
      ],
      summary: `${staff.name} is at elevated fatigue risk with compounding compliance exposure. Reassignment prevents breach with neutral cost.`,
    },
    proposed_action: {
      kind: 'reassignment',
      description: proposedActionDescription,
      payload: {
        staff_id: staff.id,
        from_shift_template: fromShift,
        to_shift_template: toShift,
      },
      impact: {
        fatigue_delta: fatigueDelta,
        cost_delta: costDelta,
        compliance_impact: 'improve',
        coverage_impact: 'neutral',
      },
    },
    counterfactual: {
      if_accepted: {
        outcome_summary: `Fatigue projected to drop to ${fatigueScore + fatigueDelta} within 48h. Coverage held. No breach.`,
        projected_metrics: {
          fatigue_48h: fatigueScore + fatigueDelta,
          coverage_pct: 98 + Math.floor(rand() * 3),
        },
      },
      if_ignored: {
        outcome_summary: `Fatigue projected to reach ${fatigueScore + 8} by Day 3. Probable compliance violation + est. $${1800 + Math.floor(rand() * 2000)} unplanned OT.`,
        projected_metrics: {
          fatigue_72h: fatigueScore + 8,
          violation_probability: 0.7 + rand() * 0.25,
        },
      },
      historical: {
        total_cases: 127 + Math.floor(rand() * 30),
        acceptance_led_to_improvement_pct: 0.88 + rand() * 0.1,
      },
    },
    status,
    confidence_score: conf,
    approved_by: approvedBy,
    approved_at: approvedAt,
    executed_at: executedAt,
    affected_staff_ids: [staff.id],
    estimated_savings: status === 'executed' ? 1200 + Math.floor(rand() * 1800) : 0,
    response_time_seconds: responseTimeSeconds,
    outcome:
      status === 'executed' && index < 240
        ? {
            observed_at: new Date(
              new Date(executedAt!).getTime() + 48 * 3600_000,
            ).toISOString(),
            effective: rand() > 0.08,
            notes: [
              `Fatigue ${fatigueScore} → ${fatigueScore + fatigueDelta} within 48h`,
              'Coverage maintained across both shifts',
              'No downstream compliance events',
            ],
            measured: {
              fatigue_delta: fatigueDelta,
              actual_cost_delta: costDelta,
            },
          }
        : null,
  };

  // Highlight the canonical James Martinez CRITICAL case as the top pending run
  if (index === 246) {
    run.trigger_payload = {
      staff_id: 'staff-martinez-j',
      staff_name: 'James Martinez',
      fatigue_score: 84,
      threshold: 70,
    };
    run.affected_staff_ids = ['staff-martinez-j'];
    run.confidence_score = 0.91;
    run.reasoning.summary =
      'James Martinez fatigue 84/100 — 6 consecutive shifts, rest period 9.2h below 11h minimum (ON-CA). Reassignment prevents breach and holds Tier-1 coverage.';
    run.proposed_action.description =
      'Reassign James Martinez: Night Ramp (Apr 18 22:00–06:00) → Morning Gate (Apr 19 06:00–14:00). Projected fatigue relief: −14 pts. Cost delta: $0.';
    run.proposed_action.impact = {
      fatigue_delta: -14,
      cost_delta: 0,
      compliance_impact: 'improve',
      coverage_impact: 'neutral',
    };
    run.counterfactual.if_accepted.outcome_summary =
      'Coverage maintained, breach prevented, fatigue projected to drop to 70 within 48h.';
    run.counterfactual.if_accepted.projected_metrics = {
      fatigue_48h: 70,
      coverage_pct: 98,
    };
    run.counterfactual.if_ignored.outcome_summary =
      'Projected fatigue 96 by Apr 20 (CRITICAL) + probable compliance violation + est. $2,140 unplanned OT.';
  }

  return run;
}

// Generate 247 runs
export const MOCK_RUNS: AgentRun[] = Array.from({ length: 247 }, (_, i) =>
  generateRun(i + 1),
).sort(
  (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime(),
);

function formatDate(d: Date, offsetHours: number): string {
  const t = new Date(d.getTime() + offsetHours * 3600_000);
  const mm = t.toLocaleString('en-US', { month: 'short' });
  const dd = t.getDate();
  const hh = String(t.getHours()).padStart(2, '0');
  const mmin = String(t.getMinutes()).padStart(2, '0');
  return `${mm} ${dd} ${hh}:${mmin}`;
}

// --- Metrics ----------------------------------------------------------------

export function metricsForAgent(agentId: string): AgentMetrics {
  const runs = MOCK_RUNS.filter((r) => r.agent_id === agentId);
  const executed = runs.filter((r) => r.status === 'executed');
  const rejected = runs.filter((r) => r.status === 'rejected');
  const proposed = runs.filter(
    (r) => r.status === 'proposed' || r.status === 'notified',
  );
  const withOutcome = runs.filter((r) => r.outcome);

  const acceptanceRate =
    executed.length + rejected.length > 0
      ? executed.length / (executed.length + rejected.length)
      : 0;

  const responseTimes = runs
    .map((r) => r.response_time_seconds)
    .filter((x): x is number => typeof x === 'number');
  const avgResponse =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const savings = executed.reduce((a, r) => a + r.estimated_savings, 0);

  const effective = withOutcome.filter((r) => r.outcome?.effective).length;
  const effectivenessRate =
    withOutcome.length > 0 ? effective / withOutcome.length : 0;

  return {
    total_runs: runs.length,
    acceptance_rate: acceptanceRate,
    avg_response_seconds: Math.round(avgResponse),
    estimated_savings: Math.round(savings),
    pending_review: proposed.length,
    effectiveness_rate: effectivenessRate,
  };
}

// --- Events (append-only ledger, derived from runs) ------------------------

export function eventsForRun(runId: string): AgentEvent[] {
  const run = MOCK_RUNS.find((r) => r.id === runId);
  if (!run) return [];

  const events: AgentEvent[] = [
    {
      id: `${runId}-e1`,
      run_id: runId,
      timestamp: run.triggered_at,
      event_type: 'triggered',
      actor: 'MAIA',
      payload: { trigger_type: run.trigger_type, ...run.trigger_payload },
    },
    {
      id: `${runId}-e2`,
      run_id: runId,
      timestamp: new Date(
        new Date(run.triggered_at).getTime() + 1400,
      ).toISOString(),
      event_type: 'analyzed',
      actor: 'MAIA',
      payload: { sources: run.reasoning.sources },
    },
    {
      id: `${runId}-e3`,
      run_id: runId,
      timestamp: new Date(
        new Date(run.triggered_at).getTime() + 2800,
      ).toISOString(),
      event_type: 'proposed',
      actor: 'MAIA',
      payload: { confidence: run.confidence_score },
    },
  ];

  if (run.approved_at && run.approved_by) {
    events.push({
      id: `${runId}-e4`,
      run_id: runId,
      timestamp: run.approved_at,
      event_type: run.status === 'rejected' ? 'rejected' : 'approved',
      actor: run.approved_by,
    });
  }
  if (run.executed_at) {
    events.push({
      id: `${runId}-e5`,
      run_id: runId,
      timestamp: run.executed_at,
      event_type: 'executed',
      actor: 'MAIA',
    });
  }
  if (run.outcome) {
    events.push({
      id: `${runId}-e6`,
      run_id: runId,
      timestamp: run.outcome.observed_at,
      event_type: 'outcome_observed',
      actor: 'MAIA',
      payload: { effective: run.outcome.effective, ...run.outcome.measured },
    });
  }

  return events;
}

// --- Templates --------------------------------------------------------------

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    type: 'fatigue_guardian',
    label: 'Fatigue Guardian',
    tagline: 'Watches fatigue thresholds. Proposes safe reassignments.',
    description:
      'Monitors fatigue scores, consecutive shifts, and rest-period compliance. Proposes reassignments that prevent breaches while holding coverage.',
    default_autonomy: 1,
    default_config: FATIGUE_GUARDIAN.config,
    available: true,
  },
  {
    type: 'compliance_sentinel',
    label: 'Compliance Sentinel',
    tagline: 'Detects labour-law violations across all 9 jurisdictions.',
    description:
      'Real-time watch against the labour-law engine. Proposes corrective scheduling actions before a violation becomes billable.',
    default_autonomy: 0,
    default_config: COMPLIANCE_SENTINEL.config,
    available: true,
  },
  {
    type: 'demand_watcher',
    label: 'Demand Watcher',
    tagline: 'Cross-references internal capacity with external demand signals.',
    description:
      'Monitors weather, flight delays, event calendars. Proposes staffing adjustments before the gap opens. (External connectors required.)',
    default_autonomy: 0,
    default_config: DEMAND_WATCHER.config,
    available: true,
  },
];

// --- Lookup helpers ---------------------------------------------------------

export function getAgent(id: string): Agent | undefined {
  return MOCK_AGENTS.find((a) => a.id === id);
}

export function getRunsForAgent(agentId: string): AgentRun[] {
  return MOCK_RUNS.filter((r) => r.agent_id === agentId);
}

export function getRun(runId: string): AgentRun | undefined {
  return MOCK_RUNS.find((r) => r.id === runId);
}

export function getStaffName(staffId: string): string {
  return STAFF_POOL.find((s) => s.id === staffId)?.name ?? staffId;
}
