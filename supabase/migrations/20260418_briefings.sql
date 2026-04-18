-- MAIA weekly executive briefings.
-- One row per generated briefing. Append-only in practice.
-- Apply via Supabase SQL Editor.

create table if not exists public.maia_briefings (
  id              text primary key,
  org_id          uuid not null,
  generated_at    timestamptz not null default now(),
  period_start    timestamptz not null,
  period_end      timestamptz not null,
  source          text not null check (source in ('claude','template')),
  summary_md      text not null,           -- full markdown briefing
  stats           jsonb not null default '{}'::jsonb,  -- decisions count, effectiveness, etc.
  created_at      timestamptz not null default now()
);

create index if not exists idx_briefings_org_time
  on public.maia_briefings(org_id, generated_at desc);

-- RLS: authenticated read-all (demo mode), permissive.
alter table public.maia_briefings enable row level security;

drop policy if exists briefings_all on public.maia_briefings;
create policy briefings_all on public.maia_briefings
  for all using (true) with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on public.maia_briefings to anon, authenticated, service_role;

notify pgrst, 'reload schema';
