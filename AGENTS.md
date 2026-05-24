# PEAQ Analytics Codex Rules

PEAQ Analytics is a coach-facing athlete performance profiling app for basketball and performance coaches. Work should stay small, practical, and easy to review.

## Guardrails

- Do not rewrite the app unless explicitly asked.
- Prefer narrow, high-confidence changes that preserve the current workflow.
- Preserve the existing visual tone: slate background, rounded cards, dark hero/dashboard sections, and clean coach-facing UI.
- Keep the app usable in StackBlitz, Vite, React, and TypeScript.
- Do not touch auth, Supabase, scoring logic, CSV import, athlete dashboard, PDF export, or report layouts unless the task explicitly asks for it.
- Do not remove the coach workspace, athlete library, report builder, scoring guide, CSV import, saved reports, or PDF report flows.
- When changing logic, explain what changed and why.

## Current Working Rules

- Follow the user's current task only.
- Do not assume old priorities are active unless the user mentions them.
- For marketing-site tasks, stay inside the marketing/homepage files unless explicitly told otherwise.
- For app-product tasks, keep changes narrow and preserve the existing athlete/report/scoring flows.
- If a task could touch protected areas, stop and ask for confirmation before editing.
