// MAIA Agents — type definitions
// The Decisions Ledger model: agent defs + runs + append-only events.

export type AgentType =
  | 'fatigue_guardian'
  | 'compliance_sentinel'
  | 'demand_watcher';

export type AgentStatus = 'active' | 'paused' | 'learning' | 'draft';

/**
 * Autonomy levels:
 *   0 suggest_only          — proposes, never executes, human must act
 *   1 approve_then_execute  — proposes + waits for human approval → executes
 *   2 execute_with_fallback — executes reversible actions, escalates edge cases
 *   3 fully_autonomous      — executes everything within guardrails (rare, opt-in)
 */
export type AutonomyLevel = 0 | 1 | 2 | 3;

export interface AgentConfig {
  triggers: AgentTrigger[];
  actions: AgentAction[];
  guardrails: AgentGuardrails;
  scope: {
    department_ids?: string[];
    all_departments?: boolean;
  };
}

export interface AgentTrigger {
  type:
    | 'fatigue_threshold_breach'
    | 'consecutive_shifts_breach'
    | 'rest_period_violation'
    | 'certification_expiring'
    | 'coverage_gap'
    | 'cost_spike';
  threshold?: number;
  window?: string; // e.g., '24h', '7d'
}

export interface AgentAction {
  type:
    | 'propose_reassignment'
    | 'notify_manager'
    | 'propose_rest_period'
    | 'propose_certification_renewal'
    | 'propose_backup_staff';
  channel?: 'in_app' | 'slack' | 'email';
}

export interface AgentGuardrails {
  jurisdiction: string; // e.g., 'ON-CA'
  max_decisions_per_hour: number;
  require_human_approval_if: HumanApprovalRule[];
  off_hours_autonomy?: 'suggest_only' | 'same';
  dry_run: boolean; // if true, never executes — proposes only
}

export type HumanApprovalRule =
  | 'tier_1_employee'
  | 'cost_delta_over_500'
  | 'cross_department_move'
  | 'always';

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  autonomy: AutonomyLevel;
  description: string;
  config: AgentConfig;
  created_by: string;
  created_at: string; // ISO
  deployed_at?: string; // ISO — when first went active
}

export type RunStatus =
  | 'proposed'
  | 'notified'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'expired'
  | 'failed';

export interface Driver {
  /** Human-readable driver — e.g., "6 consecutive shifts" */
  label: string;
  /** Contribution weight to the decision (0..1) */
  weight: number;
  /** Optional supporting data reference */
  evidence?: string;
}

export interface Reasoning {
  /** Chain of thought — short descriptive steps */
  chain_of_thought: string[];
  /** Top drivers with weights (used for explainability) */
  drivers: Driver[];
  /** Data sources consulted */
  sources: string[];
  /** Human-readable summary */
  summary: string;
}

export interface ProposedAction {
  kind:
    | 'reassignment'
    | 'rest_period'
    | 'certification_renewal'
    | 'backup_staff';
  description: string;
  /** Structured payload for the action */
  payload: Record<string, unknown>;
  /** Estimated impact deltas */
  impact: {
    fatigue_delta?: number;
    cost_delta?: number;
    compliance_impact?: 'improve' | 'neutral' | 'violate';
    coverage_impact?: 'improve' | 'neutral' | 'degrade';
  };
}

export interface Counterfactual {
  if_accepted: {
    outcome_summary: string;
    projected_metrics?: Record<string, string | number>;
  };
  if_ignored: {
    outcome_summary: string;
    projected_metrics?: Record<string, string | number>;
  };
  /** Similar historical cases and their outcomes */
  historical: {
    total_cases: number;
    acceptance_led_to_improvement_pct: number;
  };
}

export interface Outcome {
  observed_at: string; // ISO
  effective: boolean;
  notes: string[];
  measured: Record<string, string | number>;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  triggered_at: string; // ISO
  trigger_type: AgentTrigger['type'];
  trigger_payload: {
    staff_id?: string;
    staff_name?: string;
    fatigue_score?: number;
    [k: string]: unknown;
  };
  reasoning: Reasoning;
  proposed_action: ProposedAction;
  counterfactual: Counterfactual;
  status: RunStatus;
  confidence_score: number; // 0..1
  approved_by?: string | null;
  approved_at?: string | null;
  executed_at?: string | null;
  outcome?: Outcome | null;
  affected_staff_ids: string[];
  estimated_savings: number; // $ (+ positive = saved, negative = cost)
  response_time_seconds?: number | null;
}

export type EventType =
  | 'triggered'
  | 'analyzed'
  | 'proposed'
  | 'notified'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'outcome_observed'
  | 'expired'
  | 'failed';

export interface AgentEvent {
  id: string;
  run_id: string;
  timestamp: string; // ISO
  event_type: EventType;
  actor: string; // "MAIA" or person name
  payload?: Record<string, unknown>;
}

/** Aggregate metrics shown on the agent inspector hero bar. */
export interface AgentMetrics {
  total_runs: number;
  acceptance_rate: number; // 0..1
  avg_response_seconds: number;
  estimated_savings: number; // cumulative $
  pending_review: number;
  effectiveness_rate: number; // outcome.effective / runs with outcome
}

/** Template used in /agents/new */
export interface AgentTemplate {
  type: AgentType;
  label: string;
  description: string;
  tagline: string;
  default_autonomy: AutonomyLevel;
  default_config: AgentConfig;
  available: boolean;
}
