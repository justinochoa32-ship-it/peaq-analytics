-- Add reusable PEAQ Build program templates.
-- Templates are coach-owned stock programs that can be loaded or assigned later.

create table if not exists public.program_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  client_id text,
  template_name text not null,
  weekly_structure text not null default '3-Day Split',
  source_profile_bucket text,
  primary_limiter text,
  secondary_limiter text,
  program_json jsonb not null,
  tags jsonb not null default '[]'::jsonb,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint program_templates_template_name_not_blank check (btrim(template_name) <> ''),
  constraint program_templates_weekly_structure_valid check (weekly_structure in ('2-Day Split', '3-Day Split', '4-Day Split')),
  constraint program_templates_tags_array check (jsonb_typeof(tags) = 'array')
);

drop trigger if exists set_program_templates_updated_at on public.program_templates;
create trigger set_program_templates_updated_at
before update on public.program_templates
for each row execute function public.set_updated_at();

create unique index if not exists program_templates_coach_client_id_unique
on public.program_templates (coach_id, client_id);

create index if not exists program_templates_coach_updated
on public.program_templates (coach_id, updated_at desc);

alter table public.program_templates enable row level security;

drop policy if exists "Program templates are owned by coach" on public.program_templates;
create policy "Program templates are owned by coach"
on public.program_templates
for all
using (coach_id = auth.uid())
with check (coach_id = auth.uid());

notify pgrst, 'reload schema';
