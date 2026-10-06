# Boxcar desktop port — 3 October 2026

The initial port below was followed by the same-day [Home 10 desktop refinement](HOME10-DESKTOP-FINAL-2026-10-03.md). That final implementation replaces the homepage frame, hero height and stock spacing recorded here; the supporting desktop components and preserved mobile design remain in place.

The reusable Modern master now uses the curated templates/boxcar-updated desktop composition from the owner's reference at http://127.0.0.1:6455/. The Svelte reference was adapted into Modern's existing Next.js and React components, with Modern's configured dealer identity, actual inventory data, contacts, locale and supported services.

## Desktop implementation

- Matching 90 px header, 1392 px framed homepage hero, 680 px hero height, DM Sans typography and 1090 × 76 px homepage search at 1440 px.
- Boxcar stock panel, vehicle card geometry, service cards, viewing banner and three-column journal; the existing inventory filters remain usable.
- Matching pale 180 px page banners, including reusable decorative source artwork. Desktop service pages use the shared banner.
- Vehicle detail uses the source gallery/title/price hierarchy, separate information sections and matching related cards, with functioning bookmarks, print/share, gallery and phone handoff.
- About has the source gallery, benefits, two-action panel and working native FAQ. Contact has the source map and joined form/details composition using the configured dealer's contact details.
- Shared blue four-column footer and source navigation destinations. Saved cars persist locally, update across tabs, restore keyboard focus in both browser engines, and close when resizing below desktop.
- The static contact form validates and previews locally, with an explicit unsent result and real phone link. The existing configured live delivery boundary is preserved.

This is a desktop design port with Modern content and supported services. Boxcar's separate compare route and new/used catalog data were not introduced. The existing demo/production distinction and original reference asset provenance remain in place. Fifteen new source assets were verified byte-for-byte; see [asset provenance](../apps/web/public/desktop-boxcars/desktop-port-20261003.provenance.json).

## Mobile preservation

All new visual rules begin at 1024 px. Existing mobile page branches, cards, navigation, galleries and content remain intact. The new About route reuses the existing mobile About/Contact component.

Seventeen matched before/after states passed with **zero changed pixels, zero channel delta and identical measured geometry**: eight existing routes at 320 and 390 px, plus Home at 1023 px. [Machine-readable proof](boxcar-desktop-port-2026-10-03/mobile-preservation.json) and [390 px before/after](boxcar-desktop-port-2026-10-03/mobile-home-390-before-after.webp).

The comparison used the same development image/font runtime as the baseline. Production screenshots were checked separately because development and production image encoding differs. An unrelated App-port attempt was excluded. One development-server restart was re-captured successfully; the original receipts remain preserved alongside the successful capture evidence.

## Verification

- Node 22.23.2 and pnpm 11.4.0; complete Modern workspace retained.
- Production static-demo build and TypeScript passed. Build cache and large QA outputs are stored in this task's C: visualization workspace through ignored runtime links.
- L: filled during staging. Two inactive Modern Webpack caches were preserved on C: with verified file hashes and junctions at their original paths. The empty lock created by this task's failed staging command was preserved separately as recovery evidence before retrying; foreign locks and source were retained.
- Existing Web suite: 36 files / 186 tests passed. Marketplace UI suite: 19 files / 85 tests passed.
- Scoped Biome checks passed across all 32 changed source/test/CSS files, with focused rechecks of final edits; git diff whitespace checks passed.
- Sixteen full Chromium/WebKit flow checks passed. Four additional focused checks passed after the final related-card port, including its bookmark behavior.
- Thirty-five Chromium states and five WebKit states had HTTP 200, no page errors, no horizontal overflow and no broken visible images. The final vehicle detail was additionally checked at 1024/1440/1920 px.
- About FAQ and active navigation were checked separately; inventory sidebar position is x=60, y=298, width=280 at 1440 px in both locales.

[Compact check receipts](boxcar-desktop-port-2026-10-03/checks.json) and [tested source hashes](boxcar-desktop-port-2026-10-03/tested-source.json). Complete original PNGs, measured geometry, traces and logs remain under ignored runtime/boxcar-desktop-match-20261003/.

## Rendered review

| Page | Modern desktop | Owner reference |
| --- | --- | --- |
| Home | [English](boxcar-desktop-port-2026-10-03/home-en-1440.webp), [Bulgarian](boxcar-desktop-port-2026-10-03/home-bg-1440.webp) | [Boxcar](boxcar-desktop-port-2026-10-03/reference-home-1440.webp) |
| Inventory | [Bulgarian](boxcar-desktop-port-2026-10-03/inventory-bg-1440.webp) | [Boxcar](boxcar-desktop-port-2026-10-03/reference-inventory-1440.webp) |
| Vehicle | [Bulgarian](boxcar-desktop-port-2026-10-03/vehicle-bg-1440.webp) | Source composition adapted to Modern stock |
| About | [English](boxcar-desktop-port-2026-10-03/about-en-1440.webp) | [Boxcar](boxcar-desktop-port-2026-10-03/reference-about-1440.webp) |
| Contact | [Bulgarian](boxcar-desktop-port-2026-10-03/contact-bg-1440.webp) | [Boxcar](boxcar-desktop-port-2026-10-03/reference-contact-1440.webp) |

Local built preview: http://127.0.0.1:6482/bg (English: /en).

## Ownership and scope

Changes are scoped to the Modern master and its QA evidence. Related pre-existing desktop CSS/header/hero/font draft changes were reviewed and incorporated. The original docs/DESKTOP-HERO-CORRECTION-2026-10-03.md note, unrelated Cars changes, all other templates and dealer sources were preserved. This implementation does not promote a template release or deploy a dealer. Local implementation and verification are complete; owner visual acceptance remains a separate review.
