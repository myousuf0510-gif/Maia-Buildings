'use client'

import { useState, useEffect } from 'react'
import { Play, Save, Copy, BarChart3, DollarSign, Clock, AlertTriangle, Target, TrendingUp, Users, Shield, Layers, ChevronDown } from 'lucide-react'

const SCENARIOS: Record<string, { name: string; desc: string; results: Record<string, number> }> = {
  baseline:         { name: 'Current Operations',              desc: 'Current portfolio · 120 buildings · existing policies',                      results: { coverage: 94.9, cost: 285400, overtime: 18200, fatigue: 2.3, leave: 23, fill: 89.2, risk: 2.1, compliance: 98.2 } },
  tighten_arrears:  { name: 'Tighten Arrears Escalation',      desc: 'Soft reminder at day 2 (not day 3); earlier N4 drafting',                    results: { coverage: 95.8, cost: 279100, overtime: 17400, fatigue: 2.0, leave: 24, fill: 90.4, risk: 1.8, compliance: 98.6 } },
  energy_aggressive:{ name: 'Aggressive Energy Optimization',  desc: 'Widen unoccupied drift to 5°C portfolio-wide',                               results: { coverage: 94.9, cost: 268800, overtime: 18200, fatigue: 2.3, leave: 23, fill: 89.2, risk: 1.9, compliance: 98.2 } },
  market_first:     { name: 'Market-First Dispatch',           desc: 'Post every non-emergency work order to market before auto-assigning',         results: { coverage: 95.1, cost: 272600, overtime: 14300, fatigue: 2.1, leave: 25, fill: 90.8, risk: 2.0, compliance: 98.3 } },
  fairness_tight:   { name: 'Tighter Vendor Cap (20%)',        desc: 'Lower single-vendor monthly cap from 25% → 20% across all trades',           results: { coverage: 94.2, cost: 287200, overtime: 19100, fatigue: 2.2, leave: 23, fill: 88.4, risk: 2.2, compliance: 99.0 } },
  turnover_14day:   { name: '14-Day Turnover SLA',             desc: 'Hard target: every unit flip ≤ 14 calendar days; parallel trades allowed',   results: { coverage: 97.1, cost: 291400, overtime: 19900, fatigue: 2.4, leave: 22, fill: 91.8, risk: 1.9, compliance: 98.4 } },
  in_house_boost:   { name: 'Grow In-House Team +8',           desc: 'Add 8 maintenance staff; reduce contractor spend',                            results: { coverage: 96.2, cost: 278800, overtime: 11200, fatigue: 1.8, leave: 30, fill: 91.5, risk: 1.7, compliance: 98.8 } },
  contractor_cap:   { name: 'Hard Contractor Cap (20%)',       desc: 'Cap total contractor spend at 20% of maintenance budget',                     results: { coverage: 93.4, cost: 268400, overtime: 18900, fatigue: 2.1, leave: 21, fill: 87.2, risk: 2.4, compliance: 97.9 } },
  preventive_plus:  { name: 'Preventive Maintenance +40%',     desc: 'Double-down on PM schedules for buildings with 3+ compliance alerts',         results: { coverage: 96.8, cost: 293600, overtime: 17100, fatigue: 2.0, leave: 25, fill: 92.1, risk: 1.6, compliance: 99.3 } },
  winter_storm:     { name: 'Winter Storm Response',           desc: '72h pre-authorized dispatch for heating, burst pipes, snow emergencies',      results: { coverage: 98.1, cost: 302400, overtime: 22300, fatigue: 2.7, leave: 18, fill: 95.0, risk: 2.1, compliance: 98.6 } },
  holiday_season:   { name: 'Winter Holiday Window',           desc: 'Dec 22–Jan 2 minimal on-call staffing, emergency-only dispatch',              results: { coverage: 90.4, cost: 258200, overtime: 12800, fatigue: 2.0, leave: 35, fill: 85.6, risk: 2.5, compliance: 97.4 } },
  rta_guideline_27: { name: 'RTA 2027 Guideline Pre-Comply',   desc: 'Model the 2027 rent guideline ceiling across all in-scope units',             results: { coverage: 94.9, cost: 279100, overtime: 17200, fatigue: 2.2, leave: 23, fill: 89.5, risk: 2.0, compliance: 99.4 } },
  acquisition_20:   { name: 'Acquire 20 New Buildings',        desc: 'Absorb 1,800 new units over 18 months; scale team + systems',                 results: { coverage: 93.8, cost: 336800, overtime: 22100, fatigue: 2.5, leave: 24, fill: 88.4, risk: 2.3, compliance: 97.8 } },
  divest_underperf: { name: 'Divest 8 Under-performers',       desc: 'Sell 8 buildings with health score < 55; reinvest proceeds',                  results: { coverage: 96.4, cost: 261200, overtime: 15100, fatigue: 1.9, leave: 26, fill: 92.4, risk: 1.6, compliance: 98.9 } },
  smart_lock_rollout:{ name: 'Smart Lock Rollout',             desc: 'Smart locks on all 11,400 units; reduce lockout dispatches 85%',              results: { coverage: 95.6, cost: 274400, overtime: 16900, fatigue: 2.0, leave: 25, fill: 90.7, risk: 1.8, compliance: 98.5 } },
  bms_expansion:    { name: 'BMS Expansion +14 Bldgs',         desc: 'Integrate 14 more buildings onto Metasys / Desigo BMS',                       results: { coverage: 95.4, cost: 268400, overtime: 17800, fatigue: 2.1, leave: 24, fill: 90.3, risk: 1.7, compliance: 98.7 } },
  short_term_pilot: { name: 'Short-Term Rental Pilot',         desc: 'Convert 5% of units in 3 downtown buildings to furnished short-term',         results: { coverage: 94.6, cost: 294100, overtime: 19400, fatigue: 2.3, leave: 22, fill: 89.8, risk: 2.4, compliance: 98.1 } },
  rent_collect_pad: { name: 'Mandatory PAD Rollout',           desc: 'All new tenants on pre-authorized debit; projected 30% arrears drop',         results: { coverage: 95.0, cost: 282100, overtime: 17900, fatigue: 2.2, leave: 24, fill: 89.8, risk: 1.7, compliance: 98.6 } },
  tenant_app:       { name: 'Tenant Self-Serve App',           desc: 'Tenants submit work orders, pay rent, book amenities via app',                results: { coverage: 95.7, cost: 278900, overtime: 16100, fatigue: 2.0, leave: 27, fill: 91.2, risk: 1.8, compliance: 98.5 } },
  gradual_auto:     { name: 'Phased Agent Autonomy',           desc: 'Level-up Dispatch + Energy to full autonomy; keep Arrears in draft mode',     results: { coverage: 95.8, cost: 272400, overtime: 15200, fatigue: 2.0, leave: 26, fill: 91.1, risk: 1.9, compliance: 98.5 } },
  full_autonomous:  { name: 'Fully Autonomous Agents',         desc: 'All agents run autonomously; managers approve exceptions only',               results: { coverage: 96.2, cost: 267800, overtime: 13400, fatigue: 1.9, leave: 28, fill: 91.8, risk: 2.0, compliance: 98.4 } },
  aggressive_save:  { name: 'Aggressive Cost Reduction',       desc: 'All levers: market-first, contractor cap, energy optim, tight arrears',       results: { coverage: 94.0, cost: 254900, overtime: 13800, fatigue: 2.0, leave: 24, fill: 88.2, risk: 2.1, compliance: 98.2 } },
}

