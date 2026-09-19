# Public artwork derivatives

Six original PNGs were moved from the served public tree into `originals/` on 19 September 2026. The four hero/promotion WebP derivatives retain their source dimensions and were verified for pixel equality. The two navigation sprite derivatives are intentionally resized from 2172 × 724 to 600 × 200, then encoded with lossless WebP; lossless encoding does not mean that resizing preserves the original pixels. Their aspect ratio and CSS crop positions are unchanged and the mobile inventory snapshots pass without updating expectations.

The navigation sprites serve five 40px icons at up to 3× device-pixel ratio. Original files, dimensions, hashes, derivative sizes and the resized flag are recorded in [derivatives.json](derivatives.json). Original generation attribution and license records elsewhere in the repository remain authoritative. No new image was generated or creatively redrawn in this refactor.

`apps/web/asset-redirects.json` preserves all six former public URLs. These redirects preserve standalone compatibility; Cars mounted packaging must be qualified independently before release.
