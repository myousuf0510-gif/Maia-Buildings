-- MAIA Time Off Intelligence
-- Two tables: per-day viability windows (derived from demand forecast +
-- planned absences + attrition) and time-off requests with MAIA decisions.
--
-- Time Off Watcher agent reads the demand forecast + existing absences
-- + attrition model and writes per-department per-day viability scores
-- to maia_timeoff_windows. New requests are scored against those windows;
-- strong-availability requests auto-approve, blackout periods auto-deny,
-- tight windows queue for manager review. Every decision is audited.

-- ─── Windows (viability per dept per day) ──────────────────────────────────
create table if not exists public.maia_timeoff_windows (
  id                   text primary key,
  org_id               uuid not null,
  department           text not null,
  date                 date not null,
  required_fte         numeric not null,
  baseline_fte         numeric not null,
  already_off_fte      numeric not null default 0,
  available_fte        numeric not null,
  viability_score      numeric not null,   -- (available - required) / required
  classification       text not null check (classification in ('green','amber','red')),
  auto_approve_cap     int not null default 0, -- how many more requests can be auto-approved
  blackout_reason      text,
  generated_at         timestamptz not null default now(),
  unique (org_id, department, date)
);

create index if not exists idx_windows_dept_date
  on public.maia_timeoff_windows(org_id, department, date);

-- ─── Time off requests ─────────────────────────────────────────────────────
create table if not exists public.maia_timeoff_requests (
  id                   text primary key,
  org_id               uuid not null,
  staff_id             text not null,
  staff_name           text not null,
  department           text not null,
  role                 text,
  tenure_years         numeric,
  request_type         text not null check (request_type in ('vacation','sick_preplanned','personal','swap_away','floating_holiday')),
  start_date           date not null,
  end_date             date not null,
  days_requested       int not null,
  reason               text,
  submitted_at         timestamptz not null default now(),
  status               text not null default 'pending'
    check (status in ('pending','auto_approved','approved','auto_denied','denied','cancelled')),
  maia_decision        text,    -- 'auto_approve' | 'needs_review' | 'auto_deny'
  maia_reason          text,
  maia_confidence      numeric,
  min_viability_score  numeric, -- min viability across requested days
  min_viability_date   date,
  decided_at           timestamptz,
  decided_by           text,
  created_at           timestamptz not null default now()
);

create index if not exists idx_requests_status
  on public.maia_timeoff_requests(org_id, status, start_date);

-- ─── RLS + grants ─────────────────────────────────────────────────────────
alter table public.maia_timeoff_windows  enable row level security;
alter table public.maia_timeoff_requests enable row level security;

drop policy if exists timeoff_windows_all on public.maia_timeoff_windows;
create policy timeoff_windows_all on public.maia_timeoff_windows for all using (true) with check (true);

drop policy if exists timeoff_requests_all on public.maia_timeoff_requests;
create policy timeoff_requests_all on public.maia_timeoff_requests for all using (true) with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on public.maia_timeoff_windows  to anon, authenticated, service_role;
grant all on public.maia_timeoff_requests to anon, authenticated, service_role;

notify pgrst, 'reload schema';
