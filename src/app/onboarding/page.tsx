'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import {
  CheckCircle2, ChevronRight, ChevronLeft, Plane, Hospital,
  Factory, Truck, ShoppingBag, UploadCloud, Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  industry: string;
  pain_points: string[];
  country: string;
  province: string;
  integration: string;
  team_size: number;
  departments: string[];
}

const TOTAL_STEPS = 6;

// ─── Step 1 Data ──────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { id: 'aviation',      label: 'Aviation',       sub: 'Airports, Airlines, Ground Handlers', Icon: Plane,       available: true  },
  { id: 'healthcare',    label: 'Healthcare',      sub: 'Hospitals, Clinics',                  Icon: Hospital,    available: false },
  { id: 'manufacturing', label: 'Manufacturing',   sub: 'Factories, Production',               Icon: Factory,     available: false },
  { id: 'logistics',     label: 'Logistics',       sub: 'Warehouses, Distribution',            Icon: Truck,       available: false },
  { id: 'retail',        label: 'Retail',          sub: 'Stores, Hospitality',                 Icon: ShoppingBag, available: false },
];

// ─── Step 2 Data ──────────────────────────────────────────────────────────────

const PAIN_POINTS = [
  { id: 'overtime',         label: 'Overtime costs too high',            emoji: '💸' },
  { id: 'open_shifts',      label: 'Difficulty filling open shifts',     emoji: '🏢' },
  { id: 'fatigue',          label: 'Staff fatigue and burnout',          emoji: '😴' },
  { id: 'demand_planning',  label: 'Hard to predict staffing demand',    emoji: '📊' },
  { id: 'turnover',         label: 'High staff turnover',                emoji: '🏃' },
  { id: 'absenteeism',      label: 'Attendance and absenteeism',         emoji: '📋' },
  { id: 'compliance',       label: 'Compliance and labour law risks',    emoji: '⚠️' },
  { id: 'agency_spend',     label: 'Relying too much on agency staff',   emoji: '🤝' },
  { id: 'kpi_visibility',   label: 'No visibility into team performance',emoji: '📈' },
  { id: 'last_minute',      label: 'Schedule changes last minute',       emoji: '⏰' },
];

// ─── Step 3 Data ──────────────────────────────────────────────────────────────

const COUNTRIES = ['Canada', 'United States', 'United Kingdom', 'UAE', 'Australia', 'Other'];

const PROVINCES_BY_COUNTRY: Record<string, string[]> = {
  Canada: ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba', 'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland', 'PEI', 'Northwest Territories', 'Nunavut', 'Yukon'],
  'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
};

const LABOUR_LAW_PREVIEWS: Record<string, string> = {
  'Ontario':          '✅ Ontario ESA: Min 8h rest between shifts, 1.5x OT after 44h/week, 3h minimum pay',
  'British Columbia': '✅ BC ESA: 1.5x OT after 8h/day or 40h/week, 2x after 12h/day',
  'Quebec':           '✅ Quebec Labour Standards: 1.5x OT after 40h/week, 3-week notice for schedule changes',
  'Alberta':          '✅ Alberta ESA: 1.5x OT after 8h/day or 44h/week, 2x after 12h/day',
  'California':       '✅ California: 1.5x OT after 8h/day, 2x after 12h/day, mandatory rest periods',
  'New York':         '✅ New York: 1.5x OT after 40h/week, predictive scheduling law applies',
};

// ─── Step 4 Data ──────────────────────────────────────────────────────────────

const INTEGRATIONS = [
  { id: 'swai',   label: 'Smart Workforce AI', sub: 'Native integration — real-time sync', primary: true  },
  { id: 'kronos', label: 'Kronos / UKG',        sub: 'Workforce Central & Dimensions',      primary: false },
  { id: 'adp',    label: 'ADP',                 sub: 'Workforce Now & TotalSource',          primary: false },
  { id: 'deputy', label: 'Deputy',              sub: 'Scheduling & time tracking',           primary: false },
  { id: 'csv',    label: 'Manual CSV Upload',   sub: 'Upload from any system',               primary: false },
  { id: 'later',  label: "I'll connect later",  sub: 'Set up from Integrations page',        primary: false },
];

