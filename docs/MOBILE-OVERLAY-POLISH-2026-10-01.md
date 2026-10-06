# Mobile search and category overlay polish

Scope: reusable Modern master only.

Vehicle search and the mobile full-filter input share the localized prompt
`Марка или модел` / `Make or model` through `search.makeModelPlaceholder`.
Query matching and filter state are unchanged.

Category descriptions no longer override the line clamp with `block` on mobile.
Shorter Bulgarian and English descriptions use regular weight and occupy one or
two lines. Artwork grows from 56x36px to 72x52px in an 80x64px tile on mobile;
desktop keeps its existing artwork dimensions. At 320px all four category rows
measure 84px, compared with the former 100/140/120/100px heights.

Mobile overlay reset and close buttons already use the shared 44px icon-action
style. Browser measurements confirm both remain exactly 44x44px; their size was
not reduced. Header fields remain 48px, overlay entry fields 52px, and overlay
primary actions have a 48px minimum, as documented in `mobile-patterns.md`.

## Verification

- Web typecheck and the static-demo production build passed; 85 marketplace UI
  tests passed; Biome passed for the four source files.
- Browser checked category rows and reset/close controls in Bulgarian and
  English at 320px and 390px: single-line titles, one or two description lines,
  regular weight, loaded artwork and no horizontal document overflow.
- Short filter prompts fit at 320px in both languages. Desktop home and inventory
  were checked at 1440px for overflow and the existing search path.
- Selecting Trucks from the home picker closes the overlay and updates the URL
  to `/bg?category=truck`, with the matching empty truck inventory label.
- Six existing Chromium/WebKit search and filter-state cases passed, including
  mobile and desktop inventory searches. The first WebKit filter-state run timed
  out waiting for a model button to stabilize; the same test passed unchanged on
  the focused recheck. Both traces/output directories are retained.

Matched 320x844 browser captures and the composed before/after image are stored
under `../runtime/overlay-controls-2026-10-01/`. The comparison is
`overlay-before-after-320.png`.
