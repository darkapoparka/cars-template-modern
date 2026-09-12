# Modern mobile — final repair and verification pass

Repository: `J:/template-repos/cars-template-modern`.
Local branch: `astra`. Preview: `http://127.0.0.1:3001`.
The existing Next.js/React implementation and dirty working tree were preserved. No desktop redesign, framework migration, production submission, database mutation, commit or push was performed.

## New implementation in this pass

### Keep unfinished Sell drafts
Reproduced year `202` and mileage `10000001` disappearing after dismissal. The drawer incorrectly used the validating URL parser to save in-progress input. Added `readSellVehicleDraft` beside the existing contract and use it for drawer dismissal. The URL parser and serializer still enforce the original numeric bounds. Partial VIN, notes, and numeric values remain editable; invalid values still cannot pass native form validation.

### Make touch and first-tap behavior reliable
Reproduced an immediate WebKit Sell tap doing nothing before hydration and focus failing to return after dismissal. Sell records the actual event trigger instead of assuming `document.activeElement` identifies a tapped button. VIN, manual entry, and help controls wait until handlers are attached. Help-to-details handoff returns focus to the original help button, including landscape.

### Keep article controls in sync with readiness
The article search already waited for hydration; its filter, topic, clear and reset controls now follow the same readiness state. This avoids exposing active-looking controls whose handlers are not yet attached. No new layout abstraction or CSS override was added.

### Add regression coverage and repair a test race
Added six mobile scenarios, each exercised in Chromium and WebKit, plus a unit assertion separating editable drafts from validated URLs. The public SEO test pressed Back while article navigation was still pending. Browser inspection confirmed the URL had not yet changed after click. Added explicit article-arrival assertions before language/back checks in both configured-language branches; existing return and redirect assertions remain intact.

## Earlier saved implementation retained
Previous interrupted sessions had already saved the VIN/manual handoff and edit fixes, custom make serialization, URL-aware reset, contained listing map, bounded content drawer, contrast/step fixes, record-driven content summaries, shared mobile recovery navigation, CSS consolidation, and dependency/package repairs. These were inspected and regression-tested rather than replaced or presented as new work in this pass.

## Change scope
Seven production files and three test files changed. `changed-files.json` lists them; `change-summary.json` records line counts. `baseline/` contains original file snapshots with a `.before` suffix, and `session-changes.patch` records only this pass. Existing unrelated desktop/application changes remain untouched.

## Fresh completed verification

| Check | Result | Evidence |
| --- | --- | --- |
| Complete modern mobile suite | 82 passed, no failures or skips; Chromium and WebKit; no retries | `mobile-complete.log` |
| Public route and SEO suite | 50 passed, including mobile and desktop smoke | `public-demo-final.log` |
| Relevant public unit suites | 348 passed across six packages | `unit.log` |
| Release/preflight test contracts | 83 passed, no failures or skips | `contracts.log` |
| Repository typecheck | 28 successful tasks, 26 cached | `typecheck.log` |
| E2E typecheck after final test edit | Passed | `e2e-typecheck-final.log` |
| Repository lint/format | Passed; 952 files checked; no broad autoformat | `lint-final.log` |
| Package boundaries | Passed | `boundaries.log` |
| Production dependency audit | Zero reported advisories at every severity | `dependency-audit.json` |

The 348 unit tests comprise web 147, marketplace 92, marketplace UI 73, marketplace domain 15, internationalization 14, and SEO 7. Focused and repeated runs are not added to these totals. The full mobile suite includes the newly added 12 cross-engine cases. The initial public suite's two failures and their navigation-race diagnosis remain visible in `public-demo.log`; the final run replaces them as the current result, not as erased history.

Installed packages were checked directly: Next.js `16.3.3`, sharp `0.35.4`. These versions were already present when this pass began. Zero package advisories is a dependency-audit result, not an application security certification.

## Visual and interaction evidence
Reviewed fresh mobile screenshots of inventory at 320px, Sell, guides, imports, leasing, VIN-only summary, listing details, and the loaded contained map at 390px. `visual-checks.json` records captured route status and document widths; `screenshots/` holds the images. The mobile suite additionally verifies listing geometry at 320/360/390/430px and 844x390 landscape, forms, drawers, focus return, search/history, and automated accessibility assertions.

## Acceptance boundaries
No physical iPhone or Android device was connected for keyboard, safe-area, or screen-reader sign-off. No real lead was submitted, no provider delivery was claimed, and no production database integration was run. No Lighthouse/Core Web Vitals certification is implied. Desktop changes remain deferred; desktop tests here are regression smoke checks only.

## Production and final preview check
The isolated public production gate completed successfully: Next.js compiled, TypeScript passed, all 50 static pages generated, and both database-unavailable browser checks passed (mobile and desktop). Evidence: `production-unavailable.log` and `final-gate-results.json`. This used a separate loopback port with database/provider credentials disabled; it did not replace the user's dev server. The runner removed its isolated build directory afterward.

The final preview request to `/cars` returned HTTP 200. Port 3001 is still bound to `127.0.0.1` under the original PID 42588, on local branch `astra`. Approximately 3.03 GB remained free on J:. No files were staged or pushed.

Current completed results: 82 mobile browser cases, 50 public-route/SEO cases, 2 production-mode outage cases, 348 relevant unit tests, 83 release/preflight contract tests, repository typecheck/lint/boundaries, and zero reported production dependency advisories. These are separate suites; focused reruns are not counted again. Physical-device and real-delivery acceptance remain explicitly outstanding.
