# Final desktop audit — 7 October 2026

The approved Modern desktop design was retained. The audit found no layout defect requiring visual polish. The 1400px frame, 352px heroes, current artwork, four-card home sections, grey car-card arrow, section CTAs, and listing purchase panel remain in place.

## Source cleanup

Five files received small changes, with the existing dirty work preserved:

- `packages/marketplace-ui/package.json`: expose the existing `mobile-dealer-title` helper through the package export map. The route-loading component already imports this path.
- `packages/marketplace-ui/components/dealer-desktop-discovery.module.css`: use the existing 32px and 40px typography tokens for the viewing-banner title's responsive bounds.
- `packages/marketplace-ui/components/listing-detail-desktop.module.css`: use the existing 20px and 28px typography tokens and 1.3 line-height token for the desktop listing title.
- `packages/marketplace-ui/components/dealer-desktop-hero.module.css` and `packages/design-system/styles/desktop-tokens.css`: move the location badge's existing colour mixes into named desktop tokens, preserving their values.

These changes correct the package boundary and desktop token contract. They do not alter mobile component logic, copy, assets, layout dimensions, or button treatment. Current dirty preimages and the isolated task diff are retained under ignored `runtime/final-desktop-audit-20261007/`.

## Local browser coverage

The live Next development server was inspected through the in-app browser at `http://127.0.0.1:6482`. The current checkout remained on `main`, based on `5d82fca2b`.

| Locale / viewport | Pages checked |
| --- | --- |
| Bulgarian, 1440 × 1000 | Home, Cars, Mercedes GLS listing, Imports, Lease, Sell, Services, About, Contact, Blog/Guides, two articles, Terms, Privacy |
| Bulgarian, 1024 × 1000 | Home, Cars, listing, Imports, Lease, Sell, Services, About, Contact, Guides |
| Bulgarian, 1280 × 1000 | Home, Cars, listing, Services, Lease |
| Bulgarian, 1920 × 1000 | Home, Cars, Imports |
| English, 1024 × 1000 | Home, Cars, listing, Imports, Lease, Sell, Services, About, Contact, Guides |
| English, 1440 × 1000 | Home, Cars, listing, Imports, Services |
| Bulgarian, 1024 × 700 | Full inventory filter dialog and make/model picker |
| Bulgarian, 320 / 390 / 1023 × 900 | Home, listing, About, Contact, with settled content rather than loading placeholders |

The Blog routes currently redirect to their corresponding Guides routes. These redirects were observed rather than treated as separate content implementations.

No horizontal document overflow, clipped text controls, failed loaded images, or price/arrow intersections were found in the recorded routes. The sample listing title stays on one line at 1024, 1280, and 1440px. Home advice titles remain within two lines. The full filter dialog keeps its reset and results actions within a 700px-high desktop viewport.

## Interaction checks

Twenty interaction assertions passed:

- Guides search and category filtering.
- Services search and category filtering.
- Inventory grid/list switching, make/model filtering, and ascending-price sorting.
- Saving a vehicle, opening the saved-car dialog, and removing the audit's saved vehicle to restore the prior empty state.
- Full inventory filters fitting a short desktop viewport.
- Home make-picker Escape and focus restoration.
- Listing Buy/Finance selection, stable 304px card height, ArrowLeft / Home / End keyboard behavior, and navigation to the calculator with the GLS selected.
- Listing gallery open, Escape, and focus restoration.
- Imports FAQ keyboard behavior and opening the request form.

No real enquiry, phone call, external share, or provider transaction was performed. Sell and Contact received layout and control inspection; their final submission flows were not exercised.

## Appearance and preservation evidence

Matched before/after measurements for Home, the listing, About, and Contact have identical heading and action rectangles, typography, colours, and document dimensions. Four corresponding assertions passed. The listing's complete before/after screenshots are pixel-identical. Other complete screenshots contain differences within photographic banner regions after responsive-image loading across viewport changes; this is not evidence of an artwork replacement or a style change. No intentional visual change was made.

The desktop source changes are breakpoint-scoped; the added badge tokens are consumed by the desktop hero rules. Mobile route captures at 320, 390, and 1023px show the existing composition without new overflow or clipped controls. This audit did not modify mobile CSS or components.

Evidence is in [final-desktop-audit-2026-10-07](final-desktop-audit-2026-10-07/):

- `baseline-desktop.json`, `narrow-desktop.json`, `wide-desktop.json`, and `english-desktop.json`: route measurements and captured states.
- `interactions.json`: 24 passing assertions, comprising 20 interaction checks and four appearance comparisons.
- `appearance-preservation.json` and `pixel-preservation.json`: matched desktop evidence.
- `mobile-preservation.json`: twelve mobile route measurements.
- `before-…` / `after-…` PNGs: route captures; `final-home-preview.png` shows the final Home viewport. Initial full-page captures can include lazy images outside the viewport. The final Home capture was made after scrolling the page and confirming all visible image elements had loaded.

## Checks and limits

- All **94 / 94** tests passed across the existing refactor, package architecture, release preflight, authenticated preview contract, Next typegen, Studio, and release-environment suites.
- Marketplace UI TypeScript check passed with incremental output disabled.
- Biome passed for all five changed source files.
- Release preflight passed for `--target=contracts`.
- Fresh browser navigation after editing produced no new captured errors or warnings. Earlier development hot-reload CSS-chunk warnings were cleared by fresh navigation; they were not treated as a product failure.

This is local rendered and source verification. A production build, immutable release, hosted deployment, live delivery, and public dealer identity review were not part of this desktop polish audit. The underlying seed dealer configuration and its metadata were preserved. No commit, staging, push, release selection, or dealer deployment was performed.
