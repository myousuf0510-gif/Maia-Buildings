// Royal York Property Management — anchor portfolio.
// 47 buildings across the GTA. Deterministic synthesis so the demo is stable
// across reloads and every dashboard number is internally consistent.

export type BuildingClass = "class_a_office" | "class_b_office" | "multifamily_hirise" | "multifamily_lowrise" | "mixed_use";

export interface Building {
  id: string;
  name: string;
  address: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  class: BuildingClass;
  floors: number;
  units: number;              // residential units (or suites for office)
  sqft: number;
  yearBuilt: number;
  occupancyPct: number;       // current occupancy %
  arrearsTenants: number;     // residents with open arrears
  openWorkOrders: number;
  overdueWorkOrders: number;
  healthScore: number;        // 0–100, composite
  energyKwhPerSqft: number;   // rolling 12mo
  monthlyRevenue: number;     // $
  complianceAlerts: number;
  nextInspection: string;     // ISO or friendly date
}

// ─── Deterministic RNG so the portfolio is stable ────────────────────────────

function mulberry32(seed: number) {
  let a = seed | 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = [
  "Harbourfront Residences",  "Liberty Village Lofts",   "King West Towers",    "Yorkville Place",
  "Don Valley Gardens",       "Fort York Lofts",         "Distillery District Flats", "Queen Street Residences",
  "Bay-Bloor Condos",         "St. Clair Crossing",      "Leaside Heights",     "Beaches Bluff",
  "Riverdale Park Place",     "Annex Flats",             "Cabbagetown Row",     "Forest Hill Residences",
  "High Park Mansions",       "Roncesvalles Lofts",      "The Junction Quarters", "Parkdale Commons",
  "Etobicoke Lakeshore",      "Mississauga Square",      "Erin Mills Residences","Square One Towers",
  "Port Credit Lofts",        "Oakville Harbour",        "Clarkson Place",      "Lorne Park Residences",
  "Markham Centre",           "Unionville Flats",        "Richmond Hill Towers","Thornhill Gardens",
  "Vaughan Metropolitan",     "Woodbridge Commons",      "Brampton Civic",      "Mount Pleasant Heights",
  "Pickering Bayfront",       "Ajax Heights",            "Whitby Town Centre",  "Scarborough Bluffs",
  "Agincourt Place",          "Don Mills Crossing",      "North York Square",   "Willowdale Residences",
  "Bayview Village Place",    "Finch Avenue Heights",    "Sheppard Lofts",
];

const NEIGHBOURHOODS_COORDS: Record<string, { neighbourhood: string; lat: number; lng: number }> = {
  "Harbourfront Residences":  { neighbourhood: "Harbourfront",     lat: 43.6385, lng: -79.3793 },
  "Liberty Village Lofts":    { neighbourhood: "Liberty Village",  lat: 43.6380, lng: -79.4187 },
  "King West Towers":         { neighbourhood: "King West",        lat: 43.6440, lng: -79.4060 },
  "Yorkville Place":          { neighbourhood: "Yorkville",        lat: 43.6712, lng: -79.3929 },
  "Don Valley Gardens":       { neighbourhood: "Don Valley",       lat: 43.7100, lng: -79.3470 },
  "Fort York Lofts":          { neighbourhood: "Fort York",        lat: 43.6382, lng: -79.4066 },
  "Distillery District Flats":{ neighbourhood: "Distillery",       lat: 43.6503, lng: -79.3599 },
  "Queen Street Residences":  { neighbourhood: "Queen West",       lat: 43.6476, lng: -79.4095 },
  "Bay-Bloor Condos":         { neighbourhood: "Bay & Bloor",      lat: 43.6700, lng: -79.3885 },
  "St. Clair Crossing":       { neighbourhood: "St. Clair West",   lat: 43.6807, lng: -79.4295 },
  "Leaside Heights":          { neighbourhood: "Leaside",          lat: 43.7031, lng: -79.3684 },
  "Beaches Bluff":            { neighbourhood: "The Beaches",      lat: 43.6684, lng: -79.2985 },
  "Riverdale Park Place":     { neighbourhood: "Riverdale",        lat: 43.6712, lng: -79.3521 },
  "Annex Flats":              { neighbourhood: "The Annex",        lat: 43.6690, lng: -79.4050 },
  "Cabbagetown Row":          { neighbourhood: "Cabbagetown",      lat: 43.6670, lng: -79.3675 },
  "Forest Hill Residences":   { neighbourhood: "Forest Hill",      lat: 43.6960, lng: -79.4171 },
  "High Park Mansions":       { neighbourhood: "High Park",        lat: 43.6465, lng: -79.4637 },
  "Roncesvalles Lofts":       { neighbourhood: "Roncesvalles",     lat: 43.6483, lng: -79.4497 },
  "The Junction Quarters":    { neighbourhood: "The Junction",     lat: 43.6652, lng: -79.4649 },
  "Parkdale Commons":         { neighbourhood: "Parkdale",         lat: 43.6396, lng: -79.4336 },
  "Etobicoke Lakeshore":      { neighbourhood: "Etobicoke",        lat: 43.5940, lng: -79.5430 },
  "Mississauga Square":       { neighbourhood: "Mississauga",      lat: 43.5890, lng: -79.6440 },
  "Erin Mills Residences":    { neighbourhood: "Erin Mills",       lat: 43.5461, lng: -79.7080 },
  "Square One Towers":        { neighbourhood: "Square One",       lat: 43.5932, lng: -79.6438 },
  "Port Credit Lofts":        { neighbourhood: "Port Credit",      lat: 43.5541, lng: -79.5876 },
  "Oakville Harbour":         { neighbourhood: "Oakville",         lat: 43.4675, lng: -79.6877 },
  "Clarkson Place":           { neighbourhood: "Clarkson",         lat: 43.5184, lng: -79.6235 },
  "Lorne Park Residences":    { neighbourhood: "Lorne Park",       lat: 43.5295, lng: -79.6280 },
  "Markham Centre":           { neighbourhood: "Markham",          lat: 43.8561, lng: -79.3370 },
  "Unionville Flats":         { neighbourhood: "Unionville",       lat: 43.8700, lng: -79.3130 },
  "Richmond Hill Towers":     { neighbourhood: "Richmond Hill",    lat: 43.8828, lng: -79.4403 },
  "Thornhill Gardens":        { neighbourhood: "Thornhill",        lat: 43.8150, lng: -79.4200 },
  "Vaughan Metropolitan":     { neighbourhood: "Vaughan",          lat: 43.7944, lng: -79.5273 },
  "Woodbridge Commons":       { neighbourhood: "Woodbridge",       lat: 43.7860, lng: -79.5960 },
  "Brampton Civic":           { neighbourhood: "Brampton",         lat: 43.7315, lng: -79.7624 },
  "Mount Pleasant Heights":   { neighbourhood: "Mount Pleasant",   lat: 43.7039, lng: -79.3860 },
  "Pickering Bayfront":       { neighbourhood: "Pickering",        lat: 43.8354, lng: -79.0850 },
  "Ajax Heights":             { neighbourhood: "Ajax",             lat: 43.8509, lng: -79.0204 },
  "Whitby Town Centre":       { neighbourhood: "Whitby",           lat: 43.8975, lng: -78.9429 },
  "Scarborough Bluffs":       { neighbourhood: "Scarborough",      lat: 43.7164, lng: -79.2393 },
  "Agincourt Place":          { neighbourhood: "Agincourt",        lat: 43.7870, lng: -79.2848 },
  "Don Mills Crossing":       { neighbourhood: "Don Mills",        lat: 43.7375, lng: -79.3440 },
  "North York Square":        { neighbourhood: "North York",       lat: 43.7615, lng: -79.4111 },
  "Willowdale Residences":    { neighbourhood: "Willowdale",       lat: 43.7700, lng: -79.4093 },
  "Bayview Village Place":    { neighbourhood: "Bayview Village",  lat: 43.7683, lng: -79.3850 },
  "Finch Avenue Heights":     { neighbourhood: "Finch",            lat: 43.7810, lng: -79.4159 },
  "Sheppard Lofts":           { neighbourhood: "Sheppard",         lat: 43.7610, lng: -79.4110 },
};

function pickClass(r: () => number): BuildingClass {
  const roll = r();
  if (roll < 0.45) return "multifamily_hirise";
  if (roll < 0.68) return "multifamily_lowrise";
  if (roll < 0.82) return "class_b_office";
  if (roll < 0.93) return "class_a_office";
  return "mixed_use";
}

function generatePortfolio(): Building[] {
  const rng = mulberry32(7_919_031);
  const buildings: Building[] = [];
  for (let i = 0; i < NAMES.length; i++) {
    const name = NAMES[i];
    const loc = NEIGHBOURHOODS_COORDS[name];
    const cls = pickClass(rng);
    const isOffice = cls === "class_a_office" || cls === "class_b_office";
    const floors = Math.round(isOffice ? 8 + rng() * 30 : 4 + rng() * 26);
    const units = Math.round(isOffice ? 20 + rng() * 80 : 40 + rng() * 240);
    const sqftPerUnit = isOffice ? 2_800 + rng() * 3_000 : 680 + rng() * 520;
    const sqft = Math.round(units * sqftPerUnit);
    const yearBuilt = Math.round(1975 + rng() * 48);
    const occupancyPct = Math.round(88 + rng() * 11);
    const arrearsTenants = Math.floor(units * (0.01 + rng() * 0.06));
    const openWorkOrders = Math.round(2 + rng() * 18);
    const overdueWorkOrders = Math.floor(openWorkOrders * (rng() * 0.35));
    const complianceAlerts = rng() > 0.78 ? 1 + Math.floor(rng() * 3) : 0;
    const energyKwhPerSqft = +(11 + rng() * 14).toFixed(1);
    const avgRent = isOffice ? 35 * sqftPerUnit / 12 : 2_100 + rng() * 1_900;
    const monthlyRevenue = Math.round(units * avgRent * occupancyPct / 100);

    const inspectionDaysOut = Math.floor(4 + rng() * 120);
    const nextInspection = new Date(Date.now() + inspectionDaysOut * 86_400_000).toISOString().slice(0, 10);

    // Health: a weighted composite
    const occupancyScore = (occupancyPct - 80) * 4; // 88% → 32, 99% → 76
    const arrearsPenalty = (arrearsTenants / units) * 300;
    const overduePenalty = overdueWorkOrders * 3;
    const compliancePenalty = complianceAlerts * 8;
    let health = 80 + occupancyScore - arrearsPenalty - overduePenalty - compliancePenalty;
    health += (rng() - 0.5) * 8;
    const healthScore = Math.max(12, Math.min(99, Math.round(health)));

    buildings.push({
      id: `bldg-${String(i + 1).padStart(3, "0")}`,
      name,
      address: generateAddress(rng, loc.neighbourhood),
      neighbourhood: loc.neighbourhood,
      lat: loc.lat,
      lng: loc.lng,
      class: cls,
      floors,
      units,
      sqft,
      yearBuilt,
      occupancyPct,
      arrearsTenants,
      openWorkOrders,
      overdueWorkOrders,
      healthScore,
      energyKwhPerSqft,
      monthlyRevenue,
      complianceAlerts,
      nextInspection,
    });
  }
  return buildings;
}

function generateAddress(r: () => number, hood: string): string {
  const num = Math.floor(50 + r() * 2_000);
  const streets = ["Bay St", "Queen St E", "King St W", "Bloor St W", "Dundas St W", "College St", "Yonge St", "Richmond St W", "Front St W", "Spadina Ave", "University Ave", "Dufferin St"];
  const street = streets[Math.floor(r() * streets.length)];
  // Suburban hoods get a different format
  if (["Mississauga", "Oakville", "Markham", "Richmond Hill", "Brampton", "Vaughan", "Pickering", "Ajax", "Whitby"].includes(hood)) {
    const subStreets = ["Hurontario St", "Derry Rd", "Lakeshore Rd", "Dundas St", "Eglinton Ave", "Steeles Ave"];
    return `${num} ${subStreets[Math.floor(r() * subStreets.length)]}`;
  }
  return `${num} ${street}`;
}

// Compute derived totals once at module load
export const PORTFOLIO_DATA = generatePortfolio();

export function portfolioTotals() {
  const b = PORTFOLIO_DATA;
  const total = (fn: (x: Building) => number) => b.reduce((s, x) => s + fn(x), 0);
  return {
    buildingCount: b.length,
    unitCount: total((x) => x.units),
    sqftTotal: total((x) => x.sqft),
    occupancyPct: +(total((x) => x.occupancyPct * x.units) / total((x) => x.units)).toFixed(1),
    arrearsTenants: total((x) => x.arrearsTenants),
    openWorkOrders: total((x) => x.openWorkOrders),
    overdueWorkOrders: total((x) => x.overdueWorkOrders),
    complianceAlerts: total((x) => x.complianceAlerts),
    monthlyRevenue: total((x) => x.monthlyRevenue),
    avgHealth: Math.round(total((x) => x.healthScore) / b.length),
    healthy: b.filter((x) => x.healthScore >= 75).length,
    watch: b.filter((x) => x.healthScore < 75 && x.healthScore >= 55).length,
    critical: b.filter((x) => x.healthScore < 55).length,
  };
}

export const CLASS_META: Record<BuildingClass, { label: string; color: string }> = {
  multifamily_hirise:  { label: "Multi-family high-rise", color: "#2563EB" },
  multifamily_lowrise: { label: "Multi-family low-rise",  color: "#0EA5E9" },
  class_a_office:      { label: "Class A office",         color: "#7C3AED" },
  class_b_office:      { label: "Class B office",         color: "#8B5CF6" },
  mixed_use:           { label: "Mixed-use",              color: "#EC4899" },
};

export function healthColor(score: number): string {
  if (score >= 75) return "#10B981";
  if (score >= 55) return "#F59E0B";
  return "#EF4444";
}

export function healthLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 75) return "Healthy";
  if (score >= 65) return "Watch";
  if (score >= 55) return "At risk";
  return "Critical";
}
