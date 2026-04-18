import { PlaceholderPage } from "../_placeholder/PlaceholderPage";

export default function BuildingDetailPage() {
  return (
    <PlaceholderPage
      title="Building Detail"
      subtitle="Drill into any building — units, occupancy, open work orders, equipment, compliance"
      description="Pick a building from the Portfolio Map and this view will render its full intelligence surface: occupancy heat map, open work orders queue, arrears on the roll, active equipment alerts, upcoming inspections, and the MAIA decisions made on this building in the last 30 days."
      feedsFrom={[
        { href: "/portfolio-map", label: "Portfolio Map" },
        { href: "/work-order-market", label: "Work Order Market" },
        { href: "/vacancy-intelligence", label: "Vacancy Intelligence" },
      ]}
    />
  );
}
