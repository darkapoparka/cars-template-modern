# Verification and release contract

Actual audit outcomes are in [BASELINE](evidence/BASELINE.md). This file defines future acceptance. Existing green checks are useful but are not proof of desktop quality, live provider readiness or a mounted dealer release.

## Test layers

| Layer | Verify | Keep separate from |
| --- | --- | --- |
| Pure policy/unit | Config parsing, filters, price/fact formatting, statuses and permission decisions | Screenshots and external services |
| Component | Card variants, accessibility state, labels, draft preservation, fallback rendering | Full provider integration |
| Boundary/type/lint | Acyclic workspace imports, server-only ownership, declared dependencies, TypeScript and style | Visual acceptance |
| Provider-free browser | Public routes, URL state, overlays, responsive geometry, unavailable delivery | Sending real enquiries |
| Visual | Reviewed desktop composition and mobile parity in pinned conditions | Auto-updating every failed baseline |
| Authenticated integration | Tenant isolation, direct mutations, inbox paging and state changes | Production accounts/data |
| Release/mounted | Exact template snapshot, generated dealer copy, base paths/assets/actions/canonicals | Standalone localhost success |

## Existing commands

Run with Node 22.22.0 and pnpm 11.4.0 from the correct checkout. Use the existing scripts rather than copying older next-forge commands blindly.

```powershell
pnpm check
pnpm boundaries
pnpm unit
pnpm typecheck
pnpm audit --prod --audit-level=high
```

Focused iterations can run `pnpm --filter web test` and `pnpm --filter @repo/marketplace-ui test`. Public mobile checks against an already verified demo listener:

```powershell
$env:E2E_BASE_URL = 'http://127.0.0.1:3002' # Verify owner first; audit-time URL only.
pnpm --filter e2e exec playwright test --config=playwright.modern.config.ts
```

That configuration currently targets mobile; it does not certify desktop. RF-03 adds a clearly named desktop/presentation gate. For full public and authenticated release workflows, inspect current `apps/e2e/package.json`, the runner and the root release scripts before invoking them. Never run a credentialed workflow against production data just to finish a refactor checkbox.

Build in an isolated environment/output location so the preview and build do not compete for `.next`. The repository already has public-E2E output isolation; reuse its runner contract rather than inventing flags. A production build was not run in this documentation audit. Full release acceptance requires the appropriate production builds and exact runtime mode, not merely type generation.

## Visual baseline contract

Pin browser version, OS, fonts, viewport, locale, data, clock-sensitive fixtures and animation behavior. Wait for route data, fonts and **visible** image readiness. Capture errors and failed requests. Store source commit and capture recipe with every baseline. A skeleton screenshot or a screenshot from a broken image harness is not acceptable evidence.

Capture mobile preservation first at 320/360/390/430 plus landscape. Capture desktop 1024/1280/1440/1920, 768 and 1023/1024 transition, with breakpoint edges for touched CSS. Use every route family from [the UI plan](05-DESKTOP-AND-MOBILE.md), both BG/EN and two test brands. Add empty data, unavailable providers, missing images and long text. Keep a bounded WebKit mobile gate.

Automate meaningful geometry and behavior assertions. Add reviewed Playwright screenshot expectations or a verified equivalent product-story visual service; do not assume current Chromatic configuration means screenshots ran. Store baselines with intentional ownership and a review process. CI must fail on unexpected changes; updating a baseline requires a reason and actual visual inspection.

## High-risk behavior matrix

Inventory: enter query, apply/clear make/model and price, sort, back/forward, pagination, empty results, enter listing and return. Overlay: open, nested selection, dismiss, focus restore, body scroll, keyboard and safe-area clearance. Services: draft entry/edit/back/close, validation, configured/unavailable delivery, finance context. Detail: gallery, touch/keyboard tabs, contact/map links and related listings. Content: canonical blog/guides behavior, metadata and recovery routes. Theme: normal/hover/selected/focus/disabled/error states and portalled surfaces.

During read-only browser audits, block mutations and external contact actions. Functional submission testing uses an explicitly disposable endpoint/provider and records the actual outcome. Do not accept a simulated toast as delivery verification.

## Two-dealer and Cars compatibility gate

Use two fictional fixture identities with distinct accent, longer/shorter names, differing artwork, locale/market formatting and service availability. No real prospect contact. Confirm there is no inherited active identity in UI, metadata, structured data, phone/map/social links, forms, asset alt text or email destination. Preserve provenance/history without exposing it as current UI.

Then test the approved Cars packaging workflow against an exact candidate commit. Verify standalone `/cars` and mounted `/variant-2/cars` separately: locale paths, queries, assets, CSS URLs, redirects, forms, service navigation, canonicals and switcher. Updating `lead-site.ts` schema/markers/asset roles requires a coordinated packaging change before declaring the template cloneable. Existing client copies do not auto-upgrade.

## Done and rollback

Each task records before/after source, tests, visual artifacts, measured changes, unresolved issues and rollback. A release needs no unexplained failing checks, owner-approved desktop, mobile parity, correct dealer adaptation and truthful delivery. Keep schema changes and UI changes independently deployable where possible. Record exact release commit and mode; do not promote floating `main` automatically. Do not accidentally push older unpublished work with a documentation task.

Official basis: [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots) and the repository's existing QA/Cars contract. Accessibility checks assist review; they do not prove complete WCAG conformance.
