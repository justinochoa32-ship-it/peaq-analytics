# PEAQ Analytics Marketing Site

This folder contains the static public marketing site for `peaqanalytics.com`.

## Deployment

Create a separate Vercel project from this same GitHub repository and set:

- Root directory: `marketing`
- Framework preset: Other
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

Domain mapping:

- `peaqanalytics.com`: public marketing site
- `www.peaqanalytics.com`: redirect to `peaqanalytics.com`
- `app.peaqanalytics.com`: existing coach login app

The marketing site does not use Supabase, app auth, scoring logic, CSV imports,
or report generation code. Those flows remain in the coach app.
