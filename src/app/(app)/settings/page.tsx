"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Plug,
  Palette,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Upload,
  Save,
  X,
} from "lucide-react";

// ─── Integrations catalogue ──────────────────────────────────────────────────

interface Integration {
  id: string;
  name: string;
  category: "messaging" | "data" | "ai" | "identity" | "calendar" | "storage";
  purpose: string;
  statusEnvKey: string; // env var key to probe
  docUrl?: string;
  accent: string;
}

const INTEGRATIONS: Integration[] = [
  { id: "slack",       name: "Slack",               category: "messaging", purpose: "Alert routing · #ops-alerts + #hr-alerts", statusEnvKey: "slack", accent: "#611F69" },
  { id: "anthropic",   name: "Anthropic · Claude",  category: "ai",        purpose: "Agent reasoning + narrative briefings",      statusEnvKey: "anthropic", accent: "#C15F3C" },
  { id: "supabase",    name: "Supabase",            category: "data",      purpose: "Primary data store · tables + auth + RLS",   statusEnvKey: "supabase", accent: "#3ECF8E" },
  { id: "hris",        name: "BambooHR",            category: "data",      purpose: "Staff roster + certifications + tenure",     statusEnvKey: "__never__", accent: "#73B533" },
  { id: "oag",         name: "OAG · Flight schedule", category: "data",    purpose: "Flight data for demand forecast",            statusEnvKey: "__never__", accent: "#D71920" },
  { id: "eccc",        name: "Environment Canada",  category: "data",      purpose: "Weather METAR + TAF for demand forecast",    statusEnvKey: "__never__", accent: "#00A3E0" },
  { id: "google",      name: "Google SSO",          category: "identity",  purpose: "Single sign-on for managers",                statusEnvKey: "__never__", accent: "#4285F4" },
  { id: "calendar",    name: "Google Calendar",     category: "calendar",  purpose: "Manager calendar sync for notifications",    statusEnvKey: "__never__", accent: "#4285F4" },
  { id: "resend",      name: "Resend",              category: "messaging", purpose: "Email delivery (fallback from Slack)",       statusEnvKey: "__never__", accent: "#0F172A" },
  { id: "sentry",      name: "Sentry",              category: "data",      purpose: "Error monitoring for MAIA runtime",          statusEnvKey: "__never__", accent: "#362D59" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

type Section = "profile" | "integrations" | "notifications" | "security" | "appearance";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-slate-500">Loading settings…</div>}>
      <SettingsInner />
    </Suspense>
  );
}

