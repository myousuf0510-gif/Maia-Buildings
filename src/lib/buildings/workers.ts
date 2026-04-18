// Unified worker pool — employees + contractors.
// Drives the Dispatch Agent + Work Order Market + Workforce Directory.

import { PORTFOLIO_DATA } from "./portfolio";

export type WorkerType = "employee" | "contractor";
export type Trade =
  | "plumbing" | "electrical" | "hvac" | "general_maintenance"
  | "painting" | "flooring" | "locksmith" | "pest_control"
  | "cleaning" | "landscaping" | "appliance" | "fire_safety"
  | "elevator" | "roofing";

export interface Worker {
  id: string;
  name: string;
  type: WorkerType;
  company?: string;            // for contractors
  trades: Trade[];
  rating: number;              // 0–5
  completionsThisMonth: number;
  activeAssignments: number;   // in-progress load
  slaHitRatePct: number;       // 0–100
  hourlyRate: number;          // $ — employee loaded cost or contractor bill rate
  homeBase: string;            // neighbourhood
  availableNow: boolean;
  licenseValid: boolean;       // trade license
  insuranceValid: boolean;     // contractor CGL
  wsibValid: boolean;          // contractor WSIB
  licenseExpires?: string;     // ISO
  accent: string;
  badges?: string[];           // e.g. "Top rated", "Preferred", "On call"
}

// ─── Deterministic RNG ───────────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const EMPLOYEE_NAMES = [
  "James Chen", "Priya Patel", "Marcus Reid", "Elena Volkov", "Dana White",
  "Omar Hassan", "Sarah Kim", "Tomi Okafor", "Ravi Anand", "Hiro Sato",
  "Lucia Diaz", "Keisha Johnson", "Wei Chen", "Anh Nguyen", "Brianna Walker",
  "Arjun Singh", "Yusuf Ahmad", "Sofia Mueller", "Faisal Torres", "Naomi Tanaka",
  "Daniel Park", "Rafael Garcia", "Jessica Liu", "Kenji Tanaka", "Bilal Hassan",
  "Mike Rodriguez",
];

const CONTRACTOR_COMPANIES: { name: string; trades: Trade[]; hourlyRate: number; rating: number }[] = [
  { name: "Apex Plumbing Co.",        trades: ["plumbing"],                                    hourlyRate: 145, rating: 4.7 },
  { name: "GTA Electrical Inc.",      trades: ["electrical"],                                  hourlyRate: 165, rating: 4.6 },
  { name: "Hydro Electric Inc.",      trades: ["electrical"],                                  hourlyRate: 155, rating: 4.2 },
  { name: "ClimateCare HVAC",         trades: ["hvac"],                                        hourlyRate: 175, rating: 4.8 },
  { name: "Northwind Heating",        trades: ["hvac", "plumbing"],                            hourlyRate: 160, rating: 4.5 },
  { name: "Precision Painters",       trades: ["painting"],                                    hourlyRate: 85,  rating: 4.6 },
  { name: "Colourworks Inc.",         trades: ["painting", "flooring"],                        hourlyRate: 90,  rating: 4.4 },
  { name: "QuickKey Locksmiths",      trades: ["locksmith"],                                   hourlyRate: 120, rating: 4.9 },
  { name: "Toronto Pest Pros",        trades: ["pest_control"],                                hourlyRate: 110, rating: 4.5 },
  { name: "Spotless Commercial Cleaning", trades: ["cleaning"],                                hourlyRate: 55,  rating: 4.3 },
  { name: "Emerald Landscape Co.",    trades: ["landscaping"],                                 hourlyRate: 75,  rating: 4.5 },
  { name: "Appliance Rescue",         trades: ["appliance"],                                   hourlyRate: 135, rating: 4.6 },
  { name: "LCI Fire Safety",          trades: ["fire_safety"],                                 hourlyRate: 150, rating: 4.8 },
  { name: "TSSA Elevator Co.",        trades: ["elevator"],                                    hourlyRate: 220, rating: 4.7 },
  { name: "Maple Leaf Roofing",       trades: ["roofing"],                                     hourlyRate: 140, rating: 4.4 },
  { name: "Dominion Trades Ltd.",     trades: ["plumbing", "electrical", "general_maintenance"], hourlyRate: 150, rating: 4.5 },
  { name: "Flooring Experts GTA",     trades: ["flooring"],                                    hourlyRate: 95,  rating: 4.6 },
  { name: "Sunrise HVAC",             trades: ["hvac", "appliance"],                           hourlyRate: 165, rating: 4.3 },
  { name: "Ironclad Security Fire",   trades: ["fire_safety"],                                 hourlyRate: 140, rating: 4.5 },
  { name: "CleanSweep Janitorial",    trades: ["cleaning"],                                    hourlyRate: 52,  rating: 4.2 },
];

