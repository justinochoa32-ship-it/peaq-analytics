# PEAQ Analytics Project Instructions

This is an athlete performance profiling app for basketball/performance coaches.

## Product direction
The app should support:
- Coach account / private workspace
- Manual athlete report builder
- Athlete profile dashboard
- One-page PDF report
- Athlete library
- Saved report history
- CSV import from the app's template
- Eventually: report comparison, athlete trends, provider-specific imports, and real database-backed accounts

## Important constraints
- Do not rewrite the entire app unless explicitly asked.
- Prefer small, high-confidence changes.
- Preserve the current visual style: slate background, rounded cards, dark hero sections, clean coach-facing dashboard tone.
- Preserve the current scoring model unless explicitly asked.
- Do not remove the CSV import, coach workspace, athlete library, report builder, scoring guide, or PDF report flows.
- When changing logic, explain what changed and why.
- Keep the app usable in StackBlitz/Vite/React/TypeScript.

## Current build priorities
1. Stabilize save report and athlete library behavior.
2. Stabilize the one-page PDF report behavior.
3. Add localStorage persistence for coach accounts, athletes, and reports.
4. Improve CSV import validation.
5. Refactor into organized components only after the current flow works.
