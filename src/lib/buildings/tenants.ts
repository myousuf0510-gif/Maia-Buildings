// Tenant roster — synthesised against the portfolio.

import { PORTFOLIO_DATA } from "./portfolio";

export type TenancyStatus = "current" | "vacating" | "new" | "month_to_month" | "renewing";
export type PaymentStatus = "on_time" | "late" | "arrears" | "new";

export interface Tenant {
  id: string;
  name: string;
  unit: string;
  buildingId: string;
  buildingName: string;
  neighbourhood: string;
  status: TenancyStatus;
  paymentStatus: PaymentStatus;
  tenure: string;         // "3.2 yrs"
  tenureYears: number;
  monthlyRent: number;
  moveInDate: string;
  leaseEndDate: string;
  phone: string;
  email: string;
  occupants: number;      // number of people
  parkingSpots: number;
  petPolicy: "none" | "cat" | "dog" | "both";
  notes?: string;
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

const FIRST = [
  "Alex","Amira","Anita","Arjun","Ava","Bilal","Brendan","Carlos","Chen","Chloe","Daniel",
  "David","Derek","Dimitri","Elena","Emma","Ethan","Faisal","Fernanda","Grace","Hana","Hiro",
  "Isabella","James","Janet","Jamal","Jean","Jessica","Jin","Jorge","Julia","Kai","Karim",
  "Keisha","Kenji","Khadija","Kyle","Laura","Leila","Liam","Lina","Lucia","Marcus","Maria",
  "Maya","Miguel","Mohammed","Naomi","Neha","Nora","Olga","Omar","Priya","Rachel","Raj","Rina",
  "Ryan","Samir","Sara","Sebastian","Sofia","Sonya","Tara","Tom","Victor","Wei","Yasmin","Yuki","Zainab","Zoe",
];
const LAST = [
  "Adeyemi","Ahmed","Ali","Anand","Brown","Chen","Chan","Chang","Costa","Dias","DaSilva",
  "Dubois","Fernandes","Garcia","Ghosh","Gagnon","Hernandez","Huang","Ibrahim","Jackson","Khan",
  "Kim","Kowalski","Kumar","Lee","Liu","Lopez","Martinez","Mukherjee","Nguyen","Okafor","Park",
  "Patel","Petrov","Reyes","Rivera","Rodriguez","Saito","Santos","Shah","Sharma","Sato","Singh",
  "Smith","Sutton","Tanaka","Taylor","Torres","Vega","Volkov","Wang","White","Williams","Wilson",
  "Wu","Yamamoto","Yang","Yilmaz","Zhang",
];

function name(r: () => number): string {
  return `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
}

function phone(r: () => number): string {
  const a = 416 + Math.floor(r() * 200);
  const b = 200 + Math.floor(r() * 800);
  const c = 1000 + Math.floor(r() * 9000);
  return `(${a}) ${b}-${c}`;
}

function generateTenants(): Tenant[] {
  const rng = mulberry32(3_141_593);
  const tenants: Tenant[] = [];
  let id = 0;
  const now = Date.now();

  // Generate ~450 tenants across the portfolio (not all units, but a representative slice)
  PORTFOLIO_DATA.forEach((b) => {
    const sampleSize = Math.min(b.units, Math.max(3, Math.round(b.units * 0.05)));
    for (let i = 0; i < sampleSize; i++) {
      id++;
      const tenureYears = +(0.3 + rng() * 8).toFixed(1);
      const moveInDaysAgo = Math.floor(tenureYears * 365);
      const moveInDate = new Date(now - moveInDaysAgo * 86_400_000).toISOString().slice(0, 10);
      const leaseDaysOut = Math.floor(-30 + rng() * 420);
      const leaseEndDate = new Date(now + leaseDaysOut * 86_400_000).toISOString().slice(0, 10);
      const monthlyRent = Math.round((1_850 + rng() * 2_800) / 50) * 50;

      const statusRoll = rng();
      let status: TenancyStatus;
      if (tenureYears < 0.5) status = "new";
      else if (leaseDaysOut < 60) status = statusRoll < 0.5 ? "renewing" : "vacating";
      else if (statusRoll < 0.18) status = "month_to_month";
      else status = "current";

      // Payment status weighted by building's arrears rate
      const arrearsRate = b.arrearsTenants / Math.max(b.units, 1);
      const payRoll = rng();
      let paymentStatus: PaymentStatus;
      if (status === "new") paymentStatus = "new";
      else if (payRoll < arrearsRate * 2) paymentStatus = "arrears";
      else if (payRoll < arrearsRate * 2 + 0.08) paymentStatus = "late";
      else paymentStatus = "on_time";

      const occupants = 1 + Math.floor(rng() * 4);
      const parkingSpots = rng() > 0.55 ? (rng() > 0.8 ? 2 : 1) : 0;
      const petPolicy = rng() > 0.7 ? (rng() > 0.5 ? "cat" : "dog") : "none";

      const unit = `${Math.floor(1 + rng() * (b.floors - 1))}${String(Math.floor(1 + rng() * 20)).padStart(2, "0")}`;
      const n = name(rng);

      tenants.push({
        id: `ten-${String(id).padStart(4, "0")}`,
        name: n,
        unit,
        buildingId: b.id,
        buildingName: b.name,
        neighbourhood: b.neighbourhood,
        status,
        paymentStatus,
        tenure: `${tenureYears} yr${tenureYears === 1 ? "" : "s"}`,
        tenureYears,
        monthlyRent,
        moveInDate,
        leaseEndDate,
        phone: phone(rng),
        email: `${n.toLowerCase().replace(/[^a-z]/g, ".")}@gmail.com`,
        occupants,
        parkingSpots,
        petPolicy,
        notes: rng() > 0.85 ? pickNote(rng) : undefined,
      });
    }
  });

  return tenants;
}

function pickNote(r: () => number): string {
  const notes = [
    "Service animal on file",
    "Prefers email contact only",
    "Senior resident — quarterly wellness check",
    "Has 2 roommates on lease",
    "Pay-on-receipt arrangement · do not escalate",
    "WSIB light-duty return — accommodation on file",
    "Graduated rent agreement through Q3",
    "Paying via PAD since 2024",
  ];
  return notes[Math.floor(r() * notes.length)];
}

export const TENANTS = generateTenants();

export function tenantsByBuilding(buildingId: string): Tenant[] {
  return TENANTS.filter((t) => t.buildingId === buildingId);
}

export const STATUS_META: Record<TenancyStatus, { label: string; color: string; bg: string }> = {
  current:         { label: "Current",         color: "#059669", bg: "rgba(16,185,129,0.08)" },
  vacating:        { label: "Vacating",        color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  new:             { label: "New tenant",      color: "#2563EB", bg: "rgba(37,99,235,0.08)" },
  month_to_month:  { label: "Month-to-month",  color: "#7C3AED", bg: "rgba(124,58,237,0.08)" },
  renewing:        { label: "Renewing",        color: "#0891B2", bg: "rgba(8,145,178,0.1)" },
};

export const PAYMENT_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  on_time:  { label: "On time",   color: "#059669", bg: "rgba(16,185,129,0.08)" },
  late:     { label: "Late",      color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  arrears:  { label: "Arrears",   color: "#DC2626", bg: "rgba(220,38,38,0.08)" },
  new:      { label: "—",         color: "#64748B", bg: "rgba(100,116,139,0.06)" },
};
