# Mobile header silver artwork v2

Prepared 6 October 2026 for the Modern mobile header. The car, motorcycle, truck, van, guide book, filters, help and location artwork retain their existing composition and transparent framing. Only the telephone handset was regenerated: a brighter diagonal silver form improves recognition at 28 px.

The phone was generated through the session image-generation tool with transparent background, using `header-phone-v4.png` for its role and `header-location-v1.png` for the existing silver material. The original output is preserved as `phone-source.png`; the exact prompt is in `prompt.txt`. Older source files remain unchanged.

`prepare-assets.mjs` creates nine transparent WebP files at four times each rendered CSS size (112 or 136 px). These are served directly through the existing mount-aware image component; a second image-optimizer resize is unnecessary. The surrounding 36 px frame, 44 px tap target and category chevron retain their current geometry. `manifest.json` records source/output hashes, byte counts, alpha corners and visible bounds.

Regenerate delivery files from the Modern directory with the pinned Node runtime:

    node provenance/assets/mobile-header-silver-v2/prepare-assets.mjs
