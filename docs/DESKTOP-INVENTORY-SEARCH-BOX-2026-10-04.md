# Modern desktop inventory search box — 4 October 2026

Cars now carries Home's white search-box styling into its photographic banner. Make, Model and Price share a capsule with Search cars; Filters sits beside it. The results panel keeps its count, Quick/Sidebar preference, sorting and Grid/List controls, with removable applied-filter chips below that row.

The controls reuse the existing full filter dialog and URL state. Make and Model open their vehicle stage, Price opens its range, Search cars opens keyword search, and Filters opens vehicle selection with all 13 sections available. Drafts stay together while changing sections; Show results applies them, and dismissal discards changes. Removing one chip preserves other filters and sorting.

## Implementation

- `dealer-inventory-search.tsx` is a stateless control surface with a small CSS Module. The capsule shares Home's `dealer-hero-search.module.css`; inventory adjustments use an explicit context selector.
- `DealerDesktopToolbar` owns the banner placement. Its props distinguish interactive controls from the disabled route-loading header and remove unused presentation props.
- `MarketplaceShell` supplies one modal-opening callback. The results panel no longer carries unused Make/Model/section callbacks or the old quick-button styling.
- Triggers focus themselves before opening. This preserves the return target in WebKit, where pointer clicks do not automatically focus buttons. Escape restoration is covered in both engines.
- Inventory composition and styling remain scoped to 1024 px and wider.

## Verification

Production build: `cqFgx3wzUJxsaS4m4bNPr`, using Node 22.23.2 and pnpm 11.4.0 in static-demo/public-E2E mode. The candidate was reviewed at port 6492 before updating the requested port 6482.

| Check | Result |
| --- | --- |
| Scoped Biome check, 14 source/test files | Pass |
| `pnpm --filter web typecheck` | Pass |
| `pnpm --filter web exec next build --webpack` | Pass |
| UI unit tests | 95 passed |
| Web unit tests | 186 passed |
| Refactor contracts | 7 passed |
| Release preflight contracts and tests | Pass; 87 tests passed |
| Focused Chromium/WebKit suites | 40 passed; 20 per engine, no retries or skips |
| BG/EN page and modal accessibility scans | 8 scans; zero WCAG A/AA violations |
| All 13 modal sections at 1440 × 600 in both locales/engines | Footer reachable, no overflow, Escape focus restored |

Full-page captures cover BG/EN Cars at 320, 390, 1023, 1024, 1280, 1440 and 1920 px, plus BG/EN Home at 320, 390 and 1440 px. All 20 states have loaded images, no horizontal overflow and no console/page errors. The 12 preservation comparisons have zero changed pixels: Cars at 320/390/1023 and Home at 320/390/1440 in both languages.

The browser suites exercise keyword and Make/Model drafts, numeric commits between sections, apply/reset, independent clearing, sorting, Grid/List, sidebar draft preservation, preference reload and blocked storage, category/browser-Back navigation, Home search, header loading continuity and the listing gallery/phone handoff.

## Matched screenshots

BG Cars, 1440 × 1000, returning visitor, no applied filters:

![Before](assets/modern-inventory-search-box-20261004/inventory-before.png)

![After](assets/modern-inventory-search-box-20261004/inventory-after.png)

[Full filter dialog](assets/modern-inventory-search-box-20261004/filters-after.png) · [Verification receipt](assets/modern-inventory-search-box-20261004/verification.json)

## Scope and preservation

The shared Cars main checkout and unrelated edits were preserved, including the separate hero-correction draft. The task uses an isolated production output; its generated Webpack cache was retained on C: through a junction after an earlier storage error. Source, dependencies, old preview output and recovery evidence were retained. Detailed runtime logs and failed-focus traces remain under `runtime/cars-search-polish-20261004/`.

This qualifies the local standalone static demo. Immutable template promotion, mounted dealer publication and configured provider delivery retain their separate release checks.
