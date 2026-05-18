-- Add beta-safe archive support for athlete profiles.
-- Archived athletes remain stored with their report history but can be hidden from the active library.

alter table public.athletes
add column if not exists archived_at timestamptz;

create index if not exists athletes_coach_archived_at
on public.athletes (coach_id, archived_at);
