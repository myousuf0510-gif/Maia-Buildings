-- MAIA Agents — the Decisions Ledger schema.
--
-- Apply via Supabase SQL Editor → paste → run.
-- Self-contained: no external table dependencies.
--
-- Three tables:
--   maia_agents          — agent definitions
--   maia_agent_runs      — each decision (reasoning, action, counterfactual, outcome)
--   maia_agent_events    — append-only event log (Decisions Ledger)
--
-- Production note: RLS is currently authenticated-wide-open for demo simplicity.
-- For multi-tenant prod, tighten to org-scoped policies using a user_orgs table
-- or JWT claims (auth.jwt() -> 'user_metadata' ->> 'org_id').

-- =========================================================================
-- AGENTS
-- =========================================================================

create table if not exists public.maia_agents (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null,
  name              text not null,
  type              text not null
                    check (type in ('fatigue_guardian','compliance_sentinel','demand_watcher')),
  status            text not null default 'draft'
                    check (status in ('active','paused','learning','draft')),
  autonomy          int  not null default 1 check (autonomy between 0 and 3),
  description       text,
  config            jsonb not null default '{}'::jsonb,
  created_by        text,
  created_at        timestamptz not null default now(),
  deployed_at       timestamptz,
  updated_at        timestamptz not null default now()
);

create index if not exists idx_maia_agents_org on public.maia_agents(org_id);
create index if not exists idx_maia_agents_status on public.maia_agents(status);

-- =========================================================================
-- AGENT RUNS (each decision)
-- =========================================================================

create table if not exists public.maia_agent_runs (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid not null references public.maia_agents(id) on delete cascade,
  org_id                uuid not null,
  triggered_at          timestamptz not null default now(),
  trigger_type          text not null,
  trigger_payload       jsonb not null default '{}'::jsonb,

  reasoning             jsonb not null default '{}'::jsonb,
  proposed_action       jsonb not null default '{}'::jsonb,
  counterfactual        jsonb not null default '{}'::jsonb,

  status                text not null default 'proposed'
                        check (status in ('proposed','notified','approved','rejected','executed','expired','failed')),
  confidence_score      numeric(4,3) check (confidence_score between 0 and 1),

  approved_by           text,
  approved_at           timestamptz,
  executed_at           timestamptz,
  outcome               jsonb,
  affected_staff_ids    text[] not null default '{}',
  estimated_savings     numeric(12,2) not null default 0,
  response_time_seconds int,

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_runs_agent on public.maia_agent_runs(agent_id);
create index if not exists idx_runs_org on public.maia_agent_runs(org_id);
create index if not exists idx_runs_status on public.maia_agent_runs(status);
create index if not exists idx_runs_triggered_at on public.maia_agent_runs(triggered_at desc);
create index if not exists idx_runs_pending_by_org on public.maia_agent_runs(org_id, status)
  where status in ('proposed','notified');

-- =========================================================================
-- AGENT EVENTS (append-only event log — Decisions Ledger)
-- =========================================================================

create table if not exists public.maia_agent_events (
  id            uuid primary key default gen_random_uuid(),
  run_id        uuid not null references public.maia_agent_runs(id) on delete cascade,
  agent_id      uuid not null,
  org_id        uuid not null,
  timestamp     timestamptz not null default now(),
  event_type    text not null
                check (event_type in ('triggered','analyzed','proposed','notified',
                                      'approved','rejected','executed','outcome_observed',
                                      'expired','failed')),
  actor         text,
  payload       jsonb
);

create index if not exists idx_events_run on public.maia_agent_events(run_id);
create index if not exists idx_events_org_time on public.maia_agent_events(org_id, timestamp desc);

-- =========================================================================
-- updated_at triggers
-- =========================================================================

create or replace function public.maia_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_agents_touch on public.maia_agents;
create trigger trg_agents_touch before update on public.maia_agents
  for each row execute function public.maia_touch_updated_at();

drop trigger if exists trg_runs_touch on public.maia_agent_runs;
create trigger trg_runs_touch before update on public.maia_agent_runs
  for each row execute function public.maia_touch_updated_at();

-- =========================================================================
-- RLS — authenticated users can read/write (demo mode).
-- For multi-tenant prod, replace with org-scoped policies.
-- =========================================================================

alter table public.maia_agents enable row level security;
alter table public.maia_agent_runs enable row level security;
alter table public.maia_agent_events enable row level security;

drop policy if exists agents_all_auth on public.maia_agents;
create policy agents_all_auth on public.maia_agents
  for all to authenticated
  using (true) with check (true);

drop policy if exists runs_all_auth on public.maia_agent_runs;
create policy runs_all_auth on public.maia_agent_runs
  for all to authenticated
  using (true) with check (true);

drop policy if exists events_all_auth on public.maia_agent_events;
create policy events_all_auth on public.maia_agent_events
  for all to authenticated
  using (true) with check (true);

-- =========================================================================
-- Convenience view — pending decisions for inbox widgets
-- =========================================================================

create or replace view public.maia_pending_decisions as
select
  r.id                      as run_id,
  r.agent_id,
  r.org_id,
  a.name                    as agent_name,
  a.type                    as agent_type,
  r.triggered_at,
  r.trigger_type,
  r.trigger_payload,
  r.proposed_action,
  r.confidence_score,
  extract(epoch from (now() - r.triggered_at))::int as age_seconds
from public.maia_agent_runs r
join public.maia_agents a on a.id = r.agent_id
where r.status in ('proposed','notified')
order by r.triggered_at desc;
