# Mobile PDP finance studio artwork — 6 October 2026

This replaces the small silver SUV/percentage-disc composition in the first mobile PDP pass. The new banner uses a substantial frontal SUV and graphite studio setting, with calm space for real HTML copy on the left.

`source.png` is the unmodified generation output; `prompt.txt` is the exact prompt. The original Codex generation is preserved. `prepare-assets.mjs` only resizes to 1080px and encodes WebP, without cropping, repainting or semantic edits. Delivery is 1080 × 540, 51,350 bytes, at `/images/lease/mobile-pdp-finance-studio-v2.webp`. The manifest records source and delivery SHA-256 hashes.

The SUV is promotional illustration, separate from the listing photographs. `ListingFinanceCard` uses it as a full-card background with centered HTML title, marketing copy and action. Its minimum height is 208px, and the action retains a 44px treatment and an inset keyboard-focus outline. The locale-preserving link passes the supplied listing ID to the Leasing page; the card adds no financing terms or calculated offers.

`leadSite.mobileFinancingArtworkPath` selects this source for the master. Existing configurations without the override retain their configured finance artwork. The preceding source and delivery remain preserved under `mobile-pdp-finance-v1`.

From Modern, prepare with the pinned Node runtime:

    node provenance/assets/mobile-pdp-finance-v2/prepare-assets.mjs
