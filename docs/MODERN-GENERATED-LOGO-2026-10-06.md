# Generated MODERN logo

The owner subsequently approved the first concept's wider lettering. The
current template uses that exact attached artwork as v2; see
[Approved first logo](MODERN-APPROVED-LOGO-2026-10-06.md). The report below
records the preceding second draft and the shared component's implementation.

Created and applied a new image-generated MODERN logo to the local template
master at the owner's request. The artwork combines a compact angular M mark
and a bold geometric wordmark. It replaces the preceding text-only preview
identity in the existing shared logo component.

## Implementation

- `packages/marketplace/lead-site.ts` supplies optional
  `desktopPreviewIdentity.markArtwork`. The field name avoids collision with
  Cars' ordinary `logoPath` adaptation field.
- `packages/marketplace/site-config.ts` maps the asset into the existing preview
  identity, validated by `packages/marketplace-domain/site-config.ts`.
- `packages/marketplace-ui/components/dealer-desktop-logo.tsx` and its CSS module
  render the generated alpha silhouette in the surface's foreground color.
  Mobile/desktop headers, the mobile menu, desktop footer and Contact share the
  same artwork and accessible Modern label. White and dark versions preserve
  exactly the same silhouette. Local paths retain the existing base-path helper.
- The existing static-demo/source-slug guard remains authoritative. Adapted
  dealer copies continue to use their configured raster and inverse logos.
  Preview configurations without artwork retain the text fallback.

The delivery asset is `apps/web/public/images/brand/modern-logo-v1.webp`, a
transparent, lossless 960x137 WebP of 60,548 bytes. Its prompt is recorded beside
it. The portable original PNG and hashes are preserved in
`provenance/assets/modern-logo-v1/`; the tool's original files remain intact.

## Validation

- All 30 existing `packages/marketplace/site-config.test.ts` cases passed,
  including the personalized-slug and non-static preview guards.
- `pnpm --filter web typecheck` passed with Node 22.23.2 and the local demo
  environment. The production Next build also passed compile, TypeScript and
  static generation using run ID `modern-generated-logo-20261006`.
- Biome checked the five changed source/CSS files; scoped `git diff --check`
  passed.
- Local Chromium: Services in BG/EN at 320, 390 and 1440px; Home, Cars, Import,
  Sell, Leasing, Contact and About at relevant 320/390px widths; Contact at
  1440px. All measured logo slots fit without horizontal page overflow.
- White branding is visible on dark mobile headers and the desktop footer;
  dark branding is visible in the menu, desktop header and Contact form.
  Menu close restored focus; the desktop logo navigated to Home.
- A fresh Services load recorded no console errors. The tab used during edits
  recorded transient Turbopack CSS hot-refresh errors; these did not recur on
  the fresh load.
- Build/type generation changed only this task's generated `next-env.d.ts`
  imports. Its exact preimage was restored after verifying the generated hash.
  `tsconfig.json` was unchanged.

Matched screenshots, light/dark surface previews, dimensions, source paths and
browser checks are under `docs/modern-generated-logo-2026-10-06/`.

Existing dirty template work was preserved. No branch, commit, push, template
release or dealer deployment was performed. These checks establish local
Chromium/build behavior, not hosted or native acceptance.
