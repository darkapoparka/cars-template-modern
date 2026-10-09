# Discovery hover and spacing — 6 October 2026

Home and Cars now show a soft grey rounded fill behind each Make/Model/Price field's text and chevron on hover or visible keyboard focus. Adjacent dividers fade so the highlight reads as one capsule. Vehicle-type pills have 12 px between them, previously 8 px, and 24 px below the search box, previously 20 px.

The shared implementation is `packages/marketplace-ui/components/dealer-hero-search.module.css`, entirely within its existing minimum-1024-px rules. Search remains 64 px tall; its charcoal action remains 48 px. Vehicle-type pills remain 36 px tall. Labels, dialog controllers, category behavior, fonts and imagery are unchanged by this task. The local main checkout remains uncommitted, with prior dirty work preserved.

| Route | Before, actual Make hover | After, actual Make hover |
| --- | --- | --- |
| Cars | ![Before Cars](discovery-hover-spacing-2026-10-06/before-cars-buy-box.jpg) | ![After Cars](discovery-hover-spacing-2026-10-06/after-cars-buy-box.jpg) |
| Home | ![Before Home](discovery-hover-spacing-2026-10-06/before-home-buy-box.jpg) | ![After Home](discovery-hover-spacing-2026-10-06/after-home-buy-box.jpg) |

These crops come from native browser captures at the same 1440 × 1000 desktop viewport. The Make field is actually hovered, with focus moved to the preceding header action; no DOM or CSS overrides were used to stage the hover.

Verification passed:

- BG/EN Home and Cars at 1024/1440 px: intended gaps, search/pill dimensions and no horizontal overflow. [BG measurements](discovery-hover-spacing-2026-10-06/measurements.json), [English checks](discovery-hover-spacing-2026-10-06/english-checks.json).
- All three fields on both pages open and dismiss their existing dialogs, with grey hover fills and adjacent dividers hidden. Cars keyboard focus retains its 2 px outline, Enter opens Make and Escape restores focus. [Field checks](discovery-hover-spacing-2026-10-06/field-interactions.json), [keyboard check](discovery-hover-spacing-2026-10-06/keyboard-check.json).
- Matched BG Home/Cars full-page captures at 320/390/1023 px retain the same page dimensions and mobile layout. Both 1023 px pairs are pixel-identical. The four 320/390 px JPEG pairs contain raster differences and are not claimed pixel-identical; all raw captures and [comparison results](discovery-hover-spacing-2026-10-06/mobile-comparison.json) are retained. No mobile CSS was changed.
- Scoped Biome, `pnpm refactor:contracts` (7/7), `pnpm release:preflight:contracts` and `pnpm release:preflight:test` (87/87) passed.

Turbopack emitted two CSS hot-refresh errors during editing; no fresh browser errors appeared after reload and the subsequent field/locale checks. An existing Home viewing-image position warning is outside this change. A new production build was not run for this CSS-only preview; earlier build evidence does not certify this exact change. No template release or dealer deployment was performed.
