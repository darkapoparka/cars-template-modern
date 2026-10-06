# Mobile PDP showroom artwork — 6 October 2026

`reference.webp` preserves the existing illustrative showroom image `/day-night-contact-hero-v1.webp`. Image generation edited its nighttime exposure to brighter blue-hour lighting while retaining the building, road and viewpoint. This remains illustrative template artwork, not evidence of the dealer's actual premises.

`source.png` is the unmodified edit output; `prompt.txt` is the exact edit prompt. The original Codex generation is preserved. `prepare-assets.mjs` only resizes and encodes the output, with no further crop, repainting or semantic edits. Delivery is 1080 × 720, 180,456 bytes, at `/images/lease/mobile-pdp-showroom-blue-hour-v1.webp`. The manifest records reference, generated source and delivery SHA-256 hashes.

`leadSite.mobileShowroomArtworkPath` is optional and used by the mobile PDP only. Dealer configurations without it retain `publicSite.artwork.contactHero`. Other Contact/About and desktop artwork roles are unchanged. Address, city, directions URL and map URL remain the configured data in HTML.

The shared banner places the copy on a lower gradient, with a 224px minimum height and the same 44px action treatment as financing. The map disclosure follows within the dark card; its iframe and accessible link behavior are preserved. Keyboard focus uses a white inset outline on the dark background.

From Modern, prepare with the pinned Node runtime:

    node provenance/assets/mobile-pdp-showroom-v1/prepare-assets.mjs
