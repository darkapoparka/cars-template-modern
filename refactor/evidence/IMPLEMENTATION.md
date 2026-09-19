# Implementation evidence — 19 September 2026

## Identity and scope

Canonical checkout: `J:/template-repos/cars-template-modern`, branch `main`. Starting source was `1fd198a35bfccc4a6614cf57e6ac58737c38bd27`. The interrupted implementation was recovered without resetting it. The consolidated implementation commit is `edbcffa91c975b859da74186e62aab7ffd6b7075` (195 changed paths, 6,184 additions / 3,148 deletions, including tests, documentation and asset renames). Follow-up qualification changes are recorded in the subsequent Git commit, not represented as changes to an immutable old commit.

No Cars checkout, dealer copy, production database, provider configuration or deployed application was written. Source changes are local commits. No blanket staging/reset/clean or branch replacement was used.

## Fresh execution results

Logs and machine-readable job statuses: `.codex-artifacts/refactor-finish-2026-09-19/` in this checkout. They record exact command arguments, process ids, times and exit codes. Earlier baseline artifacts are retained in `refactor-implementation-2026-09-19`; older retries are in `refactor-resume-2026-09-19`. Do not confuse those earlier results with this run.

| Command / run | Recorded result |
| --- | --- |
| `pnpm check` (source-check) | Exit 0; 1,023 files checked before final documentation/test follow-up. |
| `pnpm typecheck` | Exit 0; 28 tasks, zero cache hits. A final follow-up run covers the additional tests/configuration. |
| `pnpm build --concurrency=2` | Exit 0; 23 tasks, one cache hit. Web, authenticated app, API and Storybook builds completed; prerequisite unit suites passed. |
| Database suite inside build | 188 passed, 8 skipped; skipped cases require live/disposable database fixtures. These are not eight successful integration tests. |
| `pnpm release:preflight:test` | Exit 0; 86 tests passed. This validates contracts, not a production promotion. |
| `pnpm audit --prod --audit-level=high --json` | Exit 0; no reported advisories, 998 dependencies including optional dependencies. This is not proof of zero security defects. |
| `pnpm boundaries` | Exit 0. |
| Dealer workflow/inquiry/scope focused suite | Exit 0; 22 tests passed with isolated/mocked database dependencies. |
| Marketplace/configuration suite | Exit 0; 14 files / 108 tests passed, including two independent fictional public identities. |
| Modern Chromium interaction suite | Exit 0; 63 tests passed. |
| Modern WebKit architecture/completion suite | Final IPv4 production run exit 0; 25 tests passed. |
| Responsive refactor suite | Final IPv4 production run exit 0; 18 tests passed, including unchanged mobile and newly reviewed desktop screenshot baselines. |
| Initial production payload checks | Exit 0; two additional viewport budget tests passed. They are part of the refactor suite after this follow-up. |

Final check logs are named `typecheck-final`, `contracts-final`, `source-final` and `responsive-complete`. The implementation status document records their final outcomes. Full authenticated provider/SQL integration and Cars mounted qualification were not run.

## Rendered coverage

Mobile inventory image baselines at 320, 360, 390 and 430px matched without updating their expected images. The functional suite exercises search/filter draft/apply/back flows, VIN/manual entry, request preparation, financing, service help, keyboard/touch dismissal, focus restoration, validation and accessibility. WebKit was exercised separately, not inferred from Chromium.

Desktop header/hero/search screenshots were captured with images and fonts settled at 1024, 1280, 1440 and 1920px and individually reviewed before adoption. All four then matched through the test runner. They are an implementation regression baseline, **not owner design approval**. The dark header and hero share a width; search is in normal flow inside the hero; taxonomy is not nested inside an extra decorative white panel; vehicle cards share the existing card implementation and show five columns when space permits.

The refactor suite also checks sell/import/lease/blog/contact/legal at mobile and desktop widths, 768px landscape, the 1023px breakpoint boundary, brand variables in portalled filters, focus return, listing details and a real 404. Captures and failure traces are retained under the named `apps/e2e/test-results/` run folders.

## Initial-load measurements and ceilings

Fresh Chromium contexts, DPR 1, local production build, warm server-side image cache, `/cars` and initial network idle. These measurements do not force lazy images to load and are not Lighthouse scores, field Core Web Vitals or a complete historical before/after performance comparison.

