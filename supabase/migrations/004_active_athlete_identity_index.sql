-- Keep same-name + same-DOB protection for active athletes without blocking archived profiles.
-- This matches the app behavior where archived athletes are hidden from normal matching.

drop index if exists athletes_coach_name_dob_unique;

create unique index if not exists athletes_coach_active_name_dob_unique
on public.athletes (coach_id, name_key, dob)
where dob is not null and archived_at is null;
