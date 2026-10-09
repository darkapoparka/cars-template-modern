# Mobile Services, navigation assets and service headers

Local Modern source correction on `main` at
`08c89d63f9e11939acd5b135ece4278252b80f43`, verified against the existing
Node 22.23.2 preview at `http://127.0.0.1:6482`.

## Result

- Sell and Leasing now consume a versioned sprite with genuine alpha
  transparency. V2 had an opaque white background; the earlier blend-mode
  workaround was insufficient against grey. The workaround is removed.
  Other navigation icons retain their existing v1 source.
- Services retains the selected two-column mobile tiles. Artwork has a shorter
  84px frame with wider usable image space. A compact 14px label and 16px arrow
  share the bottom row. No space is reserved for two-line headings. All four
  BG and EN labels fit on one line at 320px.
- Mobile titles are `Наличности`, `Внос`, `Лизинг`, `Продай`, and their short
  English equivalents. Desktop copy and the original searchable service text
  remain intact.
- Import and Sell mobile headers now use the charcoal brand surface with white
  wordmarks and controls, matching the Services and Leasing headers.

## Changed source

- `apps/web/app/[locale]/services/page.tsx`
- `apps/web/app/[locale]/services/services.module.css`
- `apps/web/app/[locale]/components/mobile-dealer-service-hero.tsx`
- `packages/marketplace-ui/components/dealer-bottom-nav-icon.tsx`
- `apps/web/public/images/services/navigation-assets-v3-transparent-600w.webp`
- `apps/web/public/images/services/navigation-assets-v3-transparent.provenance.md`

Existing dirty work was preserved. The pre-existing untracked Services
catalogue was not edited in this correction. Import/Sell page files, other
service tones, desktop styles, and runtime configuration were not rewritten.
Task preimages are under ignored `runtime/mobile-services-cleanup-20261006/`.
No commit, push, release selection or dealer deployment was performed.

## Verification

- Biome checked all four changed TSX/CSS files successfully; scoped
  `git diff --check` passed.
- A fresh production build passed compilation, TypeScript and static-page
  generation using Node 22.23.2 and the existing Next 16.3.8 workspace.
  Run ID: `mobile-services-cleanup-20261006`; output:
  `.next-public-e2e-mobile-services-cleanup-20261006-demo`.
- The build-generated `next-env.d.ts` was restored to its exact preimage after
  verifying the generated file's hash. `tsconfig.json` remained unchanged.
- Chromium Services checks: BG 320/390/1023/1024/1440px and EN
  320/390/1440px. No horizontal overflow; artwork loaded. All mobile card
  labels occupied one line. At 1440px BG, desktop text and card/image/title/
  description rectangles exactly matched the before capture.
- Import and Sell checked in BG/EN at 320/390px. Header background is
  `rgb(48, 52, 59)`; phone controls are white and retain their configured
  telephone links. Cars and Leasing were also inspected at 390px for shared
  navigation rendering.
- Search (`Продай автомобил` and `sell`), clear/reset, Import quick pill,
  keyboard activation of the Import card, bottom-nav Sell navigation, Import
  help, Sell VIN drawer and mobile menu open/close passed. Drawers and menu
  restored trigger focus on dismissal.
- The generated 600x200 WebP is 21,990 bytes. All four corners have alpha 0;
  each cell has transparent pixels. A magnified crop over grey confirms that
  the white rectangles are gone.
- No browser console errors were recorded. Initially pending Import flag
  images were lazy-loaded outside the horizontal viewport; the pending Cars
  photo was below the fold. These were not visible-image failures.

## Evidence and limits

Evidence is in `mobile-services-cleanup-2026-10-06/`: matched Services,
Import and Sell before/after screenshots, the grey navigation comparison,
`checks.json`, `actions.json`, `navigation-alpha.json`, `lazy-images.json`,
`console.json` and desktop geometry comparisons.

These are local Chromium and build results, not hosted or native acceptance.
The original image-generated MODERN logo was unavailable during this correction.
The owner subsequently requested a new generated logo; its completed template
implementation is recorded in [Generated logo verification](MODERN-GENERATED-LOGO-2026-10-06.md).
