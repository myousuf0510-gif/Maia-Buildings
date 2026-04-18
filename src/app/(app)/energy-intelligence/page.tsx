import { PlaceholderPage } from "../_placeholder/PlaceholderPage";

export default function EnergyIntelligencePage() {
  return (
    <PlaceholderPage
      title="Energy & Cost Intelligence"
      subtitle="Portfolio-wide energy and utility optimization with peer benchmarks"
      agent="Energy & Utility Optimizer"
      description="$/sqft benchmarks vs GTA peer group, per-building monthly waterfall showing where every dollar goes, and the recoverable savings opportunities ranked by effort. HVAC setpoint recommendations that respect comfort bands. Time-of-use-aware scheduling."
      feedsFrom={[
        { href: "/portfolio-map", label: "Portfolio Map" },
      ]}
    />
  );
}
