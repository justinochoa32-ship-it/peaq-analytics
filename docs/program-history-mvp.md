# PEAQ Assigned Program History MVP

## Current Scope

This MVP tracks Assigned Program History only:

- PEAQ Profile remains the athlete/profile source of truth.
- PEAQ Build creates, edits, prints, exports, and saves the current assigned program.
- Saved Draft and Assigned programs can be shown from the athlete profile side.
- Reopened programs remain coach-editable in PEAQ Build.

No TV View, AMS storage, billing, athlete history analytics, completed-work logging, upload extraction, or handwriting/OCR flow is active in this pass.

## Current Persistence Path

PEAQ Profile stores the athlete-side history. The saved program shape is defined in `src/savedPrograms.ts`.

Cloud persistence uses the `assigned_programs` table from:

```text
supabase/migrations/006_saved_program_history.sql
```

If that table is not deployed yet, the Profile app catches the missing-table response and continues with local workspace storage so existing profile/report behavior is not blocked.

PEAQ Build has a local fallback store for direct saves. When Build is opened from a Profile report, it sends saved programs back to the opener window with a validated `postMessage` payload. This bridges the current split-domain setup without adding a second backend.

## Reopen/Duplicate Behavior

For this local-first MVP, Profile opens saved programs in PEAQ Build by passing a serialized saved-program payload in the URL. This is a temporary handoff until PEAQ Build has authenticated access to a shared API.

Preferred future behavior:

```text
https://build.peaqanalytics.com?savedProgramId=...
```

Then PEAQ Build should load the saved program by ID from the shared backend.

## Future Completed Work Path

The future model should separate planned work from performed work:

1. Assigned Program: the coach-created plan.
2. Completed Work: the athlete's actual loads, reps, notes, and completion data.
3. Completed Program Artifacts: optional uploaded paper sheets, photos, or PDFs attached to an assigned program/week/day.

Important future rules:

- Uploaded completed sheets should be attachments first.
- Handwriting/OCR extraction should never silently write official completion data.
- Any extracted loads should be reviewed and confirmed by the coach before storage.
- Digital completion fields should become the reliable source of truth once built.
