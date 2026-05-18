# Supabase Frontend Setup

This app should only use frontend-safe Supabase values in Vite:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Do not put a `service_role`, secret key, or database password in the repo or in frontend environment variables.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Replace `https://your-project-ref.supabase.co` with the Supabase Project URL.
3. Replace `your-anon-or-publishable-public-key` with the anon/publishable public key.
4. Restart the Vite dev server after changing env vars.

`.env.local` is ignored by git through the existing `*.local` rule.

## Deployment Setup

When deploying the app, add these same values as environment variables in the host:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

For `app.peaqanalytics.com`, the hosting provider should inject these at build time.

## Required SQL

Run the migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_client_ids_for_beta_sync.sql`
3. `supabase/migrations/003_archive_athletes.sql`

The second migration adds `client_id` fields so the current app can preserve existing local athlete/report IDs while Supabase keeps UUID primary keys internally.

The third migration adds `archived_at` to keep athlete cleanup reversible during beta.

## Current Status

The database schema and frontend environment scaffold are ready.

When Supabase env vars are present, the app shows sign in/sign up, stores coach workspaces in Supabase, and keeps localStorage as a browser backup/migration source. When Supabase env vars are missing, the app falls back to localStorage-only beta mode.
