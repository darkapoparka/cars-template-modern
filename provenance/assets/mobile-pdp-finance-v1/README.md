# Mobile PDP finance artwork — 6 October 2026

`source.png` is the unmodified transparent image-generation output: a neutral silver SUV facing left with a matching silver percentage disc. The original generated file remains preserved in the Codex generated-images directory. `prompt.txt` contains the exact generation prompt.

The artwork is an illustration for the leasing action, not a photograph of the selected inventory vehicle. Card copy, the supplied monthly estimate and the selected-vehicle URL remain real HTML; no financing terms or approval claims are baked into the image.

`prepare-assets.mjs` trims transparent outer padding, scales the cutout to 720 px and encodes a 720×302 px WebP at quality 94. No repainting, recoloring or semantic editing is applied. The delivery file is **62,516 bytes**. `manifest.json` records the input and output hashes, dimensions and preparation.

The mobile card reserves one right-hand column for the complete illustration, with independent HTML copy to the left. It is 160 px high at the checked 320/390 px widths in BG and EN. The normal mount-aware Image wrapper selects a responsive optimizer source; the live 390 px inspection selected a 256 px candidate. The source `src` fallback lists a larger width, so request sizing was verified from `currentSrc`.

`leadSite.mobileFinancingArtworkPath` owns the optional artwork override. Dealer configurations without it retain their existing `financingArtworkPath` fallback. Existing finance, services and desktop artwork are preserved.

Regenerate the delivery file from Modern with the pinned Node runtime:

    node provenance/assets/mobile-pdp-finance-v1/prepare-assets.mjs
