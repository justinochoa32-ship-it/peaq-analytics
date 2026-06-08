-- Add assigned program history for PEAQ Build.
-- This stores coach-created assigned/draft programs separately from completed work.

create table if not exists public.assigned_programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  client_id text,
  source_report_client_id text,
  source_profile_bucket text,
  source_primary_limiter text,
  source_secondary_limiter text,
  program_name text not null,
  weekly_structure text not null default '3-Day Split',
  status text not null default 'Draft',
  created_from text not null default 'Manual Build',
  program_json jsonb not null,
  notes text,
  assigned_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assigned_programs_program_name_not_blank check (btrim(program_name) <> ''),
  constraint assigned_programs_weekly_structure_valid check (weekly_structure in ('2-Day Split', '3-Day Split', '4-Day Split')),
  constraint assigned_programs_status_valid check (status in ('Draft', 'Assigned', 'Completed', 'Archived')),
  constraint assigned_programs_created_from_valid check (created_from in ('Profile Handoff', 'Manual Build', 'Imported JSON', 'Duplicate'))
);

drop trigger if exists set_assigned_programs_updated_at on public.assigned_programs;
create trigger set_assigned_programs_updated_at
before update on public.assigned_programs
for each row execute function public.set_updated_at();

create unique index if not exists assigned_programs_coach_client_id_unique
on public.assigned_programs (coach_id, client_id);

create index if not exists assigned_programs_coach_athlete_updated
on public.assigned_programs (coach_id, athlete_id, updated_at desc);

create index if not exists assigned_programs_coach_status
on public.assigned_programs (coach_id, status);

alter table public.assigned_programs enable row level security;

drop policy if exists "Assigned programs are owned by coach" on public.assigned_programs;
create policy "Assigned programs are owned by coach"
on public.assigned_programs
for all
using (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.athletes
    where athletes.id = assigned_programs.athlete_id
      and athletes.coach_id = auth.uid()
  )
)
with check (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.athletes
    where athletes.id = assigned_programs.athlete_id
      and athletes.coach_id = auth.uid()
  )
);
