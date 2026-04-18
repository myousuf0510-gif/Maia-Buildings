"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { GlobalFilterBar } from "@/components/layout/GlobalFilterBar";
import { DemoBanner } from "@/components/layout/DemoBanner";
import { LivePulseOverlay } from "@/components/layout/LivePulseOverlay";
import { GlobalFilterProvider } from "@/lib/GlobalFilterContext";
import { LivePulseProvider } from "@/lib/LivePulseContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LivePulseProvider>
      <GlobalFilterProvider>
        <AppLayoutInner>{children}</AppLayoutInner>
      </GlobalFilterProvider>
    </LivePulseProvider>
  );
}

// Buildings uses per-page controls — no global filter.
const GLOBAL_FILTER_PAGES = new Set<string>([]);

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showGlobalFilter = GLOBAL_FILTER_PAGES.has(pathname);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFB" }}>
      <LivePulseOverlay />
      <Sidebar />
      <TopNav />
      <main style={{ marginLeft: "260px", paddingTop: "60px", minHeight: "100vh", position: "relative" }}>
        {showGlobalFilter && <GlobalFilterBar />}
        <DemoBanner />
        <div className="relative page-enter">{children}</div>
      </main>
    </div>
  );
}
