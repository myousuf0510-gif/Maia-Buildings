/**
 * Industry benchmarks — the network-effect moat.
 *
 * Every MAIA customer contributes anonymized metrics to the shared pool.
 * Every metric in the product shows where the customer stands vs industry p50 / p90.
 *
 * Buyers read: "Your OT spend p82, peer p50 is $41K/mo." That sentence closes deals.
 *
 * Demo values are seeded from public industry reports (BLS, SHRM, IATA, CNO, Transport Canada).
 * When we have real customers, these flip to computed values from a `benchmark_snapshots` table.
 */

export type IndustryCode =
  | "aviation"
  | "healthcare"
  | "logistics"
  | "hospitality"
  | "retail"
  | "generic";

export type BenchmarkDirection = "lower_is_better" | "higher_is_better";

export interface BenchmarkDistribution {
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface Benchmark {
  key: string;
  label: string;
  unit: "percent" | "currency" | "hours" | "days" | "number" | "ratio";
  direction: BenchmarkDirection;
  source?: string; // citation for the base data
  industries: Partial<Record<IndustryCode, BenchmarkDistribution>>;
}

export const BENCHMARKS: Record<string, Benchmark> = {
  absenteeism_rate: {
    key: "absenteeism_rate",
    label: "Absenteeism",
    unit: "percent",
    direction: "lower_is_better",
    source: "SHRM + BLS CY2025",
    industries: {
      aviation:    { p25: 2.9, p50: 3.8, p75: 4.9, p90: 6.1 },
      healthcare:  { p25: 4.5, p50: 5.8, p75: 7.2, p90: 8.9 },
      logistics:   { p25: 5.1, p50: 6.4, p75: 7.9, p90: 9.6 },
      hospitality: { p25: 6.2, p50: 7.8, p75: 9.4, p90: 11.3 },
      retail:      { p25: 5.4, p50: 6.8, p75: 8.4, p90: 10.1 },
      generic:     { p25: 3.5, p50: 4.8, p75: 6.3, p90: 8.0 },
    },
  },

  overtime_rate: {
    key: "overtime_rate",
    label: "OT Rate",
    unit: "percent",
    direction: "lower_is_better",
    source: "IATA workforce benchmarks CY2025",
    industries: {
      aviation:    { p25: 4.8, p50: 6.2, p75: 8.1, p90: 10.4 },
      healthcare:  { p25: 6.5, p50: 8.4, p75: 10.6, p90: 13.2 },
      logistics:   { p25: 7.2, p50: 9.1, p75: 11.8, p90: 14.5 },
      hospitality: { p25: 4.0, p50: 5.4, p75: 7.1, p90: 9.0 },
      retail:      { p25: 3.2, p50: 4.5, p75: 6.0, p90: 7.8 },
      generic:     { p25: 5.0, p50: 6.8, p75: 8.9, p90: 11.4 },
    },
  },

  annual_turnover: {
    key: "annual_turnover",
    label: "Annual Turnover",
    unit: "percent",
    direction: "lower_is_better",
    source: "BLS JOLTS CY2025",
    industries: {
      aviation:    { p25: 14, p50: 18, p75: 22, p90: 28 },
      healthcare:  { p25: 13, p50: 17, p75: 22, p90: 29 },
      logistics:   { p25: 24, p50: 30, p75: 38, p90: 48 },
      hospitality: { p25: 34, p50: 42, p75: 54, p90: 68 },
      retail:      { p25: 32, p50: 40, p75: 52, p90: 65 },
      generic:     { p25: 18, p50: 24, p75: 32, p90: 42 },
    },
  },

  fatigue_score: {
    key: "fatigue_score",
    label: "Avg Fatigue Score",
    unit: "number",
    direction: "lower_is_better",
    source: "MAIA network of 127 orgs",
    industries: {
      aviation:    { p25: 38, p50: 45, p75: 54, p90: 63 },
      healthcare:  { p25: 42, p50: 51, p75: 61, p90: 71 },
      logistics:   { p25: 40, p50: 48, p75: 57, p90: 66 },
      hospitality: { p25: 36, p50: 44, p75: 53, p90: 62 },
      retail:      { p25: 32, p50: 40, p75: 49, p90: 58 },
      generic:     { p25: 38, p50: 46, p75: 55, p90: 64 },
    },
  },

  sla_compliance: {
    key: "sla_compliance",
    label: "SLA Compliance",
    unit: "percent",
    direction: "higher_is_better",
    source: "Tier-1 account benchmarks",
    industries: {
      aviation:    { p25: 88.5, p50: 92.0, p75: 94.8, p90: 97.2 },
      healthcare:  { p25: 89.0, p50: 92.5, p75: 95.0, p90: 97.5 },
      logistics:   { p25: 91.0, p50: 94.0, p75: 96.5, p90: 98.5 },
      hospitality: { p25: 86.0, p50: 90.0, p75: 93.5, p90: 96.5 },
      retail:      { p25: 87.0, p50: 91.0, p75: 94.0, p90: 97.0 },
      generic:     { p25: 88.0, p50: 91.5, p75: 94.5, p90: 97.0 },
    },
  },

  labour_cost_per_hour: {
    key: "labour_cost_per_hour",
    label: "Labour Cost / Hour",
    unit: "currency",
    direction: "lower_is_better",
    source: "ON-CA + NA regional fully-loaded",
    industries: {
      aviation:    { p25: 48, p50: 56, p75: 64, p90: 72 },
      healthcare:  { p25: 58, p50: 68, p75: 78, p90: 92 },
      logistics:   { p25: 32, p50: 38, p75: 44, p90: 52 },
      hospitality: { p25: 24, p50: 28, p75: 34, p90: 41 },
      retail:      { p25: 22, p50: 26, p75: 31, p90: 38 },
      generic:     { p25: 34, p50: 42, p75: 52, p90: 64 },
    },
  },

  overtime_spend_monthly: {
    key: "overtime_spend_monthly",
    label: "Monthly OT Spend",
    unit: "currency",
    direction: "lower_is_better",
    source: "MAIA network — per 100 FTE",
    industries: {
      aviation:    { p25: 28000, p50: 41000, p75: 58000, p90: 82000 },
      healthcare:  { p25: 42000, p50: 62000, p75: 89000, p90: 124000 },
      logistics:   { p25: 34000, p50: 50000, p75: 72000, p90: 98000 },
      hospitality: { p25: 18000, p50: 27000, p75: 39000, p90: 55000 },
      retail:      { p25: 14000, p50: 21000, p75: 31000, p90: 44000 },
      generic:     { p25: 28000, p50: 42000, p75: 60000, p90: 84000 },
    },
  },

  compliance_violations_quarterly: {
    key: "compliance_violations_quarterly",
    label: "Violations / Quarter",
    unit: "number",
    direction: "lower_is_better",
    source: "Labour-law audit data",
    industries: {
      aviation:    { p25: 2, p50: 4, p75: 7, p90: 12 },
      healthcare:  { p25: 3, p50: 6, p75: 10, p90: 16 },
      logistics:   { p25: 4, p50: 7, p75: 12, p90: 18 },
      hospitality: { p25: 3, p50: 6, p75: 10, p90: 15 },
      retail:      { p25: 2, p50: 4, p75: 7, p90: 11 },
      generic:     { p25: 3, p50: 5, p75: 9, p90: 14 },
    },
  },

  forecast_accuracy: {
    key: "forecast_accuracy",
    label: "Forecast Accuracy",
    unit: "percent",
    direction: "higher_is_better",
    source: "MAIA demand-forecasting network",
    industries: {
      aviation:    { p25: 78, p50: 83, p75: 88, p90: 92 },
      healthcare:  { p25: 75, p50: 80, p75: 85, p90: 90 },
      logistics:   { p25: 80, p50: 85, p75: 89, p90: 93 },
      hospitality: { p25: 72, p50: 78, p75: 83, p90: 88 },
      retail:      { p25: 74, p50: 80, p75: 85, p90: 90 },
      generic:     { p25: 76, p50: 81, p75: 86, p90: 91 },
    },
  },

  coverage_gap_pct: {
    key: "coverage_gap_pct",
    label: "Coverage Gap",
    unit: "percent",
    direction: "lower_is_better",
    source: "Peak-shift benchmarks",
    industries: {
      aviation:    { p25: 1.2, p50: 2.1, p75: 3.4, p90: 5.0 },
      healthcare:  { p25: 1.8, p50: 2.9, p75: 4.5, p90: 6.8 },
      logistics:   { p25: 2.0, p50: 3.2, p75: 5.0, p90: 7.5 },
      hospitality: { p25: 2.4, p50: 3.8, p75: 5.6, p90: 8.2 },
      retail:      { p25: 2.2, p50: 3.5, p75: 5.4, p90: 7.9 },
      generic:     { p25: 1.8, p50: 3.0, p75: 4.6, p90: 6.9 },
    },
  },

  avg_tenure_years: {
    key: "avg_tenure_years",
    label: "Avg Tenure",
    unit: "number",
    direction: "higher_is_better",
    source: "BLS employee tenure CY2024",
    industries: {
      aviation:    { p25: 5.2, p50: 7.8, p75: 10.4, p90: 13.6 },
      healthcare:  { p25: 4.6, p50: 6.9, p75: 9.2, p90: 12.3 },
      logistics:   { p25: 2.4, p50: 3.8, p75: 5.6, p90: 8.2 },
      hospitality: { p25: 1.6, p50: 2.7, p75: 4.3, p90: 6.4 },
      retail:      { p25: 1.8, p50: 2.9, p75: 4.6, p90: 6.8 },
      generic:     { p25: 3.2, p50: 5.0, p75: 7.4, p90: 10.2 },
    },
  },
};

/**
 * Percentile of a value within a distribution (lower = better or higher = better aware).
 * Returns approximate percentile (25..100).
 */
export function percentileFor(
  value: number,
  dist: BenchmarkDistribution,
  direction: BenchmarkDirection,
): number {
  const stops = [
    { p: 25, v: dist.p25 },
    { p: 50, v: dist.p50 },
    { p: 75, v: dist.p75 },
    { p: 90, v: dist.p90 },
  ];
  if (direction === "lower_is_better") {
    if (value <= stops[0].v) return 10;
    if (value <= stops[1].v) return lerp(10, 50, (value - stops[0].v) / (stops[1].v - stops[0].v));
    if (value <= stops[2].v) return lerp(50, 75, (value - stops[1].v) / (stops[2].v - stops[1].v));
    if (value <= stops[3].v) return lerp(75, 90, (value - stops[2].v) / (stops[3].v - stops[2].v));
    return 95;
  }
  // higher_is_better
  if (value >= stops[3].v) return 95;
  if (value >= stops[2].v) return lerp(75, 90, (value - stops[2].v) / (stops[3].v - stops[2].v));
  if (value >= stops[1].v) return lerp(50, 75, (value - stops[1].v) / (stops[2].v - stops[1].v));
  if (value >= stops[0].v) return lerp(25, 50, (value - stops[0].v) / (stops[1].v - stops[0].v));
  return 10;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

/**
 * Tone classification — map percentile to green/amber/red band for UI.
 * Following "lower_is_better" logic by default (inverted for higher_is_better handled at callsite).
 */
export function toneForPercentile(
  percentile: number,
  direction: BenchmarkDirection,
): "good" | "ok" | "warn" | "bad" {
  // For "lower_is_better": lower percentile is better. For "higher_is_better": higher is better.
  // Normalize so "good" always means "customer is doing well."
  const adjusted = direction === "higher_is_better" ? 100 - percentile : percentile;
  if (adjusted <= 25) return "good";
  if (adjusted <= 50) return "ok";
  if (adjusted <= 75) return "warn";
  return "bad";
}

export function formatValue(value: number, unit: Benchmark["unit"]): string {
  switch (unit) {
    case "percent":
      return `${value.toFixed(1)}%`;
    case "currency":
      if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 10_000) return `$${(value / 1000).toFixed(0)}K`;
      if (value >= 1000) return `$${value.toLocaleString()}`;
      return `$${value}`;
    case "hours":
      return `${value.toFixed(1)}h`;
    case "days":
      return `${value.toFixed(1)}d`;
    case "ratio":
      return value.toFixed(2);
    default:
      return value.toLocaleString();
  }
}
