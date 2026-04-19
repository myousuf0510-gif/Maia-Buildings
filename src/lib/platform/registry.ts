// Central registry of MAIA Buildings platform artefacts — agents, models,
// algorithms, configurations, rules. Every page renders from this registry so
// everything stays in sync with the actual systems behind the product.
//
// Anchor customer: Royal York Property Management (Toronto, GTA portfolio).

// ─── Portfolio anchor ───────────────────────────────────────────────────────

export const PORTFOLIO = {
  name: "Royal York Property Management",
  shortName: "Royal York",
  region: "Greater Toronto Area",
  buildingCount: 120,
  unitCount: 11_400,
  residentCount: 22_800,
  rentUnderManagement: 342_000_000, // annual $
  ownerTeamSize: 132, // PM staff + in-house maintenance
  contractorPoolSize: 214, // vetted vendors
};

// ─── Agents ──────────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  scope: string;
  status: "live" | "paused" | "draft";
  source: string;
  cadence: string;
  lastRun?: string;
  notifies?: string[];
  writesTo: string[];
  feedsPages: string[];
  accent: string;
}

export const AGENTS: Agent[] = [
  {
    id: "dispatch_agent",
    name: "Dispatch Agent",
    purpose: "Auto-assigns incoming work orders to the optimal employee or contractor based on skill, availability, cost, location, fairness rotation, and compliance gating.",
    scope: "All open work orders across 47 buildings · employees + contractors",
    status: "live",
    source: "src/lib/buildings/dispatch/engine.ts · /api/dispatch/run",
    cadence: "Continuous · triggers on every new work order",
    lastRun: "18s ago",
    notifies: ["Assigned worker (app + SMS)", "Building manager (Slack)"],
    writesTo: ["ry_work_order_assignments", "ry_work_order_offers", "ry_fairness_audits"],
    feedsPages: ["/work-order-market", "/workforce-directory"],
    accent: "#2563EB",
  },
  {
    id: "work_order_market",
    name: "Work Order Market",
    purpose: "Posts work orders that can't auto-assign to the marketplace, scores fill probability, coordinates with Dispatch on escalation paths.",
    scope: "Open tickets · 15-minute cycle · vendor + in-house pool",
    status: "live",
    source: "src/lib/buildings/market/engine.ts · /api/market/run-now",
    cadence: "Every 15 min + on-demand",
    lastRun: "6m ago",
    notifies: ["Acceptance stream"],
    writesTo: ["ry_work_order_postings"],
    feedsPages: ["/work-order-market"],
    accent: "#0EA5E9",
  },
  {
    id: "vacancy_watcher",
    name: "Vacancy & Turnover Watcher",
    purpose: "Forecasts lease expirations, re-rent time, and vacancy risk per unit; flags turnover pipeline bottlenecks.",
    scope: "4,200 units · 90-day forecast horizon · portfolio rollup",
    status: "live",
    source: "src/lib/buildings/vacancy/engine.ts · /api/cron/vacancy-forecast",
    cadence: "Daily 06:00 UTC + on-demand",
    lastRun: "3h ago",
    notifies: ["Leasing team (Slack #leasing)"],
    writesTo: ["ry_vacancy_forecasts", "ry_turnover_pipeline"],
    feedsPages: ["/vacancy-intelligence", "/overview"],
    accent: "#7C3AED",
  },
  {
    id: "arrears_sentinel",
    name: "Arrears Sentinel",
    purpose: "Scores rent-collection risk per tenant, predicts delinquency 30/60/90 days out, drafts escalation paths compliant with Ontario RTA.",
    scope: "4,200 tenancies · daily · RTA-compliant escalation",
    status: "live",
    source: "src/lib/buildings/arrears/engine.ts · /api/cron/arrears-scan",
    cadence: "Daily 04:00 UTC",
    lastRun: "5h ago",
    notifies: ["Property managers", "Slack #collections for high-risk"],
    writesTo: ["ry_arrears_scores", "ry_collection_plans"],
    feedsPages: ["/arrears-intelligence"],
    accent: "#DC2626",
  },
  {
    id: "energy_optimizer",
    name: "Energy & Utility Optimizer",
    purpose: "Continuous HVAC, lighting, and amenity scheduling against occupancy forecasts. Flags waste in common areas and amenity runtime.",
    scope: "All buildings with BMS integration · always-on",
    status: "live",
    source: "src/lib/buildings/energy/engine.ts · /api/cron/energy-loop",
    cadence: "Every 5 min · BMS polling",
    lastRun: "2m ago",
    notifies: ["Slack #ops-alerts for critical waste"],
    writesTo: ["ry_energy_recommendations", "ry_utility_events"],
    feedsPages: ["/energy-intelligence", "/building-detail"],
    accent: "#10B981",
  },
  {
    id: "compliance_sentinel",
    name: "Compliance Sentinel",
    purpose: "Watches RTA deadlines, fire inspection windows, insurance renewals, building permits, elevator inspections, contractor cert expiries.",
    scope: "Ontario RTA · Fire code · Insurance · WSIB for contractors",
    status: "live",
    source: "src/lib/buildings/compliance/engine.ts · /api/cron/compliance-scan",
    cadence: "Every 30 min",
    lastRun: "14m ago",
    notifies: ["Slack #compliance for critical"],
    writesTo: ["ry_compliance_events"],
    feedsPages: ["/compliance-intelligence"],
    accent: "#F59E0B",
  },
  {
    id: "turnover_orchestrator",
    name: "Turnover Orchestrator",
    purpose: "Coordinates unit-flip pipeline: clean → paint → repair → inspect → list → show. Sequences the work orders and tracks days-to-rent-ready.",
    scope: "All vacating units · 14-day typical flip window",
    status: "live",
    source: "src/lib/buildings/turnover/engine.ts",
    cadence: "Event-driven · triggered by notice to vacate",
    lastRun: "42m ago",
    notifies: ["Unit owner / building manager"],
    writesTo: ["ry_turnover_pipeline", "ry_work_orders"],
    feedsPages: ["/vacancy-intelligence", "/maintenance-recommendations"],
    accent: "#EC4899",
  },
  {
    id: "briefing_composer",
    name: "Briefing Composer",
    purpose: "Generates the weekly portfolio executive briefing using Claude — rolls up vacancy, arrears, work-order throughput, energy savings, compliance deadlines.",
    scope: "Last 7 days across all 47 buildings",
    status: "live",
    source: "src/lib/buildings/briefing/engine.ts · /api/cron/weekly-briefing",
    cadence: "Weekly · Monday 06:00 UTC + on-demand",
    lastRun: "2d ago",
    writesTo: ["ry_briefings"],
    feedsPages: ["/briefings/executive", "/overview"],
    accent: "#8B5CF6",
  },
];

