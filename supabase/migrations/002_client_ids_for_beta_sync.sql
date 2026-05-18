-- Preserve current app/client identity while syncing to Supabase UUID tables.
-- Run after 001_initial_schema.sql.

alter table public.athletes
add column if not exists client_id text;

alter table public.reports
add column if not exists client_id text;

create unique index if not exists athletes_coach_client_id_unique
on public.athletes (coach_id, client_id);

create unique index if not exists reports_coach_client_id_unique
on public.reports (coach_id, client_id);

create index if not exists reports_coach_client_lookup
on public.reports (coach_id, client_id)
where client_id is not null;
