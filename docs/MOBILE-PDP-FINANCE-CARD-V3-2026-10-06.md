# Mobile PDP finance card — 6 October 2026

Superseded by the owner's requested [full photographic leasing banner](MOBILE-PDP-FINANCE-PHOTO-2026-10-06.md). This report and its captures preserve the preceding iteration.

The preceding finance card put its action over the car and gave the supplied monthly amount little visual emphasis. This revision gives the decorative illustration its own contained slot and makes the payment the main content in the lower row.

[Matched before/after at 390px](mobile-pdp-finance-card-v3-2026-10-06/before-after-390.png) uses actual page screenshots from the same viewport, cropped at the same document coordinate without scaling. The full captures and measurements remain in the same folder.

## Implementation

- `packages/marketplace-ui/components/listing-finance-card.tsx` now owns the finance-specific markup: an 18px title and contained illustration above a 22px payment amount, monthly caption and 44px action. The three-column header assigns two columns to the artwork. The payment and action occupy a separate row in normal flow, so neither overlays the car.
- The whole card remains a single keyboard-accessible link, with a visible white inset focus outline and the existing locale-preserving selected-vehicle URL. The amount remains supplied listing data in its original currency; no financing calculation or approval claim is introduced. The action still reads Conditions/Options rather than claiming to calculate financing.
- `packages/marketplace/lead-site.ts` selects the new generated asset through the existing optional `mobileFinancingArtworkPath`. Other existing dealer artwork fallbacks remain intact.
- The shared showroom component and its 176px photograph are unchanged. The new finance card is 176px, with no clipped content at the tested mobile widths.

## Artwork

[Generation source, prompt, preparation script and hashes](../provenance/assets/mobile-pdp-finance-v3/README.md) are preserved. The silver SUV and charcoal calculator form one decorative group. Preparation trims empty alpha padding, restores a transparent safety margin, and resizes/encodes the WebP; no objects are moved or repainted.

Delivery is `/images/lease/mobile-pdp-finance-cutout-v3.webp`, 640 × 283px, 48,624 bytes. The already prepared local derivative is served directly through the existing mount-aware image component. The complete illustration uses `object-contain` in a fixed 88px-high slot, preserving its proportions without cropping.

## Checks

- [Mobile measurements](mobile-pdp-finance-card-v3-2026-10-06/layouts.json): BG/EN at 320px and 390px. Both title and payment fit; the illustration loaded, remained contained above the payment row, and the page had no horizontal overflow. All four cases measured a 176px card, 22px payment type and 44px action.
- [Selected-car action](mobile-pdp-finance-card-v3-2026-10-06/action-check.json): clicking the card opened `/bg/lease?vehicle=am-1010`, with the GLS selected and the existing 1870 BGN estimate intact. No request was submitted.
- [Secondary listing](mobile-pdp-finance-card-v3-2026-10-06/secondary-listing-check.json): the CLS displayed its supplied 1125 BGN estimate without overflow at 320px. This listing contains an estimate, so this check is not evidence for the absent-estimate branch.
- [Keyboard](mobile-pdp-finance-card-v3-2026-10-06/keyboard-check.json): reverse Tab reached the card; its white 2px outline and -4px inset were visible.
- [Desktop](mobile-pdp-finance-card-v3-2026-10-06/desktop-check.json): the mobile card stays hidden at 1440px; no page overflow.
- `pnpm --filter @repo/marketplace-ui typecheck`, Biome for the changed source/preparation files, and scoped whitespace checks passed. The active Next dev server compiled and served the revised component. A new production build was not run for this local card revision.
- Two development HMR messages reported a missing old CSS chunk while editing. [Fresh-tab and original-tab reload checks](mobile-pdp-finance-card-v3-2026-10-06/fresh-console-check.json) were clean. The temporary QA tab was closed, leaving the original Bulgarian GLS tab with its viewport override reset.

## Delivery

The two changed source paths, new WebP and provenance remain in the canonical Cars checkout on `main`. Source preimages and the comparison script are retained under ignored `runtime/mobile-pdp-finance-card-v3-20261006/`. Prior generated artwork and independent dirty work are preserved. The existing shared `.git/index.lock` remains; no commit, push, template release or dealer deployment was performed.
