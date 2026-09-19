# Repository audit and finding register

Baseline and methods are in [evidence/BASELINE.md](evidence/BASELINE.md). Source coordinates below refer to the audited HEAD, not to future line positions. **P1** means a high-priority product/maintainability or release issue; **P2** means a planned improvement. No exploitable P0 security incident was established by this audit. “Confirmed” describes the observed code, not a claim that every affected user flow has been reproduced.

## F01 — Demo mode also selects the product [P1, confirmed]

**Evidence:** `packages/marketplace/lead-site.ts:3–32,69`; `apps/web/app/[locale]/components/public-marketplace-frame.tsx:79–95`; `packages/marketplace-ui/components/marketplace-shell.tsx:166–173`; `apps/web/app/[locale]/layout.tsx:69–98`. Mechanical scan: 97 `leadSite.staticDemoMode` references across 33 non-test application/package source files.

The flag controls dealer vs marketplace navigation, saved/publish actions, desktop landing eligibility and provider behavior. It is therefore not merely a demo-data switch. The public design is coupled to operational readiness. **Fix:** separate site/product kind, data mode, public service capabilities and server-only integration readiness. Preserve a compatibility adapter until each consumer is migrated. **Acceptance:** dealership appearance remains the dealership for demo, live and unavailable data; unavailable delivery never fabricates success. Tasks RF-04, RF-05, RF-20.

## F02 — Existing semantic tokens are bypassed by desktop styling [P1, confirmed]

**Evidence:** semantic foundations already exist in `packages/design-system/styles/globals.css:9–180`. Compare `apps/web/app/[locale]/desktop-header.css:3–113,363–430`, `packages/marketplace-ui/components/dealer-desktop-discovery.module.css`, and `desktop-landing-vehicle-card.module.css`.

The three desktop files total **1,354 lines, 120 hex occurrences and seven `!important` occurrences**. The header primary control uses `#d20a0a !important`, while its hover uses a different brand-derived variable. This is token adoption/ownership debt, not a reason to replace Tailwind. **Fix:** map repeated values to semantic and inverse-surface roles, retain scoped component geometry, and migrate one owner at a time. **Acceptance:** two contrasting dealer themes exercise default/hover/selected/focus/disabled states without editing JSX or CSS. RF-06–RF-09.

## F03 — Header CSS owns unrelated card/discovery presentation [P1, confirmed]

**Evidence:** `desktop-header.css:378–430` styles listing grid articles, nested links, titles, prices and spec pills. `dealer-desktop-discovery.module.css:162–200` reaches into global toolbar classes; its later rules override additional global controls. The locale root imports the header stylesheet for every route (`layout.tsx:1–3`).

A header file is effectively another product stylesheet. Card and toolbar changes must compete across app CSS, shared components and CSS modules. **Fix:** give header, hero, toolbar and card variants explicit owners. Remove a legacy rule in the same slice that replaces it; do not append another “final polish” sheet. **Acceptance:** each visible rule has one owner, unrelated routes do not change, and the desktop flow passes the responsive review. RF-08–RF-12.

## F04 — Desktop composition needs design work, not only refactoring [P1, confirmed code; visual judgment requires approval]

**Evidence:** `dealer-desktop-discovery.module.css:7–18,154–170,555–625` fixes hero heights and absolutely positions search with a negative bottom offset. It also supplies a separate discovery panel and per-range corrections. The desktop header and hero are separate ownership systems.

The current source can produce a large dark hero, overlapping search panel, large rounded discovery container and card rows on a grey canvas. The initial rendered audit confirmed this composition but did not establish image-complete visual sign-off. **Fix:** implement the explicit hierarchy in [05-DESKTOP-AND-MOBILE.md](05-DESKTOP-AND-MOBILE.md), with search structurally inside the hero's layout. Do not simply remove every container or turn every section into one. **Acceptance:** approved desktop composition at 1024/1280/1440/1536/1920 with long labels and varied inventory. RF-08, RF-09.

## F05 — Parallel card presentation is drifting [P1, confirmed]

**Evidence:** new `desktop-landing-vehicle-card.tsx:39–147` and its CSS coexist with `vehicle-card.tsx`, `vehicle-card-content.tsx` and shared card policies. The new card correctly reuses `vehicle-card-policy` and `vehicle-card-view-policy`; it is not a wholly duplicate pricing engine.

The risk is parallel markup, media state, badges, facts and CSS drifting between landing/results/mobile. **Fix:** retain one presentation/view-model contract, explicitly name justified variants, and share media/fact/action pieces when their behavior is genuinely the same. Do not force identical mobile and desktop DOM. **Acceptance:** variants agree on title, price, currency, status, facts, image failure and return navigation. RF-10.

