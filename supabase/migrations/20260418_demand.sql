-- MAIA Demand Forecasting
-- Three tables: forecasts (outputs), signals (inputs), alerts (actions).
-- Apply via Supabase SQL Editor.

-- ─── Demand forecasts ──────────────────────────────────────────────────────
create table if not exists public.maia_demand_forecasts (
  id             text primary key,
  org_id         uuid not null,
  department     text not null,
  period_start   timestamptz not null,
  granularity    text not null check (granularity in ('hour','day','week')),
  required_fte   numeric not null,
  scheduled_fte  numeric not null default 0,
  gap_fte        numeric not null default 0,
  confidence     numeric not null default 0.85,
  drivers        jsonb not null default '{}'::jsonb,
  generated_at   timestamptz not null default now(),
  generated_by   text not null default 'agent',
  unique (org_id, department, period_start, granularity)
);

create index if not exists idx_forecast_dept_time
  on public.maia_demand_forecasts(org_id, department, period_start);

-- ─── Demand signals (inputs MAIA ingested) ─────────────────────────────────
create table if not exists public.maia_demand_signals (
  id            text primary key,
  org_id        uuid not null,
  signal_type   text not null,          -- flight_schedule, weather, event, historical_pattern, etc.
  timestamp     timestamptz not null,
  department    text,                    -- null for org-wide
  value         numeric,
  metadata      jsonb not null default '{}'::jsonb,
  source        text,
  fetched_at    timestamptz not null default now()
);

create index if not exists idx_signal_type_time
  on public.maia_demand_signals(signal_type, timestamp);

-- ─── Demand alerts (shortage / overstaff notifications) ────────────────────
create table if not exists public.maia_demand_alerts (
  id             text primary key,
  org_id         uuid not null,
  department     text not null,
  alert_type     text not null check (alert_type in ('shortage','overstaff','anomaly')),
  severity       text not null check (severity in ('critical','high','medium','low')),
  period_start   timestamptz not null,
  period_end     timestamptz not null,
  gap_fte        numeric not null,     -- positive = shortage, negative = overstaff
  peak_hour      timestamptz,
  message        text not null,
  explanation    text,
  status         text not null default 'new' check (status in ('new','acknowledged','notified','resolved')),
  notified_to    text,                  -- 'manager' | 'hr' | 'slack'
  notified_at    timestamptz,
  acknowledged_by text,
  created_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

create index if not exists idx_alerts_status
  on public.maia_demand_alerts(status, severity, period_start);

-- ─── RLS + grants (demo mode, permissive) ─────────────────────────────────
alter table public.maia_demand_forecasts enable row level security;
alter table public.maia_demand_signals   enable row level security;
alter table public.maia_demand_alerts    enable row level security;

drop policy if exists forecasts_all on public.maia_demand_forecasts;
create policy forecasts_all on public.maia_demand_forecasts for all using (true) with check (true);

drop policy if exists signals_all on public.maia_demand_signals;
create policy signals_all on public.maia_demand_signals for all using (true) with check (true);

drop policy if exists alerts_all on public.maia_demand_alerts;
create policy alerts_all on public.maia_demand_alerts for all using (true) with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on public.maia_demand_forecasts to anon, authenticated, service_role;
grant all on public.maia_demand_signals   to anon, authenticated, service_role;
grant all on public.maia_demand_alerts    to anon, authenticated, service_role;

notify pgrst, 'reload schema';
