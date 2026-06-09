# Supabase Frontend Setup

This app should only use frontend-safe Supabase values in Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`

Do not put a `service_role`, secret key, or database password in the repo or in frontend environment variables.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Replace `https://your-project-ref.supabase.co` with the Supabase Project URL.
3. Replace `your-anon-public-key` with the anon public key, or set `VITE_SUPABASE_PUBLISHABLE_KEY` to the publishable public key instead.
4. Restart the Vite dev server after changing env vars.

`.env.local` is ignored by git through the existing `*.local` rule.

## Deployment Setup

When deploying the app, add these same values as environment variables in the host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY`

For `app.peaqanalytics.com`, the hosting provider should inject these at build time.

## Required SQL

Run the migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_client_ids_for_beta_sync.sql`
3. `supabase/migrations/003_archive_athletes.sql`
4. `supabase/migrations/004_active_athlete_identity_index.sql`
5. `supabase/migrations/005_profile_management_fields.sql`
6. `supabase/migrations/006_saved_program_history.sql`
7. `supabase/migrations/007_fix_assigned_programs_upsert_index.sql`
8. `supabase/migrations/008_program_templates.sql`

The second migration adds `client_id` fields so the current app can preserve existing local athlete/report IDs while Supabase keeps UUID primary keys internally.

The third migration adds `archived_at` to keep athlete cleanup reversible during beta.

The fourth migration keeps same-name + same-DOB protection scoped to active athletes, so archived profiles do not block future roster cleanup.

The fifth migration adds optional coach and athlete metadata fields used by the Account Profile and athlete Edit Details flows.

The sixth and seventh migrations add and prepare assigned program history for Profile and Build handoff persistence.

The eighth migration adds the coach-owned reusable program templates layer for PEAQ Build.

## Current Status

The database schema and frontend environment scaffold are ready for live beta accounts.

When Supabase env vars are present, the app shows sign in/sign up, stores coach workspaces in Supabase, and keeps localStorage as a browser backup/migration source. When Supabase env vars are missing, the app falls back to localStorage-only beta mode.
