"use client";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#080C14" }}>
      <Sidebar />
      <TopNav />
      <main className="ml-64 pt-16 min-h-screen relative">
        {children}
      </main>
    </div>
  );
}
