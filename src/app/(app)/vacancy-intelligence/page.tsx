import { PlaceholderPage } from "../_placeholder/PlaceholderPage";

export default function VacancyIntelligencePage() {
  return (
    <PlaceholderPage
      title="Vacancy & Turnover Intelligence"
      subtitle="Per-unit re-rent forecasts + the turnover pipeline, across all 47 buildings"
      agent="Vacancy & Turnover Watcher · Turnover Orchestrator"
      description="90-day vacancy probability per unit; expected days-to-rent-ready from notice to lease signed; critical-path bottlenecks for every flip in flight. Upcoming lease expirations, renewal probabilities, and the turnover pipeline with per-trade load visible."
      feedsFrom={[
        { href: "/work-order-market", label: "Turnover work orders" },
        { href: "/workforce-directory", label: "Trade availability" },
      ]}
    />
  );
}
