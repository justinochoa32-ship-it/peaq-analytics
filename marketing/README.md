# PEAQ Analytics Marketing Site

This folder contains the static public marketing site for `peaqanalytics.com`.

## Deployment

Create a separate Vercel project from this same GitHub repository and set:

- Root directory: `marketing`
- Framework preset: Other
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: none

The `marketing/vercel.json` file also pins the marketing build command and
output directory so Vercel serves `dist` as the deployment root. In that output,
`robots.txt` and `sitemap.xml` live at the top level and should resolve at
`/robots.txt` and `/sitemap.xml`.

If this marketing project is ever deployed with the repository root instead of
`marketing` as the Vercel root directory, use:

- Build command: `npm --prefix marketing run build`
- Output directory: `marketing/dist`

Do not reuse the root `vercel.json` for the public marketing domain; that file
belongs to the authenticated Vite coach app deployment.

Domain mapping:

- `peaqanalytics.com`: public marketing site and canonical domain
- `www.peaqanalytics.com`: redirects to `peaqanalytics.com`
- `app.peaqanalytics.com`: existing coach login app

The marketing site does not use Supabase, app auth, scoring logic, CSV imports,
or report generation code. Those flows remain in the coach app.