// ─── Models ──────────────────────────────────────────────────────────────────

export type ModelStatus = "production" | "staging" | "shadow" | "deprecated";
export type ModelType = "llm" | "deterministic" | "statistical" | "heuristic" | "ml";

export interface ModelInfo {
  id: string;
  name: string;
  type: ModelType;
  version: string;
  status: ModelStatus;
  purpose: string;
  inputs: string[];
  outputs: string[];
  metric: { name: string; value: string };
  retrainCadence: string;
  lastUpdated: string;
  accent: string;
  usedBy: string[];
}

export const MODELS: ModelInfo[] = [
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    type: "llm",
    version: "claude-haiku-4-5-20251001",
    status: "production",
    purpose: "Agent reasoning, briefings, tenant communication drafts, chain-of-thought on dispatch decisions.",
    inputs: ["Context JSON", "Structured prompts"],
    outputs: ["Reasoning", "Structured JSON", "Markdown narratives"],
    metric: { name: "Response latency p95", value: "1.2s" },
    retrainCadence: "Provider-managed · Anthropic",
    lastUpdated: "Oct 2025",
    accent: "#7C3AED",
    usedBy: ["Dispatch Agent (rationale)", "Briefing Composer", "Arrears Sentinel (escalation drafts)"],
  },
  {
    id: "dispatch-score",
    name: "Dispatch Scoring Model",
    type: "deterministic",
    version: "v1.4",
    status: "production",
    purpose: "Scores every candidate worker (employee or contractor) for a given work order. Combines skill match, availability, cost, travel time, historical quality, fairness.",
    inputs: ["Worker pool", "Skills matrix", "Current load", "Work order (building, trade, urgency)", "Rate cards", "Historical quality ratings"],
    outputs: ["Ranked candidate list", "Per-candidate score 0–100", "Rationale"],
    metric: { name: "Auto-assign acceptance rate", value: "91%" },
    retrainCadence: "Weights reviewed monthly",
    lastUpdated: "Q2 2026",
    accent: "#2563EB",
    usedBy: ["Dispatch Agent", "Work Order Market"],
  },
  {
    id: "vacancy-forecast",
    name: "Vacancy Forecast Model",
    type: "statistical",
    version: "v1.6",
    status: "production",
    purpose: "Per-unit 90-day vacancy + re-rent time forecast. Factors lease expiry, historical turnover, seasonality, local market velocity, unit condition score.",
    inputs: ["Lease roll", "Unit condition audits", "Historical turnover", "Local rental market index"],
    outputs: ["Vacancy probability 30/60/90d", "Expected re-rent days", "Confidence"],
    metric: { name: "MAPE (rolling 90d)", value: "11.2%" },
    retrainCadence: "Quarterly",
    lastUpdated: "Q1 2026",
    accent: "#F59E0B",
    usedBy: ["Vacancy & Turnover Watcher", "Arrears Sentinel (joint risk)"],
  },
  {
    id: "arrears-risk",
    name: "Arrears Risk Scoring",
    type: "ml",
    version: "v0.9 · shadow",
    status: "shadow",
    purpose: "Gradient-boosted model estimating 30/60/90-day delinquency probability per tenant. Currently shadow — not auto-escalating.",
    inputs: ["Payment history", "Days-to-pay trend", "Arrears flags", "Tenure", "Lease age"],
    outputs: ["Delinquency probability (30/60/90d)", "Top features", "Confidence"],
    metric: { name: "ROC-AUC (shadow)", value: "0.87" },
    retrainCadence: "Monthly",
    lastUpdated: "Mar 2026",
    accent: "#DC2626",
    usedBy: ["Arrears Sentinel"],
  },
  {
    id: "energy-optim",
    name: "Energy Optimization Heuristic",
    type: "heuristic",
    version: "v2.1",
    status: "production",
    purpose: "HVAC + lighting schedule optimizer using occupancy forecast × utility pricing × thermal inertia of each building.",
    inputs: ["BMS telemetry", "Occupancy forecast", "Hydro rate schedule", "Weather forecast"],
    outputs: ["Setpoint changes", "Schedule recommendations", "Projected $ save"],
    metric: { name: "Avg monthly $ save / building", value: "$2,840" },
    retrainCadence: "Rules tuned quarterly per building",
    lastUpdated: "Q2 2026",
    accent: "#10B981",
    usedBy: ["Energy & Utility Optimizer"],
  },
  {
    id: "occupancy-forecast",
    name: "Occupancy Forecast",
    type: "deterministic",
    version: "v1.3",
    status: "production",
    purpose: "Hourly occupancy forecast per building per zone. Drives HVAC + amenity + cleaning scheduling.",
    inputs: ["Access control logs", "Historical swipe-in/out data", "Lease roll", "Day-of-week × season seasonality"],
    outputs: ["Occupants per hour per zone", "Confidence"],
    metric: { name: "MAPE (7d hourly)", value: "9.8%" },
    retrainCadence: "Curves refreshed monthly",
    lastUpdated: "Apr 2026",
    accent: "#0EA5E9",
    usedBy: ["Energy & Utility Optimizer", "Cleaning scheduling"],
  },
  {
    id: "turnover-pipeline",
    name: "Turnover Pipeline Model",
    type: "heuristic",
    version: "v1.2",
    status: "production",
    purpose: "Simulates unit-flip timing: clean → paint → repair → inspect → list. Flags bottleneck trades + recommends parallel work.",
    inputs: ["Unit inspection report", "Trade availability", "Historical flip times", "Marketing lead time"],
    outputs: ["Critical path", "Expected days to rent-ready", "Bottleneck trades"],
    metric: { name: "Avg flip time improvement", value: "−2.4 days" },
    retrainCadence: "Per-building curves refreshed quarterly",
    lastUpdated: "Q2 2026",
    accent: "#EC4899",
    usedBy: ["Turnover Orchestrator"],
  },
  {
    id: "fairness-audit",
    name: "Fairness Audit",
    type: "deterministic",
    version: "v1.0",
    status: "production",
    purpose: "Audits work-order assignment distribution across contractors + employees. Flags concentration, rotation drift, and systemic bias.",
    inputs: ["Assignment log", "Worker pool", "Dimensions: seniority, trade, region"],
    outputs: ["Distribution vs expected", "Rotation drift", "Alerts"],
    metric: { name: "Alert precision", value: "94%" },
    retrainCadence: "Rules versioned in-app",
    lastUpdated: "Q2 2026",
    accent: "#7C3AED",
    usedBy: ["Dispatch Agent", "Work Order Market"],
  },
];