// ─── Step 5 Data ──────────────────────────────────────────────────────────────

const TEAM_SIZE_LABELS: Record<number, string> = {
  0: '< 10',
  1: '10–50',
  2: '50–100',
  3: '100–500',
  4: '500–1000',
  5: '1000+',
};

const AVIATION_DEPARTMENTS = [
  'Ground Operations', 'Gate Operations', 'Ramp Operations',
  'Baggage Handling', 'Passenger Services', 'Check-in & Boarding',
  'Airport Security', 'Aircraft Maintenance', 'Airside Operations',
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <div key={i} className="flex items-center gap-2 flex-1">
          <div
            className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < step ? '#2563EB' : '#E2E8F0' }}
          />
        </div>
      ))}
      <span className="text-xs font-semibold text-[#94A3B8] ml-2 shrink-0">
        {step}/{TOTAL_STEPS}
      </span>
    </div>
  );
}

// ─── Nav Buttons ──────────────────────────────────────────────────────────────

function NavButtons({
  step,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  loading = false,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mt-8">
      {step > 1 ? (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled || loading}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#2563EB' }}
      >
        {loading ? 'Saving…' : nextLabel}
        {!loading && <ChevronRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    industry: '',
    pain_points: [],
    country: 'Canada',
    province: 'Ontario',
    integration: '',
    team_size: 1,
    departments: [],
  });

  const next = useCallback(() => setStep((s) => Math.min(s + 1, TOTAL_STEPS)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const togglePainPoint = (id: string) => {
    setData((d) => ({
      ...d,
      pain_points: d.pain_points.includes(id)
        ? d.pain_points.filter((p) => p !== id)
        : [...d.pain_points, id],
    }));
  };

  const toggleDept = (d2: string) => {
    setData((d) => ({
      ...d,
      departments: d.departments.includes(d2)
        ? d.departments.filter((x) => x !== d2)
        : [...d.departments, d2],
    }));
  };

  const finishOnboarding = async () => {
    setLoading(true);
    try {
      // Persist to localStorage immediately (fast)
      localStorage.setItem('maia_onboarding', JSON.stringify({ ...data, completed_at: new Date().toISOString() }));

      // Fetch org_id for the current user
      if (user) {
        const { data: orgMember } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single() as { data: { org_id: string } | null };

        if (orgMember?.org_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('organizations')
            .update({ onboarding_complete: true, onboarding_data: data })
            .eq('id', orgMember.org_id);
        }
      }

      router.push('/overview');
    } catch (err) {
      console.error('Onboarding save failed:', err);
      // Still navigate — onboarding data is in localStorage
      router.push('/overview');
    } finally {
      setLoading(false);
    }
  };

  const labourLawPreview =
    LABOUR_LAW_PREVIEWS[data.province] ??
    `✅ Labour law rules for ${data.country} will be pre-loaded automatically`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: '#F8FAFC',
        backgroundImage: 'radial-gradient(circle, #C8CDD6 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-sm"
        style={{ border: '1px solid #E2E8F0' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-black text-[#0F172A] tracking-tight">MAIA Intelligence</span>
        </div>

        <ProgressBar step={step} />

        {/* ── Step 1: Welcome + Industry ── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Welcome to MAIA Intelligence</h1>
            <p className="text-sm text-[#475569] mb-6">Let&apos;s configure your platform in under 5 minutes</p>

            <p className="text-xs font-bold text-[#94A3B8] tracking-wider uppercase mb-3">Select your industry</p>
            <div className="grid grid-cols-1 gap-3">
              {INDUSTRIES.map(({ id, label, sub, Icon, available }) => (
                <button
                  key={id}
                  onClick={() => available && setData((d) => ({ ...d, industry: id }))}
                  disabled={!available}
                  className="flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                  style={{
                    border: `2px solid ${data.industry === id ? '#2563EB' : '#E2E8F0'}`,
                    background: data.industry === id ? 'rgba(37,99,235,0.04)' : '#FAFAFA',
                    opacity: available ? 1 : 0.45,
                    cursor: available ? 'pointer' : 'not-allowed',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: data.industry === id ? 'rgba(37,99,235,0.1)' : '#F1F5F9',
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: data.industry === id ? '#2563EB' : '#64748B' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#0F172A]">
                      {label}
                      {!available && (
                        <span className="ml-2 text-[9px] font-black px-1.5 py-0.5 rounded" style={{ background: '#F1F5F9', color: '#94A3B8' }}>
                          COMING SOON
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#64748B]">{sub}</div>
                  </div>
                  {data.industry === id && <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />}
                </button>
              ))}
            </div>

            <NavButtons step={step} onBack={back} onNext={next} nextDisabled={!data.industry} />
          </div>
        )}

        {/* ── Step 2: Pain Points ── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">What are your biggest challenges?</h1>
            <p className="text-sm text-[#475569] mb-6">Select all that apply — we&apos;ll customise your dashboard and insights</p>

            <div className="grid grid-cols-2 gap-3">
              {PAIN_POINTS.map(({ id, label, emoji }) => {
                const selected = data.pain_points.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => togglePainPoint(id)}
                    className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200"
                    style={{
                      border: `2px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
                      background: selected ? 'rgba(37,99,235,0.04)' : '#FAFAFA',
                    }}
                  >
                    <span className="text-lg shrink-0">{emoji}</span>
                    <span className="text-sm font-medium text-[#0F172A] flex-1 leading-snug">{label}</span>
                    {selected && <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <NavButtons step={step} onBack={back} onNext={next} nextDisabled={data.pain_points.length === 0} />
          </div>
        )}

        {/* ── Step 3: Jurisdiction ── */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Where do you operate?</h1>
            <p className="text-sm text-[#475569] mb-6">Your labour law rules will be pre-loaded automatically</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5 block">Country</label>
                <select
                  value={data.country}
                  onChange={(e) => setData((d) => ({ ...d, country: e.target.value, province: '' }))}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#0F172A] outline-none transition-all"
                  style={{ border: '1.5px solid #E2E8F0', background: '#FAFAFA' }}
                >
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              {PROVINCES_BY_COUNTRY[data.country] && (
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1.5 block">
                    {data.country === 'Canada' ? 'Province' : 'State'}
                  </label>
                  <select
                    value={data.province}
                    onChange={(e) => setData((d) => ({ ...d, province: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[#0F172A] outline-none transition-all"
                    style={{ border: '1.5px solid #E2E8F0', background: '#FAFAFA' }}
                  >
                    <option value="">Select {data.country === 'Canada' ? 'province' : 'state'}…</option>
                    {PROVINCES_BY_COUNTRY[data.country].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              )}

              {/* Labour law preview */}
              <div
                className="p-4 rounded-xl"
                style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)' }}
              >
                <p className="text-xs font-semibold text-[#2563EB]">{labourLawPreview}</p>
              </div>
            </div>

            <NavButtons step={step} onBack={back} onNext={next} />
          </div>
        )}

        {/* ── Step 4: Integrations ── */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Connect your scheduling system</h1>
            <p className="text-sm text-[#475569] mb-6">You can add more integrations later from the Integrations page</p>

            <div className="space-y-3">
              {INTEGRATIONS.map(({ id, label, sub, primary }) => {
                const selected = data.integration === id;
                return (
                  <button
                    key={id}
                    onClick={() => setData((d) => ({ ...d, integration: id }))}
                    className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all duration-200"
                    style={{
                      border: `2px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
                      background: selected ? 'rgba(37,99,235,0.04)' : '#FAFAFA',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A]">{label}</span>
                        {primary && (
                          <span
                            className="text-[9px] font-black px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}
                          >
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B]">{sub}</p>
                    </div>
                    {selected && <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0" />}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-[#94A3B8] mt-3">
              Don&apos;t worry — you can add integrations later from the Integrations page
            </p>

            <NavButtons step={step} onBack={back} onNext={next} nextDisabled={!data.integration} />
          </div>
        )}

        {/* ── Step 5: Team Setup ── */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Tell us about your team</h1>
            <p className="text-sm text-[#475569] mb-6">This helps us calibrate insights and benchmarks</p>

            <div className="space-y-6">
              {/* Team size slider */}
              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 block">
                  How many staff do you manage?
                </label>
                <div className="px-1">
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={1}
                    value={data.team_size}
                    onChange={(e) => setData((d) => ({ ...d, team_size: parseInt(e.target.value) }))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between mt-1">
                    {Object.values(TEAM_SIZE_LABELS).map((label) => (
                      <span key={label} className="text-[10px] font-medium text-[#94A3B8]">{label}</span>
                    ))}
                  </div>
                  <p
                    className="text-sm font-bold text-center mt-2"
                    style={{ color: '#2563EB' }}
                  >
                    {TEAM_SIZE_LABELS[data.team_size]} staff
                  </p>
                </div>
              </div>

              {/* Departments */}
              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-3 block">
                  What departments do you have? (optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {AVIATION_DEPARTMENTS.map((dept) => {
                    const selected = data.departments.includes(dept);
                    return (
                      <button
                        key={dept}
                        onClick={() => toggleDept(dept)}
                        className="flex items-center gap-2 p-2.5 rounded-lg text-left text-xs font-medium transition-all duration-200"
                        style={{
                          border: `1.5px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
                          background: selected ? 'rgba(37,99,235,0.04)' : '#FAFAFA',
                          color: selected ? '#2563EB' : '#475569',
                        }}
                      >
                        {selected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CSV upload (optional) */}
              <div>
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2 block">
                  Import staff list (optional)
                </label>
                <label
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:border-blue-300"
                  style={{ border: '1.5px dashed #CBD5E1', background: '#FAFAFA' }}
                >
                  <UploadCloud className="w-5 h-5 text-[#94A3B8]" />
                  <div>
                    <p className="text-sm font-medium text-[#475569]">Upload CSV file</p>
                    <p className="text-xs text-[#94A3B8]">Columns: first_name, last_name, employee_id, department</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" />
                </label>
              </div>
            </div>

            <NavButtons step={step} onBack={back} onNext={next} />
          </div>
        )}

        {/* ── Step 6: Done! ── */}
        {step === 6 && (
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Your MAIA Intelligence platform is ready</h1>
            <p className="text-sm text-[#475569] mb-8">Here&apos;s what we&apos;ve configured for you:</p>

            <div className="space-y-3 text-left mb-8">
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.12)' }}
              >
                <CheckCircle2 className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">
                    Dashboard customised for{' '}
                    <span className="text-[#2563EB]">
                      {INDUSTRIES.find((i) => i.id === data.industry)?.label ?? data.industry} operations
                    </span>
                  </p>
                  <p className="text-xs text-[#64748B]">Charts, KPIs, and intelligence feeds tailored to your industry</p>
                </div>
              </div>

              {data.province && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}
                >
                  <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">
                      Labour law rules loaded for{' '}
                      <span className="text-[#10B981]">{data.province}, {data.country}</span>
                    </p>
                    <p className="text-xs text-[#64748B]">{labourLawPreview}</p>
                  </div>
                </div>
              )}

              {data.pain_points.length > 0 && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.12)' }}
                >
                  <CheckCircle2 className="w-5 h-5 text-[#F97316] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">Priority insights configured</p>
                    <p className="text-xs text-[#64748B]">
                      {data.pain_points
                        .map((id) => PAIN_POINTS.find((p) => p.id === id)?.label)
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
              )}

              {data.integration && data.integration !== 'later' && (
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.12)' }}
                >
                  <CheckCircle2 className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">
                      Integration selected:{' '}
                      <span className="text-[#7C3AED]">
                        {INTEGRATIONS.find((i) => i.id === data.integration)?.label}
                      </span>
                    </p>
                    <p className="text-xs text-[#64748B]">Complete setup from the Integrations page</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={finishOnboarding}
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #2563EB, #1D4ED8)' }}
            >
              {loading ? 'Setting up your workspace…' : 'Go to Dashboard →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