| Viewport | Resource transfer | Initial document | Encoded JavaScript | Desktop hero requests |
| --- | ---: | ---: | ---: | ---: |
| 390 × 844 | 948,950 bytes | 39,478 bytes | 576,139 bytes | 0 |
| 1440 × 900 | 922,684 bytes | 39,478 bytes | 574,384 bytes | 2 |

Raw timings: `performance-mobile.json`, `performance-desktop.json` and `performance-summary.json` in the final artifact folder. The initial-load regression gate uses 750,000 encoded script bytes and 1,350,000 transfer bytes including the document, with zero desktop-hero requests on mobile. These are conservative regression ceilings for the current 12-vehicle demo, not a claim that payload work is permanently finished or that these are universal performance targets. The CI test uses 900px height at both widths and records its own JSON metrics; it intentionally allows bounded headroom. Content/dependency changes that need a new ceiling require evidence and review rather than silently raising it.

## Cleanup and entry-point disposition

| Owner / candidate | Disposition and evidence |
| --- | --- |
| Legacy global desktop header stylesheet | Removed; header, toolbar, discovery and card styles have component-owned modules. Architecture tests reject raw hexadecimal palettes, `!important`, `:global` and `nth-child` in those modules. |
| Separate desktop landing vehicle card + stylesheet | Removed; server-owned collections use `VehicleCard` and shared price/fact/media policies. Contract tests assert the retired component is absent. |
| Client import of desktop collection composition | Replaced by a server-created `desktopDiscoverySlot`. A directive deletion alone was not used as an RSC migration. |
| Six served PNG originals | Archived with source attribution/hashes; four dimension-preserving WebP conversions and two explicitly resized sprites. Six old public URLs retain redirects. See the derivative manifest. |
| Raw public artwork footprint for those six files | 9,135,715 bytes became 5,202,028 served bytes: 3,933,687 fewer bytes in that subset. Originals remain in the repo, so this is not a claim that total Git history/clone size fell. |
| Unused snapshot-style export | Removed after a repository-wide identifier search found its declaration as the only reference. No runtime stylesheet was changed. |
| Unbounded dependency/UI overwrite commands | Retired in favor of deliberate review and targeted updates. Node types and selected floating dependency declarations were aligned; the whole stack was not blindly upgraded. |
| Inventory parsing/publication and release environment logic | Extracted into focused owners with existing contracts and characterization tests retained. Large coherent transaction/schema modules were not split merely to lower line counts. |
| Optional provider packages, framework special files, generated clients, compatibility re-exports | Retained. Their package exports, generation, jobs or cross-repo consumers make a simple text-reference count insufficient deletion evidence. |
| Other old artwork / downstream Cars consumers | Retained unless proven unused; no blanket “dead code free” certification. Two fixture configs are not a mounted Cars compatibility proof. |

## Failures investigated rather than hidden

An inherited production process stalled on an AVIF request for contact artwork. The same source encoded quickly with Sharp; restarting only the task-owned preview cleared that request. There was no image replacement or broad cache deletion. A subsequent contact test waited for the full window load event, including the external map. It now waits for DOM readiness and then still requires visible application images/fonts to finish, no overflow and the correct heading.

A WebKit attempt received a real HTTP 500; the server logged a reset while proxying to its `localhost` alias. Final qualification uses the exact bound IPv4 authority, matching the established local/CI run contract. The unchanged interaction assertions passed on the fresh production build. The test now reports the HTTP status immediately instead of waiting 45 seconds for a missing button. The underlying transient process/alias failure is not presented as a proven universal framework defect or a completed production-host reliability investigation.

## Remaining release gates

Owner acceptance of the desktop composition; authorized disposable Postgres/Clerk end-to-end qualification of tenant membership, real transaction conflicts and inquiry delivery; two complete standalone + Cars-mounted dealer copies; and explicit publication/promotion authorization. No live integration success, deployment or owner acceptance is inferred from the source checks.

Rollback is a scoped revert of the implementation/follow-up commit(s) after reviewing later work, not a reset/clean. No schema migration was introduced, so this change does not carry an unrecorded database rollback step.
