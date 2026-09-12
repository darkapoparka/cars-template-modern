# Focused mobile continuation after 7bad6bb

Repository: `J:/template-repos/cars-template-modern`; local branch: `astra`.
Started at checkpoint `7bad6bb` with no staged or unstaged owner changes.
No branch reset, history rewrite, push, deployment, desktop redesign or provider submission.

## Unit 1: shared service help

The shared help button now remains disabled until its click handler is attached. This covers Import, Leasing and Sell without changing their visual composition or parent-level disabled rules.
The Import information drawer now exposes a named, keyboard-focusable scrolling region with a visible focus outline, matching the existing Leasing panel pattern.
Added four reusable browser scenarios (eight engine cases) covering server-rendered readiness, touch dismissal/reopening, Escape focus return, and Tab/End scrolling to the last answer in landscape.

### Verification

- `pnpm --filter e2e e2e:mobile modern-mobile-service-help.spec.ts`: 8 passed, no retries or skips (`help-after.log`).
- `pnpm --filter web typecheck` and `pnpm --filter e2e typecheck`: passed.
- `pnpm check` and `pnpm boundaries`: passed (`help-checks.json` and corresponding logs).
- Visually reviewed the Import help drawer at 844x390; screenshot `import-help-landscape.png`.
- Used the existing Node 22.22.0 installation through process-local PATH; did not change the machine's global runtime or restart the preview.

`help-before.log` retains the initial run. Import's enabled server-rendered button and absent focusable panel were reproduced in both engines. The initial Leasing tests also exposed test assumptions: role locators could not see hidden streamed markup without JavaScript, and touch need not focus Close. The final tests inspect the server-rendered control directly and explicitly start the Tab sequence at Close; those test assumptions are not counted as product defects.

Physical-device keyboard/safe-area/screen-reader acceptance, real lead delivery, authorized database integration and production performance remain unverified. Historical baseline suite totals in the previous report are not new results from this continuation.

## Unit 2: Import listing-link focus

Clearing the listing URL now synchronously returns focus to the existing input with `preventScroll`. It reuses the existing input ref; no new abstraction, dependency, stylesheet or layout was introduced.
Added 320px and 844x390 scenarios checking immediate keyboard typing after clear, empty-submit disabling, retained replacement text after reopening, focus return on dismissal and native invalid-URL blocking. No valid request is submitted.
`focus-before.log`: 2 Chromium failures reproduced the lost input focus; both WebKit cases already passed. `focus-after.log`: all 4 cross-engine cases passed, with no retries or skips.
Added the same report-versus-raw-evidence ignore rules used by the earlier dated runs. Reports and reusable regression specs remain versioned; screenshots, logs, JSON summaries and browser traces stay on this machine.
Visually reviewed the cleared Import link input at 320px (`import-cleared-320.png`). This desktop browser capture is not a physical-device keyboard check.

## Repository verification after both repairs

- `pnpm typecheck`: all 28 tasks successful, none cached (`final-typecheck.log`).
- `pnpm check`: passed (`final-check.log`).
- `pnpm boundaries`: passed (`final-boundaries.log`).
- `pnpm --filter web --filter @repo/marketplace-ui test`: 220 passed, comprising web 147 and marketplace UI 73 (`final-unit.log`).
- Command exit statuses are retained in `final-checks.json`.

The completed focused browser runs total 12 engine cases: 8 for service help and 4 for link focus. Repeated runs are not additional unique coverage.

## Final cross-engine regression and handoff

`pnpm --filter e2e e2e:mobile --output=../../docs/implementation/2026-09-12-mobile-continuation/mobile-complete` completed successfully: **94 passed**, comprising 47 Chromium and 47 WebKit cases, with no failures, retries or skips. Evidence: `mobile-complete.log`, `mobile-complete-status.json` and the `mobile-complete/` browser output directory. This total includes the 12 new engine cases; focused reruns are not added again.
The suite exercises listing geometry at 320/360/390/430px and 844x390 landscape, Sell draft/edit/reset/validation, import and leasing drawers, filters and URL state, article navigation, menu/gallery focus and automated accessibility checks. It blocks non-read HTTP methods rather than submitting real enquiries.

Completed local implementation commits:
- `894e775` — shared help readiness and Import keyboard scrolling.
- `78469e6` — Import listing-link focus, regression tests and local-evidence ignore rules.

The final preview request to `/cars` returned HTTP 200. The original preview remains bound to `127.0.0.1:3001`, PID 42588; it was not replaced or restarted. Branch `astra` retains checkpoint `7bad6bb` as an ancestor.
Only two production source files changed. No desktop redesign, dependency upgrade, live provider submission, database migration, push or deployment was performed.
The separate historical public/SEO and production-outage suites, release contracts and production dependency audit were not rerun in this continuation. No new production build, performance certification or physical-device acceptance is claimed.

## Unit 3: one presentation for Sell, Import and Leasing help

The separate help drawer implementations have been replaced by `MobileServiceHelpDrawer`. All three now share the centered heading, visible description, circular close action, rounded surface, height/width limits, numbered step cards, typography, padding and keyboard-focusable scroll body. The presentation follows the existing Sell pattern rather than introducing a new page design.
Import and Leasing use the same FAQ rendering below the steps. Their original answers remain intact. Import's three step summaries are derived from its existing request/FAQ copy. Sell retains its vehicle-details action and the existing close-then-open handoff callbacks. All three use the same localized close label and focus behavior.
No dependency, shared desktop stylesheet, provider, or database configuration changed.

The browser regression now compares actual computed styles across all three help drawers at 320, 390, 430 and 844x390. It checks bounded geometry, step structure, descriptions, focus return, opening readiness and landscape keyboard scrolling; at 390px it also scans each open drawer for serious/critical automated accessibility violations. Sell's existing details handoff is included.
Visually reviewed all three at 390px, Sell at 320px, and Import in landscape. Screenshots are retained under `help-unified-results/`; initial captures are `help-before-*.png`.
Web and E2E typechecks, repository lint/format and package boundaries passed (`help-unified-*-typecheck.log`, `help-unified-check.log`, `help-unified-boundaries.log`).

Final targeted browser result: **22 passed** (11 Chromium, 11 WebKit), no failures, retries or skips; `help-unified-browser.log`. The four presentation cases in each engine visit all three services. Command from `apps/e2e`: `node node_modules/@playwright/test/cli.js test --config=playwright.modern.config.ts --grep="service.help|help.waits|help.supports|landscape.Sell.help" --output=../../docs/implementation/2026-09-12-mobile-continuation/help-unified-results`.
These are focused results for the shared help presentation, not a rerun of the earlier full 94-case suite. Physical-device and real-delivery acceptance remain separate.
