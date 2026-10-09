# Approved first MODERN logo

The owner preferred the original generated MODERN logo's wide geometric
lettering over the taller second draft. The template now points to
`apps/web/public/images/brand/modern-logo-v2.webp`, prepared directly from the
attached approved PNG. The shared logo component and its sizing are unchanged.

The first generated original and the attachment have identical alpha pixels.
The delivery crop keeps the visible lettering and emblem at their original
1843x264 resolution, with lossless WebP encoding and no resizing, redrawing,
font substitution or SVG conversion. All retained alpha and visible RGB pixels
match the attachment. CSS uses only the alpha to provide the existing white
and dark versions. The complete approved PNG and hashes are retained under
`provenance/assets/modern-logo-v2/`; earlier v1 assets are preserved.

The configuration change is confined to `desktopPreviewIdentity.markArtwork`.
Its static-demo/source-slug guard continues to keep this template identity out
of personalized dealer copies.

Focused checks passed:

- Exact retained alpha/visible-RGB comparison against the attached PNG.
- All 30 existing `packages/marketplace/site-config.test.ts` cases, including
  source-slug and non-static preview guards.
- Biome on `packages/marketplace/lead-site.ts` and scoped `git diff --check`.
- Local Chromium: Cars BG at 320, 390 and 1440px, its menu at 390px, Services EN
  at 390px and Contact BG at 1440px. Every displayed logo uses v2 and fits its
  surface, with no page overflow. Header, menu, Contact and footer retain their
  correct white/dark colors. The fresh tab recorded no console errors.
- The configuration matches its task preimage except for the one artwork path;
  unrelated dirty source remains intact. No generated type/build files changed.

Matched before/after captures and pixel/browser evidence are retained in
`docs/modern-approved-logo-2026-10-06/`. This asset-only selection does not
repeat the preceding shared-component production build recorded in
[Generated logo](MODERN-GENERATED-LOGO-2026-10-06.md). This is a local
source/artwork update; no commit, push, template release or dealer deployment
was performed.