// ─── Algorithms ──────────────────────────────────────────────────────────────

export type AlgorithmCategory = "optimization" | "scoring" | "matching" | "detection" | "narrative" | "attribution";

export interface AlgorithmInfo {
  id: string;
  name: string;
  category: AlgorithmCategory;
  complexity: string;
  purpose: string;
  usedIn: string[];
  tunables: string[];
  accent: string;
}

export const ALGORITHMS: AlgorithmInfo[] = [
  {
    id: "greedy-dispatch",
    name: "Greedy dispatch assignment",
    category: "matching",
    complexity: "O(n·m) where n = candidates, m = scoring factors",
    purpose: "Scores every candidate worker against each work order and picks the highest-scoring non-conflicted match. Respects fairness rotation.",
    usedIn: ["Dispatch Agent", "Work Order Market"],
    tunables: ["Skill weight", "Cost weight", "Distance weight", "Fairness weight", "SLA urgency weight"],
    accent: "#2563EB",
  },
  {
    id: "fairness-rotation",
    name: "Policy-driven fairness rotation",
    category: "optimization",
    complexity: "O(n log n) per posting",
    purpose: "Orders candidates by seniority / rotation / hybrid policy. Records selection_reason for every offer to make rotation auditable.",
    usedIn: ["Dispatch Agent", "Work Order Market"],
    tunables: ["Rotation policy (Seniority / Rotation / Random / Hybrid)", "Rotation decay window"],
    accent: "#7C3AED",
  },
  {
    id: "vacancy-time-series",
    name: "Vacancy time-series forecast",
    category: "scoring",
    complexity: "O(n) per unit per day",
    purpose: "Per-unit 90-day forecast combining lease roll, historical turnover, seasonality, local market index.",
    usedIn: ["Vacancy & Turnover Watcher"],
    tunables: ["Seasonality window", "Local market weight", "Lease-end tail"],
    accent: "#F59E0B",
  },
  {
    id: "arrears-gbdt",
    name: "Arrears risk GBDT",
    category: "scoring",
    complexity: "O(trees · depth) per tenant",
    purpose: "Gradient-boosted decision tree estimating delinquency probability. Currently shadow-deployed.",
    usedIn: ["Arrears Sentinel"],
    tunables: ["Tree depth", "Learning rate", "Risk threshold"],
    accent: "#DC2626",
  },
  {
    id: "hvac-setpoint-optim",
    name: "HVAC setpoint optimizer",
    category: "optimization",
    complexity: "O(zones · timesteps) per cycle",
    purpose: "Picks HVAC setpoints per zone minimising energy cost subject to occupancy + comfort band constraints.",
    usedIn: ["Energy & Utility Optimizer"],
    tunables: ["Comfort band tolerance", "Thermal inertia constant", "Hydro rate schedule"],
    accent: "#10B981",
  },
  {
    id: "critical-path",
    name: "Unit flip critical-path",
    category: "optimization",
    complexity: "O(n²) tasks with dependencies",
    purpose: "Builds the dependency DAG for a unit flip and identifies bottleneck trades. Drives the Turnover Orchestrator.",
    usedIn: ["Turnover Orchestrator"],
    tunables: ["Parallel-work policy", "Trade SLA windows"],
    accent: "#EC4899",
  },
  {
    id: "signal-detection",
    name: "Silent signal detection",
    category: "detection",
    complexity: "O(n · w) across rolling windows",
    purpose: "Detects patterns in work-order volume, tenant complaints, rent payment timing that haven't crossed a threshold yet but are trending.",
    usedIn: ["Compliance Sentinel", "Arrears Sentinel"],
    tunables: ["Window size", "Detection sensitivity", "Dismissal decay"],
    accent: "#0EA5E9",
  },
  {
    id: "briefing-llm",
    name: "Claude narrative composition",
    category: "narrative",
    complexity: "LLM call · fixed context budget",
    purpose: "Uses Claude Haiku to compose weekly portfolio briefings from structured agent activity logs.",
    usedIn: ["Briefing Composer"],
    tunables: ["Context window size", "Section template", "Tone"],
    accent: "#8B5CF6",
  },
  {
    id: "cost-attribution",
    name: "Cost attribution waterfall",
    category: "attribution",
    complexity: "O(line items)",
    purpose: "Attributes each dollar of opex to its source lever: energy, labour, turnover, insurance, capex amortisation. Powers the savings narrative.",
    usedIn: ["Energy Optimizer", "Briefing Composer"],
    tunables: ["Amortisation curve", "Lever hierarchy"],
    accent: "#F97316",
  },
];