const EMPLOYEE_TRADES: Trade[][] = [
  ["general_maintenance", "painting"],
  ["plumbing", "general_maintenance"],
  ["electrical", "general_maintenance"],
  ["general_maintenance", "appliance"],
  ["cleaning"],
  ["hvac", "general_maintenance"],
  ["general_maintenance", "landscaping"],
  ["painting", "flooring", "general_maintenance"],
  ["plumbing", "appliance"],
  ["general_maintenance"],
];

const NEIGHBOURHOODS = Array.from(new Set(PORTFOLIO_DATA.map((b) => b.neighbourhood)));

function generate(): Worker[] {
  const rng = mulberry32(2_718_281);
  const workers: Worker[] = [];

  // Employees — Royal York in-house maintenance team
  EMPLOYEE_NAMES.forEach((name, i) => {
    const trades = EMPLOYEE_TRADES[i % EMPLOYEE_TRADES.length];
    workers.push({
      id: `emp-${String(i + 1).padStart(3, "0")}`,
      name,
      type: "employee",
      trades,
      rating: +(4.2 + rng() * 0.8).toFixed(1),
      completionsThisMonth: Math.round(14 + rng() * 22),
      activeAssignments: Math.floor(rng() * 5),
      slaHitRatePct: Math.round(88 + rng() * 11),
      hourlyRate: Math.round(42 + rng() * 18), // loaded cost per hour
      homeBase: NEIGHBOURHOODS[Math.floor(rng() * NEIGHBOURHOODS.length)],
      availableNow: rng() > 0.25,
      licenseValid: rng() > 0.08,
      insuranceValid: true,   // covered by RYPM
      wsibValid: true,        // RYPM carries
      accent: "#2563EB",
      badges: i < 4 ? ["Top rated"] : i < 8 ? ["Preferred"] : undefined,
    });
  });

  // Contractors
  CONTRACTOR_COMPANIES.forEach((co, i) => {
    // 1–3 techs per contractor
    const techCount = 1 + Math.floor(rng() * 3);
    for (let t = 0; t < techCount; t++) {
      const name = `${co.name} · Tech ${t + 1}`;
      const jitter = (rng() - 0.5) * 0.4;
      // Some contractors have lapsed compliance (the Hydro Electric Inc. example)
      const isHydro = co.name === "Hydro Electric Inc.";
      workers.push({
        id: `con-${String(i + 1).padStart(2, "0")}-${t + 1}`,
        name,
        type: "contractor",
        company: co.name,
        trades: co.trades,
        rating: +Math.max(3.0, Math.min(5.0, co.rating + jitter)).toFixed(1),
        completionsThisMonth: Math.round(6 + rng() * 22),
        activeAssignments: Math.floor(rng() * 4),
        slaHitRatePct: Math.round(82 + rng() * 16),
        hourlyRate: co.hourlyRate + Math.round((rng() - 0.5) * 20),
        homeBase: NEIGHBOURHOODS[Math.floor(rng() * NEIGHBOURHOODS.length)],
        availableNow: rng() > 0.3,
        licenseValid: rng() > 0.05,
        insuranceValid: !isHydro && rng() > 0.03,   // Hydro flagged
        wsibValid: !isHydro,                          // Hydro flagged
        licenseExpires: new Date(Date.now() + (20 + rng() * 500) * 86_400_000).toISOString().slice(0, 10),
        accent: co.rating >= 4.7 ? "#10B981" : co.rating >= 4.4 ? "#2563EB" : "#F59E0B",
        badges: isHydro ? ["WSIB LAPSED"] : co.rating >= 4.7 ? ["Top rated"] : undefined,
      });
    }
  });

  return workers;
}

export const WORKER_POOL = generate();

export function workerById(id: string): Worker | undefined {
  return WORKER_POOL.find((w) => w.id === id);
}

export const TRADE_META: Record<Trade, { label: string; color: string; icon: string }> = {
  plumbing:            { label: "Plumbing",            color: "#0891B2", icon: "💧" },
  electrical:          { label: "Electrical",          color: "#F59E0B", icon: "⚡" },
  hvac:                { label: "HVAC",                color: "#2563EB", icon: "🌡️" },
  general_maintenance: { label: "General maintenance", color: "#64748B", icon: "🔧" },
  painting:            { label: "Painting",            color: "#7C3AED", icon: "🎨" },
  flooring:            { label: "Flooring",            color: "#EC4899", icon: "🪵" },
  locksmith:           { label: "Locksmith",           color: "#0F172A", icon: "🔑" },
  pest_control:        { label: "Pest control",        color: "#10B981", icon: "🛡️" },
  cleaning:            { label: "Cleaning",            color: "#06B6D4", icon: "✨" },
  landscaping:         { label: "Landscaping",         color: "#16A34A", icon: "🌿" },
  appliance:           { label: "Appliance",           color: "#DC2626", icon: "🧰" },
  fire_safety:         { label: "Fire safety",         color: "#EA580C", icon: "🔥" },
  elevator:            { label: "Elevator",            color: "#8B5CF6", icon: "🛗" },
  roofing:             { label: "Roofing",             color: "#B45309", icon: "🏠" },
};
