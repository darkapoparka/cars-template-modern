# Desktop density correction — 1 October 2026

The previous three-column desktop composition made the cards too large and left excessive space above the listings and between model names and prices. This correction supersedes the visual changes in [Desktop inventory refinement](desktop-inventory-refinement-2026-10-01.md).

## Changes

- The catalogue has four columns from 1280px and three from 1024–1279px. Responsive image sizes match these breakpoints and keep the existing mobile size.
- The inventory masthead uses an explicit hero variant with a plain background and no cropped car backdrop. The existing result-title policy supplies its heading, and the duplicate result heading remains available to screen readers.
- Search and the primary filters share one row from 1280px. Smaller desktop widths keep two rows. Expanded filters span the available width, and the disclosure retains its selected-filter count.
- Desktop cards use smaller type and padding, full wrapping model names and a compact wrapping specification row. Natural row sizing aligns prices without a fixed blank title area. List view retains its own layout.
- At 1440px the first photos begin at approximately 313px, versus 457px in the rejected version. Home retains its existing masthead and full search panel; its shared desktop cards receive the same tighter typography and specifications.
- All layout and typography changes apply at 1024px and above. Mobile components, data, providers, assets, dependencies and form delivery are unchanged. No template release or dealer deployment was requested.

## Verification

- Browser inspection at 1024, 1280, 1440 and 1920px: expected column counts, full model names, no horizontal overflow or clipped controls. Home was also inspected at 1440px.
- Advanced-filter disclosure works with pointer and Enter. Diesel selection, collapsed submission and reset retain their existing behavior: seven diesel results and twelve after reset. Price sorting, grid/list switching and detail navigation were checked; returning from a detail restored `currency=BGN&sort=price_asc`.
- Home and Cars at 320 and 390px matched all 164 visible structural nodes in the saved baseline, including text, geometry, typography, spacing and colors. The Cars 320px raw probe had one additional transient image-loading placeholder; the structural comparison excludes only that placeholder slot. These checks do not assert identical image pixels.
- Marketplace UI tests: 85 passed. Web tests: 186 passed. Both suites used `vitest run --maxWorkers=1`.
- Biome passed for all eight changed source files. Scoped `git diff --check` passed.
- Marketplace UI and Web typechecks passed. The Web production build passed with Node 22.23.2 and the documented static-demo preview environment, including optimized compilation, TypeScript and page generation.

Local screenshots and probes are under ignored `runtime/desktop-density-correction-2026-10-01/`. This records local verification; owner visual acceptance and template release remain separate.