export default function ScenarioModelingPage() {
  const [selected, setSelected] = useState('baseline')
  const [showComparison, setShowComparison] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const scenario = SCENARIOS[selected]
  const baseline = SCENARIOS.baseline.results

  const [vars, setVars] = useState({
    forecastHorizon: 14, staffBuffer: 8, minShift: 4, maxShift: 10,
    otCap: 20, costCeiling: 300000, fatigueTol: 3.0,
    leaveTol: 85, incentiveBudget: 15000, microShifts: false, splitShifts: false, slt: 95,
  })
  const [toast, setToast] = useState<{ kind: 'saved' | 'exported' | 'scheduled' | 'implemented'; msg: string } | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  const updateVar = (k: string, v: any) => setVars(p => ({ ...p, [k]: v }))

  const runSimulation = async () => {
    setIsRunning(true)
    await new Promise(r => setTimeout(r, 2000))
    setIsRunning(false)
  }

  const flashToast = (kind: 'saved' | 'exported' | 'scheduled' | 'implemented', msg: string) => {
    setToast({ kind, msg })
    setTimeout(() => setToast(null), 2400)
  }

  const handleSave = () => {
    setSavedCount(c => c + 1)
    flashToast('saved', `Saved "${scenario.name}" with current variable snapshot`)
  }

  const handleExport = () => {
    const payload = {
      scenario: { id: selected, name: scenario.name, description: scenario.desc },
      variables: vars,
      results: scenario.results,
      baseline: baseline,
      deltas: Object.fromEntries(
        Object.entries(scenario.results).map(([k, v]) => [k, +(v - (baseline[k] ?? 0)).toFixed(2)])
      ),
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `maia-scenario-${selected}-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    flashToast('exported', `Downloaded scenario report (JSON)`)
  }

  const handleSchedule = () => {
    const when = prompt('Schedule this scenario to run automatically?\n\nEnter cron-style or natural window (e.g. "weekly Monday 08:00", "nightly")', 'weekly Monday 08:00')
    if (!when) return
    flashToast('scheduled', `Scheduled "${scenario.name}" — ${when}`)
  }

  const handleImplement = () => {
    if (!confirm(`Apply "${scenario.name}" to live operations?\n\nThis changes scheduling rules for the next 14 days. You can roll back from the Decisions Ledger.`)) return
    flashToast('implemented', `"${scenario.name}" applied · rollback available in Decisions Ledger`)
  }

  const metricColor = (val: number, type: string) => {
    if (type === 'coverage') return val >= 95 ? '#059669' : val >= 90 ? '#D97706' : '#DC2626'
    if (type === 'cost') return val <= 280000 ? '#059669' : val <= 300000 ? '#D97706' : '#DC2626'
    if (type === 'risk') return val <= 2 ? '#059669' : val <= 3 ? '#D97706' : '#DC2626'
    if (type === 'compliance') return val >= 98 ? '#059669' : val >= 95 ? '#D97706' : '#DC2626'
    return '#64748B'
  }

  const METRIC_CONFIG = [
    { key: 'coverage',   label: 'Occupancy',         icon: Target,         type: 'coverage',   fmt: (v: number) => `${v.toFixed(1)}%` },
    { key: 'cost',       label: 'Monthly Opex',      icon: DollarSign,     type: 'cost',       fmt: (v: number) => `$${(v/1000).toFixed(0)}K` },
    { key: 'overtime',   label: 'Contractor Spend',  icon: Clock,          type: 'cost',       fmt: (v: number) => `$${(v/1000).toFixed(0)}K` },
    { key: 'fatigue',    label: 'Equipment Risk',    icon: AlertTriangle,  type: 'risk',       fmt: (v: number) => v.toFixed(1) },
    { key: 'leave',      label: 'Turnover Capacity', icon: Users,          type: 'coverage',   fmt: (v: number) => `${v}` },
    { key: 'fill',       label: 'Work Order Fill',   icon: TrendingUp,     type: 'coverage',   fmt: (v: number) => `${v.toFixed(1)}%` },
    { key: 'risk',       label: 'Portfolio Risk',    icon: BarChart3,      type: 'risk',       fmt: (v: number) => v.toFixed(1) },
    { key: 'compliance', label: 'Compliance',        icon: Shield,         type: 'compliance', fmt: (v: number) => `${v.toFixed(1)}%` },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 800px 400px at top right, rgba(99,102,241,0.02), transparent), #F8FAFB',
      padding: '24px',
      opacity: mounted ? 1 : 0,
      transition: 'all 400ms cubic-bezier(0.16,1,0.3,1)',
    }}>

      {/* HERO */}
      <div className="glass-card p-6 mb-6 card-enter-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}>
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Scenario Modeling</h1>
            <p className="text-[12px] text-slate-500 font-medium">Strategic &ldquo;what-if&rdquo; testing for portfolio strategy, cost, and operations</p>
          </div>
        </div>
        <p className="text-[15px] font-semibold text-slate-800 leading-relaxed">
          Micro shift enablement improves coverage 2.8% with controlled cost increase of 2.3%. Increased buffer scenario achieves best overall performance.
        </p>
      </div>

      {/* CONTROLS BAR */}
      <div className="solid-card p-4 mb-6 flex items-center gap-4 card-enter-2">
        <div className="relative">
          <select value={selected} onChange={e => setSelected(e.target.value)}
            className="appearance-none text-[12px] font-medium px-3 py-2 pr-8 rounded-lg bg-slate-50 border border-slate-200/80 cursor-pointer">
            {Object.entries(SCENARIOS).map(([k, s]) => (
              <option key={k} value={k}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>
        <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
          <input type="checkbox" checked={showComparison} onChange={e => setShowComparison(e.target.checked)} className="rounded accent-blue-500" />
          Show baseline comparison
        </label>
        <div className="flex-1" />
        <button onClick={handleSave} className="btn-secondary text-[12px] flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Save{savedCount > 0 && ` · ${savedCount}`}
        </button>
        <button onClick={runSimulation} disabled={isRunning}
          className="btn-primary text-[12px] flex items-center gap-1.5 disabled:opacity-60">
          {isRunning ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.6s linear infinite' }} /> Running...</>
          ) : (
            <><Play className="w-3.5 h-3.5" /> Run Simulation</>
          )}
        </button>
      </div>

      {/* VARIABLE CONTROLS */}
      <div className="solid-card p-5 mb-6 card-enter-3">
        <h3 className="section-header mb-5">Scenario Variables</h3>
        <div className="grid grid-cols-4 gap-6">
          {/* Forecast */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Forecast &amp; Planning</h4>
            {[
              { label: 'Forecast Horizon', key: 'forecastHorizon', min: 7, max: 90, unit: ' days', value: vars.forecastHorizon },
              { label: 'Staffing Buffer', key: 'staffBuffer', min: 0, max: 20, unit: '%', value: vars.staffBuffer },
              { label: 'Service Level', key: 'slt', min: 85, max: 99, unit: '%', value: vars.slt },
            ].map(s => (
              <div key={s.key}>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => updateVar(s.key, +e.target.value)}
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
                  <span className="text-[12px] font-bold text-slate-800 w-12 text-right">{s.value}{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Shift Config */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Shift Configuration</h4>
            {[
              { label: 'Min Shift Length', key: 'minShift', min: 2, max: 8, unit: 'h', value: vars.minShift },
              { label: 'Max Shift Length', key: 'maxShift', min: 6, max: 12, unit: 'h', value: vars.maxShift },
            ].map(s => (
              <div key={s.key}>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={s.min} max={s.max} value={s.value} onChange={e => updateVar(s.key, +e.target.value)}
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
                  <span className="text-[12px] font-bold text-slate-800 w-8 text-right">{s.value}{s.unit}</span>
                </div>
              </div>
            ))}
            <div className="space-y-2 pt-1">
              {[{ label: 'Micro Shifts (2–4h)', key: 'microShifts' }, { label: 'Split Shifts', key: 'splitShifts' }].map(c => (
                <label key={c.key} className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                  <input type="checkbox" checked={(vars as any)[c.key]} onChange={e => updateVar(c.key, e.target.checked)} className="rounded accent-blue-500" />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          {/* Cost */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Cost &amp; Compliance</h4>
            {[
              { label: 'Overtime Cap', key: 'otCap', min: 5, max: 35, unit: '%', value: vars.otCap },
              { label: 'Cost Ceiling', key: 'costCeiling', min: 250000, max: 350000, step: 5000, unit: 'K', value: vars.costCeiling, fmt: (v: number) => `$${v/1000}` },
              { label: 'Fatigue Tolerance', key: 'fatigueTol', min: 1, max: 5, step: 0.1, unit: '', value: vars.fatigueTol },
            ].map(s => (
              <div key={s.key}>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={s.min} max={s.max} step={s.step || 1} value={s.value} onChange={e => updateVar(s.key, +e.target.value)}
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
                  <span className="text-[12px] font-bold text-slate-800 w-12 text-right">{s.fmt ? s.fmt(s.value) : s.value}{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Advanced */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">Advanced</h4>
            {[
              { label: 'Leave Tolerance', key: 'leaveTol', min: 70, max: 95, unit: '%', value: vars.leaveTol },
              { label: 'Incentive Budget', key: 'incentiveBudget', min: 5000, max: 30000, step: 1000, unit: 'K', value: vars.incentiveBudget, fmt: (v: number) => `$${v/1000}` },
            ].map(s => (
              <div key={s.key}>
                <label className="text-[11px] font-medium text-slate-600 mb-1 block">{s.label}</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={s.min} max={s.max} step={s.step || 1} value={s.value} onChange={e => updateVar(s.key, +e.target.value)}
                    className="flex-1 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer" />
                  <span className="text-[12px] font-bold text-slate-800 w-12 text-right">{s.fmt ? s.fmt(s.value) : s.value}{s.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <div className="solid-card p-5 mb-6 card-enter-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="section-header">{scenario.name}</h3>
            <p className="section-subtitle mt-0.5">{scenario.desc}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3 h-3" /> Last run: 2 min ago
          </div>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
          {METRIC_CONFIG.map(({ key, label, icon: Icon, type, fmt }, i) => {
            const val = scenario.results[key]
            const baseVal = baseline[key]
            const diff = val - baseVal
            return (
              <div key={key} className="p-3 rounded-xl bg-slate-50/80 border border-slate-100" style={{ animation: `fade-in 0.3s ease-out ${i * 40}ms both` }}>
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  {showComparison && diff !== 0 && (
                    <span className={`text-[9px] font-bold ${diff > 0 ? 'text-blue-600' : 'text-red-500'}`}>
                      {diff > 0 ? '+' : ''}{key === 'cost' || key === 'overtime' ? `$${Math.abs(diff/1000).toFixed(0)}K` : diff.toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">{label}</div>
                <div className="text-[16px] font-bold" style={{ color: metricColor(val, type) }}>{fmt(val)}</div>
              </div>
            )
          })}
        </div>

        <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100">
          <h4 className="text-[12px] font-bold text-blue-800 mb-1.5">Impact Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-[11px] text-blue-700">
            <div><strong>Coverage:</strong> {scenario.results.coverage > baseline.coverage ? 'Improved' : 'Reduced'} by {Math.abs(scenario.results.coverage - baseline.coverage).toFixed(1)}%</div>
            <div><strong>Cost:</strong> {scenario.results.cost > baseline.cost ? 'Increased' : 'Reduced'} by ${Math.abs(scenario.results.cost - baseline.cost).toLocaleString()}</div>
            <div><strong>Risk:</strong> {scenario.results.risk > baseline.risk ? 'Higher' : 'Lower'} by {Math.abs(scenario.results.risk - baseline.risk).toFixed(1)} pts</div>
          </div>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      {showComparison && (
        <div className="solid-card overflow-hidden mb-6 card-enter-5">
          <div className="p-5 border-b" style={{ borderColor: 'rgba(15,23,42,0.04)' }}>
            <h3 className="section-header">Scenario Comparison</h3>
          </div>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Scenario</th><th className="text-center">Coverage</th><th className="text-center">Cost</th>
                <th className="text-center">Overtime</th><th className="text-center">Risk</th>
                <th className="text-center">Compliance</th><th className="text-center">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(SCENARIOS).map(([k, s], i) => (
                <tr key={k} className={k === selected ? 'bg-blue-50/30' : ''} style={{ animation: `fade-in 0.3s ease-out ${i * 50}ms both` }}>
                  <td>
                    <div className="font-semibold text-slate-800">{s.name}</div>
                    <div className="text-[10px] text-slate-500">{s.desc}</div>
                  </td>
                  <td className="text-center font-bold" style={{ color: metricColor(s.results.coverage, 'coverage') }}>{s.results.coverage.toFixed(1)}%</td>
                  <td className="text-center font-bold" style={{ color: metricColor(s.results.cost, 'cost') }}>${(s.results.cost/1000).toFixed(0)}K</td>
                  <td className="text-center font-semibold text-slate-700">${(s.results.overtime/1000).toFixed(0)}K</td>
                  <td className="text-center font-bold" style={{ color: metricColor(s.results.risk, 'risk') }}>{s.results.risk.toFixed(1)}</td>
                  <td className="text-center font-bold" style={{ color: metricColor(s.results.compliance, 'compliance') }}>{s.results.compliance.toFixed(1)}%</td>
                  <td className="text-center">
                    {k === 'increased_buffer' && <span className="badge badge-green text-[9px]">Recommended</span>}
                    {k === 'reduced_ot' && <span className="badge badge-amber text-[9px]">Risk Review</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SAVED & ACTIONS */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { title: '🎯 Best Performance', desc: 'Increased Buffer: 97.8% coverage, 1.6 risk score — optimal balance', color: 'emerald' },
          { title: '💰 Cost Optimization', desc: 'Reduced Overtime saves $16,500/month but requires higher risk tolerance', color: 'blue' },
          { title: '🔄 Flexible Options', desc: 'Micro Shifts improve coverage with minimal cost — recommended for trial', color: 'purple' },
        ].map((card, i) => (
          <div key={i} className={`solid-card p-4 card-enter-${i + 6}`}>
            <h4 className="text-[13px] font-bold text-slate-800 mb-1.5">{card.title}</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      <div className="solid-card p-5 flex items-center justify-between">
        <div>
          <h3 className="section-header">Scenario Actions</h3>
          <p className="text-[12px] text-slate-500 mt-1">Export or implement recommended changes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-[12px]">Export Report</button>
          <button onClick={handleSchedule} className="btn-secondary text-[12px]">Schedule Run</button>
          <button onClick={handleImplement} className="btn-primary text-[12px]">Implement Scenario</button>
        </div>
      </div>

      {toast && (
        <div
          className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-md"
          style={{
            background: '#FFFFFF',
            border: `1px solid ${toast.kind === 'implemented' ? 'rgba(16,185,129,0.4)' : 'rgba(37,99,235,0.3)'}`,
            boxShadow: '0 8px 28px rgba(15,23,42,0.12)',
          }}
        >
          <div className="w-2 h-2 rounded-full" style={{
            background: toast.kind === 'implemented' ? '#10B981'
              : toast.kind === 'exported' ? '#2563EB'
              : toast.kind === 'scheduled' ? '#F59E0B'
              : '#7C3AED'
          }} />
          <div className="text-[12px] font-semibold text-[#0F172A]">{toast.msg}</div>
        </div>
      )}

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
