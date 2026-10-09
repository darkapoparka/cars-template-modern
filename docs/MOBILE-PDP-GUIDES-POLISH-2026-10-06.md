# Mobile PDP and Guides polish — 6 October 2026

**Finance and showroom revision:** the owner rejected the small finance illustration and plain showroom card in this pass. [The subsequent revision](MOBILE-PDP-CARDS-REVISION-2026-10-06.md) supersedes those two sections and their earlier 160px finance-card evidence. The Guides and Details/Photos changes below remain in place.

The mobile listing page now uses **Детайли / Снимки** (Details / Photos), with the short description included in Details. Specs and supplied extras use matching white frames; empty extras are omitted. The finance card has dedicated silver artwork, similar cars no longer have a grey outer container, and the showroom section is a compact address card with its existing map toggle.

Guides show the result count inside search, such as `(6)`, and a single title-case category such as **Покупка** on cards and the mobile article header. The separate result-count row and card reading-time metadata were removed. Search, filters and clearing still update the count.

## Visual evidence

- [PDP below tabs: matched before and after](mobile-pdp-guides-2026-10-06/pdp-below-tabs-before-after.png)
- [Guides: matched before and after](mobile-pdp-guides-2026-10-06/guides-before-after.png)
- [Accepted mobile measurements](mobile-pdp-guides-2026-10-06/layouts.json): Bulgarian and English Guides and GLS, plus Bulgarian BMW, at 320px and 390px.
- [Desktop PDP check](mobile-pdp-guides-2026-10-06/desktop-pdp-check.json) and [desktop Guides check](mobile-pdp-guides-2026-10-06/desktop-guides-check.json), at 1440px.
- [Map toggle](mobile-pdp-guides-2026-10-06/map-toggle-check.json) and [final reload](mobile-pdp-guides-2026-10-06/final-reload.json).

The screenshots compare the same CSS viewport and content width without scaling. The 390px PDP body captures are 375px wide because the browser reserves a scrollbar gutter. Initial streamed-loading captures are retained as diagnostics and excluded from the accepted measurements.

## Source changes

- `apps/web/app/[locale]/components/mobile-content-hub.tsx`: result count inside both search layouts; simpler category metadata; removal of the separate count row.
- `apps/web/app/[locale]/guides/[slug]/page.tsx`: simpler mobile article category.
- `packages/marketplace-ui/components/listing-details-tabs.tsx` and `listing-detail-content.tsx`: mobile Details/Photos composition, description placement, finance card and transparent related section.
- `listing-photo-grid.tsx`: actual listing images with the existing full-screen gallery, failure handling and keyboard/focus behavior.
- `listing-specs.tsx` and `listing-equipment.tsx`: matching mobile frames and compact supplied extras; default desktop variants preserved.
- `listing-finance-card.tsx`: 160px mobile card with HTML price/copy and a reserved artwork column.
- `listing-location.tsx`: compact showroom card, existing directions URL and collapsible map.
- `related-listing-card.tsx`: subtle borders on individual mobile cards.
- `packages/marketplace/lead-site.ts`: optional `mobileFinancingArtworkPath`, with the existing finance artwork as a fallback for other configurations.
- `apps/e2e/specs/modern-mobile.spec.ts`, `modern-mobile-completion.spec.ts`, and `docs/QA.md`: focused regression coverage and expectations.

Paths for the `listing-*.tsx` entries above are under `packages/marketplace-ui/components/`. Starting dirty changes in these files were preserved. The existing hero gallery source was not changed.

## Artwork

[Generation source, prompt and preparation](../provenance/assets/mobile-pdp-finance-v1/README.md) are preserved with a SHA-256 manifest. Delivery is `apps/web/public/images/lease/mobile-pdp-finance-silver-v1.webp`, 720 × 302, 62,516 bytes. Preparation only trims transparent outer padding, resizes and encodes WebP.

The silver SUV and percentage disc illustrate financing; they do not replace inventory photography. Artwork fits a reserved column without negative positioning. Copy, approximate monthly amount and the locale-preserving `/lease?vehicle=…` action remain real HTML. The final card is 160px high at both tested mobile widths in Bulgarian and English; the browser selected a responsive 256px image source.

## Verification

- Final production build passed compilation, TypeScript and static generation (8/8), using Node 22.23.2, pnpm 11.4.0 and Next 16.3.8 in provider-free public QA mode.
- Marketplace UI unit tests: **101 passed**. Web unit tests: **188 passed**.
- Final focused Playwright run: **8 passed**, across Chromium and WebKit. This covers Guides search/count/category, serious/critical automated Guides accessibility checks, and PDP photos/lightbox/focus/map/related rail/overflow at 320px and 390px.
- Biome passed on the 13 changed TypeScript files; scoped whitespace checks passed.
- Root `node scripts/check-workflow.mjs` passed after the QA documentation update.
- Manual checks covered both locales at 320px and 390px, desktop 1440px, keyboard tab selection, gallery escape/focus return, map opening/closing, article category and the `/bg/blog` redirect to `/bg/guides`.
- The finance action opened `/bg/lease?vehicle=am-1001` with the BMW X5 selected and its supplied monthly estimate intact.
- Final GLS reload showed no horizontal overflow, error overlay or new console errors. The original user tab was returned to the GLS page and its temporary viewport override cleared.

The current GLS and BMW fixtures each supply one photo. Photos displays supplied images only; additional gallery images and equipment were not invented. Desktop PDP composition and the existing hero gallery were preserved. No dealer deployment or template promotion was performed.

Build/test logs and preimages are retained under ignored `runtime/mobile-pdp-guides-20261006/` and its adjacent named logs. `next-env.d.ts`, `tsconfig.json` and the session fixture were restored to their exact starting hashes after verification.

## Delivery boundary

Work is in the canonical `L:/CODEX/cars` checkout on `main`, starting at `08c89d63f9e11939acd5b135ece4278252b80f43`. Unrelated dirty work is preserved. No staging, commit or push was attempted while the existing zero-byte `.git/index.lock` remains (last written 5 October, 05:43 local). This task did not remove or bypass that lock.

Automatic approval review rejected cleanup of the inactive task build output as **“blocked by policy.”** No deletion occurred; `apps/web/.next-public-e2e-mobile-pdp-guides-20261006-demo` is preserved. That retained output does not change the completed source or verification results.
