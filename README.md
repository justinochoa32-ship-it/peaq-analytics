# PEAQ Analytics

PEAQ Analytics is a React/Vite athlete profiling app for basketball and performance coaches. The beta app supports coach workspaces, manual PEAQ Profiles, CSV imports, athlete libraries, saved report history, comparison reports, and one-page PDF reports.

## Supabase Setup

The initial Supabase schema lives in `supabase/migrations/001_initial_schema.sql`.

Frontend Supabase configuration uses Vite environment variables:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-public-key
```

For local development, copy `.env.example` to `.env.local` and fill in the public values from Supabase. Do not commit `.env.local`, secret keys, `service_role` keys, or database passwords.

More details are in `docs/supabase-frontend-setup.md`.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

The app is prepared for Vercel deployment with `vercel.json`.

Recommended beta URL structure:

- `app.peaqanalytics.com` for the coach app
- `peaqanalytics.com` for the future marketing/landing site

Deployment details and demo QA steps are in `docs/vercel-deployment.md`.
