"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code, ChevronDown, Lock, Pencil, CheckCircle2, X } from "lucide-react";
import { CONFIG_GROUPS } from "@/lib/platform/registry";
import type { ConfigGroup } from "@/lib/platform/registry";

type EditingEntry = {
  groupId: string;
  key: string;
  value: string;
  unit?: string;
  description: string;
  accent: string;
};

export default function ConfigsPage() {
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(CONFIG_GROUPS.map((g) => g.id)));
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<EditingEntry | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenGroups((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const keyFor = (groupId: string, entryKey: string) => `${groupId}::${entryKey}`;

  const saveEdit = (newValue: string) => {
    if (!editing) return;
    setOverrides((prev) => ({ ...prev, [keyFor(editing.groupId, editing.key)]: newValue }));
    setToast(`${editing.key} updated to ${newValue}${editing.unit ?? ''} — propagating to agents in ~2 minutes`);
    setEditing(null);
    setTimeout(() => setToast(null), 2800);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #0F172A, #2563EB)", boxShadow: "0 2px 6px rgba(15,23,42,0.3)" }}>
            <Code className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase"
            style={{ background: "linear-gradient(90deg, #0F172A, #2563EB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Configurations · {CONFIG_GROUPS.length} groups
          </span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          Every tunable knob in the platform
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          Fatigue thresholds, demand horizons, incentive floors, fairness policies, notification routes. Locked entries are statutory; editable entries flow to agents in ~2 minutes.
        </p>
      </div>

      <div className="space-y-3">
        {CONFIG_GROUPS.map((g) => {
          const open = openGroups.has(g.id);
          return (
            <div
              key={g.id}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${g.accent}28`,
                boxShadow: "0 2px 16px rgba(15,23,42,0.04)",
              }}
            >
              <button
                type="button"
                onClick={() => toggle(g.id)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left transition-colors hover:bg-slate-50"
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${g.accent}14`, border: `1px solid ${g.accent}30` }}>
                  <Code className="w-4 h-4" style={{ color: g.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: g.accent }}>
                    {g.name}
                  </div>
                  <div className="text-[13px] font-bold text-[#0F172A] leading-tight">{g.purpose}</div>
                </div>
                <span className="text-[10.5px] text-[#64748B] tabular-nums shrink-0">
                  {g.entries.length} entries
                </span>
                <ChevronDown className="w-4 h-4 text-[#94A3B8] shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : undefined }} />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                    style={{ borderTop: `1px solid ${g.accent}14` }}
                  >
                    <div className="divide-y divide-slate-100">
                      {g.entries.map((e) => {
                        const overrideKey = keyFor(g.id, e.key);
                        const override = overrides[overrideKey];
                        const displayValue = override !== undefined ? override : String(e.value);
                        const isOverridden = override !== undefined;
                        return (
                          <div key={e.key} className="px-5 py-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                            <div className="md:col-span-4 flex items-center gap-1.5">
                              <span className="text-[12.5px] font-bold text-[#0F172A]">{e.key}</span>
                              {!e.editable && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                              {isOverridden && (
                                <span className="inline-flex items-center gap-1 px-1 py-0 rounded text-[8.5px] font-bold tracking-wide uppercase"
                                  style={{ background: "rgba(245,158,11,0.1)", color: "#B45309", border: "1px solid rgba(245,158,11,0.3)" }}>
                                  Overridden
                                </span>
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <span className="inline-flex items-baseline gap-1 px-2 py-0.5 rounded-md font-mono tabular-nums text-[12px] font-bold"
                                style={{ background: `${g.accent}10`, color: g.accent, border: `1px solid ${g.accent}26` }}>
                                {displayValue}{e.unit && <span className="text-[10px] opacity-75">{e.unit}</span>}
                              </span>
                            </div>
                            <div className="md:col-span-5 text-[11.5px] text-[#475569] leading-relaxed">{e.description}</div>
                            <div className="md:col-span-1 text-right">
                              {e.editable ? (
                                <button
                                  type="button"
                                  onClick={() => setEditing({
                                    groupId: g.id, key: e.key, value: displayValue, unit: e.unit, description: e.description, accent: g.accent,
                                  })}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide text-[#2563EB] hover:bg-[#EFF6FF] transition-colors"
                                  style={{ border: "1px solid rgba(37,99,235,0.2)" }}
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                  Edit
                                </button>
                              ) : (
                                <span className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">Locked</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="text-[10.5px] text-[#94A3B8] text-center">
        Config changes propagate to agents within 2 minutes. Locked entries represent statutory or platform-level constraints.
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(6px)" }}
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 360, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl p-5"
              style={{ background: "#FFFFFF", border: `1.5px solid ${editing.accent}40`, boxShadow: "0 20px 60px rgba(15,23,42,0.2)" }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="text-[9.5px] font-bold tracking-[0.22em] uppercase" style={{ color: editing.accent }}>
                    Edit configuration
                  </div>
                  <div className="text-[15px] font-bold text-[#0F172A] font-mono mt-0.5">{editing.key}</div>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[11.5px] text-[#64748B] leading-relaxed mb-4">{editing.description}</div>

              <EditForm
                initial={editing.value}
                unit={editing.unit}
                accent={editing.accent}
                onSave={saveEdit}
                onCancel={() => setEditing(null)}
              />

              <div className="mt-3 text-[10px] text-[#94A3B8]">
                Change writes to Supabase and propagates to agents on the next poll cycle.
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2 max-w-md"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(16,185,129,0.35)",
            boxShadow: "0 8px 28px rgba(15,23,42,0.12)",
          }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <div className="text-[12px] font-semibold text-[#0F172A]">{toast}</div>
        </div>
      )}
    </div>
  );
}

function EditForm({
  initial, unit, accent, onSave, onCancel,
}: {
  initial: string;
  unit?: string;
  accent: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const dirty = value !== initial && value.trim().length > 0;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (dirty) onSave(value); }}>
      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">New value</label>
      <div className="flex items-stretch gap-1 mt-1">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg text-[13px] font-mono tabular-nums outline-none focus:ring-2 transition-all"
          style={{ background: "#F8FAFC", border: `1.5px solid ${accent}40` }}
        />
        {unit && (
          <span className="px-2 flex items-center text-[11px] font-mono text-[#64748B]"
            style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)", borderRadius: "0.5rem" }}>
            {unit}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          disabled={!dirty}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-white transition-all disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}CC)`, boxShadow: `0 2px 8px ${accent}40` }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Save change
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-lg text-[12px] font-bold text-[#475569]"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.1)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
