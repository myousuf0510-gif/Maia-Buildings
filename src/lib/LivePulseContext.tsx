"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

/**
 * Live Pulse mode — the "command center" toggle.
 *
 * When enabled:
 *   - <body> gets `class="live-pulse"` which cascades styles (see globals.css)
 *   - A scrolling ticker appears at the top of the viewport
 *   - Edge vignette darkens the outer 10% of the screen
 *   - Critical items pulse with red rings
 *   - Key metric numbers breathe (subtle 1.0 → 1.015 scale)
 *   - The LIVE PULSE indicator replaces standard API Status
 *
 * State persists across page loads via localStorage.
 */

interface LivePulseContextType {
  enabled: boolean;
  toggle: () => void;
  setEnabled: (on: boolean) => void;
}

const LivePulseContext = createContext<LivePulseContextType | null>(null);

const STORAGE_KEY = "maia:live-pulse";

export function LivePulseProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "on") setEnabledState(true);
  }, []);

  // Apply body class + persist
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (enabled) {
      document.body.classList.add("live-pulse");
      window.localStorage.setItem(STORAGE_KEY, "on");
    } else {
      document.body.classList.remove("live-pulse");
      window.localStorage.setItem(STORAGE_KEY, "off");
    }
  }, [enabled]);

  const toggle = useCallback(() => setEnabledState((v) => !v), []);
  const setEnabled = useCallback((on: boolean) => setEnabledState(on), []);

  return (
    <LivePulseContext.Provider value={{ enabled, toggle, setEnabled }}>
      {children}
    </LivePulseContext.Provider>
  );
}

export function useLivePulse(): LivePulseContextType {
  const ctx = useContext(LivePulseContext);
  if (!ctx) {
    // Permissive fallback for components rendered outside the provider during HMR
    return { enabled: false, toggle: () => {}, setEnabled: () => {} };
  }
  return ctx;
}
