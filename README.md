# PEAQ Analytics

PEAQ Analytics is a React/Vite athlete profiling app for basketball and performance coaches. The beta app supports coach workspaces, manual PEAQ Profiles, CSV imports, athlete libraries, saved report history, comparison reports, and one-page PDF reports.

## Supabase Setup

The Supabase schema migrations live in `supabase/migrations/`. Run them in order before using cloud accounts.

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

### Local Program Builder Handoff

Run the two local Vite apps on explicit ports so the Profile -> Program Builder handoff is stable:

```bash
cd "/Users/justinochoa/Documents/peaq-programming"
npm run dev -- --host 127.0.0.1 --port 5174
```

```bash
cd "/Users/justinochoa/Documents/New project/peaq-analytics-review"
VITE_PROGRAM_BUILDER_URL=http://localhost:5174/ npm run dev -- --host 127.0.0.1 --port 5175
```

Then open PEAQ Profiling at `http://127.0.0.1:5175/`. The `Build Program from Profile` report action opens Program Builder at `http://localhost:5174/` with the profile assignment prefilled.

For production, set the Profile app environment variable to the Build domain:

```bash
VITE_PROGRAM_BUILDER_URL=https://build.peaqanalytics.com
```

Current placeholder access flags default open until real billing/auth entitlements are connected:

```bash
VITE_PEAQ_ACCESS_PROFILE=true
VITE_PEAQ_ACCESS_BUILD=true
VITE_PEAQ_ACCESS_PROFILE_TO_PROGRAM=true
```

### Production Profile + Build Deployment

The intended split-domain setup is:

- `app.peaqanalytics.com` = PEAQ Profile app
- `build.peaqanalytics.com` = PEAQ Program Builder app

Deploy in this order:

1. Deploy the Program Builder app first.
2. Confirm the temporary Program Builder deployment URL works.
3. Add `build.peaqanalytics.com` to the Program Builder hosting project.
4. Add the DNS record requested by the host.
5. Set `VITE_PROGRAM_BUILDER_URL=https://build.peaqanalytics.com` in the Profile app production environment.
6. Redeploy the Profile app.
7. Test `app.peaqanalytics.com` -> `Build Program from Profile` -> `build.peaqanalytics.com`.

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
