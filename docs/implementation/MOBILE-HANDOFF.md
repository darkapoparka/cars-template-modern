# Mobile continuation baseline

Repository: `J:/template-repos/cars-template-modern`; local branch: `astra`.
Preview: `http://127.0.0.1:3001`. Use the remote Windows machine, not another container's localhost.

## Version-control workflow
The owner requested a committed checkpoint of the accumulated template and mobile work.
The checkpoint preserves the existing application, desktop, mobile, test, dependency and configuration changes together.
Historical reports saying that no commit was made describe those earlier sessions, not a restriction on future work.
Commit completed, verified changes in focused commits; do not carry completed work uncommitted across sessions.
Preserve any later user edits. Never reset, clean or replace the local branch with remote main.
A local commit is not a push or deployment; neither was requested for this checkpoint.

## Implementation evidence
Read `2026-09-12-mobile-continuation/IMPLEMENTATION-REPORT.md` first for focused work after checkpoint `7bad6bb`.
The prior full baseline is recorded in `2026-09-12-mobile-final-verification/IMPLEMENTATION-REPORT.md`.
The prior completed baseline reports 82 mobile browser cases, 50 public/SEO cases, 2 production outage cases,
348 relevant unit tests and 83 release contracts, with passing typecheck/lint/boundaries.
Those numbers belong to the implementation pass, not this version-control checkpoint.
Dated Markdown reports are versioned. Raw logs, browser traces, screenshots, patches and source snapshots
remain on the original machine in their existing locations and are intentionally ignored, not deleted.
Application image assets and reusable browser regression specs remain tracked.

## Remaining scope
Continue mobile first; no new desktop redesign. Physical-device keyboard/safe-area/screen-reader checks,
real lead delivery, authorized database integration and production performance measurement remain separate acceptance items.
