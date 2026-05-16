-- PEAQ Analytics initial Supabase schema.
-- Frontend apps should use only the project URL and anon/publishable key.
-- Do not place service_role or secret keys in this repository.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  coach_name text not null,
  organization text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  name_key text generated always as (lower(btrim(name))) stored,
  dob date,
  sex text,
  sex_key text generated always as (lower(btrim(coalesce(sex, '')))) stored,
  sport text default 'Basketball',
  sport_key text generated always as (lower(btrim(coalesce(sport, '')))) stored,
  position text,
  position_key text generated always as (lower(btrim(coalesce(position, '')))) stored,
  height numeric(7, 2),
  bodyweight numeric(7, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint athletes_name_not_blank check (btrim(name) <> ''),
  constraint athletes_sex_valid check (sex is null or sex in ('Male', 'Female')),
  constraint athletes_height_positive check (height is null or height > 0),
  constraint athletes_bodyweight_positive check (bodyweight is null or bodyweight > 0)
);

drop trigger if exists set_athletes_updated_at on public.athletes;
create trigger set_athletes_updated_at
before update on public.athletes
for each row execute function public.set_updated_at();

create unique index if not exists athletes_coach_name_dob_unique
on public.athletes (coach_id, name_key, dob)
where dob is not null;

create index if not exists athletes_coach_name_lookup
on public.athletes (coach_id, name_key);

create index if not exists athletes_missing_dob_lookup
on public.athletes (coach_id, name_key, sex_key, sport_key, position_key)
where dob is null;

create index if not exists athletes_coach_updated_at
on public.athletes (coach_id, updated_at desc);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  testing_date date not null,
  raw_inputs jsonb not null,
  calculated_profile jsonb not null,
  metric_scores jsonb not null default '{}'::jsonb,
  bucket_scores jsonb not null default '{}'::jsonb,
  overall_score numeric(6, 2),
  profile_rating numeric(3, 1),
  archetype text,
  status text,
  primary_limiter text,
  secondary_limiter text,
  green_flag_one text,
  green_flag_two text,
  training_focus jsonb not null default '{}'::jsonb,
  coach_summary text,
  saved_at timestamptz not null default now(),
  corrected_at timestamptz,
  correction_count integer not null default 0,
  correction_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_correction_count_non_negative check (correction_count >= 0),
  constraint reports_overall_score_range check (overall_score is null or (overall_score >= 0 and overall_score <= 100)),
  constraint reports_profile_rating_range check (profile_rating is null or (profile_rating >= 0 and profile_rating <= 5))
);

drop trigger if exists set_reports_updated_at on public.reports;
create trigger set_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create index if not exists reports_coach_athlete_date
on public.reports (coach_id, athlete_id, testing_date desc);

create index if not exists reports_coach_date
on public.reports (coach_id, testing_date desc);

create index if not exists reports_coach_archetype
on public.reports (coach_id, archetype);

create index if not exists reports_coach_primary_limiter
on public.reports (coach_id, primary_limiter);

create table if not exists public.csv_import_batches (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  file_name text,
  row_count integer not null default 0,
  ready_count integer not null default 0,
  needs_review_count integer not null default 0,
  saved_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint csv_import_batches_counts_non_negative check (
    row_count >= 0
    and ready_count >= 0
    and needs_review_count >= 0
    and saved_count >= 0
  )
);

drop trigger if exists set_csv_import_batches_updated_at on public.csv_import_batches;
create trigger set_csv_import_batches_updated_at
before update on public.csv_import_batches
for each row execute function public.set_updated_at();

create index if not exists csv_import_batches_coach_created
on public.csv_import_batches (coach_id, created_at desc);

create table if not exists public.csv_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.csv_import_batches(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  row_number integer not null,
  raw_row jsonb not null,
  parsed_inputs jsonb,
  review_status text not null default 'Needs Review',
  review_message text,
  matched_athlete_id uuid references public.athletes(id) on delete set null,
  saved_report_id uuid references public.reports(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint csv_import_rows_row_number_positive check (row_number > 0),
  constraint csv_import_rows_review_status_valid check (
    review_status in ('Ready', 'Needs Review', 'Saved', 'Skipped', 'Invalid', 'Error')
  )
);

drop trigger if exists set_csv_import_rows_updated_at on public.csv_import_rows;
create trigger set_csv_import_rows_updated_at
before update on public.csv_import_rows
for each row execute function public.set_updated_at();

create index if not exists csv_import_rows_batch_row_number
on public.csv_import_rows (batch_id, row_number);

create index if not exists csv_import_rows_coach_status
on public.csv_import_rows (coach_id, review_status);

create index if not exists csv_import_rows_matched_athlete
on public.csv_import_rows (matched_athlete_id)
where matched_athlete_id is not null;

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.reports enable row level security;
alter table public.csv_import_batches enable row level security;
alter table public.csv_import_rows enable row level security;

drop policy if exists "Profiles are owned by authenticated coach" on public.profiles;
create policy "Profiles are owned by authenticated coach"
on public.profiles
for all
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Athletes are owned by coach" on public.athletes;
create policy "Athletes are owned by coach"
on public.athletes
for all
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

drop policy if exists "Reports are owned by coach" on public.reports;
create policy "Reports are owned by coach"
on public.reports
for all
using (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.athletes
    where athletes.id = reports.athlete_id
      and athletes.coach_id = auth.uid()
  )
)
with check (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.athletes
    where athletes.id = reports.athlete_id
      and athletes.coach_id = auth.uid()
  )
);

drop policy if exists "CSV import batches are owned by coach" on public.csv_import_batches;
create policy "CSV import batches are owned by coach"
on public.csv_import_batches
for all
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

drop policy if exists "CSV import rows are owned by coach" on public.csv_import_rows;
create policy "CSV import rows are owned by coach"
on public.csv_import_rows
for all
using (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.csv_import_batches
    where csv_import_batches.id = csv_import_rows.batch_id
      and csv_import_batches.coach_id = auth.uid()
  )
)
with check (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.csv_import_batches
    where csv_import_batches.id = csv_import_rows.batch_id
      and csv_import_batches.coach_id = auth.uid()
  )
  and (
    matched_athlete_id is null
    or exists (
      select 1
      from public.athletes
      where athletes.id = csv_import_rows.matched_athlete_id
        and athletes.coach_id = auth.uid()
    )
  )
  and (
    saved_report_id is null
    or exists (
      select 1
      from public.reports
      where reports.id = csv_import_rows.saved_report_id
        and reports.coach_id = auth.uid()
    )
  )
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, coach_name, organization)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'coach_name', new.raw_user_meta_data->>'name', 'Coach'),
    new.raw_user_meta_data->>'organization'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
