# Modern final pass — 10 October 2026

## Verdict

The public frontend is polished after the focused corrections below. The initial audit missed the mobile car cards' image/copy imbalance; the owner flagged it and the follow-up corrected it with matched evidence. Obsolete desktop implementation and several state/navigation edge cases also survived previous polish and are corrected locally. One high-severity dependency advisory remains, so this is not an unrestricted release approval.

Scope is the Modern master at `L:/CODEX/cars/templates/modern`, within `darkapoparka/cars` on `main`. The request's “app template” wording was interpreted using this active checkout. Demo inventory/content is expected and was not treated as a defect. No dealer personalization, provider activation, deployment, commit or push was performed.

## Findings and local corrections

| Finding | Result |
| --- | --- |
| Old desktop service-switch/cutout implementation survived after the dealer branch had an unconditional early return. | Removed unreachable fallback branches and three unreferenced modules: `desktop-lead-services.tsx`, `dealer-vehicle-type-pills.tsx`, `desktop-banner-artwork.ts`. Removed unused category/filter CSS after checking consumers. Approximately 740 net lines were removed in this architecture cleanup; the active dealer composition and marketplace fallback were preserved. |
| Desktop Filters and Make/Model drafts survived crossing below 1024px. | Crossing into mobile now closes those desktop surfaces and cancels the draft. Initially opening mobile filters still works. |
| Full-filter Reset manually enumerated fields and omitted power, extras, radius, currency and pagination. | Reset now uses search-schema defaults and retains the selected sort order. |
| Draft category changes reused the applied category's vehicle taxonomy; mobile Apply could keep the old category route. | Full Filters use draft-category taxonomy and route-aware Apply. Sidebar taxonomy is forwarded through the actual results composition. BG/EN category regression tests pass. |
| Filter Apply could retain a later results page. | Full and quick-filter Apply return to page 1. |
| Selecting a listing from mobile search did not remember the current inventory return URL. Home was also excluded from the return allowlist. | Search remembers the return before navigation. Home, localized home and existing inventory routes retain query/scroll context; arbitrary/external URLs remain rejected. |
| Explicit mobile “flexible” financing preferences disappeared from the URL and became desktop 20%/48-month defaults. | Explicit flexible values remain serialized across 320px → 1440px and reload. Initial absent-query defaults remain as designed. |
| Fifth desktop Home card depended on positional `article:nth-child(5)` styling. Two source contracts failed. | Added an explicit optional card class for the same fifth-card breakpoint behavior; replaced existing 400/500 font-weight literals with their equivalent tokens. Refactor contracts pass without changing their rules. |
| A legacy lease test demanded search autofocus, while the current dialog correctly started focus on its Close control. | Verified focus stays in the chooser and Tab reaches search. Updated the test to that observed contract and seeded the existing locale-welcome fixture. No production autofocus change. |

The deleted modules had no remaining import/export/test/config consumers. Authenticated apps and provider packages have real retained purposes and were not removed merely because the public dealer demo does not use them. Client/server and static-preview/provider boundaries remain intact in the inspected public dependency graph. The public composition is easier to reason about, although this audit does not establish that every feature in the complete monorepo is exercised.

## Browser evidence

Reused the existing Modern preview at `http://127.0.0.1:6483`; no dependency installation, preview restart or new build output was needed. Manual inspection covered Home, inventory, listing/gallery, leasing, services, contact and guides, including a finance guide. Relevant checks used 320px, 390px and 1440px, with focused breakpoint checks at 1024/1399/1400px. BG was the main visual sample; BG/EN behavior was checked in the focused journeys. This was a targeted sample, not an all-route/all-viewport matrix.

No horizontal page overflow or broken loaded visible imagery was found in the inspected narrow views. Listing gallery dismissal, mobile search-to-listing-to-filtered-inventory return and the financing selector were exercised. Home stock still shows four cards at 1399px and five at 1400px. Chromium and WebKit both passed the focused search/Back journeys.

### Visible behavior correction

