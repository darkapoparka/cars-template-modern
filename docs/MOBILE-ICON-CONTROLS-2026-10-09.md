# Mobile icon controls — 9 October 2026

The mobile listing back/share buttons painted 44px circles while the main-page
header painted 40px circles inside 44px tap targets. The image expander was a
53×36px pill, the photo viewer close circle painted 32px, and the floating phone
action used a 52px circle.

These controls now share a 40px painted circle inside a 44px target. The common
geometry lives in `packages/marketplace-ui/lib/mobile-header-icon-action.ts`.
Mobile overlay back/close controls share it too. Back/share/expand and photo
viewer action glyphs use 18px. Existing header/phone artwork retains its slot.
The image expander is a circle, with the truthful photo count shown separately.
Detail corner actions also use the main header's 16px gutters and 12px top inset.

The photo retains its original source, dimensions and crop. The main-page header
region at 390px and the entire detail screenshot at 1440px have zero changed
pixel bytes in matched captures. Desktop gallery sizing is preserved with
breakpoint-scoped inset/glyph rules.

Validation: scoped Biome checks; marketplace UI and web TypeScript checks;
157 existing marketplace UI unit tests; 38 reachable overlay states per locale
in Bulgarian and English Chromium at 320px; detail/gallery captures at
320/390px and desktop at 1440px. The sample listing has one photo; gallery
previous/next actions reuse the same responsive rule and retain their existing
index/keyboard behavior.

Matched screenshots, measured geometry, preservation comparisons and any
development-server retries are in ignored
`runtime/mobile-pdp-controls-20261009/`.
