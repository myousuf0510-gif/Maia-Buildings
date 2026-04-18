import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark intelligence platform palette
        intel: {
          950: "#040810",
          900: "#080C14",
          850: "#0A0F1E",
          800: "#0D1426",
          750: "#101828",
          700: "#162032",
          600: "#1E2D42",
          500: "#263548",
        },
        // Primary blue
        primary: {
          DEFAULT: "#2563EB",
          glow: "rgba(37,99,235,0.3)",
          600: "#2563EB",
          500: "#3B82F6",
          400: "#60A5FA",
        },
        // Cyan accent
        cyan: {
          DEFAULT: "#06B6D4",
          400: "#22D3EE",
          300: "#67E8F9",
        },
        // Purple accent
        purple: {
          DEFAULT: "#7C3AED",
          500: "#8B5CF6",
          400: "#A78BFA",
        },
        success: { DEFAULT: "#10B981", glow: "rgba(16,185,129,0.3)" },
        warning: { DEFAULT: "#F59E0B", glow: "rgba(245,158,11,0.3)" },
        danger:  { DEFAULT: "#EF4444", glow: "rgba(239,68,68,0.3)" },
        // Text
        text: {
          primary:   "#F1F5F9",
          secondary: "#94A3B8",
          muted:     "#475569",
        },
        // Glass
        glass: "rgba(255,255,255,0.04)",
        "glass-border": "rgba(255,255,255,0.08)",
        background: "#080C14",
        foreground: "#F1F5F9",
        border: "rgba(255,255,255,0.08)",
      },
      fontFamily: {
        sans:     ["Space Grotesk", "system-ui", "-apple-system", "sans-serif"],
        mono:     ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        display:  ["Space Grotesk", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      boxShadow: {
        "glow-blue":   "0 0 20px rgba(37,99,235,0.4), 0 0 60px rgba(37,99,235,0.15)",
        "glow-cyan":   "0 0 20px rgba(6,182,212,0.4), 0 0 60px rgba(6,182,212,0.15)",
        "glow-purple": "0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)",
        "glow-green":  "0 0 20px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.15)",
        "glow-sm":     "0 0 10px rgba(37,99,235,0.3)",
        "panel":       "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "card":        "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        "modal":       "0 25px 80px rgba(0,0,0,0.7), 0 0 80px rgba(37,99,235,0.15)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-intel":  "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
        "gradient-cyber":  "linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)",
        "gradient-text":   "linear-gradient(135deg, #60A5FA 0%, #A78BFA 100%)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-fast": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 8px rgba(37,99,235,0.6)" },
          "50%":       { opacity: "0.6", boxShadow: "0 0 20px rgba(37,99,235,0.9)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%":       { opacity: "0.4", transform: "scale(0.85)" },
        },
        "orb-1": {
          "0%":   { transform: "translate(0, 0) scale(1)" },
          "33%":  { transform: "translate(60px, -40px) scale(1.1)" },
          "66%":  { transform: "translate(-40px, 60px) scale(0.9)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        "orb-2": {
          "0%":   { transform: "translate(0, 0) scale(1)" },
          "33%":  { transform: "translate(-80px, 40px) scale(0.9)" },
          "66%":  { transform: "translate(50px, -60px) scale(1.15)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        "orb-3": {
          "0%":   { transform: "translate(0, 0) scale(1)" },
          "50%":  { transform: "translate(40px, 80px) scale(1.05)" },
          "100%": { transform: "translate(0, 0) scale(1)" },
        },
        "scan-line": {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ticker-up": {
          "0%":   { transform: "translateY(0)", opacity: "1" },
          "100%": { transform: "translateY(-24px)", opacity: "0" },
        },
        flicker: {
          "0%, 95%, 100%": { opacity: "1" },
          "96%":            { opacity: "0.6" },
          "97%":            { opacity: "1" },
          "98%":            { opacity: "0.8" },
        },
      },
      animation: {
        "fade-in":       "fade-in 0.4s ease-out both",
        "fade-in-fast":  "fade-in-fast 0.2s ease-out both",
        "slide-in-left": "slide-in-left 0.35s ease-out both",
        "scale-in":      "scale-in 0.3s ease-out both",
        "pulse-glow":    "pulse-glow 2s ease-in-out infinite",
        "pulse-dot":     "pulse-dot 2s ease-in-out infinite",
        "orb-1":         "orb-1 18s ease-in-out infinite",
        "orb-2":         "orb-2 24s ease-in-out infinite",
        "orb-3":         "orb-3 20s ease-in-out infinite",
        shimmer:         "shimmer 2.5s linear infinite",
        flicker:         "flicker 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