function SettingsInner() {
  const params = useSearchParams();
  const deepLink = params?.get("section");
  const initialSection: Section =
    deepLink === "integrations" || deepLink === "notifications" ||
    deepLink === "security" || deepLink === "appearance" || deepLink === "profile"
      ? deepLink : "profile";
  const [section, setSection] = useState<Section>(initialSection);
  const [probes, setProbes] = useState<Record<string, boolean>>({});
  const { signOut } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (deepLink && deepLink !== section) {
      if (deepLink === "integrations" || deepLink === "notifications" ||
          deepLink === "security" || deepLink === "appearance" || deepLink === "profile") {
        setSection(deepLink);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink]);

  const handleSignOut = async () => {
    if (signingOut) return;
    if (!confirm("Sign out of MAIA Intelligence?")) return;
    setSigningOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      setSigningOut(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/integrations/status");
        if (res.ok) setProbes(await res.json());
      } catch {}
    })();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md"
            style={{ background: "linear-gradient(135deg, #64748B, #0F172A)", boxShadow: "0 2px 6px rgba(15,23,42,0.3)" }}>
            <SettingsIcon className="w-2.5 h-2.5 text-white" />
          </span>
          <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B]">Settings · Platform</span>
        </div>
        <h1 className="text-[28px] font-bold text-[#0F172A] tracking-tight leading-tight">
          Your profile, integrations, and platform preferences
        </h1>
        <p className="text-[13px] text-[#64748B] mt-0.5">
          Everything behind the curtain. Click an integration to see its wiring, or jump to config knobs in{" "}
          <Link href="/configs" className="text-[#2563EB] font-bold">Configurations</Link>.
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Section nav */}
        <div className="col-span-12 md:col-span-3">
          <nav className="rounded-2xl p-2 space-y-1" style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <SectionButton icon={User}     id="profile"      label="Profile"       active={section} onClick={setSection} />
            <SectionButton icon={Plug}     id="integrations" label="Integrations"  active={section} onClick={setSection} />
            <SectionButton icon={Bell}     id="notifications" label="Notifications" active={section} onClick={setSection} />
            <SectionButton icon={Shield}   id="security"     label="Security"      active={section} onClick={setSection} />
            <SectionButton icon={Palette}  id="appearance"   label="Appearance"    active={section} onClick={setSection} />
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full mt-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-[#EF4444] hover:bg-rose-50 transition-colors disabled:opacity-60"
            style={{ background: "#FFFFFF", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <LogOut className="w-3.5 h-3.5" /> {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {/* Content */}
        <div className="col-span-12 md:col-span-9 space-y-4">
          {section === "profile" && <ProfileSection />}
          {section === "integrations" && <IntegrationsSection probes={probes} />}
          {section === "notifications" && <NotificationsSection />}
          {section === "security" && <SecuritySection />}
          {section === "appearance" && <AppearanceSection />}
        </div>
      </div>
    </div>
  );
}

function SectionButton({ id, label, icon: Icon, active, onClick }: { id: Section; label: string; icon: React.ElementType; active: Section; onClick: (s: Section) => void }) {
  const isActive = active === id;
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className="w-full inline-flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-semibold tracking-wide transition-colors"
      style={{
        background: isActive ? "linear-gradient(135deg, rgba(37,99,235,0.1), rgba(124,58,237,0.08))" : "transparent",
        color: isActive ? "#2563EB" : "#475569",
        border: isActive ? "1px solid rgba(37,99,235,0.2)" : "1px solid transparent",
      }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
      {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
    </button>
  );
}

// ─── Profile ─────────────────────────────────────────────────────────────────

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Moe Yousuf",
    email: "moe@maiaintelligence.io",
    role: "Director of Operations",
    org: "Toronto Pearson · Ground Ops",
    timezone: "America/Toronto",
    language: "English (Canada)",
  });
  const [draft, setDraft] = useState(profile);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const onSave = () => {
    setProfile(draft);
    setEditing(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  const onCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  return (
    <div className="rounded-2xl p-6" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
      <div className="flex items-center gap-4 mb-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[24px] font-bold overflow-hidden"
          style={{
            background: avatarUrl
              ? `url(${avatarUrl}) center/cover`
              : "linear-gradient(135deg, #1E40AF 0%, #2563EB 100%)",
            boxShadow: "0 4px 16px rgba(37,99,235,0.35)",
          }}
        >
          {!avatarUrl && profile.fullName[0]}
        </div>
        <div>
          <div className="text-[18px] font-bold text-[#0F172A]">{profile.fullName}</div>
          <div className="text-[12px] text-[#64748B]">{profile.role} · {profile.org}</div>
          <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-[0.14em] uppercase"
            style={{ background: "rgba(16,185,129,0.1)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" }}>
            <CheckCircle2 className="w-2.5 h-2.5" /> Active · online
          </div>
        </div>
        {savedFlash && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="ml-auto inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-bold"
            style={{ background: "rgba(16,185,129,0.12)", color: "#059669", border: "1px solid rgba(16,185,129,0.3)" }}
          >
            <CheckCircle2 className="w-3 h-3" /> Saved
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Full name" value={profile.fullName}
          editing={editing} onChange={(v) => setDraft({ ...draft, fullName: v })} draftValue={draft.fullName} />
        <Field label="Email" value={profile.email}
          editing={editing} onChange={(v) => setDraft({ ...draft, email: v })} draftValue={draft.email} />
        <Field label="Role" value={profile.role}
          editing={editing} onChange={(v) => setDraft({ ...draft, role: v })} draftValue={draft.role} />
        <Field label="Organisation" value={profile.org}
          editing={editing} onChange={(v) => setDraft({ ...draft, org: v })} draftValue={draft.org} />
        <Field label="Time zone" value={profile.timezone}
          editing={editing} onChange={(v) => setDraft({ ...draft, timezone: v })} draftValue={draft.timezone} />
        <Field label="Language" value={profile.language}
          editing={editing} onChange={(v) => setDraft({ ...draft, language: v })} draftValue={draft.language} />
      </div>

      <div className="flex items-center gap-2 mt-5 pt-5 border-t border-slate-100">
        {!editing ? (
          <>
            <button
              type="button"
              onClick={() => { setDraft(profile); setEditing(true); }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white inline-flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#475569] inline-flex items-center gap-1.5"
              style={{ background: "rgba(15,23,42,0.04)", border: "1px solid rgba(15,23,42,0.08)" }}
            >
              <Upload className="w-3 h-3" />
              {avatarUrl ? "Replace avatar" : "Change avatar"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl(null)}
                className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-[#64748B] inline-flex items-center gap-1"
                style={{ background: "transparent", border: "1px solid rgba(15,23,42,0.08)" }}
              >
                <X className="w-3 h-3" />
                Reset
              </button>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-white inline-flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}
            >
              <Save className="w-3 h-3" />
              Save changes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#64748B]"
              style={{ background: "transparent", border: "1px solid rgba(15,23,42,0.12)" }}
            >
              Cancel
            </button>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onPickAvatar}
          className="hidden"
        />
      </div>
    </div>
  );
}

function Field({
  label, value, editing, onChange, draftValue,
}: {
  label: string;
  value: string;
  editing?: boolean;
  onChange?: (v: string) => void;
  draftValue?: string;
}) {
  return (
    <div>
      <div className="text-[9.5px] font-bold tracking-[0.14em] uppercase text-[#94A3B8] mb-1">{label}</div>
      {editing ? (
        <input
          value={draftValue ?? value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-blue-400 transition-colors"
          style={{ background: "#FFFFFF", border: "1.5px solid rgba(37,99,235,0.25)" }}
        />
      ) : (
        <div className="px-3 py-2 rounded-lg text-[12.5px] font-semibold text-[#0F172A]"
          style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
          {value}
        </div>
      )}
    </div>
  );
}

// ─── Integrations ────────────────────────────────────────────────────────────

function IntegrationsSection({ probes }: { probes: Record<string, boolean> }) {
  const [focus, setFocus] = useState<Integration | null>(null);
  const byCategory: Record<string, Integration[]> = {};
  for (const i of INTEGRATIONS) {
    byCategory[i.category] = byCategory[i.category] ?? [];
    byCategory[i.category].push(i);
  }
  const categoryLabels: Record<string, string> = {
    messaging: "Messaging",
    data: "Data connectors",
    ai: "AI · Reasoning",
    identity: "Identity",
    calendar: "Calendar",
    storage: "Storage",
  };

  const isConnected = (i: Integration) => {
    if (i.id === "slack") return probes.slack === true;
    if (i.id === "anthropic") return probes.anthropic === true;
    if (i.id === "supabase") return probes.supabase === true || true; // supabase always on
    return false;
  };

  return (
    <div className="space-y-4">
      {focus && <IntegrationDrawer integration={focus} connected={isConnected(focus)} onClose={() => setFocus(null)} />}
      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ background: "rgba(15,23,42,0.02)", borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
            <div className="text-[10px] font-bold tracking-[0.22em] uppercase text-[#64748B]">
              {categoryLabels[cat] ?? cat}
            </div>
            <span className="text-[10.5px] text-[#94A3B8]">{items.length} integration{items.length === 1 ? "" : "s"}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {items.map((it) => {
              const connected = isConnected(it);
              return (
                <div key={it.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${it.accent}14`, border: `1px solid ${it.accent}30` }}>
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: it.accent }}>
                      {it.name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] font-bold text-[#0F172A] leading-tight">{it.name}</div>
                    <div className="text-[10.5px] text-[#64748B] truncate">{it.purpose}</div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold tracking-[0.12em] uppercase shrink-0"
                    style={{
                      background: connected ? "rgba(16,185,129,0.1)" : "rgba(107,114,128,0.08)",
                      color: connected ? "#059669" : "#6B7280",
                      border: connected ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(107,114,128,0.18)",
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: connected ? "#10B981" : "#94A3B8" }} />
                    {connected ? "Connected" : "Not set"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFocus(it)}
                    className="ml-1 inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[10.5px] font-bold tracking-wide text-[#2563EB] hover:bg-[#EFF6FF] transition-colors shrink-0"
                    style={{ border: "1px solid rgba(37,99,235,0.2)" }}
                  >
                    {connected ? "Manage" : "Connect"}
                    <ChevronRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Integration detail drawer ──────────────────────────────────────────────

function IntegrationDrawer({
  integration, connected, onClose,
}: {
  integration: Integration;
  connected: boolean;
  onClose: () => void;
}) {
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [flash, setFlash] = useState<false | "saved">(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const onSave = () => {
    setFlash("saved");
    setTimeout(() => { setFlash(false); onClose(); }, 900);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-end"
      style={{ background: "rgba(15,23,42,0.4)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 360, damping: 36 }}
        className="h-full w-full md:w-[440px] bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${integration.accent}14`, border: `1px solid ${integration.accent}30` }}>
            <span className="text-[13px] font-bold" style={{ color: integration.accent }}>
              {integration.name[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-[#0F172A] leading-tight">{integration.name}</div>
            <div className="text-[11px] text-[#64748B]">{integration.purpose}</div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-lg p-3 flex items-center gap-2"
            style={{ background: connected ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${connected ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: connected ? "#10B981" : "#F59E0B" }} />
            <div className="text-[11.5px] font-bold" style={{ color: connected ? "#047857" : "#92400E" }}>
              {connected ? "Currently connected" : "Not yet connected"}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">Endpoint / webhook URL</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full px-3 py-2 rounded-lg text-[12px] font-mono outline-none"
              style={{ border: "1px solid rgba(15,23,42,0.12)", background: "#F8FAFC" }}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#94A3B8]">API key / token</label>
            <input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste key…"
              type="password"
              className="mt-1 w-full px-3 py-2 rounded-lg text-[12px] font-mono outline-none"
              style={{ border: "1px solid rgba(15,23,42,0.12)", background: "#F8FAFC" }}
            />
          </div>

          <div className="rounded-lg p-3" style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
            <div className="text-[10.5px] font-bold text-[#475569] mb-1">How this slots in</div>
            <div className="text-[11px] text-[#64748B] leading-relaxed">
              Credentials are stored in Vercel environment variables and never exposed in the UI.
              The MAIA agent layer reads directly from env at runtime; changes propagate on next deploy.
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-white"
            style={{ background: flash === "saved"
              ? "linear-gradient(135deg, #10B981, #059669)"
              : `linear-gradient(135deg, ${integration.accent}, ${integration.accent}CC)` }}
          >
            {flash === "saved" ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved</> : connected ? "Update credentials" : "Save & connect"}
          </button>
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-lg text-[12px] font-bold text-[#475569]"
            style={{ border: "1px solid rgba(15,23,42,0.1)" }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Notifications ───────────────────────────────────────────────────────────

function NotificationsSection() {
  const defaults = [
    { event: "Fatigue breach projected", to: "Slack #ops-alerts + manager email", enabled: true },
    { event: "Shortage alert · critical/high", to: "Slack #ops-alerts (immediate)", enabled: true },
    { event: "Compliance breach", to: "Slack #compliance + HR email", enabled: true },
    { event: "Auto-denied time-off request", to: "Slack DM to requester", enabled: true },
    { event: "Weekly executive briefing", to: "Director email + #leadership", enabled: true },
    { event: "Performance flag · at-risk retention", to: "HR email only", enabled: true },
    { event: "Bias flag · fairness audit", to: "Slack #hr-alerts", enabled: true },
    { event: "Cost leakage > $10K/mo", to: "Finance email", enabled: false },
  ];
  const [rules, setRules] = useState(defaults);
  const active = rules.filter((r) => r.enabled).length;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(15,23,42,0.05)" }}>
        <div className="text-[13px] font-bold text-[#0F172A]">Notification rules · {active} of {rules.length} active</div>
        <div className="text-[11px] text-[#64748B] mt-0.5">Who gets told what, and through which channel. Critical events bypass batching windows.</div>
      </div>
      <div className="divide-y divide-slate-100">
        {rules.map((r, i) => (
          <div key={i} className="px-5 py-3 flex items-center gap-3">
            <Bell className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-bold text-[#0F172A]">{r.event}</div>
              <div className="text-[10.5px] text-[#64748B]">→ {r.to}</div>
            </div>
            <Toggle
              on={r.enabled}
              onToggle={() => setRules(rules.map((rule, idx) => idx === i ? { ...rule, enabled: !rule.enabled } : rule))}
              label={`Toggle ${r.event}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-pressed={on}
      className="relative inline-flex w-9 h-5 rounded-full shrink-0 transition-colors cursor-pointer"
      style={{ background: on ? "#10B981" : "rgba(15,23,42,0.15)" }}
    >
      <motion.span
        className="absolute w-4 h-4 rounded-full bg-white top-0.5 shadow"
        animate={{ left: on ? "calc(100% - 18px)" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ─── Security ────────────────────────────────────────────────────────────────

function SecuritySection() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const keys = [
    { id: "claude", name: "Anthropic API key", masked: "sk-ant-api03-●●●●●●●●●●●●●●●●", lastUsed: "2m ago", scope: "agents · briefings" },
    { id: "supabase", name: "Supabase service role", masked: "eyJhbGciOiJIUzI1NiIs●●●●", lastUsed: "just now", scope: "all platform writes" },
    { id: "slack", name: "Slack webhook", masked: "hooks.slack.com/services/●●●", lastUsed: "3h ago", scope: "#ops-alerts · #hr-alerts" },
  ];
  const copyKey = async (id: string, masked: string) => {
    try {
      await navigator.clipboard.writeText(masked);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
        <div className="text-[13px] font-bold text-[#0F172A] mb-1">API keys · masked</div>
        <div className="text-[11px] text-[#64748B] mb-3">Keys are managed in environment variables and never exposed in plaintext. Rotate via Vercel.</div>
        <div className="space-y-2">
          {keys.map((k) => (
            <div key={k.id} className="rounded-lg px-3 py-2.5 flex items-center gap-3"
              style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-bold text-[#0F172A]">{k.name}</div>
                <div className="font-mono text-[10.5px] text-[#64748B] truncate">
                  {revealed[k.id] ? k.masked : "●●●●●●●●●●●●●●●●●●"}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5">Last used {k.lastUsed} · scope: {k.scope}</div>
              </div>
              <button
                type="button"
                onClick={() => setRevealed((s) => ({ ...s, [k.id]: !s[k.id] }))}
                className="p-1.5 text-[#64748B] hover:text-[#2563EB] transition-colors"
                title={revealed[k.id] ? "Hide key" : "Reveal masked key"}
              >
                {revealed[k.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => copyKey(k.id, k.masked)}
                className="p-1.5 text-[#64748B] hover:text-[#2563EB] transition-colors relative"
                title="Copy masked reference to clipboard"
              >
                {copied === k.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
        <div className="text-[13px] font-bold text-[#0F172A] mb-1">Sign-in & SSO</div>
        <div className="text-[11px] text-[#64748B] mb-3">Currently signed in via Supabase Auth. SSO via Google available.</div>
        <div className="rounded-lg p-3 flex items-center gap-3" style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.25)" }}>
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <div className="text-[12px] text-[#0F172A] flex-1">2FA enabled · TOTP authenticator app</div>
          <button
            type="button"
            onClick={() => setTwoFactorOpen((v) => !v)}
            className="text-[10.5px] font-bold text-[#2563EB] hover:underline"
          >
            {twoFactorOpen ? "Hide" : "Manage"}
          </button>
        </div>
        {twoFactorOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            className="rounded-lg p-4 space-y-3"
            style={{ background: "rgba(37,99,235,0.03)", border: "1px solid rgba(37,99,235,0.15)" }}
          >
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-[12px] font-bold text-[#0F172A]">Second-factor methods</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">Current: TOTP via authenticator app. Backup codes generated Jan 2026.</div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" className="px-2.5 py-1.5 rounded-md text-[10.5px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #2563EB, #7C3AED)" }}>
                Regenerate backup codes
              </button>
              <button type="button" className="px-2.5 py-1.5 rounded-md text-[10.5px] font-bold text-[#475569]"
                style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.1)" }}>
                Add WebAuthn key
              </button>
              <button type="button" className="px-2.5 py-1.5 rounded-md text-[10.5px] font-bold text-rose-600 hover:bg-rose-50"
                style={{ border: "1px solid rgba(239,68,68,0.25)" }}>
                Disable 2FA
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)" }}>
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-[12.5px] font-bold text-[#991B1B]">Compliance reminder</div>
            <div className="text-[11px] text-[#7F1D1D]">
              All agent actions are logged in <code className="font-mono text-[10.5px]">maia_agent_events</code> for 90 days. Export for audit via the Decisions Ledger.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Appearance ──────────────────────────────────────────────────────────────

function AppearanceSection() {
  const [theme, setTheme] = useState("Light · enterprise bright");
  const [density, setDensity] = useState("Comfortable");
  const [motion, setMotion] = useState("Full");
  const [font, setFont] = useState("Space Grotesk + Inter");
  return (
    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.06)", boxShadow: "0 2px 16px rgba(15,23,42,0.04)" }}>
      <div className="text-[13px] font-bold text-[#0F172A] mb-1">Appearance</div>
      <div className="text-[11px] text-[#64748B] mb-4">Theme and density preferences. Saved per browser.</div>
      <div className="space-y-3">
        <OptionRow
          label="Theme"
          value={theme}
          options={["Light · enterprise bright", "Dark · obsidian", "System · follow OS"]}
          onChange={setTheme}
          hint="Dark mode applies after next reload"
        />
        <OptionRow
          label="Density"
          value={density}
          options={["Comfortable", "Compact", "Spacious"]}
          onChange={setDensity}
          hint="Affects padding across all pages"
        />
        <OptionRow
          label="Motion"
          value={motion}
          options={["Full", "Reduced", "None"]}
          onChange={setMotion}
          hint="Honours prefers-reduced-motion by default"
        />
        <OptionRow
          label="Font pair"
          value={font}
          options={["Space Grotesk + Inter", "Inter only", "System stack"]}
          onChange={setFont}
          hint="Editorial-forward default"
        />
      </div>
    </div>
  );
}

function OptionRow({
  label, value, options, onChange, hint,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  hint: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg px-3 py-2.5 flex items-center gap-3 relative"
      style={{ background: "rgba(15,23,42,0.02)", border: "1px solid rgba(15,23,42,0.06)" }}>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold text-[#0F172A]">{label}</div>
        <div className="text-[10.5px] text-[#64748B]">{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
        style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.08)" }}
      >
        {value}
        <ChevronRight className="w-2.5 h-2.5 text-[#94A3B8]"
          style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 150ms" }} />
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-3 top-full mt-1 z-10 rounded-lg overflow-hidden"
          style={{ background: "#FFFFFF", border: "1px solid rgba(15,23,42,0.1)", boxShadow: "0 8px 24px rgba(15,23,42,0.1)", minWidth: 220 }}
        >
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full px-3 py-2 text-left text-[11.5px] hover:bg-slate-50 transition-colors flex items-center gap-2"
              style={{ color: opt === value ? "#2563EB" : "#0F172A", fontWeight: opt === value ? 700 : 500 }}
            >
              {opt === value && <CheckCircle2 className="w-3 h-3" />}
              <span>{opt}</span>
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
