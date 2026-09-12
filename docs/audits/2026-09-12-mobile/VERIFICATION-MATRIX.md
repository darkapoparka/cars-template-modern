# Verification matrix and evidence limits

Audit date: 12 September 2026. Repository: local `astra` working tree. These results describe what was actually executed, not all conceivable production behavior.

## Completed and interrupted gates
| Check | Result | Evidence / interpretation |
| --- | --- | --- |
| Required Node runtime | Pass after selecting Node 22.22.0 | Machine default Node 24 was outside repository engines; no global runtime change. |
| Public dev server | Started, loopback port 3001 | Recheck health after any dependency change; start command in README. |
| `pnpm check` | Fail: 255 diagnostics / 944 files | `lint.log`; includes formatting/import diagnostics, not 255 functional bugs. |
| `pnpm boundaries` | Fail | `boundaries.log`; AI test package lacks declared Vitest dependency. |
| `pnpm typecheck` | Pass on corrected invocation | `typecheck-distinct-origins.log`. Initial `typecheck.log` used the same origin for all apps and failed an environment contract; not a TS product regression. |
| `pnpm --filter web build` | Pass | `build-web.log`; public demo production build, not every service deployment. |
| Public unit suites | Pass: 312 tests / 60 files | `unit-public.log`: domain 15, marketplace 92, UI 73, web 132. |
| Release/preflight contracts | 78 pass / 5 fail | `contracts.log`; CI guards, package export, provider-free typegen contract. |
| Production dependency audit | Fail: 2 critical / 25 high / 21 moderate / 2 low | `dependency-audit.log`; applicability needs triage, critical Next baseline needs patching. |
| Existing public mobile E2E gate | Incomplete / nonzero exit | `e2e-mobile-gate.log`; 33 selected, reached case 27, then isolated Turbopack cache exhausted disk. Failures also preceded the capacity error. Unavailable mode was not reached. |
| Ad hoc Chromium route crawl | 87 captured scenarios / 49 requested URLs | `browser/results.json`; not a replacement for the complete assertion-based E2E gate. |
| Baseline Axe | 40 scenarios analyzed, 9 scenario records with contrast violations | Sell, hub entry URLs, six articles. Alias duplicates are not distinct template defects. |
| WebKit smoke | Six routes HTTP 200; no captured page errors | `final-checks/results.json`; listing still has 406px scroll width in a 390px viewport. Not physical Safari. |

## Command environment
Typecheck and public build used Node 22 with `SKIP_ENV_VALIDATION=true`, demo public mode, web origin `http://localhost:3001`, API origin `http://localhost:3002`, and app origin `http://localhost:3000`. These distinct origins satisfy the repository's broader contract. The running static-demo server uses the single-host configuration documented in README.

The existing public E2E runner creates an isolated provider-disabled server/cache. Its disk cleanup ran on exit and recovered roughly 2.8GB. No user source or unrelated cache was removed. Do not count a disk-full run as a complete gate, and do not ignore the genuine and stale-contract failures that occurred before the panic.

## Interaction evidence
Twenty-nine exploratory interaction captures are in `interactions/`; ten settled confirmation cases are in `confirmed/`; four final targeted Chromium checks plus six WebKit route checks are in `final-checks/`. They cover filters, menu, search/reset, listing gallery/tabs, service entry drawers, constrained layouts, and the Sell handoff/edit defect. Successful external form delivery was deliberately not attempted.

## Harness corrections — do not turn these into product bugs
The baseline record's `width` property contains measured `window.innerWidth`, overwriting the originally requested viewport. On the overflowing listing page it reads 406, not the requested 390. The matrix below derives the requested dimensions from each capture name and compares the document width to that request. The settled geometry probe also records `documentElement.clientWidth` directly.

The initial search URL probe used `query`; the application actually uses `q`. A later real search confirmed zero results and reset behavior. The make-filter confirmation expected lowercase `make=bmw`; the application correctly produced `make=BMW&model=X5`, and refresh returned two matching vehicles. That harness assertion is not a product defect.

An initial Sell probe attempted to fill a hidden input; it was replaced with visible-dialog inspection. Early overlay screenshots capture opening/closing animation frames, so apparent transparency and transient dialog counts are not permanent UI bugs. A first price-filter capture did not wait for navigation; the final check waited for `priceMax=60000` and confirmed the correct empty result. The final landscape last-option failure persisted through normal actionability waits and is a reproduced layout defect.

A guessed `/cars/bmw/x5` model URL returned 404; canonical model-route taxonomy needs explicit verification before classifying that guessed slug as broken. The working make/model query path is independently confirmed. Disabled static-demo contact/platform routes can intentionally return not-found; their inconsistent visual chrome is a separate finding.

