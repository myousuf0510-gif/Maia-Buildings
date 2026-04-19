// Vacancy & turnover pipeline synthesis.

import { PORTFOLIO_DATA, type Building } from "./portfolio";

export type TurnoverStage = "notice_received" | "inspection" | "repair" | "paint" | "clean" | "listed" | "showings" | "leased";

export interface VacatingUnit {
  id: string;
  buildingId: string;
  buildingName: string;
  neighbourhood: string;
  unit: string;
  tenant: string;
  vacateDate: string;         // ISO
  currentRent: number;
  projectedRent: number;
  expectedFlipDays: number;
  stage: TurnoverStage;
  bottleneck?: string;        // trade that's the blocker
  confidence: number;         // 0–1 on re-rent forecast
  daysSinceNotice: number;
}

export interface LeaseExpiry {
  buildingId: string;
  buildingName: string;
  unit: string;
  tenant: string;
  expiresOn: string;
  tenure: string;             // "4.2 yrs"
  renewalProbability: number; // 0–1
  currentRent: number;
  guidelineIncreasePct: number;
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

const STAGES: TurnoverStage[] = ["notice_received", "inspection", "repair", "paint", "clean", "listed", "showings", "leased"];

const FIRST_NAMES = ["Marco", "Aisha", "Daniel", "Priya", "Liam", "Sophie", "Luca", "Yuki", "Noah", "Emma", "Ethan", "Maya", "Leon", "Ava", "Omar", "Grace", "Kai", "Zara", "Oliver", "Chloe"];
const LAST_NAMES = ["Chen", "Patel", "Smith", "Nguyen", "Rodriguez", "Kim", "Ibrahim", "Singh", "Okafor", "Tanaka", "Garcia", "Brown", "Sato", "Walker", "Anand", "Kowalski", "Liu", "Park", "Hernandez", "Ahmad"];

function fakeName(r: () => number): string {
  return `${FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(r() * LAST_NAMES.length)]}`;
}

function generateVacating(): VacatingUnit[] {
  const rng = mulberry32(4_311_277);
  const now = Date.now();
  const units: VacatingUnit[] = [];
  // Generate about 0.7% of units currently turning over
  const target = 68;
  for (let i = 0; i < target; i++) {
    const b: Building = PORTFOLIO_DATA[Math.floor(rng() * PORTFOLIO_DATA.length)];
    const stage = STAGES[Math.floor(rng() * STAGES.length)];
    const daysSinceNotice = Math.floor(rng() * 45);
    const vacateDaysOut = 30 - daysSinceNotice;
    const vacateDate = new Date(now + vacateDaysOut * 86_400_000).toISOString().slice(0, 10);
    const currentRent = Math.round(1_900 + rng() * 2_100);
    const projectedRent = Math.round(currentRent * (1.08 + rng() * 0.12));
    const expectedFlipDays = Math.round(8 + rng() * 14);
    const unitNumber = `${Math.floor(1 + rng() * (b.floors - 1))}${String(Math.floor(1 + rng() * 20)).padStart(2, "0")}`;
    const bottleneckRoll = rng();
    const bottleneck = bottleneckRoll < 0.20 ? "Painters booked solid" :
                        bottleneckRoll < 0.35 ? "Flooring delivery delayed" :
                        bottleneckRoll < 0.45 ? "Awaiting inspection sign-off" :
                        undefined;
    units.push({
      id: `vac-${String(i + 1).padStart(3, "0")}`,
      buildingId: b.id,
      buildingName: b.name,
      neighbourhood: b.neighbourhood,
      unit: unitNumber,
      tenant: fakeName(rng),
      vacateDate,
      currentRent,
      projectedRent,
      expectedFlipDays,
      stage,
      bottleneck,
      confidence: +(0.74 + rng() * 0.24).toFixed(2),
      daysSinceNotice,
    });
  }
  // Sort: in-flight pipeline first (by stage progression)
  units.sort((a, b) => STAGES.indexOf(b.stage) - STAGES.indexOf(a.stage) || a.expectedFlipDays - b.expectedFlipDays);
  return units;
}

function generateLeaseExpiries(): LeaseExpiry[] {
  const rng = mulberry32(8_192_003);
  const now = Date.now();
  const rows: LeaseExpiry[] = [];
  const target = 180;
  for (let i = 0; i < target; i++) {
    const b = PORTFOLIO_DATA[Math.floor(rng() * PORTFOLIO_DATA.length)];
    const daysOut = Math.floor(5 + rng() * 110);
    const expiresOn = new Date(now + daysOut * 86_400_000).toISOString().slice(0, 10);
    const tenureYrs = +(0.8 + rng() * 7).toFixed(1);
    const rent = Math.round(1_900 + rng() * 2_400);
    // Longer tenure and reasonable rent → higher renewal probability
    const renewalProb = Math.min(0.97, Math.max(0.12, 0.45 + (tenureYrs * 0.06) + (rng() - 0.3) * 0.25));
    rows.push({
      buildingId: b.id,
      buildingName: b.name,
      unit: `${Math.floor(1 + rng() * (b.floors - 1))}${String(Math.floor(1 + rng() * 20)).padStart(2, "0")}`,
      tenant: fakeName(rng),
      expiresOn,
      tenure: `${tenureYrs} yrs`,
      renewalProbability: +renewalProb.toFixed(2),
      currentRent: rent,
      guidelineIncreasePct: 2.5,
    });
  }
  rows.sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
  return rows;
}

export const VACATING_UNITS = generateVacating();
export const LEASE_EXPIRIES = generateLeaseExpiries();

export const STAGE_META: Record<TurnoverStage, { label: string; color: string; order: number }> = {
  notice_received: { label: "Notice received", color: "#64748B", order: 0 },
  inspection:      { label: "Inspection",      color: "#2563EB", order: 1 },
  repair:          { label: "Repair",          color: "#F59E0B", order: 2 },
  paint:           { label: "Paint",           color: "#7C3AED", order: 3 },
  clean:           { label: "Clean",           color: "#06B6D4", order: 4 },
  listed:          { label: "Listed",          color: "#EC4899", order: 5 },
  showings:        { label: "Showings",        color: "#F97316", order: 6 },
  leased:          { label: "Leased",          color: "#10B981", order: 7 },
};