// ─── Configurations ──────────────────────────────────────────────────────────

export interface ConfigEntry {
  key: string;
  value: string | number | boolean;
  unit?: string;
  description: string;
  editable: boolean;
}

export interface ConfigGroup {
  id: string;
  name: string;
  purpose: string;
  accent: string;
  entries: ConfigEntry[];
}

export const CONFIG_GROUPS: ConfigGroup[] = [
  {
    id: "dispatch",
    name: "Dispatch",
    purpose: "Tunables that govern how work orders get auto-assigned.",
    accent: "#2563EB",
    entries: [
      { key: "auto_assign_threshold", value: 80, unit: "score", description: "Minimum candidate score to auto-assign without human approval.", editable: true },
      { key: "distance_weight", value: 0.22, description: "Relative weight of travel distance in scoring (0–1).", editable: true },
      { key: "cost_weight", value: 0.28, description: "Relative weight of cost in scoring.", editable: true },
      { key: "skill_weight", value: 0.30, description: "Relative weight of skill match in scoring.", editable: true },
      { key: "fairness_weight", value: 0.20, description: "Relative weight of fairness rotation in scoring.", editable: true },
      { key: "require_license_check", value: true, description: "Block assignment if contractor license/insurance/WSIB is lapsed.", editable: false },
    ],
  },
  {
    id: "vacancy",
    name: "Vacancy & Turnover",
    purpose: "Thresholds for vacancy alerts and turnover pipeline.",
    accent: "#F59E0B",
    entries: [
      { key: "lease_end_alert_days", value: 90, unit: "d", description: "Days before lease end when Vacancy Watcher begins monitoring.", editable: true },
      { key: "turnover_target_days", value: 14, unit: "d", description: "Target days-to-rent-ready for a vacating unit.", editable: true },
      { key: "notice_to_vacate_sla", value: 60, unit: "d", description: "Tenant notice window (Ontario RTA minimum).", editable: false },
    ],
  },
  {
    id: "arrears",
    name: "Arrears & Collections",
    purpose: "Escalation thresholds for rent collection. RTA-gated.",
    accent: "#DC2626",
    entries: [
      { key: "soft_reminder_days", value: 3, unit: "d", description: "Days after due date before a soft reminder goes out.", editable: true },
      { key: "formal_notice_days", value: 14, unit: "d", description: "Days after due date for RTA N4 notice.", editable: false },
      { key: "escalation_risk_threshold", value: 0.65, description: "Arrears risk score above which the collections team is notified.", editable: true },
    ],
  },
  {
    id: "energy",
    name: "Energy & HVAC",
    purpose: "Comfort bands and rate-aware scheduling.",
    accent: "#10B981",
    entries: [
      { key: "comfort_band_c", value: 2.0, unit: "°C", description: "Tolerance around target temperature before intervening.", editable: true },
      { key: "occupied_setpoint_heat", value: 21, unit: "°C", description: "Heating setpoint when zone is occupied.", editable: true },
      { key: "occupied_setpoint_cool", value: 24, unit: "°C", description: "Cooling setpoint when zone is occupied.", editable: true },
      { key: "unoccupied_drift_c", value: 4, unit: "°C", description: "Permissible drift from occupied setpoint when zone is empty.", editable: true },
      { key: "peak_rate_window", value: "07:00-19:00", description: "Ontario TOU peak rate window (winter).", editable: false },
    ],
  },
  {
    id: "fairness",
    name: "Fairness",
    purpose: "How the platform maintains equitable worker rotation.",
    accent: "#7C3AED",
    entries: [
      { key: "rotation_policy", value: "Hybrid · rotation × seniority", description: "Which policy orders candidates for work orders.", editable: true },
      { key: "fairness_tolerance_pts", value: 15, unit: "pts", description: "How far any group can drift from expected share before alerting.", editable: true },
      { key: "max_pct_single_contractor", value: 0.25, description: "Cap on share of monthly volume any single contractor can receive.", editable: true },
    ],
  },
  {
    id: "notifications",
    name: "Notification routing",
    purpose: "Who gets told what, and how.",
    accent: "#EC4899",
    entries: [
      { key: "critical_channel", value: "Slack #ops-alerts", description: "Channel for critical events (fire, emergency, flooding).", editable: true },
      { key: "collections_channel", value: "Slack #collections", description: "Channel for arrears escalations.", editable: true },
      { key: "tenant_sms_enabled", value: true, description: "Send SMS for high-priority tenant-facing events.", editable: true },
      { key: "manager_digest", value: "daily 08:00", description: "Daily building manager digest.", editable: true },
    ],
  },
  {
    id: "agents",
    name: "Agent autonomy",
    purpose: "How much each agent can act without a human in the loop.",
    accent: "#0F172A",
    entries: [
      { key: "dispatch_auto_assign", value: true, description: "Allow Dispatch Agent to auto-assign when score ≥ threshold.", editable: true },
      { key: "energy_auto_apply_setpoints", value: true, description: "Let Energy Optimizer apply setpoint changes via BMS.", editable: true },
      { key: "arrears_auto_draft_letters", value: true, description: "Draft N4 notices; human approval required before send.", editable: false },
    ],
  },
];

