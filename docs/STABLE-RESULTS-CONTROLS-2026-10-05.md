# Stable results controls — 5 October 2026

The previous conditional chip row changed height when filters were applied, removed or wrapped. It pushed the car grid down and then back up.

The chip strip now always occupies 56 px. It keeps chips on one line and scrolls horizontally when needed, with a thin native scrollbar. Empty strips are hidden from accessibility output and contain no controls. The Filters button has a fixed 144 px width, so its count badge also leaves the centered controls in place. Chip keyboard focus stays visible inside the strip.

Changed source: `packages/marketplace-ui/components/dealer-inventory-filters.tsx` and `dealer-inventory.module.css`. The existing banner hierarchy test now asserts stable grid coordinates and control width across adding/removing/clearing filters.

Focused BG/EN checks at 1024/1440 px passed with zero and eight filters: controls remained at document y474, width 408 px; the grid remained at document y610; the strip remained 56 px high. At 1024 px the chips scrolled without page overflow. Keyboard Tab reached the offscreen Clear all button and scrolled the strip 161 px. Clear all preserved the grid's document position. Mobile Cars geometry remained equal at 320/390/1023 px.

Scoped Biome and diff whitespace checks passed. The web TypeScript check passed. The updated Playwright spec was not run; the browser checks above used the live local development server. No fresh production build or publication occurred.

Evidence: `docs/stable-results-controls-2026-10-05/`; source preimages/incremental patches: ignored `runtime/stable-results-controls-20261005/`. Existing dirty work and the Git index lock are preserved. The lock still blocks scoped commit/push.

![Stable grid position without and with filters](stable-results-controls-2026-10-05/stable-states.jpg)
