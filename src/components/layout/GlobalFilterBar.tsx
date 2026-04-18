"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Calendar, ChevronDown, Building2, UserCircle } from "lucide-react";
import {
  useGlobalFilter,
  DATE_RANGE_LABELS,
  DEPARTMENTS,
  POSITIONS_BY_DEPARTMENT,
  DateRange,
} from "@/lib/GlobalFilterContext";

const RANGE_OPTIONS: DateRange[] = [
  "today",
  "this_week",
  "next_week",
  "last7",
  "last30",
  "last_6months",
  "next_6months",
  "last_12months",
  "next_12months",
  "custom",
];

// Page-aware filter config — defines which filters each page needs
// Pages not listed get all three filters by default
const PAGE_FILTER_CONFIG: Record<string, { showDate: boolean; showDept: boolean; showPosition: boolean; dateOptions?: DateRange[] }> = {
  "/workforce":           { showDate: false, showDept: true,  showPosition: true  },
  "/labour-analytics":    { showDate: true,  showDept: true,  showPosition: false, dateOptions: ["last7","last30","last_6months","last_12months"] },
  "/cost-intelligence":   { showDate: true,  showDept: true,  showPosition: false, dateOptions: ["this_week","last7","last30","last_6months","last_12months"] },
  "/kpi-intelligence":    { showDate: true,  showDept: true,  showPosition: true,  dateOptions: ["last7","last30","last_6months","last_12months"] },
  "/compliance":          { showDate: true,  showDept: true,  showPosition: false, dateOptions: ["last7","last30","last_6months"] },
  "/forecasting":         { showDate: true,  showDept: true,  showPosition: false, dateOptions: ["this_week","next_week","next_6months","next_12months"] },
  "/time-off":            { showDate: true,  showDept: true,  showPosition: false, dateOptions: ["this_week","next_week","last30","next_6months"] },
  "/shift-recommendations":{ showDate: true, showDept: true,  showPosition: true,  dateOptions: ["today","this_week","next_week"] },
  "/performance-hub":     { showDate: true,  showDept: true,  showPosition: true,  dateOptions: ["last7","last30","last_6months","last_12months"] },
  "/bid-intelligence":    { showDate: true,  showDept: true,  showPosition: false, dateOptions: ["this_week","next_week","next_6months"] },
  "/dashboard":           { showDate: true,  showDept: true,  showPosition: false },
};

