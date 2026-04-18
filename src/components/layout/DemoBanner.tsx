"use client";

/**
 * MAIA Intelligence — Demo Mode Banner
 *
 * A thin, subtle banner that appears below the GlobalFilterBar when the
 * user is viewing demo/sample data. Helps enterprise clients understand
 * they're in demo mode and provides a clear path to connect real data.
 */

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

// Fixed demo org IDs (must match seed-demo.ts and seed-demo-expanded.ts)
const DEMO_ORG_IDS = new Set([
  "00000000-0000-0000-0000-000000000001", // Toronto Pearson Ground Operations
  "00000000-0000-0000-0000-000000000002", // Toronto General Hospital
  "00000000-0000-0000-0000-000000000003", // Amazon YYZ Distribution
  "00000000-0000-0000-0000-000000000004", // Marriott Toronto Downtown
]);

// Demo org display names
const DEMO_ORG_LABELS: Record<string, { label: string; industry: string }> = {
  "00000000-0000-0000-0000-000000000001": {
    label: "Toronto Pearson Ground Operations",
    industry: "✈️ Aviation",
  },
  "00000000-0000-0000-0000-000000000002": {
    label: "Toronto General Hospital",
    industry: "🏥 Healthcare",
  },
  "00000000-0000-0000-0000-000000000003": {
    label: "Amazon YYZ Distribution",
    industry: "📦 Logistics",
  },
  "00000000-0000-0000-0000-000000000004": {
    label: "Marriott Toronto Downtown",
    industry: "🏨 Hospitality",
  },
};

function isDemoOrg(orgId: string | undefined, orgName: string | undefined): boolean {
  if (!orgId && !orgName) return false;
  if (orgId && DEMO_ORG_IDS.has(orgId)) return true;
  if (orgName && orgName.includes("(Demo)")) return true;
  return false;
}

export function DemoBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Get org info from user metadata
  const orgId = user?.user_metadata?.org_id as string | undefined;
  const orgName = user?.user_metadata?.org_name as string | undefined;

  // Check if this is a demo org
  const isDemo = isDemoOrg(orgId, orgName);

  if (!isDemo || dismissed) return null;

  // Get display label
  const demoInfo = orgId
    ? DEMO_ORG_LABELS[orgId]
    : { label: orgName ?? "Demo Organization", industry: "🎯 Demo" };

  return (
    <div
      style={{
        background: "linear-gradient(90deg, rgba(37,99,235,0.05) 0%, rgba(124,58,237,0.04) 50%, rgba(37,99,235,0.05) 100%)",
        borderBottom: "1px solid rgba(37,99,235,0.12)",
        padding: "5px 24px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      {/* Pulsing amber dot */}
      <div style={{ position: "relative", flexShrink: 0, width: 8, height: 8 }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "#F59E0B",
          opacity: 0.3,
          animation: "pulse-dot 1.5s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute",
          inset: "2px",
          borderRadius: "50%",
          background: "#F59E0B",
        }} />
      </div>

      {/* Demo label */}
      <span style={{ fontSize: 10, color: "#92400E", fontWeight: 800, letterSpacing: "0.1em", flexShrink: 0 }}>
        DEMO MODE
      </span>

      {/* Separator */}
      <div style={{ width: 1, height: 12, background: "rgba(146,64,14,0.25)", flexShrink: 0 }} />

      {/* Org info */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 10, color: "#B45309", fontWeight: 600, flexShrink: 0 }}>
          {demoInfo?.industry}
        </span>
        <span style={{ fontSize: 10, color: "#92400E", fontWeight: 500, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {demoInfo?.label}
        </span>
        <span style={{ fontSize: 10, color: "#A16207", opacity: 0.7, flexShrink: 0 }}>
          · Sample data for demonstration purposes only
        </span>
      </div>

      {/* Connect CTA */}
      <a
        href="/settings?tab=data-sources"
        style={{
          marginLeft: "auto",
          fontSize: 10,
          color: "#2563EB",
          fontWeight: 700,
          cursor: "pointer",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 4,
          flexShrink: 0,
          padding: "3px 8px",
          borderRadius: 6,
          background: "rgba(37,99,235,0.06)",
          border: "1px solid rgba(37,99,235,0.15)",
          transition: "all 0.15s",
        }}
      >
        Connect your real data →
      </a>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          flexShrink: 0,
          width: 16,
          height: 16,
          borderRadius: 4,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#A16207",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.6,
          padding: 0,
        }}
        title="Dismiss demo banner"
      >
        ×
      </button>
    </div>
  );
}