## F06 — New discovery content is under a broad client boundary [P2, confirmed graph; cost unmeasured]

**Evidence:** `dealer-desktop-discovery.tsx:1–21,86–124` has a client directive, static copy and client-side collection policy. `marketplace-shell.tsx:1,41,73–76,376–392` imports it and supplies listings. Both landing content and responsive results are composed within the shell.

This is a candidate for server-prepared summaries and client islands, not proof of a particular bundle-size regression. Removing a directive in the child alone will not fix a parent client import graph. **Fix:** make a server owner prepare discovery data and pass rendered sections through slots; leave filters/search/return-state/media behavior in focused client boundaries. **Acceptance:** production bundle and serialized payload comparison, unchanged filtering/back behavior, no hydration or privacy regressions. RF-11, RF-17.

## F07 — Identity and artwork are not fully configurable [P1, confirmed]

**Evidence:** `lead-site.ts` already owns identity and some artwork. But `dealer-desktop-discovery.tsx:60,69` uses fixed hero cutout paths; `desktop-header.css:108` references `/day-night-contact-hero-v1.png`. Brand/name/color-pattern matches also occur in contact, lease, sell, editorial content, taxonomy artwork and SEO modules (the scan is a candidate inventory, not proof that every match is improper).

A reusable copy still needs a broad manual sweep. **Fix:** a typed public site config with complete artwork roles, structured content/market formatting and service capabilities. Preserve stable provisioning markers until Cars callers are migrated. **Acceptance:** two synthetic dealer copies require no product JSX/CSS edits and have no inherited live identity. RF-04, RF-07, RF-21.

## F08 — Theme and color-mode ownership are ambiguous [P2, confirmed]

**Evidence:** root layout sets `--canvas` and a family of `--lead-site-accent-*` properties inline (`layout.tsx:50–64`). Shared globals contain light/dark definitions. `packages/design-system/providers/theme.tsx:8–13` uses `defaultTheme="light"` and `enableSystem`. Desktop often uses literal white/dark values.

Brand, neutral palette and color mode currently have multiple owners. Do not assume the public site intentionally supports a fully designed dark mode. **Fix:** explicitly choose public supported modes, keep admin mode independent, establish brand foreground contrast rather than deriving every foreground mechanically, and test portalled controls. **Acceptance:** no mixed-mode components or theme flash; portal tokens match the page. RF-06, RF-07.

## F09 — Content disappears through positional CSS at smaller desktop widths [P2, confirmed]

**Evidence:** `dealer-desktop-discovery.module.css:589–595` changes a vehicle row to three columns and hides `:nth-child(n + 4)` between 1024 and 1279px.

This is not automatically an accessibility defect because hidden cards are removed from display, but visible inventory becomes a side effect of DOM position and CSS. **Fix:** define a deliberate row/overflow/collection policy. Prefer an explicit row limit, accessible overflow or a grid that actually displays the intended items. **Acceptance:** 3/4/5-card density decisions are documented and inventory is not silently lost without a clear view-all path. RF-09, RF-10.

## F10 — Source assets are heavy; no measured page-weight conclusion yet [P2, confirmed]

**Evidence:** 108 tracked image/font assets under `apps/web/public` total **54,750,275 bytes**. The largest PNG is `day-night-contact-hero-v1.png` at **2,047,605 bytes** and is referenced directly in CSS. Several service artworks exceed 1.4MB. The desktop hero supplies two priority images (`dealer-desktop-discovery.tsx:55–69`).

Source bytes are not transferred page bytes, especially with `next/image`. A WebP extension alone is not proof of optimization. **Fix:** distinguish production renditions from source masters; measure crop/resolution/quality and actual network delivery. Move large originals outside deployed `public` after checking consumers. Audit hero preload behavior on mobile before asserting wasted requests. RF-16, RF-17.

## F11 — There are cleanup candidates, not a safe delete list [P2, confirmed scan with limitations]

A literal-reference scan found no full URL/path references for `images/services/header-phone-v2.png`, `header-phone-v3.png`, and `leasing-keys-red-v1.webp`. No byte-identical image/font files were found in the 108-file scan. Dynamic paths, provisioning scripts outside this repo, case/encoding variations and external consumers can invalidate a simple absence result.

**Fix:** validate import/export reachability, CSS/config/metadata consumers, dynamic construction, public URLs and Cars clone contracts before deleting. Track “candidate / retained / removed with evidence.” Preserve purposeful compatibility re-exports in `packages/marketplace`. RF-15, RF-16.

## F12 — Existing tests do not establish desktop visual consistency [P1, confirmed search scope]

