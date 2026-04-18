"use client";

import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";

export function PlaceholderPage({
  title,
  subtitle,
  agent,
  description,
  feedsFrom,
}: {
  title: string;
  subtitle: string;
  agent?: string;
  description: string;
  feedsFrom?: { href: string; label: string }[];
}) {
  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}
          >
            <Sparkles className="w-2.5 h-2.5 text-white" />
          </span>
          <span
            className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{
              background: "linear-gradient(90deg, #2563EB, #7C3AED)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {agent ? `Powered by ${agent}` : "Coming in next wave"}
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">{title}</h1>
        <p className="text-[13px] text-[#64748B] mt-0.5 max-w-3xl">{subtitle}</p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(37,99,235,0.04), rgba(124,58,237,0.04))",
          border: "1px solid rgba(37,99,235,0.2)",
        }}
      >
        <div className="text-[13px] text-[#334155] leading-relaxed mb-3">{description}</div>

        {feedsFrom && feedsFrom.length > 0 && (
          <div>
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-2">
              Data sources already wired
            </div>
            <div className="flex flex-wrap gap-2">
              {feedsFrom.map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold text-[#2563EB]"
                  style={{ background: "#FFFFFF", border: "1px solid rgba(37,99,235,0.22)" }}
                >
                  {f.label}
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
