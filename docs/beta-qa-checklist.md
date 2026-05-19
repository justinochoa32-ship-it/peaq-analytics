# PEAQ Analytics Beta QA Checklist

Run this checklist before merging beta-facing changes or inviting coaches to test a new build.

## Setup

- Open the latest `main` branch in StackBlitz or the local dev server.
- Confirm Vercel has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set for Production and Preview.
- Confirm Supabase migrations `001` through `005` have been run in order.
- Start with a fresh browser profile or clear localStorage when testing first-run behavior.
- Also test once with existing localStorage data to confirm migrations/persistence still work.

## Supabase Cloud Accounts

- Sign up with a new coach account.
- Confirm the account by email if email confirmation is enabled.
- Sign in and confirm the workspace loads without a cloud error.
- Refresh and confirm the coach stays signed in or can sign back in cleanly.
- Edit Account Profile fields and confirm they persist after refresh.
- Use Reset Password and confirm the email link returns to the app domain and allows a new password.
- Log out and confirm the sign-in screen appears.
- Check Supabase Table Editor and confirm rows appear for the signed-in coach in `profiles`, `athletes`, and `reports` after saving data.
- Confirm Coach A cannot see Coach B data by signing in with a second test coach account.

## Coach Workspace

- Create a new PEAQ workspace.
- Refresh the page and confirm the workspace persists.
- Confirm the header buttons stay in order: Run New Report, Import CSV, Scoring Guide, Log Out.
- Confirm the workspace summary cards show athlete/report counts correctly.
- Click Export Workspace Data and confirm a `.json` file downloads.
- Open the exported JSON and confirm it includes coach, athletes, reports, and correction history when present.
- Log out and confirm the create workspace flow still appears.

## Manual Report Save

- Run a new PEAQ Profile.
- Enter athlete identity fields, including DOB.
- Enter testing data and confirm calculated fields display.
- Save the report.
- Confirm the athlete appears in the Athlete Library.
- Refresh and confirm the athlete/report persists.
- Open the saved report and confirm the dashboard still matches the saved data.

## Athlete Identity

- Save John Smith with DOB `2011-01-01`.
- Save a second John Smith report with the same DOB and a different test date.
- Confirm there is one John Smith profile with two reports.
- Save Jane Smith with DOB `2008-02-20`.
- Save Jane Smith with DOB `2010-07-12`.
- Confirm they are two separate profiles.
- Save a same-name athlete with missing DOB and confirm it does not silently merge when ambiguous.

## Correction Audit

- Open a saved report.
- Click Correct Report.
- Change bodyweight, DOB, or one testing metric.
- Save the correction.
- Reopen the saved report.
- Confirm Correction Audit Trail appears.
- Confirm before/after values are correct.
- Confirm the active report uses the corrected values.

## Duplicate Identity Correction

- Create John Smith with DOB `2011-01-01`.
- Create another John Smith with missing or incorrect DOB.
- Open the second John Smith report and click Correct Report.
- Change the DOB to `2011-01-01`.
- Save the correction.
- Confirm the app asks whether to move the corrected report to the existing John Smith profile.
- Choose OK and confirm the matching John Smith profile now has both reports.
- Repeat and choose Cancel to confirm the profiles remain separate.

## Athlete Library

- Search by athlete name.
- Sort by Name A-Z and Name Z-A.
- Sort by rating high to low and low to high.
- Sort by most recent and least recent testing date.
- Filter by sex, sport, archetype, limiter, and star rating.
- Confirm Showing X of Y athletes updates.
- Click Clear Filters and confirm the full list returns.
- Confirm same-name athletes show DOB or secondary identity text.
- Archive one athlete and confirm the profile is hidden from the active list.
- Turn on Show archived and restore the athlete.
- Select multiple athletes and confirm bulk archive/restore works.

## Athlete And Coach Metadata

- Open Account Profile.
- Edit display name, organization, role/title, phone, website, location, and notes.
- Refresh and confirm the coach profile edits persist.
- Open an athlete profile.
- Click Edit Details.
- Edit display name, DOB, sport, team/school, position, graduation year, contact fields, and notes.
- Refresh and confirm the athlete profile edits persist.
- Confirm saved reports still display their original report data correctly after metadata edits.

## CSV Import

- Download the CSV template.
- Confirm the template headers are unchanged and DOB is included.
- Import multiple complete rows.
- Click Save Ready Rows.
- Confirm only one success message appears for the batch.
- Import same-name athletes with different DOBs and confirm separate profiles.
- Import a row matching an existing athlete by name + DOB and confirm it attaches to the existing profile.
- Import ambiguous same-name rows with missing DOB and confirm they show Needs Review.
- Fix a Needs Review row from the inline row editor and confirm it re-checks automatically.
- Confirm the inline row editor stays open while typing multi-character values, then closes with Done.
- Save the fixed row once it changes to Ready.

## Reports And PDFs

- Open a saved report and click Print Report / PDF.
- Confirm the one-page PEAQ Profile remains landscape, complete, and not cut off.
- Save Story Profile and confirm the PNG uses the PEAQ logo and the vertical story layout.
- Save two reports for the same athlete.
- Open the athlete profile and compare Report A to Report B.
- Confirm Report A -> Report B direction is clear.
- Confirm sprint and 505 decreases show as improvements.
- Confirm other metric increases show as improvements.
- Click Print Progress Report and confirm the separate progress report opens.
- Save Progress Story and confirm the PNG uses the PEAQ logo and the vertical progress layout.

## Scoring Guide

- Open Scoring Guide.
- Confirm male/female standards still display.
- Confirm score tiers, scoring structure, and archetype definitions display.
- Confirm no scoring standard values changed unexpectedly.

## Final Release Checks

- Run `git diff --check`.
- Confirm GitHub Actions build passes.
- Confirm no scoring model, scoring standards, archetype logic, or CSV template columns changed unless the task explicitly required it.
- Merge only after the app passes the relevant checklist sections.