## Not certified by this audit
Actual software-keyboard/safe-area behavior on iOS and Android hardware; screen-reader and enlarged-text journeys; every possible category/filter/data combination; full authenticated app/API/database runtime behavior; real lead/email delivery; production deployment security; production performance metrics. The unavailable-mode E2E gate was interrupted before it could run. These remain acceptance requirements, not silent passes.

## Browser capture matrix
`overflow` below means document scroll width exceeds the requested viewport; an internally scrolling carousel is not itself a defect. `Axe IDs` is empty for clean analyses and also for scenarios where Axe was not run: only the initial 40 baseline scenarios received those analyses. A 200 response does not guarantee the UI is a successful content route; inspect invalid-route screenshots and production robots behavior separately.

| Requested route | Viewport | HTTP | Document width | Overflow | Axe IDs | Screenshot |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | 390x844 | 200 | 390 | no | - | [top](browser/_-390x844-top.png) |
| `/bg` | 390x844 | 200 | 390 | no | - | [top](browser/_bg-390x844-top.png) |
| `/cars` | 390x844 | 200 | 390 | no | - | [top](browser/_cars-390x844-top.png) |
| `/bg/cars` | 390x844 | 200 | 390 | no | - | [top](browser/_bg_cars-390x844-top.png) |
| `/contact` | 390x844 | 200 | 390 | no | - | [top](browser/_contact-390x844-top.png) |
| `/imports` | 390x844 | 200 | 390 | no | - | [top](browser/_imports-390x844-top.png) |
| `/imports/china` | 390x844 | 200 | 390 | no | - | [top](browser/_imports_china-390x844-top.png) |
| `/sell` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_sell-390x844-top.png) |
| `/lease` | 390x844 | 200 | 390 | no | - | [top](browser/_lease-390x844-top.png) |
| `/blog` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_blog-390x844-top.png) |
| `/guides` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_guides-390x844-top.png) |
| `/collections/chinese-ev-hybrids` | 390x844 | 200 | 390 | no | - | [top](browser/_collections_chinese-ev-hybrids-390x844-top.png) |
| `/motorbikes` | 390x844 | 200 | 390 | no | - | [top](browser/_motorbikes-390x844-top.png) |
| `/trucks` | 390x844 | 200 | 390 | no | - | [top](browser/_trucks-390x844-top.png) |
| `/vans` | 390x844 | 200 | 390 | no | - | [top](browser/_vans-390x844-top.png) |
| `/cars/bmw` | 390x844 | 200 | 390 | no | - | [top](browser/_cars_bmw-390x844-top.png) |
| `/cars/bmw/x5` | 390x844 | 404 | 390 | no | - | [top](browser/_cars_bmw_x5-390x844-top.png) |
| `/legal/privacy` | 390x844 | 200 | 390 | no | - | [top](browser/_legal_privacy-390x844-top.png) |
| `/legal/terms` | 390x844 | 200 | 390 | no | - | [top](browser/_legal_terms-390x844-top.png) |
| `/audit-not-found` | 390x844 | 404 | 390 | no | - | [top](browser/_audit-not-found-390x844-top.png) |
| `/bg/listing/bmw-x5-m50d-sofia-2020` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_bmw-x5-m50d-sofia-2020-390x844-top.png) |
| `/bg/listing/mercedes-benz-gls-400d-4matic-amg-sofia-2021` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-gls-400d-4matic-amg-sofia-2021-390x844-top.png) |
| `/bg/listing/bmw-m4-competition-sofia-2021` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_bmw-m4-competition-sofia-2021-390x844-top.png) |
| `/bg/listing/bmw-750e-xdrive-m-sport-sofia-2024` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_bmw-750e-xdrive-m-sport-sofia-2024-390x844-top.png) |
| `/bg/listing/mercedes-benz-e-63-s-amg-sofia-2021` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-e-63-s-amg-sofia-2021-390x844-top.png) |
| `/bg/listing/mercedes-benz-cls-400d-4matic-sofia-2020` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-cls-400d-4matic-sofia-2020-390x844-top.png) |
| `/bg/listing/audi-q8-50-tdi-quattro-s-line-sofia-2021` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_audi-q8-50-tdi-quattro-s-line-sofia-2021-390x844-top.png) |
| `/bg/listing/mercedes-benz-gle-400d-coupe-sofia-2021` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-gle-400d-coupe-sofia-2021-390x844-top.png) |
| `/bg/listing/mercedes-benz-s-350d-long-amg-sofia-2019` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-s-350d-long-amg-sofia-2019-390x844-top.png) |
| `/bg/listing/range-rover-sport-svr-sofia-2021` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_range-rover-sport-svr-sofia-2021-390x844-top.png) |
| `/bg/listing/bmw-430i-xdrive-gran-coupe-sofia-2023` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_bmw-430i-xdrive-gran-coupe-sofia-2023-390x844-top.png) |
| `/bg/listing/bmw-x5-xdrive40d-berlin-2022` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_bmw-x5-xdrive40d-berlin-2022-390x844-top.png) |
| `/bg/guides/dealer-listing-transparency` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_bg_guides_dealer-listing-transparency-390x844-top.png) |
| `/bg/guides/premium-used-car-checklist` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_bg_guides_premium-used-car-checklist-390x844-top.png) |
| `/bg/guides/import-costs-and-timing` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_bg_guides_import-costs-and-timing-390x844-top.png) |
| `/bg/guides/financing-offer-questions` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_bg_guides_financing-offer-questions-390x844-top.png) |
| `/bg/guides/buying-used-car-bulgaria` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_bg_guides_buying-used-car-bulgaria-390x844-top.png) |
| `/bg/guides/ev-hybrid-ownership-checklist` | 390x844 | 200 | 390 | no | color-contrast | [top](browser/_bg_guides_ev-hybrid-ownership-checklist-390x844-top.png) |
| `/bg/listing/mercedes-benz-v-250d-vip-business-sofia-2018` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-v-250d-vip-business-sofia-2018-390x844-top.png) |
| `/bg/listing/mercedes-benz-gle-53-amg-coupe-sofia-2022` | 390x844 | 200 | 406 | yes | - | [top](browser/_bg_listing_mercedes-benz-gle-53-amg-coupe-sofia-2022-390x844-top.png) |
| `/cars` | 320x700 | 200 | 320 | no | - | [top](browser/_cars-320x700-top.png) |
| `/imports` | 320x700 | 200 | 320 | no | - | [top](browser/_imports-320x700-top.png) |
| `/sell` | 320x700 | 200 | 320 | no | - | [top](browser/_sell-320x700-top.png) |
| `/lease` | 320x700 | 200 | 320 | no | - | [top](browser/_lease-320x700-top.png) |
| `/contact` | 320x700 | 200 | 320 | no | - | [top](browser/_contact-320x700-top.png) |
| `/guides` | 320x700 | 200 | 320 | no | - | [top](browser/_guides-320x700-top.png) |
| `/listing/bmw-x5-m50d-sofia-2020` | 320x700 | 200 | 336 | yes | - | [top](browser/_listing_bmw-x5-m50d-sofia-2020-320x700-top.png) |
| `/guides/premium-used-car-checklist` | 320x700 | 200 | 320 | no | - | [top](browser/_guides_premium-used-car-checklist-320x700-top.png) |
| `/legal/privacy` | 320x700 | 200 | 320 | no | - | [top](browser/_legal_privacy-320x700-top.png) |
| `/audit-not-found` | 320x700 | 404 | 320 | no | - | [top](browser/_audit-not-found-320x700-top.png) |
| `/cars` | 360x800 | 200 | 360 | no | - | [top](browser/_cars-360x800-top.png) |
| `/imports` | 360x800 | 200 | 360 | no | - | [top](browser/_imports-360x800-top.png) |
| `/sell` | 360x800 | 200 | 360 | no | - | [top](browser/_sell-360x800-top.png) |
| `/lease` | 360x800 | 200 | 360 | no | - | [top](browser/_lease-360x800-top.png) |
| `/contact` | 360x800 | 200 | 360 | no | - | [top](browser/_contact-360x800-top.png) |
| `/guides` | 360x800 | 200 | 360 | no | - | [top](browser/_guides-360x800-top.png) |
| `/listing/bmw-x5-m50d-sofia-2020` | 360x800 | 200 | 376 | yes | - | [top](browser/_listing_bmw-x5-m50d-sofia-2020-360x800-top.png) |
| `/guides/premium-used-car-checklist` | 360x800 | 200 | 360 | no | - | [top](browser/_guides_premium-used-car-checklist-360x800-top.png) |
| `/legal/privacy` | 360x800 | 200 | 360 | no | - | [top](browser/_legal_privacy-360x800-top.png) |
| `/audit-not-found` | 360x800 | 404 | 360 | no | - | [top](browser/_audit-not-found-360x800-top.png) |
| `/cars` | 430x932 | 200 | 430 | no | - | [top](browser/_cars-430x932-top.png) |
| `/imports` | 430x932 | 200 | 430 | no | - | [top](browser/_imports-430x932-top.png) |
| `/sell` | 430x932 | 200 | 430 | no | - | [top](browser/_sell-430x932-top.png) |
| `/lease` | 430x932 | 200 | 430 | no | - | [top](browser/_lease-430x932-top.png) |
| `/contact` | 430x932 | 200 | 430 | no | - | [top](browser/_contact-430x932-top.png) |
| `/guides` | 430x932 | 200 | 430 | no | - | [top](browser/_guides-430x932-top.png) |
| `/listing/bmw-x5-m50d-sofia-2020` | 430x932 | 200 | 446 | yes | - | [top](browser/_listing_bmw-x5-m50d-sofia-2020-430x932-top.png) |
| `/guides/premium-used-car-checklist` | 430x932 | 200 | 430 | no | - | [top](browser/_guides_premium-used-car-checklist-430x932-top.png) |
| `/legal/privacy` | 430x932 | 200 | 430 | no | - | [top](browser/_legal_privacy-430x932-top.png) |
| `/audit-not-found` | 430x932 | 404 | 430 | no | - | [top](browser/_audit-not-found-430x932-top.png) |
| `/cars` | 844x390 | 200 | 844 | no | - | [top](browser/_cars-844x390-top.png) |
| `/imports` | 844x390 | 200 | 844 | no | - | [top](browser/_imports-844x390-top.png) |
| `/sell` | 844x390 | 200 | 844 | no | - | [top](browser/_sell-844x390-top.png) |
| `/lease` | 844x390 | 200 | 844 | no | - | [top](browser/_lease-844x390-top.png) |
| `/contact` | 844x390 | 200 | 844 | no | - | [top](browser/_contact-844x390-top.png) |
| `/guides` | 844x390 | 200 | 844 | no | - | [top](browser/_guides-844x390-top.png) |
| `/listing/bmw-x5-m50d-sofia-2020` | 844x390 | 200 | 860 | yes | - | [top](browser/_listing_bmw-x5-m50d-sofia-2020-844x390-top.png) |
| `/guides/premium-used-car-checklist` | 844x390 | 200 | 844 | no | - | [top](browser/_guides_premium-used-car-checklist-844x390-top.png) |
| `/legal/privacy` | 844x390 | 200 | 844 | no | - | [top](browser/_legal_privacy-844x390-top.png) |
| `/audit-not-found` | 844x390 | 404 | 844 | no | - | [top](browser/_audit-not-found-844x390-top.png) |
| `/en/cars` | 390x844 | 200 | 390 | no | - | [top](browser/_en_cars-390x844-top.png) |
| `/en/contact` | 390x844 | 200 | 390 | no | - | [top](browser/_en_contact-390x844-top.png) |
| `/en/guides` | 390x844 | 200 | 390 | no | - | [top](browser/_en_guides-390x844-top.png) |
| `/cars?query=zzzz-no-such-car` | 390x844 | 200 | 390 | no | - | [top](browser/_cars_query_zzzz-no-such-car-390x844-top.png) |
| `/listing/does-not-exist` | 390x844 | 200 | 390 | no | - | [top](browser/_listing_does-not-exist-390x844-top.png) |
| `/guides/does-not-exist` | 390x844 | 404 | 390 | no | - | [top](browser/_guides_does-not-exist-390x844-top.png) |
| `/legal/does-not-exist` | 390x844 | 404 | 390 | no | - | [top](browser/_legal_does-not-exist-390x844-top.png) |