Same `/bg/cars` journey: open desktop Filters at 1440px, resize to 390px. Before, the desktop draft remained open as a mobile filter sheet. After, it closes and returns to inventory. This changes the faulty transition, not the normal mobile filter design.

| Before | After |
| --- | --- |
| ![Desktop draft incorrectly remains open after resizing](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/breakpoint-before.jpg) | ![Desktop draft closes when entering mobile](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/breakpoint-after.jpg) |

### Design preservation

Matched Home captures at the same 1440×1000 viewport and scroll position, with visible images loaded. The semantic fifth-card class and equivalent font tokens preserve the rendering. Both screenshot rasters are 1425×990; mean absolute JPEG channel delta was approximately 0.164 on a 0–255 scale. This is supporting evidence alongside rendered inspection, not a claim of byte-identical pixels.

| Before | After |
| --- | --- |
| ![Home before source cleanup](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/home-before.jpg) | ![Home after source cleanup](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/home-after.jpg) |

## Validation

Node 22.22.0 and pnpm 11.4.0 were used with the stable existing workspace installation.

| Check | Actual result |
| --- | --- |
| Whole Modern `pnpm check` | Passed: 1,201 files. Two final formatting-only issues were corrected: a test callback format and the editorial provenance JSON's missing terminal newline. JSON data was unchanged. |
| Nonincremental TypeScript: marketplace UI, web and E2E | All three passed with `--noEmit --emitDeclarationOnly false --incremental false`. One BG/EN test tuple needed `as const`; no production type workaround was introduced. |
| Reset/return and existing search-param unit checks | 51 passed. |
| Focused breakpoint, category and search/Back browser cases | 8 passed. |
| Existing persistence/storage-resilience journeys | All 7 validated: 4 passed initially, the remaining 3 passed on the warmed stable preview. |
| Lease chooser/persistence and explicit-flexible regression | 2 passed. |
| Refactor contracts | 8/8 passed after the explicit fifth-card/token corrections. |
| `pnpm release:preflight:contracts` | Passed. This is the contract target, not the complete production release gate. |
| Scoped `git diff --check` | Passed. |
| `pnpm audit --prod --json` | One high-severity advisory; no other reported severity counts. See below. |

The initial persistence failures occurred while routes were cold and source edits/HMR were still active: a listing remained in loading state, one Next router-initialization error was captured, and a reload exceeded the default deadline. Only those three failures were rerun, after warming and with a 90-second test deadline; all passed. The category test reproduced a real `/cars` versus `/motorbikes` route bug before the correction. A subsequent cold-streaming timeout passed on the same assertion after warming. Slow first compilation on this shared development server remains a limitation of these local timings; production performance was not measured.

No production build, full workflow suite, portfolio-wide doctor/preflight or hosted audit was run. The current change-sized validation was completed against the existing preview; production and mounted-dealer release acceptance remain separate checkpoints.

## Remaining concern

`braces@3.0.3` remains in the production dependency audit through `@repo/feature-flags → @vercel/toolbar` and its tooling dependencies. [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) reports high-severity stack exhaustion from deeply nested patterns and no patched version. The current npm registry still reports latest `3.0.3`; an override to unpublished `3.0.4` would not be a valid fix.

Toolbar rendering is gated by the existing flags configuration. This audit did not establish a public dealer attack path, but the advisory remains a dependency release blocker to resolve or explicitly assess at integration. Provider packages and lockfiles were preserved. Demo forms retain their existing static/demo boundaries; this pass does not certify real delivery or finance processing.

## Ownership and retention

Initial observed shared Cars HEAD: `0f9c79d28665272bb0041c751ede597642347239`. Later observed HEAD: `513b07fa7369a5090e03a54202ec2118971eeb71`, advanced by concurrent work. Neither SHA represents this uncommitted audit patch. Existing owner `AGENTS.md` changes and unrelated Cars/template work were preserved; no Git index or history mutation was made. The empty untracked `1.0.0` file has a 7 October timestamp, predates this audit and was also preserved.

