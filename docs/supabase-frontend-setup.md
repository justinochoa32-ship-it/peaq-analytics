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

## Current Status

The database schema and frontend environment scaffold are ready. The app still uses the localStorage beta workspace until the next phase wires Supabase Auth and read/write operations into the current coach, athlete, report, CSV, and correction flows.
