-- MAIA Shift Market + Incentive Optimizer
-- Two agents share this schema:
--   - Shift Market Agent writes maia_shift_postings (open shift queue).
--   - Incentive Optimizer Agent writes maia_shift_offers (offers made per posting)
--     and derives maia_fairness_audits on a rolling window.
--
-- Fairness-first: incentive_usd is a per-posting amount, never per-person.
-- Every offer records the fairness policy and the reason that person was
-- chosen at that moment (rotation-based last_offered_at timestamp,
-- seniority tier, etc.).

-- ─── Shift postings ─────────────────────────────────────────────────────────
create table if not exists public.maia_shift_postings (
  id                        text primary key,
  org_id                    uuid not null,
  department                text not null,
  role                      text not null,
  shift_date                date not null,
  start_hour                int not null,
  duration_h                int not null,
  required_count            int not null,
  filled_count              int not null default 0,
  posting_status            text not null default 'posted'
    check (posting_status in ('draft','posted','filling','filled','expired','cancelled')),
  posted_at                 timestamptz,
  lead_time_h               numeric,
  difficulty_score          numeric,
  fill_probability          numeric,
  incentive_usd             numeric not null,
  incentive_policy          text,
  expected_fill_at          timestamptz,
  notes                     text,
  generated_at              timestamptz not null default now()
);

create index if not exists idx_postings_status
  on public.maia_shift_postings(org_id, posting_status, shift_date);

-- ─── Shift offers ───────────────────────────────────────────────────────────
create table if not exists public.maia_shift_offers (
  id                  text primary key,
  posting_id          text not null references public.maia_shift_postings(id) on delete cascade,
  org_id              uuid not null,
  staff_id            text not null,
  staff_name          text not null,
  department          text not null,
  tenure_years        numeric,
  role                text,
  offer_order         int,                                 -- 1 = first offered, etc.
  offered_at          timestamptz not null default now(),
  expires_at          timestamptz,
  incentive_usd       numeric not null,                    -- same for everyone on this posting
  response_status     text not null default 'pending'
    check (response_status in ('pending','accepted','declined','expired','withdrawn')),
  responded_at        timestamptz,
  selection_policy    text not null,                       -- rotation / seniority / random / hybrid
  selection_reason    text,                                -- "rotation: last offered 27d ago"
  days_since_offer    int,                                 -- for rotation fairness
  created_at          timestamptz not null default now()
);

create index if not exists idx_offers_posting on public.maia_shift_offers(posting_id, offer_order);
create index if not exists idx_offers_staff on public.maia_shift_offers(staff_id, offered_at desc);

-- ─── Fairness audits ────────────────────────────────────────────────────────
create table if not exists public.maia_fairness_audits (
  id                       text primary key,
  org_id                   uuid not null,
  window_start             timestamptz not null,
  window_end               timestamptz not null,
  policy                   text not null,
  offer_count              int,
  unique_staff_offered     int,
  dept_distribution        jsonb,
  tenure_distribution      jsonb,
  role_distribution        jsonb,
  fairness_score           numeric,                        -- 0..1
  bias_flags               jsonb,                          -- [{dimension, group, deviation_pct}]
  created_at               timestamptz not null default now()
);

create index if not exists idx_audits_window on public.maia_fairness_audits(window_end desc);

-- ─── RLS + grants ──────────────────────────────────────────────────────────
alter table public.maia_shift_postings   enable row level security;
alter table public.maia_shift_offers     enable row level security;
alter table public.maia_fairness_audits  enable row level security;

drop policy if exists postings_all on public.maia_shift_postings;
create policy postings_all on public.maia_shift_postings for all using (true) with check (true);

drop policy if exists offers_all on public.maia_shift_offers;
create policy offers_all on public.maia_shift_offers for all using (true) with check (true);

drop policy if exists audits_all on public.maia_fairness_audits;
create policy audits_all on public.maia_fairness_audits for all using (true) with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant all on public.maia_shift_postings  to anon, authenticated, service_role;
grant all on public.maia_shift_offers    to anon, authenticated, service_role;
grant all on public.maia_fairness_audits to anon, authenticated, service_role;

notify pgrst, 'reload schema';
