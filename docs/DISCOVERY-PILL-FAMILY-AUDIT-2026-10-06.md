# Discovery artwork family audit — 6 October 2026

The current car, motorbike, van and truck thumbnails were inspected together at source size and their actual 44 × 24 px display size. No further product change was warranted by this review. The image boxes, alignment and spacing match; the silver/charcoal finish, photographic treatment and right-facing front three-quarter direction form a coherent family.

| Property | Verified result |
| --- | --- |
| Export dimensions and aspect | All four are transparent 132 × 72 px WebP, 11:6 |
| Rendered image boxes | All four are 44 × 24 px with `object-fit: contain`, no CSS transform or filter |
| Image placement inside buttons | Identical 15 px left inset and 6 px top inset |
| Tyre baseline inside artwork | Identical 70/3 px from the rendered image top at alpha greater than 64 |
| Horizontal silhouette centre | Centred within 1/6 px of integer export rounding |
| Buttons and spacing | 36 px height, 8 px image-to-label gap, 12 px between buttons and 24 px below search |
| Label typography | Inter, 14/20 px, weight 500 throughout the row |
| State treatments | All four use the same white selected, pale grey selected-hover and translucent inactive treatments |

The export aspect ratio is identical; the actual vehicle silhouettes retain different natural proportions. Their visible dimensions are approximately 42.67 × 21.67 px for the car, 30.33 × 22.67 px for the motorbike, 42.33 × 22.67 px for the van and 32.67 × 22.67 px for the truck. Silver bodywork shares a neutral palette; reflections, tyres, glass and small physical details differ naturally. Camera direction and finish were reviewed visually. Flat raster assets do not establish identical numeric camera angles or lighting parameters, so this audit does not claim those are mathematically identical.

![Verified Cars row](discovery-pill-family-audit-2026-10-06/bg-cars-1440-verified-row.jpg)

[The family board](discovery-pill-family-audit-2026-10-06/family-artwork-board.png) shows the four source silhouettes alongside actual-size examples on light and dark backgrounds. Full live captures are retained in [the evidence folder](discovery-pill-family-audit-2026-10-06/).

Verification:

- All 16 BG/EN Home/Cars desktop views at 1024, 1280, 1440 and 1920 px passed the measurements above, with four loaded images and no horizontal overflow. [Browser measurements](discovery-pill-family-audit-2026-10-06/browser-measurements.json) and [verification](discovery-pill-family-audit-2026-10-06/verification.json).
- Six BG Home/Cars views at 320, 390 and 1023 px confirmed the desktop artwork stays hidden and the page has no horizontal overflow. Product code was unchanged during this audit; these are current boundary checks, not a new matched mobile pixel comparison.
- Each Home category remained a draft on `/bg`. All four selected thumbnails were readable on the same white treatment and retained 44 × 24 px geometry. Selected hover and idle captures are separate. [Hover states and keyboard focus](discovery-pill-family-audit-2026-10-06/selected-states.json), [white idle states](discovery-pill-family-audit-2026-10-06/selected-idle-states.json).
- Keyboard focus was visible when moving from Cars to Motorbikes with Tab.
- Fresh Home/Cars reloads and subsequent selected-state checks logged no fresh errors. [Console verification](discovery-pill-family-audit-2026-10-06/console-verification.json).
- All four active WebP and original source hashes match the preceding van-perspective manifest. [Asset measurements](discovery-pill-family-audit-2026-10-06/asset-measurements.json).

Only audit evidence and this report were added. Existing product source, artwork and shared dirty work were preserved. No new production build, source commit, template release or deployment was performed. Browser captures retain their native JPEG dimensions; evidence crops map the logical viewport coordinates to the native capture rather than claiming pixel-identical exports.
