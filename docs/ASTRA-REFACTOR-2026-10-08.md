# Modern: Astra refactor and verification — 2026-10-08

## Review status and baseline

This is an isolated code-quality comparison branch, not a redesign or unconditional production sign-off.

- Repository: `darkapoparka/cars`, scope: `templates/modern`.
- Branch: `astra-modern-refactor`.
- Original audited main: `45f6e8e1a84c8420c32a29d72d5c2b3a7134c84b` (`Correct Mobile PDP button sizing`).
- Updated main incorporated before delivery: `8829ef5a290f963bea1845c331013657bfffed3a`. The intervening commits do not change `templates/modern`; the original visual baseline therefore still applies.
- Worktree: `L:\CODEX\cars-astra-modern`. The user's original main worktree and its uncommitted files were not modified.
- No merge into main, database migration, seed, real lead submission, email, payment, or production deployment was performed.

The public production build, workspace unit tests, complete workspace type checking, package boundaries, and repository lint pass. Two findings remain open: an unpublished transitive security patch and intermittent WebKit reload errors. Do not describe this branch as fully release-cleared.

## Implemented changes

### Search behavior separated from rendering

`packages/marketplace-ui/components/desktop-search-assistant.tsx` was approximately 776 lines of keyboard behavior, state, and dialog rendering. Its controller is now 281 lines. Dialog/suggestion rendering lives in the adjacent `desktop-search-dialog.tsx`; keyboard behavior lives in the small tested `lib/search-keyboard.ts` policy. This is a separation of responsibilities, not a claim that all extracted lines were deleted from the repository.

The existing component interface and re-exports are retained. A TypeScript AST comparison confirmed that the original JSX `className` literal values were preserved across the controller and extracted renderer. No CSS, design tokens, public artwork, fonts, hero layout, card styling, or mobile navigation layout was changed.

Desktop and mobile search no longer generate suggestion groups while closed. Desktop filter-only views do not process hidden suggestions. Flattened results are memoized, and a single ID-to-index map replaces a linear search for every rendered option. These remove identifiable unnecessary work; this audit does not claim a measured whole-site speedup or a smaller complete install.

Search Enter handling now respects active input-method composition, including the key-code-229 compatibility case. Confirming composed text no longer prematurely submits the mobile search. Ten keyboard-policy unit tests cover composition, completed Enter, visible listing selection, empty/hidden suggestions, Escape, and arrow navigation. Browser coverage specifically verifies the mobile Enter behavior; it is not a claim to have tested every operating-system input method or every dialog-level composition interaction.

### Make/model listing returns retain browsing context

`lib/inventory-return.ts` previously recognized only top-level inventory routes. Opening a listing from `/cars/bmw` or `/cars/bmw/x5` did not save the return route, its query filters, or its scroll position.

The helper now uses one canonical path rule for category, make, and model inventory routes, preserving localization/base-path handling and the existing one-shot scroll restoration. It rejects external URLs, traversal paths, backslashes, and extra path segments rather than accepting arbitrary `/cars/*` destinations.

Nine new regression cases were added. Before changing implementation, the three positive make/model cases failed while the other nineteen return tests passed. After the fix, all twenty-two pass. Browser tests additionally exercise the listing's own Back control—not only browser history—at 390px and 1440px for both make and model routes, retaining price and sort queries.

### Repository maintenance without asset regeneration

The full repository lint scan found twenty errors, including formatting and block-statement issues in asset provenance preparation scripts/manifests. Safe Biome fixes were applied to those files. No preparation script was executed and no asset was regenerated. All twenty-seven provenance JSON documents were compared before/after as parsed values and remained equal. Final whole-repository lint passes.

The retained Next-forge application/API/auth/database/provider packages were not deleted merely because the provider-free public demo does not exercise them. Existing marketplace-domain, marketplace, marketplace-ui, and server-orchestration boundaries remain intact. No runtime library was added for this refactor.

## Dependency review

The existing Node 22.22.x / pnpm 11.4.0 toolchain was used. The isolated install started with the committed lockfile. Prisma Client was generated locally before the production build/full tests; no database connection or migration was required for that generation.

The production dependency audit initially reported eight advisories: three high, three moderate, and two low. Six narrow package patches were installed and the lockfile regenerated:

| Package | Before | After |
| --- | --- | --- |
| sharp | 0.35.4 | 0.35.5 |
| source-map-js | 1.2.1 | 1.2.2 |
| fast-uri | 3.1.7 | 3.1.8 |
| brace-expansion | 5.0.11 | 5.0.12 |
| DOMPurify | 3.4.13 | 3.4.16 |
| Hono | 4.13.5 | 4.13.7 |

The post-patch production audit reports one high advisory and zero critical, moderate, or low advisories. A subsequent `pnpm install --frozen-lockfile` succeeds.

**Remaining security finding:** `braces@3.0.3`, advisory `GHSA-vfj7-8cjw-p6xm`, remains in the retained feature-flag/development-toolbar dependency graph. The advisory names `3.0.4` as the patched release, but direct npm registry inspection and installation both showed that this version was not published at review time; the registry's latest was still `3.0.3`. An attempted override to the unavailable version was removed. Audit thresholds and the dependency were not hidden, suppressed, or reclassified to claim success. The production audit command still exits nonzero, so an aggregate release gate requiring a clean high-severity audit remains blocked. This audit finding is not proof that the public site exposes the vulnerable pattern-processing path.

