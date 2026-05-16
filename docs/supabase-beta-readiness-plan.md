# Supabase Beta Readiness Plan

This plan maps the current localStorage PEAQ Analytics prototype to a Supabase-backed beta without changing the scoring model, archetype logic, report outputs, or CSV template.

## Goals

- Each coach can only see their own athletes, reports, imports, and future exports.
- Athletes use stable UUIDs, not name slugs, once stored in Supabase.
- Same-name athletes are separated safely by DOB when DOB exists.
- Missing-DOB athletes are never silently merged when identity is ambiguous.
- Raw testing inputs and calculated PEAQ outputs are both preserved.

## Recommended Tables

### profiles

Stores the coach workspace/account record for each authenticated user.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key. References `auth.users(id)` on delete cascade. |
| email | text | Copied from auth user for display/support. |
| coach_name | text | Current local `coach.name`. |
| organization | text | Current local `coach.organization`. |
| created_at | timestamptz | Default `now()`. |
| updated_at | timestamptz | Updated on profile changes. |

### athletes

Stores one athlete profile per coach-owned athlete identity.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, default `gen_random_uuid()`. |
| coach_id | uuid | References `profiles(id)` on delete cascade. |
| name | text | Required. |
| dob | date | Nullable, but preferred for safe identity matching. |
| sex | text | Current values: `Male`, `Female`. |
| sport | text | Defaults to `Basketball` in the app. |
| position | text | Nullable. |
| height | numeric | Inches. Nullable. |
| bodyweight | numeric | Pounds. Nullable. |
| created_at | timestamptz | Default `now()`. |
| updated_at | timestamptz | Updated when athlete identity/profile fields change. |

Recommended indexes:

- Unique partial index on `(coach_id, lower(name), dob)` where `dob is not null`.
- Non-unique lookup index on `(coach_id, lower(name), lower(sex), lower(sport), lower(position))` for missing-DOB review/matching.

Do not force uniqueness for missing-DOB athletes until the product has an explicit review/merge workflow.

### reports

Stores each saved testing report, including raw inputs and calculated profile output.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, default `gen_random_uuid()`. |
| coach_id | uuid | References `profiles(id)` on delete cascade. |
| athlete_id | uuid | References `athletes(id)` on delete cascade. |
| testing_date | date | Current report `date`. |
| raw_inputs | jsonb | Exact form inputs used to build the report. |
| calculated_profile | jsonb | Full calculated output from `buildProfile`. |
| archetype | text | Copied from calculated output for filtering/search. |
| status | text | Copied from calculated output. |
| primary_limiter | text | Copied from calculated output. |
| secondary_limiter | text | Copied from calculated output. |
| overall_score | numeric | Copied from calculated output. |
| profile_rating | numeric | Copied from calculated output. |
| saved_at | timestamptz | Original save timestamp. |
| corrected_at | timestamptz | Nullable. Last correction timestamp. |
| correction_count | integer | Default `0`. |
| correction_history | jsonb | Previous report snapshots for audit trail. |
| created_at | timestamptz | Default `now()`. |
| updated_at | timestamptz | Updated on corrections. |

Store both `raw_inputs` and `calculated_profile`. Raw inputs explain the math; calculated outputs keep historical reports stable even if future scoring changes are intentionally introduced.

### csv_imports

Tracks import batches for support, review, and beta debugging.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key, default `gen_random_uuid()`. |
| coach_id | uuid | References `profiles(id)` on delete cascade. |
| file_name | text | Nullable when pasted manually. |
| row_count | integer | Total rows parsed. |
| ready_count | integer | Rows ready to save. |
| needs_review_count | integer | Ambiguous or invalid rows. |
| saved_count | integer | Rows actually saved. |
| created_at | timestamptz | Default `now()`. |

Optional later: `csv_import_rows` for row-by-row validation history. For beta, a batch table plus client-side review may be enough.

### report_exports

Optional later table. Do not build this until the app needs export history or cloud file storage.

| Column | Type | Notes |
| --- | --- | --- |
| id | uuid | Primary key. |
| coach_id | uuid | References `profiles(id)`. |
| athlete_id | uuid | References `athletes(id)`. |
| report_id | uuid | Nullable for progress reports. |
| report_a_id | uuid | Nullable for single profile report. |
| report_b_id | uuid | Nullable for single profile report. |
| export_type | text | `profile_pdf` or `progress_pdf`. |
| storage_path | text | Future Supabase Storage path. |
| created_at | timestamptz | Default `now()`. |

## Row Level Security

Enable RLS on every app table.

Required policies:

- `profiles`: users can select/update only where `id = auth.uid()`.
- `athletes`: users can select/insert/update/delete only where `coach_id = auth.uid()`.
- `reports`: users can select/insert/update/delete only where `coach_id = auth.uid()`.
- `csv_imports`: users can select/insert/update only where `coach_id = auth.uid()`.
- Future `report_exports`: users can select/insert only where `coach_id = auth.uid()`.

For `reports`, also validate the referenced `athlete_id` belongs to the same `coach_id`.

## Auth Flow

Recommended beta auth:

1. Coach signs up with email/password or magic link.
2. App creates or upserts a `profiles` row with `id = auth.uid()`.
3. Coach lands in their PEAQ workspace.
4. Existing localStorage data can be imported/migrated into Supabase after sign-in.

## App Workflows

### Coach Signup

- Supabase Auth creates user.
- App creates `profiles` row.
- Empty workspace loads from Supabase.

### Manual Report Save

1. Build the profile locally using the unchanged scoring model.
2. Resolve athlete identity:
   - If correcting from an existing athlete profile, use that athlete ID.
   - Else match exact name + DOB when DOB exists.
   - Else match name + sex + sport + position only when exactly one clear match exists.
   - Else create a new athlete or mark for review if the flow supports review.
3. Insert a `reports` row with raw inputs and calculated profile output.
4. Update athlete profile fields from the saved report when appropriate.

### Report Correction

1. Keep the existing `reports.id`.
2. Copy the current report snapshot into `correction_history`.
3. Overwrite the active report fields with corrected raw inputs and calculated output.
4. Update `corrected_at`, `correction_count`, and `updated_at`.

### CSV Import

1. Parse CSV client-side using the current template headers.
2. Validate row data.
3. Run the same athlete identity matching rules used by manual save.
4. Mark ambiguous rows as `Needs Review`.
5. Insert an optional `csv_imports` batch.
6. Save ready rows as athletes/reports.
7. Show one batch success message.

## localStorage Mapping

| Current localStorage shape | Supabase destination |
| --- | --- |
| `coach.id`, `coach.name`, `coach.email`, `coach.organization` | `profiles` |
| `coach.athletes[]` | `athletes` |
| `athlete.reports[]` | `reports` |
| `report.data` | `reports.raw_inputs` |
| `report.profile` and copied report summary fields | `reports.calculated_profile` and reporting columns |
| `report.correctionHistory` | `reports.correction_history` |

## Implementation Phases

1. Create Supabase project, schema, indexes, and RLS policies.
2. Add Supabase client and auth UI states.
3. Create a data-access layer that mirrors the current localStorage operations.
4. Swap workspace load/save/report operations to the data-access layer.
5. Add one-time localStorage migration after coach sign-in.
6. Move CSV save flow to batch-aware Supabase writes.
7. Add correction audit persistence to `reports.correction_history`.
8. Add optional export history/storage only after beta coaches need it.

