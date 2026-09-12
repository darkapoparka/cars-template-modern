# Codebase audit and simplification plan

Date: 12 September 2026. Scope: the local dirty `astra` working tree of `cars-template-modern`. This document distinguishes confirmed failures, structural recommendations, and unverified runtime areas. Public mobile routes received the deepest source and browser review; a repository-wide static scan is not a line-by-line security certification of every backend module.

## Architecture to retain
The repository already separates public routing (`apps/web`), pure marketplace policy, shared marketplace components, low-level design-system primitives, and database/provider concerns. Retain those boundaries. The mobile work should improve the existing Next.js/React implementation; a Svelte migration, new state framework, generic page-builder, new CMS, or universal form engine is not justified by these findings.

The inventory covers 1,004 source/configuration files and 151,937 lines, including generated and configuration material. The pattern scan reads 893 application/package TS/JS/CSS files. Counts include tests: 132 client directives, 34 useEffect occurrences, 33 lines containing `!important`, 101 brand-string matches, and five imageBySlug matches. These are inspection candidates, not that many confirmed defects. See `source-inventory.json` and `static-scan.json`.

## C01 — P0 — Patch the vulnerable dependency baseline
`dependency-audit.log` reports 50 advisories: 2 critical, 25 high, 21 moderate, and 2 low. This is a dependency report, not proof of 50 exploitable endpoints. Triage the workspace dependency paths and actual enabled features, but do not ship the known critical baseline.

Installed Next.js 16.2.11 falls in the affected 16.x ranges of GHSA-p293-qw3h-jr36 (Windows-hosted remote code execution) and GHSA-2xp9-vwfh-vxw4 (AVIF image optimization/libheif issue). The published fixes begin at 16.3.3 for that branch. An affected sharp version is also reported. The dev server was kept on loopback; this is exposure reduction, not a security patch. No exploit was attempted.

**Action:** review direct Next.js/React/sharp constraints and lockfile resolution, upgrade to a compatible patched release, and rerun build, typecheck, public tests, image handling, and dependency audit. Resolve transitive advisories through their owning packages; avoid a blind `--force` or a growing list of incompatible overrides. Keep the patch separate from design refactoring.

Primary advisory evidence, checked 12 September 2026:
- `https://github.com/advisories/GHSA-p293-qw3h-jr36`
- `https://github.com/advisories/GHSA-2xp9-vwfh-vxw4`
- `https://github.com/advisories/GHSA-rgj7-g3m4-5g8c`

## C02 — P1 — Restore trustworthy quality gates
`pnpm check` exits nonzero with 255 diagnostics across 944 checked files; many shown diagnostics concern formatting/import organization. Treat this as a dirty baseline, not 255 user-facing bugs. Do not autoformat the entire user's working tree during the audit. Fix functional/import problems first and isolate formatting-only changes.

`pnpm boundaries` identifies `packages/ai/listing-copy.test.ts` importing Vitest without declaring it in that package. Release contracts also reject the unexported deep import `@repo/marketplace-ui/components/dealer-mobile-header-icon` from `mobile-about-contact.tsx`. Either consume an existing supported export or deliberately declare the public subpath; do not bypass package boundaries with filesystem aliases.

The release/preflight contract run has 78 passes and five failures. Three failures concern the expected CI workflow/protected release guards and the missing `.github/workflows/ci.yml`; another is the package export failure; another concerns the provider-free Next type-generation test. Inspect the latter's Windows execution details before declaring it a product typing failure. The normal repository typecheck and public production build both pass with distinct app/web/API origins.

The existing mobile E2E gate selected 33 tests, reached case 27, and then hit a Turbopack out-of-disk panic. Failures had already occurred before the capacity error. Several tests describe the older generic marketplace experience: for example, consent UI is expected although the static-demo layout intentionally excludes analytics/consent providers. Separate genuine defects (including reproduced Sell contrast) from obsolete mode assumptions. Do not delete assertions simply to get green; state the supported mode and assert its intended behavior.

