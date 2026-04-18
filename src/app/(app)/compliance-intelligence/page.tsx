import { PlaceholderPage } from "../_placeholder/PlaceholderPage";

export default function ComplianceIntelligencePage() {
  return (
    <PlaceholderPage
      title="Compliance Intelligence"
      subtitle="RTA · Fire code · TSSA · insurance · contractor certs — ±90-day horizon"
      agent="Compliance Sentinel"
      description="Every statutory deadline across the portfolio on a single timeline. Fire alarm inspections, sprinkler cycles, elevator TSSA inspections, insurance renewals, RTA-triggered obligations, and contractor WSIB + license expiries — each with an auto-booked remediation path."
      feedsFrom={[
        { href: "/rules", label: "Rule packs" },
        { href: "/workforce-directory", label: "Contractor credentials" },
      ]}
    />
  );
}