// ─── Rule packs ──────────────────────────────────────────────────────────────

export interface Rule {
  text: string;
  source: string;
  autoEnforced: boolean;
}

export interface RulePack {
  id: string;
  name: string;
  jurisdiction: string;
  purpose: string;
  enforced: boolean;
  accent: string;
  rules: Rule[];
}

export const RULE_PACKS: RulePack[] = [
  {
    id: "on-rta",
    name: "Ontario Residential Tenancies Act",
    jurisdiction: "ON-CA",
    purpose: "Compliance with provincial tenant law.",
    enforced: true,
    accent: "#DC2626",
    rules: [
      { text: "Minimum 24-hour written notice required for landlord entry (non-emergency).", source: "RTA s.27(1)", autoEnforced: true },
      { text: "N4 notice for rent arrears may only be issued on the day after rent is due.", source: "RTA s.59", autoEnforced: true },
      { text: "Notice to vacate (tenant) must be ≥60 days for month-to-month tenancies.", source: "RTA s.44", autoEnforced: true },
      { text: "Rent increase requires 90-day N1 notice + guideline compliance.", source: "RTA s.116, s.120", autoEnforced: true },
      { text: "Vital service interruption (heat/water/electrical) triggers emergency response.", source: "RTA s.21", autoEnforced: true },
    ],
  },
  {
    id: "on-fire-code",
    name: "Ontario Fire Code",
    jurisdiction: "ON-CA",
    purpose: "Fire safety inspections, alarm maintenance, exit signage.",
    enforced: true,
    accent: "#F97316",
    rules: [
      { text: "Annual fire alarm inspection required for every building.", source: "OFC 6.3.1.1", autoEnforced: true },
      { text: "Emergency lighting monthly test + annual full discharge test.", source: "OFC 6.5.1.4", autoEnforced: true },
      { text: "Fire extinguishers inspected monthly; serviced annually.", source: "OFC 6.2.7.3", autoEnforced: true },
      { text: "Sprinkler system inspected quarterly; main drain test annually.", source: "OFC 6.4.3", autoEnforced: true },
    ],
  },
  {
    id: "tssa-elevator",
    name: "TSSA · Elevator safety",
    jurisdiction: "ON-CA",
    purpose: "Elevator certification and inspection cadence.",
    enforced: true,
    accent: "#2563EB",
    rules: [
      { text: "Every elevator requires annual TSSA inspection + valid license.", source: "TSSA Elevating Devices Code", autoEnforced: true },
      { text: "Monthly routine maintenance by licensed elevator mechanic.", source: "CSA B44", autoEnforced: true },
      { text: "Phase II firefighter recall tested monthly.", source: "CSA B44 §2.27", autoEnforced: true },
    ],
  },
  {
    id: "insurance-wsib",
    name: "Contractor insurance & WSIB",
    jurisdiction: "ON-CA",
    purpose: "Every contractor dispatched must carry valid insurance + WSIB coverage.",
    enforced: true,
    accent: "#7C3AED",
    rules: [
      { text: "Contractor must have CGL coverage ≥$2M before dispatch.", source: "Royal York master contractor policy", autoEnforced: true },
      { text: "WSIB clearance certificate must be current (within 60 days).", source: "WSIB Act s.141", autoEnforced: true },
      { text: "Trade license must be valid (electrical, plumbing, gas).", source: "OCOT / ESA / TSSA", autoEnforced: true },
    ],
  },
  {
    id: "internal-policy",
    name: "Royal York operational policy",
    jurisdiction: "Internal",
    purpose: "Internal SLAs + quality standards.",
    enforced: true,
    accent: "#0891B2",
    rules: [
      { text: "Emergency work orders (flooding, no heat, no water) must be assigned within 15 minutes.", source: "Internal SLA v4", autoEnforced: true },
      { text: "Routine work orders must be assigned within 2 business hours.", source: "Internal SLA v4", autoEnforced: true },
      { text: "Tenant-facing updates within 4h of work order receipt.", source: "Internal SLA v4", autoEnforced: true },
      { text: "Post-job quality audit required on 20% of completed work orders.", source: "Quality program v2", autoEnforced: false },
      { text: "Contractor rating below 3.5/5 triggers review after 3 consecutive.", source: "Quality program v2", autoEnforced: false },
    ],
  },
];
