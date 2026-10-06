# Desktop inventory filter controls — 4 October 2026

The Cars hero had a useful search capsule, but each field opened the entire 13-section filter navigation. Filters also competed with the capsule, while Quick/Sidebar crowded the results toolbar. This follow-up gives each action a clearer place and reuses the existing filter state.

## Result

- Make, Model, Price and Search cars open focused dialogs from the banner. Make/Model retains searchable stages and dependent selection rules. Model opens its stage when a make is selected; choosing a make remains the first step otherwise.
- Filters and Sort share one centered container below the banner: blue Filters, neutral Sort. Count is on the left; Grid/List is on the right.
- Quick/Sidebar lives in the smaller template preview menu beside Grid/List. The menu is gated by the master preview identity; personalized dealer configuration still chooses the default layout.
- Full Filters has four groups: Vehicle, Price and year, Specifications, and Location. All 13 supported sections remain available. Related fields share cards and one scroll area, with a fixed Reset/Show results footer.
- The focused and full dialogs reuse the existing controlled draft and URL controller. Apply commits; Escape or dismissal discards edits and restores trigger focus. Focused Clear changes only that section. Switching full groups preserves selections and commits numeric edits before unmounting the previous group.
- Applied-filter chips, sorting, view mode, sidebar drafts and the dealer-scoped layout preference retain their existing behavior.

## Rendered evidence

The before captures are the previous production preview on 6482. The after captures use the new production output at the same 1440 × 1000 viewport, BG locale and returning-visitor state.

| Surface | Before | After |
| --- | --- | --- |
| Cars page | [Before](assets/modern-inventory-filter-controls-20261004/inventory-before.png) | [After](assets/modern-inventory-filter-controls-20261004/inventory-after.png) |
| Full Filters | [Before](assets/modern-inventory-filter-controls-20261004/filters-before.png) | [After](assets/modern-inventory-filter-controls-20261004/filters-after.png) |

[Focused Make](assets/modern-inventory-filter-controls-20261004/make-dialog.png) · [Focused Price](assets/modern-inventory-filter-controls-20261004/price-dialog.png) · [Verification record](assets/modern-inventory-filter-controls-20261004/verification.json).

## Verification

- Scoped Biome check; explicit web typecheck; Next 16.3.8 production webpack build with Node 22.23.2 and pnpm 11.4.0.
- Marketplace UI: 95 tests across 20 files. Web: 186 tests across 36 files.
- Refactor contracts: 7 tests. Release preflight contracts passed; release harness: 87 tests.
- BG/EN Cars captures at 320, 390, 1023, 1024, 1280, 1440 and 1920 px; BG/EN Home captures at 320, 390 and 1440 px. All 20 states have settled content, complete visible images, no horizontal overflow and no console/page errors.
- Twelve preservation comparisons have exactly zero changed pixels: BG/EN Cars at 320, 390 and 1023 px, and BG/EN Home at 320, 390 and 1440 px.
- Chromium and WebKit, BG/EN: 32 Axe scans across the page, all four full-filter groups, focused Make, Price and Search. Zero WCAG A/AA violations. All four groups and focused Make/Price keep the footer reachable at 600 px viewport height; Escape restores focus.
- Forty-eight browser scenarios qualified: 24 Chromium and 24 WebKit. The final batch passed 47/48; one WebKit Apply click timed out while waiting for stability, then passed in an isolated run in 7.1 seconds. Both runs and the earlier failure traces are retained; automatic retries and skips are zero.
- Canonical 6482 serves the qualified build on BG/EN Cars with HTTP 200. Full and focused dialogs open, dismiss and restore focus. Its banner/control rows match the reviewed candidate capture exactly, with no console/page errors or horizontal overflow.

The first browser launch used a stale cookie-fixture output path and failed before creating pages. Subsequent qualification corrected obsolete preview-button selectors, waited for closing menus and resized layouts to settle, and retained the existing default-currency URL contract. These harness failures and their traces are preserved under the ignored task runtime.

## Source and limits

The shared implementation is in `packages/marketplace-ui/components/`: inventory search/summary/filter composition, the full-filter dialog and its shared fields/group renderer. `lib/desktop-full-filter-policy.ts` defines the groups. Existing browser suites and a reusable preview-menu fixture verify the new controls. `TEMPLATE.md` and `docs/QA.md` describe the resulting behavior.

Evidence and helper scripts remain under `runtime/cars-filter-controls-20261004/`. The production output is `apps/web/.next-public-e2e-cars-filter-controls-20261004-demo`, build ID `WEJu161wL4yhsr__st2x3`. Thirteen product source hashes are retained and checked against the reviewed output. Previous production outputs, the unrelated hero-correction draft, and all other template/dealer work are preserved.

This is local reusable-master polish. Template promotion, dealer publishing and owner visual acceptance remain separate checks.
