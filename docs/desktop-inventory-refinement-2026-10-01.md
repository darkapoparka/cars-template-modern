# Desktop inventory refinement — 1 October 2026

The owner rejected this desktop composition. Its visual changes are superseded by [Desktop density correction](desktop-density-correction-2026-10-01.md). The checks below describe this earlier implementation, not the current layout or visual acceptance.

The catalogue keeps Modern's existing black, white and red identity, inventory data, search draft, URL state and filter dialogs. The changes apply at 1024px and above. Mobile card components and mobile layout constants are unchanged.

## Changes

- The inventory search shows make, model, price and year first. An accessible disclosure exposes the remaining eight fields. Its count identifies selected advanced filters even while collapsed; collapsing does not clear the draft.
- Vehicle categories use a compact row. The inventory hero and result toolbar use less space, bringing the cars approximately 120px higher at 1440px.
- The catalogue uses two columns from 1024–1199px and three from 1200px. Responsive image sizes follow those desktop widths while retaining the existing mobile value.
- Shared desktop discovery cards have larger titles and prices, room for long model names, and plain specification text. The Home carousel retains its existing column layout and full search panel.
- No dependencies, providers, dealer content, form delivery, template releases or deployments changed.

## Verification

- Browser: catalogue at 1024, 1440 and 1920px; Home at 1440px. No horizontal overflow in the checked desktop views.
- Mobile: Home and Cars at 320 and 390px. Before/after DOM probes matched all 164 visible structural nodes in each view, including text and bounding boxes. No horizontal overflow. Screenshots were also inspected; these are geometry comparisons, not a claim of identical image pixels.
- Interactions: pointer and Enter-key expand/collapse, fuel selection, search with the advanced section collapsed, selected-filter count, reset, price sorting, grid/list switching, vehicle detail and return to the original sorted search. Diesel search returned seven listings with `fuel=diesel`; reset returned twelve. The restored preview reported no browser console errors.
- Marketplace UI typecheck passed. UI tests: 85 passed. Web tests: 186 passed with `vitest run --maxWorkers=1`. The first web run had a worker startup timeout; the single-worker rerun completed the entire suite.
- Biome check passed for all seven changed source files. `git diff --check` passed.
- Web typecheck and production build passed using the documented static-demo preview environment and Node 22.23.2. Next completed its optimized build, TypeScript check and page generation.

Local screenshots and probes are under ignored `runtime/desktop-refinement-2026-10-01/`. This records local verification, not owner visual acceptance or a reviewed template release.