The recursive outdated scan was also run. Next 16.3.8, React/React DOM 19.2.4, Tailwind 4.3.0, TypeScript 5.9.3, Vitest 4.1.8, and Playwright 1.61.1 were retained. Newer registry releases exist; a framework/compiler/test-runner migration was not mixed into a styling-preserving refactor. Dependency versions are observations as of this review, not a promise that everything is latest.

Primary references consulted include the installed Next.js lazy-loading documentation, MDN KeyboardEvent composition documentation, and the npm registry/GitHub advisories returned by `pnpm audit`:

- https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing
- https://github.com/advisories/GHSA-wq5f-xc86-pv6w
- https://github.com/advisories/GHSA-68fv-2mgg-jv7q
- https://github.com/advisories/GHSA-vfj7-8cjw-p6xm

## Verification actually executed

| Gate | Result |
| --- | --- |
| Original and updated frozen installs | Pass |
| Production public `web` build | Pass before and after changes |
| Full `pnpm unit` | 1,253 passed; 8 database tests skipped |
| Complete workspace type checking | Pass |
| `pnpm boundaries` | Pass |
| `pnpm refactor:contracts` | Pass |
| `pnpm release:preflight:contracts` | Pass |
| `pnpm release:preflight:test` | Pass |
| Whole-repository Biome check | Pass |
| Post-patch `pnpm audit --prod` | Fails: one remaining high advisory, explained above |
| Public route/viewport smoke checks | 32 before and 32 after; expected HTTP status, no horizontal overflow or page errors |
| Before/after viewport screenshot comparison | 12 pairs; detailed results below |
| Architecture browser suite | Chromium 10/10; WebKit 9/10 in the full run |
| Isolated repeats of the WebKit failure | 2 passed, 1 failed across three repeats; not resolved |

The 1,253 passing unit tests span sixteen test-bearing workspace packages/apps, including the public app (200), marketplace UI (143), marketplace (179), database (188), API (134), and authenticated app (204). The eight skipped database cases are not counted as passes. Live provider/account/payment integration was not established by these tests.

### Route and visual coverage

Home, inventory, and a real listing were visited and captured at 320, 390, 1023, and 1440px widths. Sell, imports, lease, blog, contact, privacy, make inventory, model inventory, the Chinese EV collection, and a nonexistent URL were smoke-checked at both 390px and 1440px. These secondary checks are route/runtime/layout checks, not exhaustive interactive visual sign-off on every page.

Seven of twelve screenshot pairs are pixel-identical, including all three 1440px desktop captures and all four listing-detail captures. The five non-identical pairs have the following exact raw-pixel differences:

| Capture | Different pixels | Total pixels |
| --- | ---: | ---: |
| 1023px home | 13 | 920,700 |
| 1023px inventory | 35 | 920,700 |
| 320px home | 48 | 288,000 |
| 390px home | 109 | 351,000 |
| 390px inventory | 3 | 351,000 |

The largest differing fraction is about 0.0311%. No changed layout was visible in the inspected representative desktop/mobile/inventory/listing captures. The exact rendering cause of every changed pixel was not established; these are not described as twelve perfectly identical screenshots. No baseline images were updated to conceal a difference.

### Remaining WebKit finding

The new navigation and mobile input-composition tests all pass in both Chromium and WebKit. Existing shortlist cross-tab/reload persistence and inventory view persistence also pass in both engines.

The strict existing 1440px WebKit persistence test intermittently receives page errors for same-origin Next RSC requests. Inspection of the initial trace places the errors about forty milliseconds after `page.reload`, before the listing click or browser Back action. The URL/filter/listing-return assertions themselves pass; the assertion requiring no page errors fails.

The full run was nineteen passed / one failed. A bounded three-repeat investigation of the unchanged test returned two passes / one failure. This was not resolved, and it has not been proven to be caused by this refactor or to predate it. No CORS headers, global prefetch settings, error handlers, assertion filters, or retry settings were changed to hide it. The original trace and failed screenshots were retained locally. A real-device Safari reproduction and a minimal reproduction against the installed Next/WebKit combination are appropriate follow-up investigation, not completed work.

## Reproduction and evidence

From `templates/modern`, using the pinned toolchain:

```sh
pnpm install --frozen-lockfile
pnpm --filter @repo/database build
pnpm unit
pnpm exec turbo typecheck --concurrency=2
pnpm boundaries
pnpm refactor:contracts
pnpm release:preflight:contracts
pnpm release:preflight:test
pnpm exec biome check .
pnpm --filter web build
pnpm audit --prod
```

For the committed browser tests, start the provider-free local production build on port 3187 in a separate terminal and run:

```sh
pnpm --filter web exec next start -H 127.0.0.1 -p 3187
# Separate terminal:
pnpm --filter e2e exec playwright test --config=playwright.architecture.config.ts
```

The config also accepts `E2E_BASE_URL` for an explicitly prepared local preview. It does not start or modify a production deployment. Browser test setup changes only local preference cookies and blocks non-preference API POSTs.

Raw logs, thirty-two-route reports, before/after screenshots, pixel-comparison details, security findings, patch availability, and initial WebKit traces are retained under the ignored `runtime/astra-audit/` directory in the isolated worktree. These local captures are not repository download links. No credentials, browser authentication state, generated Prisma client, installed dependencies, or build output were committed.

Review the application refactor, security updates, and provenance cleanup as separate commits. Main remains the user's decision point; the open security and WebKit findings must remain visible when deciding whether to promote this branch.
