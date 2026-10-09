# Equal Filters and Sort controls — 5 October 2026

Filters and Sort share a single desktop CSS rule for their 144 × 44 px dimensions, padding, typography, color, border and rounding. The centered pair is 296 px including its 8 px gap. Sort's value container can shrink, and its text uses an ellipsis within the available 90 px; the dropdown retains full option labels and the trigger's hover title exposes its complete selected label. Default Bulgarian text remains “Сортирай.”

Live local checks at 1024 px covered all six Bulgarian sort options with three applied filters: both buttons stayed 144 × 44 px, the longest labels truncated, full labels stayed available, no page overflow occurred and the grid remained at document y486. English controls with a filter badge also measured 144 × 44 px. Default and long-label states were inspected at 1440 px. Scoped Biome, web TypeScript and all seven refactor contracts passed. Automated Playwright suites and a production build were not run for this focused correction.

Screenshots and geometry are in `docs/equal-results-controls-2026-10-05/`; exact preimages, incremental patches and logs are in ignored `runtime/equal-results-controls-20261005/`. Inherited work and the existing Git index lock remain preserved; commit/push is still blocked by that lock. No promotion or deployment occurred.
