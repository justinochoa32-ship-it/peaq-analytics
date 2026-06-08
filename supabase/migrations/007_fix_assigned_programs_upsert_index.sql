-- Fix assigned program upsert conflict target for PostgREST.
-- The Profile app saves assigned programs using on_conflict=coach_id,client_id.
-- PostgREST requires a usable unique constraint/index for that conflict target.

drop index if exists public.assigned_programs_coach_client_id_unique;

create unique index if not exists assigned_programs_coach_client_id_unique
on public.assigned_programs (coach_id, client_id);

notify pgrst, 'reload schema';
