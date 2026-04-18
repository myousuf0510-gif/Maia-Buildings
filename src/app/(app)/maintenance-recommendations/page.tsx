import { PlaceholderPage } from "../_placeholder/PlaceholderPage";

export default function MaintenanceRecommendationsPage() {
  return (
    <PlaceholderPage
      title="Maintenance Recommendations"
      subtitle="This week's exact work orders per building, with rationale"
      agent="Turnover Orchestrator · Compliance Sentinel"
      description="A week-ahead view of every planned work order across the portfolio, clustered by building. Preventive maintenance, turnover flips, inspection-driven work, and MAIA-proposed interventions — exportable to your CMMS with one click."
      feedsFrom={[
        { href: "/work-order-market", label: "Work Order Market" },
        { href: "/vacancy-intelligence", label: "Turnover pipeline" },
      ]}
    />
  );
}