export function GlobalFilterBar() {
  const pathname = usePathname();
  const { dateRange, department, position, dateLabel, setDateRange, setDepartment, setPosition } =
    useGlobalFilter();
  const [rangeOpen, setRangeOpen] = useState(false);
  const [deptOpen, setDeptOpen] = useState(false);
  const [posOpen, setPosOpen] = useState(false);

  const positions = POSITIONS_BY_DEPARTMENT[department] ?? POSITIONS_BY_DEPARTMENT["All Departments"];

  // Get page-specific config, default to showing all
  const config = PAGE_FILTER_CONFIG[pathname] ?? { showDate: true, showDept: true, showPosition: true };
  const availableDateOptions = config.dateOptions ?? RANGE_OPTIONS;

  const isStrategicRange = ["last_6months","next_6months","last_12months","next_12months"].includes(dateRange);

  return (
    <div
      className="sticky top-[60px] z-20 flex items-center gap-3 px-6 py-2.5"
      style={{
        background: "rgba(241,245,249,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(15,23,42,0.06)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      {/* Date filter — only shown on pages that need it */}
      {config.showDate && (
        <>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
            <span className="text-[10px] font-bold text-[#374151] tracking-wider uppercase">Viewing:</span>
            <span className="text-[11px] font-semibold" style={{ color: isStrategicRange ? "#7C3AED" : "#0F172A" }}>
              {dateLabel}
            </span>
          </div>
          <div className="relative">
            <button
              onClick={() => { setRangeOpen(!rangeOpen); setDeptOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-[#2563EB] transition-all duration-200 hover:bg-[#EFF6FF]"
              style={{ background: "#EFF6FF", border: "1px solid rgba(37,99,235,0.2)" }}
            >
              {DATE_RANGE_LABELS[dateRange]}
              <ChevronDown className="w-3 h-3" />
            </button>
            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-xl min-w-[180px]"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(37,99,235,0.12)", boxShadow: "0 8px 24px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.06)" }}>
                  {availableDateOptions.map((r) => {
                    const isStrategic = ["last_6months","next_6months","last_12months","next_12months"].includes(r);
                    return (
                      <button key={r} onClick={() => { setDateRange(r); setRangeOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-[#EFF6FF]"
                        style={{ color: r === dateRange ? "#2563EB" : isStrategic ? "#7C3AED" : "#374151", fontWeight: r === dateRange ? 700 : 500 }}>
                        {DATE_RANGE_LABELS[r]}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <div className="w-px h-4 bg-black/10" />
        </>
      )}

      {/* Department filter */}
      {config.showDept && (
        <>
          <div className="relative">
            <button
              onClick={() => { setDeptOpen(!deptOpen); setRangeOpen(false); setPosOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:bg-[#F8FAFC]"
              style={{
                background: department !== "All Departments" ? "#EFF6FF" : "#D8DADF",
                border: `1px solid ${department !== "All Departments" ? "rgba(37,99,235,0.2)" : "rgba(0,0,0,0.08)"}`,
                color: department !== "All Departments" ? "#2563EB" : "#374151",
              }}
            >
              <Building2 className="w-3 h-3" />
              {department}
              <ChevronDown className="w-3 h-3" />
            </button>
            {deptOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDeptOpen(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-xl min-w-[200px]"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(37,99,235,0.12)", boxShadow: "0 8px 24px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.06)" }}>
                  {DEPARTMENTS.map((d) => (
                    <button key={d} onClick={() => { setDepartment(d); setDeptOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-[#EFF6FF]"
                      style={{ color: d === department ? "#2563EB" : "#374151", fontWeight: d === department ? 700 : 500 }}>
                      {d}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {config.showPosition && <div className="w-px h-4 bg-black/10" />}
        </>
      )}

      {/* Position filter — only on pages that need it */}
      {config.showPosition && (
        <div className="relative">
          <button
            onClick={() => { setPosOpen(!posOpen); setRangeOpen(false); setDeptOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 hover:bg-[#F8FAFC]"
            style={{
              background: position !== "All Positions" ? "#EFF6FF" : "#D8DADF",
              border: `1px solid ${position !== "All Positions" ? "rgba(37,99,235,0.2)" : "rgba(0,0,0,0.08)"}`,
              color: position !== "All Positions" ? "#2563EB" : "#374151",
            }}
          >
            <UserCircle className="w-3 h-3" />
            {position}
            <ChevronDown className="w-3 h-3" />
          </button>
          {posOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setPosOpen(false)} />
              <div className="absolute top-full left-0 mt-1 z-20 py-1 rounded-xl min-w-[220px]"
                style={{ background: "#FFFFFF", border: "1px solid rgba(37,99,235,0.12)", boxShadow: "0 8px 24px rgba(37,99,235,0.1), 0 2px 8px rgba(0,0,0,0.06)" }}>
                {positions.map((p) => (
                  <button key={p} onClick={() => { setPosition(p); setPosOpen(false); }}
                    className="w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-[#EFF6FF]"
                    style={{ color: p === position ? "#2563EB" : "#374151", fontWeight: p === position ? 700 : 500 }}>
                    {p}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Period context pill */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold"
        style={{ background: "rgba(37,99,235,0.06)", color: "#64748B", border: "1px solid rgba(37,99,235,0.08)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} />
        Data reflects selected period
      </div>
    </div>
  );
}