**Acceptance:** supported package imports, declared test dependencies, an intentional CI contract, zero unreviewed lint/type errors, and complete mode-appropriate mobile gates. A build pass or isolated screenshots alone are not release sign-off.

## C03 — P1 — One sell draft contract
The most important state defect is not a missing abstraction: mobile and desktop read different slices of the same GET data. The contact handoff omits VIN; the mobile form ignores query-provided initial fields. Introduce one small serializable `SellVehicleDraft` plus parse/serialize/validate helpers next to existing sell policy, and use it in page composition, drawer initialization, summary, and edit links. Keep transient open/close state local.

A good regression test changes every supported field, continues, edits, reloads, and compares values—not placeholder text. Include VIN-only, manual-only, empty, invalid, and long values. Retain the current in-memory draft behavior for accidental drawer close; persist sensitive data only when a product requirement justifies it.

## C04 — P2 — Remove business hardcoding, not all literals
`packages/marketplace/lead-site.ts` already centralizes name, contact channels, address, country/currency, accent, social links, and primary assets. Configuration is the correct home for concrete values. The problem is duplicated identity, district copy, route assets, and content classification in presentation components—not the existence of a configuration object.

`mobile-content-hub.tsx` contains guide-category, blog-category, and slug-to-image maps; article rendering repeats an image mapping. Put category, image, alt text, and read-time metadata on the typed content record once. Pass those fields to both hub cards and article pages. Add a new article by changing data, not by updating several component switchboards.

`mobile-sell-vehicle-experience.tsx` repeats localized next-step arrays already represented by `mobileSellVehicleCopy.howSteps`. Reuse one record source; share category assets/labels and query parsing between Sell and Contact rather than duplicating them. Use the existing localized URL helper instead of ad hoc locale-prefix concatenation.

**Definition of done:** changing dealer identity/contact data or a content record does not require editing JSX in unrelated routes. A configuration-substitution test verifies name, phone, currency, map, and asset references. Legitimate exceptions include test fixtures, static translation dictionaries, semantic design tokens, category enums, and physical/domain constants. Do not replace every spacing value or every literal with an abstraction just to claim “zero hardcoding.”

## C05 — P2 — Assign CSS ownership once
The root layout imports `styles.css`, `mobile-final-polish.css`, and then `desktop-header.css`. Mobile geometry also lives in Tailwind component classes. The polish sheet contains many structural `!important` overrides restoring layout around earlier selectors. A file named desktop-header does not make its entire cascade harmless to mobile; review its selectors explicitly.

Target ownership: design-system globals own resets and tokens; existing marketplace primitives own reusable geometry/behavior; page composition owns local layout. Give surfaces, borders, muted text, radius, gutters, and overlay layers semantic owners. Avoid DOM-shape selectors such as last-child-based action positioning and route-specific global patches.

Move a rule only when its component receives the matching style and its before/after mobile evidence remains stable. Remove the obsolete rule in the same change. Keep the visualViewport/keyboard compatibility logic until real-device tests demonstrate a simpler replacement; deleting every `!important` at once would be another regression-prone rewrite.

## C06 — P2 — Smaller client boundaries, measured performance
The client content hub imports full article collections although filtering/cards only need summaries. Build a small card view model on the server and pass it into the interactive hub. Keep full article bodies server-side. Confirm the bundle result rather than promising a byte reduction from source inspection alone. Next's client boundary includes imported modules: `https://nextjs.org/docs/app/getting-started/server-and-client-components`.

The root-level `MobileFinancingInterceptor` is an application-wide event interception mechanism. Audit its supported link targets, fallback navigation, focus restoration, and query data ownership before adding more global click interception. Prefer explicit triggers or a narrowly scoped existing context when a component owns the action; do not introduce a navigation framework.