The useful retained evidence is the four comparison JPEGs above and compact results/source hashes in the same task evidence directory. No active Playwright consumer remained at closeout. Automatic approval review rejected both the bounded generated-output cleanup and an explicitly resolved single-directory retry with “blocked by policy.” Therefore approximately 6 MB of resolved category-regression diagnostics remain in `behavior-before-category`, along with small last-run metadata directories. Their named purpose is temporary retention pending an allowed cleanup; they are not additional design baselines. No alternate deletion mechanism was used. The existing preview/output, prior audit baselines, session data, databases and recovery evidence are retained.

## Owner follow-up: mobile card image/copy balance

The initial mobile checks established overflow, facts and behavior more thoroughly than visual proportion. They did not establish that the right-hand copy was given enough room. The 46% photo column grew with the phone width while the model name was forced onto one line. At 390px the default Mercedes model was visibly truncated; at 320px it lost still more of its name. This was a missed visual usability issue, not a mock-content issue.

The correction is limited to `packages/marketplace-ui/lib/mobile-vehicle-card-layout.ts`: use a `min(42%, 8.5rem)` photo column, a matching conservative 124px mobile image size hint, and up to two model-title lines. Existing typography, landscape crop, corners, facts and all desktop breakpoint classes are retained. The shared layout also benefits financing option/selected cards.

With this browser's scrollbar gutter, a 390px viewport yields a 343px card. The photo changes from approximately 146×109px to 124×93px; usable right-hand text width grows from 165px to 187px. `GLS 400d 4MATIC AMG` is now complete on one line. At 320px, right-hand text width grows from 127px to 138px and that title is complete on two lines. All twelve supplied BG/EN model titles and primary prices fit their rendered bounds in the checked 320px inventory.

| 390px before | 390px after |
| --- | --- |
| ![Mobile cards before at 390px](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/mobile-card-fit/cards-390-before.jpg) | ![Mobile cards after at 390px](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/mobile-card-fit/cards-390-after.jpg) |

| 320px before | 320px after |
| --- | --- |
| ![Mobile cards before at 320px](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/mobile-card-fit/cards-320-before.jpg) | ![Mobile cards after at 320px](C:/Users/radev/.codex/visualizations/2026/10/10/01a123d7-909a-7111-8b3b-cd621cfba25c/modern-final-audit/mobile-card-fit/cards-320-after.jpg) |

Focused verification: scoped Biome and whitespace checks passed; the existing 320px/390px card cases passed on Chromium and WebKit, each covering BG/EN (4/4 cases). Those tests cover landscape photos, the complete four-fact row, accessible titles and no page overflow; direct rendered measurements supply the additional title/price-fit evidence. Manual inspection covered the selected Mercedes financing card at 320px, tablet inventory at 768px and desktop inventory at 1440px. A transient Turbopack CSS hot-update error cleared on the settled reload; screenshots and final checks use that settled source.

This follow-up retains four additional comparison captures in `mobile-card-fit` for the distinct owner-requested card correction. Together with the original four, their named purposes are desktop preservation, responsive-dialog behavior, and mobile card balance at 320/390px. The focused runner produced only compact passed-run metadata, with no failure captures, videos or traces. No build, installation, deployment, commit or provider change was made.

## Authorized publication checkpoint

After the local audit and mobile correction, the owner explicitly requested a GitHub commit/push and deployment to the existing Vercel project. At this checkpoint, the release contracts passed, all 87 existing release-preflight tests passed, and Turbo boundaries checked 1,198 files across 30 packages without issues. The portfolio workspace doctor fetched current tracking refs without changing working files. Earlier no-publication statements above describe the local audit closeout before this subsequent request.

Publication scope is the Modern master and its existing `cars-template-modern` publishing mirror/project. The mirror's retained source matches its recorded Cars commit exactly; its parent history, publishing receipt and recovery evidence must be preserved. `templates.lock.json`, dealer releases, unrelated template edits, the owner's `AGENTS.md` changes and the preexisting `1.0.0` file are outside this change. The requested deployment follows disclosure of the `braces` advisory and carries that explicit exception; the dependency security gate is not reported as passed. Production-build and hosted verification results belong in the separate final publication receipt after the exact source has been deployed.