## Final repository-wide test follow-through
After the public subset, the broader non-E2E repository command was executed with `pnpm exec turbo test --filter=!e2e --concurrency=2 --continue=always`. It completed all scheduled tasks instead of stopping at the first failing package. Evidence: `unit-repository-complete.log` and `unit-repository-summary.txt`.

Reported totals: **898 passed, 9 failed, 7 skipped** test assertions, with **16 successful tasks out of 18** and **8 cached tasks**. Four database integration files also report setup/runtime failures; assertion totals do not fully represent failed suite setup. The 312 public tests are a subset of these results, not an additional 312 distinct tests.

Eight failed assertions belong to `@repo/internationalization`, including expectations for `en`/`en-GB` defaults and redirect/rewrite behavior while the current dealership defaults to Bulgarian. Reconcile the intended locale/configuration contract before changing either behavior or tests. The remaining failed assertion and database suite setup failures could not reach the deliberately disabled database at `127.0.0.1:1`. The audit did not point integration tests at a real database or create production records.

The broader command was run with Node 22, test mode, distinct public origins, and an intentionally unreachable synthetic database URL. It reported passes for web (132), app (200), API (134), and the non-integration database assertions (159), alongside the other package suites. These are unit-level results, not live authenticated/provider workflow certification. Live PostgreSQL integration remains unverified rather than classified as a product defect.
