# Discovery pill artwork — 6 October 2026

Home and Cars replace the generic outline vehicle icons with small copies of the existing generated silver car, motorbike, van and truck artwork. All four retain the same native selection buttons, labels, selected/glass treatment and keyboard focus. Pills stay 36 px tall, with 12 px between them and 24 px below the search box.

The original assets in `apps/web/public/images/services/` are preserved. Four transparent 96 × 64 px WebP derivatives total 12,448 bytes and render in 36 × 24 px slots. Processing only crops transparent margins and scales proportionally; it does not generate or alter the vehicles. [Asset manifest](assets/DISCOVERY-PILL-ARTWORK-2026-10-06.json) records source and output hashes, dimensions, crop bounds and file sizes.

Source owners are `packages/marketplace-ui/components/dealer-vehicle-type-pills.tsx` and `dealer-hero-search.module.css`. Images use the existing mount-aware PublicImage wrapper, empty alt text, decorative semantics and native lazy loading. The small WebP files are served directly. Styling remains inside the existing minimum-1024-px rules; mobile artwork and controls are unchanged.

| Before — outline icons | After — vehicle artwork |
| --- | --- |
| ![Before Cars](discovery-pill-artwork-2026-10-06/before-cars-pills.jpg) | ![After Cars](discovery-pill-artwork-2026-10-06/after-cars-pills.jpg) |

Matched Home captures and all uncropped views are in [the evidence folder](discovery-pill-artwork-2026-10-06/).

Verification passed:

- Eight BG/EN Home/Cars views at 1024/1440 px: four loaded images, 36 × 24 px artwork, 36 px pill height, preserved 12/24 px gaps and no horizontal overflow. [Measurements](discovery-pill-artwork-2026-10-06/measurements.json).
- Home Trucks selection remains a draft on `/bg`; inventory Trucks selection opens `/bg/trucks?category=truck` with the correct selected state. Keyboard navigation to Vans retains a 2 px focus outline. [Category behavior](discovery-pill-artwork-2026-10-06/category-behavior.json).
- Matched Home/Cars 320/390 px captures retain page dimensions and mobile layout; desktop artwork has zero visible dimensions. The JPEG comparisons have raster differences and are not claimed pixel-identical. [Comparison results](discovery-pill-artwork-2026-10-06/mobile-comparison.json).
- Scoped Biome and Marketplace UI typecheck passed. Refactor contracts passed 7/7; release-preflight contracts passed; release-preflight tests passed 87/87. No fresh browser errors appeared during the final viewport/category checks.

Task preimages remain under ignored `runtime/discovery-pill-artwork-20261006/preimages/`. Prior dirty source/docs/assets are preserved; no commit, template promotion or dealer deployment was performed. A new production build was not run for this local artwork preview.
