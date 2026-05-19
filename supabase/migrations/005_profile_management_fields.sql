-- Add beta-ready profile metadata fields for coach accounts and athletes.
-- These columns are optional and do not change scoring/report calculations.

alter table public.profiles
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists display_name text,
add column if not exists contact_email text,
add column if not exists role_title text,
add column if not exists phone text,
add column if not exists website text,
add column if not exists location text,
add column if not exists notes text;

alter table public.athletes
add column if not exists first_name text,
add column if not exists last_name text,
add column if not exists display_name text,
add column if not exists email text,
add column if not exists phone text,
add column if not exists team_school text,
add column if not exists graduation_year integer,
add column if not exists notes text;

create index if not exists athletes_coach_display_name_lookup
on public.athletes (coach_id, display_name);

create index if not exists athletes_coach_team_school_lookup
on public.athletes (coach_id, team_school);
