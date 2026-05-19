# Vercel Deployment

Use Vercel for the coach demo/beta app so desktop and mobile testing use a real hosted URL instead of StackBlitz.

## Recommended Project Settings

- Framework Preset: Vite
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`
- Production Branch: `main`

These settings are also captured in `vercel.json` so Vercel has a stable project-level default.

## First Deploy

1. Go to Vercel and create a new project.
2. Import the GitHub repo: `justinochoa32-ship-it/peaq-analytics`.
3. Keep the Vite defaults or match the settings above.
4. Deploy.
5. Open the generated `vercel.app` URL on desktop and mobile.

## Environment Variables

The live beta app uses Supabase when frontend-safe env vars are present. Without these values, the app falls back to localStorage-only mode.

Add only frontend-safe values in Vercel Project Settings -> Environment Variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Never add a Supabase secret key, service role key, database password, or anything named secret to frontend env vars.

## Custom Domain Plan

For beta, point the app subdomain at Vercel:

- App domain: `app.peaqanalytics.com`
- Marketing site later: `peaqanalytics.com`

In Vercel:

1. Open the PEAQ Analytics project.
2. Go to Settings -> Domains.
3. Add `app.peaqanalytics.com`.
4. Follow Vercel's DNS instructions for the required CNAME record at your domain registrar.
5. Wait for Vercel to verify the domain and issue SSL.

Keep the apex domain `peaqanalytics.com` available for the future landing page.

## Demo QA After Deploy

Run this on the hosted URL:

1. Sign up for a coach account.
2. Confirm the email if Supabase email confirmation is enabled.
3. Sign in and confirm the cloud workspace loads.
4. Edit the Account Profile and confirm it persists after refresh.
5. Create or import a test athlete.
6. Open the athlete profile and edit athlete details.
7. Refresh and confirm the profile edits persist.
8. Download the CSV template.
9. Import two or more demo athletes.
10. Save ready rows.
11. Open the Athlete Library.
12. Open an athlete profile.
13. Print or save a PEAQ Profile PDF.
14. Open the same URL on an iPhone/Android browser and repeat the dashboard, import, athlete profile, and report views.

Also run one localStorage fallback pass with Supabase env vars removed:

1. Create a local workspace.
2. Download the CSV template.
3. Import two or more demo athletes.
4. Save ready rows.
5. Open the Athlete Library.
6. Open an athlete profile.
7. Print or save a PEAQ Profile PDF.
8. Refresh and confirm the local workspace persists.

## Known Current Limit

localStorage remains a fallback and migration source. Data created while signed out or while Supabase env vars are missing lives only in that browser until the coach signs in and the app migrates it to Supabase.
