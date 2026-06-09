-- Add athlete-specific PEAQ Build assignments and digital completion log foundation.
-- Planned assignment JSON is stored separately from future completed work.

create table if not exists public.program_assignments (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  template_id uuid references public.program_templates(id) on delete set null,
  assignment_name text not null,
  phase_name text,
  weekly_structure text not null default '3-Day Split',
  start_date date,
  end_date date,
  status text not null default 'draft',
  program_json jsonb not null,
  coach_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint program_assignments_assignment_name_not_blank check (btrim(assignment_name) <> ''),
  constraint program_assignments_weekly_structure_valid check (weekly_structure in ('2-Day Split', '3-Day Split', '4-Day Split')),
  constraint program_assignments_status_valid check (status in ('draft', 'assigned', 'in_progress', 'completed', 'reviewed', 'archived')),
  constraint program_assignments_date_order check (end_date is null or start_date is null or end_date >= start_date)
);

drop trigger if exists set_program_assignments_updated_at on public.program_assignments;
create trigger set_program_assignments_updated_at
before update on public.program_assignments
for each row execute function public.set_updated_at();

create index if not exists program_assignments_coach_athlete_updated
on public.program_assignments (coach_id, athlete_id, updated_at desc);

create index if not exists program_assignments_coach_status
on public.program_assignments (coach_id, status);

create index if not exists program_assignments_athlete_status
on public.program_assignments (athlete_id, status);

create index if not exists program_assignments_archived_at
on public.program_assignments (coach_id, archived_at);

alter table public.program_assignments enable row level security;

drop policy if exists "Program assignments are owned by coach" on public.program_assignments;
create policy "Program assignments are owned by coach"
on public.program_assignments
for all
using (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.athletes
    where athletes.id = program_assignments.athlete_id
      and athletes.coach_id = auth.uid()
  )
)
with check (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.athletes
    where athletes.id = program_assignments.athlete_id
      and athletes.coach_id = auth.uid()
  )
  and (
    template_id is null
    or exists (
      select 1
      from public.program_templates
      where program_templates.id = program_assignments.template_id
        and program_templates.coach_id = auth.uid()
    )
  )
);

create table if not exists public.program_completion_logs (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.program_assignments(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  session_index integer not null,
  session_name text,
  exercise_id text,
  exercise_name text not null,
  planned_json jsonb,
  completed_json jsonb,
  status text not null,
  rpe numeric(4, 1),
  pain_flag boolean not null default false,
  notes text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_completion_logs_session_index_positive check (session_index >= 0),
  constraint program_completion_logs_exercise_name_not_blank check (btrim(exercise_name) <> ''),
  constraint program_completion_logs_status_valid check (status in ('completed', 'modified', 'missed', 'partial')),
  constraint program_completion_logs_rpe_range check (rpe is null or (rpe >= 0 and rpe <= 10))
);

drop trigger if exists set_program_completion_logs_updated_at on public.program_completion_logs;
create trigger set_program_completion_logs_updated_at
before update on public.program_completion_logs
for each row execute function public.set_updated_at();

create index if not exists program_completion_logs_assignment_session
on public.program_completion_logs (assignment_id, session_index);

create index if not exists program_completion_logs_coach_athlete
on public.program_completion_logs (coach_id, athlete_id);

create index if not exists program_completion_logs_coach_status
on public.program_completion_logs (coach_id, status);

alter table public.program_completion_logs enable row level security;

drop policy if exists "Program completion logs are owned by coach" on public.program_completion_logs;
create policy "Program completion logs are owned by coach"
on public.program_completion_logs
for all
using (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.program_assignments
    where program_assignments.id = program_completion_logs.assignment_id
      and program_assignments.coach_id = auth.uid()
      and program_assignments.athlete_id = program_completion_logs.athlete_id
  )
)
with check (
  coach_id = auth.uid()
  and exists (
    select 1
    from public.program_assignments
    where program_assignments.id = program_completion_logs.assignment_id
      and program_assignments.coach_id = auth.uid()
      and program_assignments.athlete_id = program_completion_logs.athlete_id
  )
);

notify pgrst, 'reload schema';