Some desktop-only sections remain in the DOM with priority images despite being CSS-hidden on mobile. Review actual network requests and responsive image sizes before changing rendering. The regression log already contains image sizing/LCP-loading warnings. Use accurate `sizes`, stable image dimensions, and eager loading only for the real above-fold candidate. Keep generic content/listing data server-rendered where possible.

The current evidence does not contain a production Lighthouse/Core Web Vitals certification. Add a production-mode mobile measurement after correctness and capacity fixes; measure payload, image bytes, LCP, layout shifts, and input responsiveness under a repeatable profile. Dev compilation timings are not production performance scores.

## C07 — P2 — Reuse existing primitives without a mega-component
`MobileDealerChrome`, `DealerMobileBrandBar`, `MobileMarketplaceOverlay`, and the existing Drawer/Dialog primitives are useful seams. Standardize header slots, surface geometry, focus restoration, scroll ownership, and bottom-action clearance through them. Do not create another nearly identical header for each route, and do not move every route into a single boolean-heavy frame.

The shared public frame retains generic marketplace and static-dealer branches, including hidden legacy markup. Once behavior is covered, separate only cohesive variants that reduce duplicated markup or unreachable branches. Keep route-specific domain logic next to its route/policy. File length alone is not a reason to fragment components or large database modules.

## C08 — Security/privacy and correctness boundaries
The two raw-HTML pattern matches are the chart primitive and JSON-LD. The inspected JSON-LD component escapes `<`, `>`, `&`, and Unicode line separators before injection; the mere presence of `dangerouslySetInnerHTML` is not an XSS finding. No `@ts-ignore`, `@ts-nocheck`, or `as any` matches were found by this scoped scan; that is useful baseline evidence, not proof of type safety everywhere.

The static dealer experience intentionally omits analytics providers. Keep that behavior unless the product explicitly changes it; do not enable analytics to satisfy stale consent tests. Review map/third-party resource behavior and actual privacy copy before launch. No secrets were printed, no vulnerability exploitation was attempted, and no legal compliance certification is asserted here.

Finance figures, vehicle facts, and customer communications need a truthful data source. For the current call-first Sell path, use copy that matches the action actually performed. Live import/finance submissions, mail delivery, provider failures, rate limits, authenticated permissions, and database mutation behavior need their own authorized integration evidence.

## Working agreements for the implementation phase
Each change should have one purpose, a source owner, a regression assertion, and mobile before/after evidence. Preserve the user's existing uncommitted work. Keep formatting-only cleanup separate from behavior changes. Do not weaken tests or hide errors to manufacture a green summary. Do not redesign desktop during mobile finalization; capture desktop smoke baselines only to catch accidental shared-style regressions.

## Evidence index
`lint.log`; `boundaries.log`; `contracts.log`; `typecheck-distinct-origins.log`; `unit-public.log`; `build-web.log`; `dependency-audit.log`; `e2e-mobile-gate.log`; `source-inventory.json`; `static-scan.json`. The verification matrix records which commands actually completed and which were interrupted or corrected.

## Final broader-suite result
The repository-wide non-E2E run subsequently completed with `--continue=always`: 898 passing assertions, nine failing assertions, seven skipped, 16/18 successful tasks, including eight cached tasks. The public 312 are included, not additive. Eight failures concern internationalization defaults/redirects (English assumptions versus current Bulgarian dealer defaults); the remaining assertion plus database suite setup failures require PostgreSQL and failed against the audit's deliberately unreachable database endpoint. Web, app, and API unit suites all passed. See `unit-repository-complete.log`, `unit-repository-summary.txt`, and the final section of VERIFICATION-MATRIX.md.

Add the locale contract to C02's repair scope. Do not silently change the dealership back to English to satisfy tests, and do not remove locale coverage. Make the configured default and supported URL behavior explicit in fixtures/assertions. Database integration requires an isolated test database with explicit authorization; a blocked connection here is not evidence of an application database defect.
