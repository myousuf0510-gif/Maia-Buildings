"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type DateRange =
  | "today"
  | "last7"
  | "last30"
  | "last_quarter"
  | "this_week"
  | "next_week"
  | "last_6months"
  | "next_6months"
  | "last_12months"
  | "next_12months"
  | "custom";

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  today:        "Today",
  this_week:    "This Week",
  next_week:    "Next Week",
  last7:        "Last 7 Days",
  last30:       "Last 30 Days",
  last_6months: "Last 6 Months",
  next_6months: "Next 6 Months",
  last_12months:"Last 12 Months",
  next_12months:"Next 12 Months",
  last_quarter: "Last Quarter",
  custom:       "Custom Range",
};

export const DEPARTMENTS = [
  "All Departments",
  "Ground Operations",
  "Baggage Handling",
  "Passenger Services",
  "Gate Operations",
  "Ramp Operations",
  "Airport Security",
  "Aircraft Maintenance",
];

export const POSITIONS_BY_DEPARTMENT: Record<string, string[]> = {
  "All Departments": [
    "All Positions",
    "Manager",
    "Supervisor",
    "Lead",
    "Senior Agent",
    "Agent",
    "Specialist",
    "Trainee",
  ],
  "Ground Operations": [
    "All Positions",
    "Ground Operations Manager",
    "Ground Operations Supervisor",
    "Senior Ground Agent",
    "Ground Agent",
    "Ground Operations Trainee",
  ],
  "Baggage Handling": [
    "All Positions",
    "Baggage Handling Supervisor",
    "Senior Baggage Handler",
    "Baggage Handler",
    "Baggage Handling Trainee",
  ],
  "Passenger Services": [
    "All Positions",
    "Passenger Services Supervisor",
    "Senior Customer Service Agent",
    "Customer Service Agent",
    "Check-in Agent",
    "Passenger Services Trainee",
  ],
  "Gate Operations": [
    "All Positions",
    "Gate Operations Supervisor",
    "Senior Gate Agent",
    "Gate Agent",
    "Boarding Agent",
  ],
  "Ramp Operations": [
    "All Positions",
    "Ramp Operations Supervisor",
    "Senior Ramp Agent",
    "Ramp Agent",
    "Ramp Operations Trainee",
  ],
  "Airport Security": [
    "All Positions",
    "Security Manager",
    "Security Supervisor",
    "Senior Security Officer",
    "Security Officer",
    "Security Trainee",
  ],
  "Aircraft Maintenance": [
    "All Positions",
    "Maintenance Manager",
    "Licensed Aircraft Technician",
    "Aircraft Maintenance Engineer",
    "Maintenance Technician",
    "Maintenance Trainee",
  ],
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtMonthYear(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function getDateRangeString(range: DateRange): { label: string; short: string } {
  const now = new Date();
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtShort = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  switch (range) {
    case "today": {
      const s = fmt(now);
      return { label: s, short: fmtShort(now) };
    }
    case "last7": {
      const start = new Date(now); start.setDate(now.getDate() - 6);
      return { label: `${fmt(start)} – ${fmt(now)}`, short: `${fmtShort(start)} – ${fmtShort(now)}` };
    }
    case "last30": {
      const start = new Date(now); start.setDate(now.getDate() - 29);
      return { label: `${fmt(start)} – ${fmt(now)}`, short: `${fmtShort(start)} – ${fmtShort(now)}` };
    }
    case "last_quarter": {
      const start = new Date(now); start.setDate(now.getDate() - 89);
      return { label: `${fmt(start)} – ${fmt(now)}`, short: `${fmtShort(start)} – ${fmtShort(now)}` };
    }
    case "this_week": {
      const day = now.getDay();
      const mon = new Date(now); mon.setDate(now.getDate() - ((day + 6) % 7));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { label: `${fmt(mon)} – ${fmt(sun)}`, short: `${fmtShort(mon)} – ${fmtShort(sun)}` };
    }
    case "next_week": {
      const day = now.getDay();
      const nextMon = new Date(now); nextMon.setDate(now.getDate() + (8 - ((day + 6) % 7)) % 7 + 1);
      if (nextMon <= now) nextMon.setDate(nextMon.getDate() + 7);
      const nextSun = new Date(nextMon); nextSun.setDate(nextMon.getDate() + 6);
      return { label: `${fmt(nextMon)} – ${fmt(nextSun)}`, short: `${fmtShort(nextMon)} – ${fmtShort(nextSun)}` };
    }
    case "last_6months": {
      const start = new Date(now); start.setMonth(now.getMonth() - 6);
      return {
        label: `Strategic View — ${fmtMonthYear(start)} – ${fmtMonthYear(now)}`,
        short: `${fmtMonthYear(start)} – ${fmtMonthYear(now)}`,
      };
    }
    case "next_6months": {
      const end = new Date(now); end.setMonth(now.getMonth() + 6);
      return {
        label: `Strategic View — ${fmtMonthYear(now)} – ${fmtMonthYear(end)}`,
        short: `${fmtMonthYear(now)} – ${fmtMonthYear(end)}`,
      };
    }
    case "last_12months": {
      const start = new Date(now); start.setMonth(now.getMonth() - 12);
      return {
        label: `Annual View — ${fmtMonthYear(start)} – ${fmtMonthYear(now)}`,
        short: `${fmtMonthYear(start)} – ${fmtMonthYear(now)}`,
      };
    }
    case "next_12months": {
      const end = new Date(now); end.setMonth(now.getMonth() + 12);
      return {
        label: `Annual View — ${fmtMonthYear(now)} – ${fmtMonthYear(end)}`,
        short: `${fmtMonthYear(now)} – ${fmtMonthYear(end)}`,
      };
    }
    case "custom":
      return { label: "Custom Range", short: "Custom" };
  }
}

interface GlobalFilterState {
  dateRange: DateRange;
  department: string;
  position: string;
  dateLabel: string;
  dateShort: string;
  setDateRange: (r: DateRange) => void;
  setDepartment: (d: string) => void;
  setPosition: (p: string) => void;
}

const GlobalFilterContext = createContext<GlobalFilterState>({
  dateRange: "last7",
  department: "All Departments",
  position: "All Positions",
  dateLabel: "",
  dateShort: "",
  setDateRange: () => {},
  setDepartment: () => {},
  setPosition: () => {},
});

export function GlobalFilterProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRange>("last7");
  const [department, setDepartmentState] = useState("All Departments");
  const [position, setPositionState] = useState("All Positions");

  const setDateRange = useCallback((r: DateRange) => setDateRangeState(r), []);
  const setDepartment = useCallback((d: string) => {
    setDepartmentState(d);
    setPositionState("All Positions"); // reset position when dept changes
  }, []);
  const setPosition = useCallback((p: string) => setPositionState(p), []);

  const { label, short } = getDateRangeString(dateRange);

  return (
    <GlobalFilterContext.Provider
      value={{
        dateRange,
        department,
        position,
        dateLabel: label,
        dateShort: short,
        setDateRange,
        setDepartment,
        setPosition,
      }}
    >
      {children}
    </GlobalFilterContext.Provider>
  );
}

export function useGlobalFilter() {
  return useContext(GlobalFilterContext);
}