**Evidence:** no literal `toHaveScreenshot` or `toMatchSnapshot` calls were found in tracked files matching the audit's test/spec extension scan. `apps/e2e/playwright.modern.config.ts:5–10,24–41` selects four mobile spec files with 390px Chromium/WebKit projects. Existing screenshot captures and behavior/geometry tests must not be mistaken for approved-image comparisons.

**Fix:** keep valuable existing tests, add deterministic desktop surface and mobile preservation baselines, and require review of changes. This is not permission to add hundreds of redundant tests. RF-02, RF-03, RF-22.

## F13 — Old refactor documentation gives conflicting operating instructions [P1, confirmed]

**Evidence:** `docs/refactor/README.md:3` calls both desktop and mobile approved. `IMPLEMENTATION_STATUS.md:3–9,75–96` refers to a different branch, baseline and historical verification blockers. The actual checkout is main with newer desktop commits.

**Fix:** one current program with historical notices and one task ledger. Preserve old content as provenance rather than quietly rewriting its claims. **Acceptance:** a new session can identify the correct repo, baseline, current scope and next task without reconciling contradictory “final” documents. RF-01.

## F14 — Dealer admin exists but is not a complete enquiry-management product [P1 for admin launch, confirmed source]

**Evidence:** `apps/app/app/(authenticated)/dealer/leads/page.tsx:17–77` resolves an actor and dealer, lists enquiries, renders status/intent/message/date and an empty state. This page is a read view; it does not itself expose assignment, status editing, history or pagination controls. `packages/database/leads.ts` already has persistence, idempotency and conversation pagination policy.

Do not build a second CRM data model or call the current screen a finished CRM. **Fix:** a small dealer workspace roadmap on existing organizations/leads/inventory. Verify all public enquiry channels before promising a unified inbox. RF-18–RF-20.

## F15 — Authorization foundations should be consolidated, not discarded [P2, confirmed; not a vulnerability finding]

**Evidence:** dealer layout calls `requireDealerOrganizationActor`; the helper uses durable organization access and allowed roles. Admin layout checks authentication/admin role. `packages/auth/authorization.ts:18–39,75–88` has per-operation durable role policy. The enquiry page uses an additional older listing/dealer actor path.

**Fix:** standardize how dealer services obtain and verify their actor; carry tenant scope into every read/mutation; add leads operations to the established permission policy as needed. Verify object ownership inside the service, not only the navigation/layout. **Acceptance:** cross-organization, revoked member, viewer-write and admin impersonation tests. RF-18, RF-19.

## F16 — Large backend files mix domain workflows, but line count is not a defect [P2, triage]

Examples: `database/inventory-ingestion.ts` 3,490 lines; `inventory-imports.ts` 3,021; `organization-verification.ts` 1,321; `scripts/release-preflight.mjs` 2,339. Schema, catalogs, fixtures, generated declarations and third-party-derived UI files can be legitimately large.

**Fix:** extract by transactional/workflow boundary only when responsibility review shows a benefit. Keep atomic ingestion, idempotency, retention and audit semantics intact. Do not turn this into a generic repository/service factory. **Acceptance:** unchanged invariants and focused tests, with lower cross-feature coupling rather than a line-count score. RF-14, RF-18.

## F17 — Version policy needs explicit compatibility discipline [P2, confirmed]

The installed web app is Next 16.3.3 / Tailwind 4.3.0 / TypeScript 5.9.3; manifests often specify Tailwind `^4.2.1`. Turbo is installed at 2.9.16. Design-system declares `radix-ui: latest` (installed 1.6.7). Analytics declares `@next/third-parties` 16.1.6 while Next apps use 16.3.3. Node runtime is 22, while many Node type packages are 25.x.

These are review items, not automatically broken combinations. A frozen lockfile still fixes today's install. **Fix:** retain the lockfile, check peer/runtime requirements and security advisories, then do a separate tested dependency slice. Never mix mass upgrades with visual regression work. RF-13.

## F18 — Release claims must be narrower than audit results [P1, confirmed scope limitation]

Lint and package boundaries passed during this audit. Other command outcomes and browser limitations are recorded in the baseline file. No production provider provisioning, authenticated live-session walkthrough, complete cross-browser visual certification, migration rehearsal or deployed-performance certification is implied.

**Fix:** maintain evidence per environment/mode. A local 200 does not prove deployment identity; an environment-validation bypass does not prove live readiness. RF-03, RF-20–RF-23.

## Strengths to preserve

The pure domain package and deliberate marketplace facade; URL-first filters and extracted shared policies; mobile overlay/focus/draft work; semantic token foundations; server-only markers; organization role checks; atomic/idempotent enquiry and import logic; environment readiness handling; and existing test/release safeguards are investments. Improve them rather than replacing them with another scaffold.
