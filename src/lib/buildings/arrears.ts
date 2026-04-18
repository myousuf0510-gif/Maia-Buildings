// Arrears synthesis — per-tenant rent-collection risk.

import { PORTFOLIO_DATA } from "./portfolio";

export type ArrearsStage = "current" | "reminder_sent" | "n4_drafted" | "n4_served" | "ltb_filed" | "payment_plan";

export interface ArrearsTenant {
  id: string;
  buildingId: string;
  buildingName: string;
  neighbourhood: string;
  unit: string;
  tenant: string;
  tenure: string;
  rent: number;
  balance: number;           // $ owed
  daysOverdue: number;
  stage: ArrearsStage;
  riskScore: number;         // 0–100 delinquency risk 30d
  paymentHistory: ("paid_on_time" | "paid_late" | "missed")[]; // last 12 months
  nextAction: string;
  nextActionDue: string;     // ISO
}

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ["Maria", "David", "Sophia", "Jamal", "Linh", "Carlos", "Aisha", "Owen", "Priya", "Kofi", "Elena", "Ryan", "Yuki", "Samir", "Nadia", "Tom", "Leila", "Ethan", "Zoe", "Raj"];
const LAST = ["Costa", "Anderson", "Park", "Williams", "Nguyen", "Lopez", "Ali", "Brown", "Singh", "Adeyemi", "Kim", "Martin", "Tanaka", "Khan", "Ahmed", "Wilson", "Hussein", "Taylor", "Dubois", "Shah"];

function fakeName(r: () => number) {
  return `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
}

const ACTION_BY_STAGE: Record<ArrearsStage, { next: string; daysOut: number }> = {
  current:          { next: "Monitoring · no action needed", daysOut: 7 },
  reminder_sent:    { next: "Follow-up call · day 7 script",  daysOut: 2 },
  n4_drafted:       { next: "Review + approve N4 notice",     daysOut: 1 },
  n4_served:        { next: "Track 14-day payment window",    daysOut: 5 },
  ltb_filed:        { next: "LTB hearing scheduling",         daysOut: 14 },
  payment_plan:     { next: "Monthly installment check-in",   daysOut: 30 },
};

function generate(): ArrearsTenant[] {
  const rng = mulberry32(6_180_339);
  const now = Date.now();
  const rows: ArrearsTenant[] = [];
  // Generate ~70 tenants in various arrears states
  const target = 74;
  for (let i = 0; i < target; i++) {
    const b = PORTFOLIO_DATA[Math.floor(rng() * PORTFOLIO_DATA.length)];
    const unit = `${Math.floor(1 + rng() * (b.floors - 1))}${String(Math.floor(1 + rng() * 20)).padStart(2, "0")}`;
    const rent = Math.round(1_900 + rng() * 2_200);
    const daysOverdue = Math.floor(Math.pow(rng(), 1.6) * 90);

    // Stage from days overdue
    let stage: ArrearsStage;
    if (daysOverdue === 0) stage = "current";
    else if (daysOverdue < 7) stage = "reminder_sent";
    else if (daysOverdue < 15) stage = "n4_drafted";
    else if (daysOverdue < 30) stage = "n4_served";
    else if (daysOverdue < 60) stage = "ltb_filed";
    else stage = "payment_plan";

    const balance = rent * Math.max(0.3, daysOverdue / 30);

    // Payment history — skew by risk
    const history: ("paid_on_time" | "paid_late" | "missed")[] = [];
    const reliability = 0.4 + rng() * 0.5;  // 0.4–0.9
    for (let j = 0; j < 12; j++) {
      const r = rng();
      if (r < reliability) history.push("paid_on_time");
      else if (r < reliability + 0.2) history.push("paid_late");
      else history.push("missed");
    }

    const missedCount = history.filter((h) => h === "missed").length;
    const lateCount = history.filter((h) => h === "paid_late").length;
    // Risk: weighted by history + current state
    const riskScore = Math.min(97, Math.max(3, Math.round(
      missedCount * 10 + lateCount * 4 + Math.min(40, daysOverdue * 1.2) + (rng() - 0.5) * 10 + 8,
    )));

    const action = ACTION_BY_STAGE[stage];
    rows.push({
      id: `arr-${String(i + 1).padStart(3, "0")}`,
      buildingId: b.id,
      buildingName: b.name,
      neighbourhood: b.neighbourhood,
      unit,
      tenant: fakeName(rng),
      tenure: `${(0.5 + rng() * 6).toFixed(1)} yrs`,
      rent,
      balance: Math.round(balance),
      daysOverdue,
      stage,
      riskScore,
      paymentHistory: history,
      nextAction: action.next,
      nextActionDue: new Date(now + action.daysOut * 86_400_000).toISOString().slice(0, 10),
    });
  }
  rows.sort((a, b) => b.riskScore - a.riskScore);
  return rows;
}

export const ARREARS = generate();

export const ARREARS_STAGE_META: Record<ArrearsStage, { label: string; color: string; bg: string }> = {
  current:        { label: "Current",        color: "#64748B", bg: "rgba(100,116,139,0.08)" },
  reminder_sent:  { label: "Reminder sent",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  n4_drafted:     { label: "N4 drafted",     color: "#D97706", bg: "rgba(217,119,6,0.12)" },
  n4_served:      { label: "N4 served",      color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
  ltb_filed:      { label: "LTB filed",      color: "#991B1B", bg: "rgba(153,27,27,0.12)" },
  payment_plan:   { label: "Payment plan",   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
};
