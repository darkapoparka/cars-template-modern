# Mobile PDP card layout — 6 October 2026

The subsequent [finance card revision](MOBILE-PDP-FINANCE-CARD-V3-2026-10-06.md) replaces only the finance layout and artwork described below. The showroom sizing remains current; the finance comparison and 160px measurement below describe the preceding pass.

The preceding finance banner reserved half its width for a vertical title, payment, caption and action. The owner identified that stack and the showroom's height as too heavy. This follow-up keeps the photographic assets and makes the layout more compact.

[Matched before/after at 390px](mobile-pdp-card-layout-2026-10-06/before-after-390.png) uses actual page captures, cropped from the same document coordinate without resizing. Full before and after captures remain in the same folder.

## Changes

- `packages/marketplace-ui/components/listing-cta-banner.tsx` places finance copy and its action beside each other at the bottom of the image. The text column uses the available space instead of a 50% maximum. Finance height reduces from 192px to 160px; showroom imagery reduces from 224px to 176px, with the existing map disclosure below it.
- `packages/marketplace-ui/components/listing-finance-card.tsx` puts the existing approximate amount and `/мес.` or `/mo.` suffix on one line at the tested widths. The heading stays above that line. Amount formatting and the selected-vehicle URL remain intact.

Both cards retain their 18px headings, 16px padding, rounded frames, decorative artwork and 44px action treatment. Content remains in normal flow so longer dealer copy can increase the height without clipping.

## Verification

- [Browser measurements](mobile-pdp-card-layout-2026-10-06/layouts.json): Bulgarian and English at 320px and 390px. Finance measured 160px, showroom 176px, payment one line, actions 44px, artwork loaded, and no page or text overflow in all four cases.
- [Desktop check](mobile-pdp-card-layout-2026-10-06/desktop-check.json): both mobile cards remain hidden at 1440px and the page has no horizontal overflow.
- `pnpm --filter @repo/marketplace-ui typecheck` passed.
- Biome checks and scoped `git diff --check` passed for both edited TypeScript files.
- No browser console errors were captured during the layout checks. The existing 6482 dev server compiled and served the changed source. No new production build was run for this layout-only follow-up.

The user's tab was returned to the Bulgarian GLS listing and its temporary viewport override was reset. Source preimages and the screenshot comparison script are retained under ignored `runtime/mobile-pdp-card-layout-20261006/`.

## Delivery

Changes remain local in the canonical Cars checkout on `main`. Existing dirty work is preserved. The shared Cars `.git/index.lock` remains in place; no commit, push, template promotion or dealer deployment was performed.
