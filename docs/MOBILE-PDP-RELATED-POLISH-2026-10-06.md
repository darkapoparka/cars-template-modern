# Mobile PDP related cards — 6 October 2026

The preceding related cards had a thin outer border and different corners on the nested vehicle card, leaving straight lines around white-on-white content. Each recommendation now has one soft grey surface with matching rounded corners, an inset photo, clear title/price grouping and white specification chips. The overall section keeps its open page layout.

[Matched before/after at 390px](mobile-pdp-related-polish-2026-10-06/before-after-390.png) uses actual page screenshots cropped around the section without scaling. Full captures, horizontal-scroll evidence and measurements are preserved beside it.

## Source changes

- `packages/marketplace-ui/components/related-listing-card.tsx` removes the outer border and owns the mobile card surface. The existing vehicle-card component, listing data, localized copy and links are reused.
- `packages/marketplace-ui/components/related-listing-card.module.css` scopes the transparent inner surface, inherited corners and compact white chips to this mobile wrapper. A 44% photo column leaves the English price enough space; facts can wrap if future content needs it.
- `packages/marketplace-ui/components/listing-detail-content.tsx` retains a full-width recommendation at 320px. From 360px it uses a card width of at least 272px and leaves part of the next recommendation visible. Existing horizontal scroll snapping remains active.

The desktop component and shared inventory/lease vehicle-card owners are unchanged. Existing dirty source, previous finance/showroom work and artwork provenance are preserved. The React best-practices review confirmed no new client state, effects, providers or dependencies, and retained accessible links and inset keyboard focus.

## Verification

- Focused Biome checks on the two TSX files and CSS module passed.
- `pnpm --filter @repo/marketplace-ui typecheck` passed.
- The existing vehicle-card policy and view-policy suites passed: 2 files, 16 tests.
- Live browser checks in BG/EN at 320, 360 and 390px found no horizontal page overflow and all three visible mobile cards' prices and fact chips fit. The 360/390px views expose 29/36px of the next card.
- A horizontal scroll snapped to the next card at 307px. Opening the CLS recommendation reached its matching URL and displayed `2020 Mercedes-Benz CLS 400d 4MATIC`.
- At 1440px, the existing desktop grid remained visible with three recommendations and hidden mobile wrappers; the page had no horizontal overflow.
- No console errors were recorded after the final page load. The original GLS PDP remains open and the temporary viewport override was reset.

The server remains available at port 6482. Verification is local source/browser evidence, with no new production build or publication. No commit or push was made; the existing shared `L:/CODEX/cars/.git/index.lock` remains present and untouched.
