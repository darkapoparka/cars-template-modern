# Discovery icons and results spacing correction — 5 October 2026

The preceding miniature vehicle photos with a white CSS filter produced indistinct silhouettes. Home/Cars pills now use one consistent Lucide outline family: CarFront, Motorbike, Van and Truck. Each icon is 20 px, inherits the pill text color and remains decorative beside its localized label. White active and glass inactive pills are retained. Source raster assets and the large hero cutouts remain preserved.

Quick inventory removes the enclosing grey background/padding and reduces the banner-to-toolbar gap from 64 to 16 px. Applied chips move into the left side of the same 44 px toolbar row, with horizontal overflow, while the 344 px Filters/Sort group stays centered. The toolbar-to-card gap decreases from 92 to 16 px. The grid aligns with the banner frame and starts at document y486 rather than y610. Empty and populated chip states use identical geometry; keyboard focus explicitly reveals offscreen chip buttons. Clear all retains the same grid position.

Focused local checks passed for BG/EN at 1024/1440 px with zero and eight applied filters: four outline icons, 16 px gaps, stable centered controls/grid and no page overflow. Keyboard navigation revealed Clear all completely in the narrow chip region, and Enter cleared filters without moving the cards. Home/Cars mobile body/heading/document geometry exactly matched the preceding measurements at 320/390/1023 px. Matched desktop screenshots, an active-filter screenshot, keyboard observations and responsive geometry are in `docs/discovery-correction-2026-10-05/`.

Web TypeScript, scoped Biome and 94 architecture/refactor/preflight tests passed. This was checked in the local development preview; automated Playwright suites and a new production build were not run. Exact preimages, incremental source patches and check logs are in ignored `runtime/discovery-correction-20261005/`. Inherited dirty work and the existing Git index lock remain preserved. The lock prevents scoped commit/push. No release promotion or dealer deployment occurred.

![Matched before and after](discovery-correction-2026-10-05/before-after.jpg)
