import { PlaceholderPage } from "../_placeholder/PlaceholderPage";

export default function ArrearsIntelligencePage() {
  return (
    <PlaceholderPage
      title="Arrears Intelligence"
      subtitle="Rent-collection risk per tenant with RTA-compliant escalation paths"
      agent="Arrears Sentinel"
      description="30/60/90-day delinquency probability per tenant, top drivers per prediction, and the exact escalation path — soft reminder → N4 notice → Landlord and Tenant Board filing — all RTA-compliant. Drafts wait for your approval before send."
      feedsFrom={[
        { href: "/briefings/executive", label: "Weekly briefing" },
      ]}
    />
  );
}
