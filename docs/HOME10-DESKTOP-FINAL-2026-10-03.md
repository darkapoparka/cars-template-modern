# Modern desktop final — Home 10

Modern's desktop homepage is finalized around the owner's Boxcar Home 10 direction: a white header, contained photograph, one clear search action, and stock immediately below. The implementation uses the existing Next.js 16.3.3 and React components in the complete Modern workspace, with the configured dealer identity, inventory, locale and supported services.

The shared header, homepage hero, stock panel and supporting homepage sections now align to a frame capped at 1320 px. Side margins are 40 px at 1024/1280 px, 60 px at 1440 px, and 300 px at 1920 px. The responsive hero is 460–520 px tall, replacing the initial port's 680 px height. The headline is capped at 60 px; the image overlay keeps the heading readable while allowing the car to appear brighter below the search. The original photograph and its provenance remain unchanged.

The stock panel uses a smaller heading and tighter spacing. At 1440 px, its first card row begins at y=838 instead of y=1085. Existing filters, sort links, save actions and service destinations retain their behavior. The existing desktop regression test now checks the contained frame, matching header alignment, compact hero and stock appearing before y=900 in both locales.

## Rendered review

| State | Evidence |
| --- | --- |
| Bulgarian, 1440 × 900 | [Before](home10-desktop-final-2026-10-03/home-bg-1440-before.webp), [final](home10-desktop-final-2026-10-03/home-bg-1440-after.webp) |
| English, 1920 × 900 | [Final](home10-desktop-final-2026-10-03/home-en-1920-after.webp) |
| Mobile, 390 px | [Preserved homepage](home10-desktop-final-2026-10-03/mobile-home-390.webp) |

Built preview: http://127.0.0.1:6482/bg; English: /en. The original Boxcar research reference remains at port 6455.

## Mobile preservation

All consumers of the changed desktop frame/hero tokens are inside media queries beginning at 1024 px. Mobile source, cards, navigation, galleries, artwork and content are preserved.

Seventeen matched production before/after states have **zero changed pixels, zero channel delta and identical measured geometry**: Home, Cars, vehicle detail, Contact, Imports, Sell, Leasing and Blog at 320/390 px, plus Home at 1023 px. [Comparison receipt](home10-desktop-final-2026-10-03/mobile-preservation.json).

Two initial captures were unsettled: lazy vehicle-detail artwork and a seven-pixel painted edge on Imports. Both were re-captured after visible asset decoding and stable painting, and matched exactly. Original captures and receipts are retained alongside the selected settled frames in ignored runtime/boxcar-home10-final-20261003/.

## Verification and ownership

- Node 22.23.2 and pnpm 11.4.0; Next.js production static-demo build and the separate web TypeScript check passed.
- Web: 36 test files / 186 tests passed. Marketplace UI: 19 files / 85 tests passed.
- Four changed CSS/test files passed Biome and scoped whitespace checks.
- Sixteen existing desktop flow tests passed in Chromium and WebKit, covering the frame, navigation, filters, saved cars, gallery, phone handoff, financing preferences, imports and the local enquiry preview.
- Twenty-seven Chromium states and four WebKit states returned HTTP 200, with no page errors, horizontal overflow or broken visible images. Home was checked in Bulgarian and English at 1024, 1280, 1440 and 1920 px; supporting route checks also cover the shared header.

[Compact check receipts](home10-desktop-final-2026-10-03/checks.json) and [tested source hashes](home10-desktop-final-2026-10-03/tested-source.json) record the verified code. Full PNGs, geometry, logs, the successful production build and preserved baseline remain in the ignored task runtime. Build caches are separate from the prior preview build.

This follow-up changes three desktop stylesheets, the existing desktop regression test and the related template/QA documentation. The pre-existing untracked DESKTOP-HERO-CORRECTION-2026-10-03.md note and unrelated Cars work are preserved. The full Next.js workspace, static-demo/production boundary and asset ownership remain intact. This completes the requested local desktop implementation; template release selection and dealer publishing retain their separate Cars workflow.
