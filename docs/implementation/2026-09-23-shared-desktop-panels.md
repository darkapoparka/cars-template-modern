# Shared desktop heroes and action panels — 23 September 2026

Scope: finalize home, inventory, sell, financing and import desktop heroes and boxes. Work stayed in the saved `main` checkout at `J:/template-repos/cars-template-modern`, remote `darkapoparka/cars-template-modern`. Starting HEAD was `754e8f2`; origin was fetched before changes. Other Modern tasks were idle. The existing Node 22.23.2 dev listener on port 6462 belongs to this checkout.

## Implementation

- `DealerDesktopHero` owns the masthead for all five routes; inventory no longer paints a separate background or sizes its own title. Heroes expand with their forms.
- `DesktopActionPanel` owns desktop panel padding, corners, border, shadow, headings, form surfaces and focus outlines. Search, appraisal, import and financing consume it.
- Home and inventory use the same category tabs, draft filters, visible Show results button and reset behavior in `DealerHeroSearch`. Results count, readable sorting and inventory view controls sit inside the panel. Removed the competing home/inventory overrides and fixed-height search rows.
- Financing shows the actual selected vehicle image, title, facts and detail link beside the preferences. The price and advertised estimate have a clear hierarchy; the call action is a normal 48px button. Preferences explicitly do not recalculate the estimate.
- Vehicle, deposit and term are read from URL state. Native history updates use Next's supported `replaceState(null, ...)` integration, so details → Back and reload retain the selection and preferences. Mobile selection, clearing and phone handoff were checked again after this fix.
- Reviewed and incorporated the pre-existing desktop header, search-dialog/filter-grid, discovery-card, search-summary projection and power/equipment filter changes needed by the resulting desktop UI. Source boundaries, runtime, lockfile and demo/provider separation remain intact. Restored corrupted Bulgarian count labels found in the inherited working changes.
- Corrected the existing category-navigation test's clipped-header click setup and the mobile import test's assumption that canonical URLs have no locale prefix. Added persistent shared-buy-box and financing-return regression coverage in `desktop-panel-flows.spec.ts`.

## Verification

Runtime: Node 22.23.2 and pnpm 11.4.0. Existing full workspace retained.

- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web build`, with the local static-demo environment from `docs/QA.md`: passed, including TypeScript. Repeated after financing state changes.
- `pnpm --filter web test`: 185 tests passed.
- `pnpm --filter @repo/marketplace-ui test`: 82 tests passed.
- Scoped Biome check and staged diff whitespace check: passed.
- Rendered `/en` and `/bg` home, cars, sell, lease and imports at 390, 1024, 1440 and 1920px: 40 route/viewport checks passed without horizontal overflow. Home/inventory panel geometry matched at desktop widths. Inspected desktop screenshots, including Bulgarian sell/finance at 1024px.
- Existing `desktop-category-navigation`, `modern-mobile-completion` and `modern-mobile-service-help` selections: 33 tests ultimately passed. Three first-run failures were stale test assumptions, corrected and rerun; product behavior was not weakened.
- New `desktop-panel-flows`: both tests passed after correcting harness readiness. Covers shared geometry, draft fuel submission/reset, finance selection/estimate, detail return and reload.
- Existing mobile financing selection/reopening and deferred-form dismissal checks: both passed after the URL-state fix. Total selected browser regressions: 37.
- Additional browser actions: import URL → editable request form and sell draft → contact handoff passed; no enquiry was sent and no phone or map action was invoked externally.

Playwright used installed Chrome via a temporary configuration because the workspace's matching bundled Chromium executable is absent. The configuration sets the existing locale-prompt dismissal cookie; tests still use the repository specs. Screenshots and raw local QA scripts were captured under `C:/Users/radev/AppData/Local/Temp/modern-desktop-polish/`.

## Limits and preserved work

The default `/bg/contact` route in the combined dirty dev checkout returns HTTP 500 with Radix's single-child Slot error. Its separate unfinished page changes were not adopted or overwritten. The sell contact handoff and vehicle-detail route work. Automatic approval review rejected starting a separate production preview on port 6464 with only “blocked by policy,” so production runtime confirmation of that contact error was unavailable.

Preserved outside this commit: the mobile content-hub changes, contact-page changes, the earlier implementation ledger additions, old screenshot artifacts, unused generated desktop artwork and unused `desktop-banner-cars` source. No blanket cleanup, branch switch, worktree creation or dealer snapshot replacement occurred.

These checks describe the local combined checkout; this is not an exact-commit source release, mounted/public deployment verification or owner visual acceptance. Forms remain demos/phone handoffs until real delivery is configured and verified. No dealer deployment or external enquiry was performed.
