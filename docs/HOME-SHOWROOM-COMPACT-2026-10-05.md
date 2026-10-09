# Compact Home showroom — 5 October 2026

The requested Home composition is implemented in the reusable Modern master. The photographic banner matches Cars at 270 px, with a centered 40 px title, 64 px search capsule and four small vehicle-type buttons beneath search inside the banner. Cars, Motorbikes, Vans and Trucks use the existing assets, category routes and supplied category taxonomy. Selection keeps a local search draft, clears Make/Model and preserves the budget until Search is submitted. The category buttons have localized accessible names, pressed state and keyboard focus.

The stock section keeps its title centered and retains All, Recommended and Recently added as a compact segmented control. It shows up to four cars: four columns from 1200 px and a balanced two-column layout at 1024–1199 px. View all cars sits alongside the heading on wide desktop and below it at narrower widths. Visible result-count text and tab counts are removed; the live status still announces the preview count and available total. Recommended stock can contain fewer than four vehicles. Services, the showroom CTA, journal and footer follow the preview. The previously implemented fact badges and blue Details action remain in use.

## Matched review

- Bulgarian Home at 1440 × 1100: [before](home-showroom-compact-2026-10-05/bg-home-before.png), [after](home-showroom-compact-2026-10-05/bg-home-after.png).
- English Home at 1440 × 1100: [before](home-showroom-compact-2026-10-05/en-home-before.png), [after](home-showroom-compact-2026-10-05/en-home-after.png).
- Full Bulgarian Home: [before](home-showroom-compact-2026-10-05/home-full-before.png), [after](home-showroom-compact-2026-10-05/home-full-after.png).
- Mobile Home at 390 px: [before](home-showroom-compact-2026-10-05/mobile-home-390-before.png), [after](home-showroom-compact-2026-10-05/mobile-home-390-after.png).
- [Capture receipts](home-showroom-compact-2026-10-05/after-receipt.json), [preservation comparison](home-showroom-compact-2026-10-05/preservation.json) and [check summary](home-showroom-compact-2026-10-05/verification.json).

The captures use fresh browser contexts, the actual OS scrollbar, settled route content, loaded fonts and decoded visible images. Per-phase coverage is 18 captures: BG/EN Home at 320, 390, 1023, 1024, 1280, 1440 and 1920 px, plus BG/EN Cars and Leasing at 1440 px. Logs and initial failure artifacts are preserved in `runtime/home-showroom-implementation-20261005/`.

## Source and checks

- Hero geometry and composition: `packages/design-system/styles/desktop-tokens.css`, `dealer-desktop-discovery-hero.tsx`, `dealer-desktop-hero.module.css` and `dealer-desktop-discovery.module.css`.
- Search pills and category data: `dealer-hero-search.tsx`, `dealer-hero-search.module.css`, `desktop-discovery-bar.tsx` and `marketplace-shell.tsx`, under `packages/marketplace-ui/components/`.
- Preview selection and status: `packages/marketplace-ui/components/dealer-desktop-stock.tsx`.
- Browser coverage: Home frame, pill draft/category/taxonomy and search/sidebar cases in `desktop-panel-flows.spec.ts`; Home stock keyboard and reduced-motion cases in `modern-desktop-reuse.spec.ts`.
- Scoped Biome passes. Marketplace UI has 101 passing unit tests; Web has 188. Refactor contracts have 7 passes; release preflight contracts pass and the preflight/architecture suite has 87 passes.
- The production build and Web typecheck pass with Node 22.23.2 and pnpm 11.4.0. The generated `next-env.d.ts` preimage is restored byte for byte.
- All 22 focused browser cases pass across Chromium and WebKit: 18 frame/search/stock cases and four final category-draft/taxonomy cases. Coverage includes BG/EN and 1024/1440/1920 px, category clearing, budget retention, the appropriate Make options, keyboard operation, stock selection and reduced motion. Initial test setup attempted a prepared Home query that renders an inventory context; the corrected case creates the draft through visible Home controls and waits for the dialog lifecycle before keyboard input. Safari keyboard tests open the controls with Enter because its mouse focus behavior differs from Chromium.
- Mobile and the 1023 px boundary keep their dimensions and page heights. Cars and Leasing retain their existing desktop layout. Of ten preservation comparisons, four are pixel-identical and six have at most 81 changed pixels, with a maximum channel difference of 8. The 18 final captures record no page/console errors or horizontal overflow; desktop Home headings are centered within 0.008 px.
- Canonical local port 6482 runs verified build `kC6pY4RpKLWjC-pRgrGo2`. Final after-captures come from this live listener; the previous build is preserved and temporary port 6499 is stopped.

This task changes the local Modern master and preview. It does not select an immutable template release or change dealer deployments. Other Cars work and the existing untracked Modern hero-correction document are preserved.

Source commit/push is pending: the existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time, blocked the scoped stage. Both authorized coordinating chats report no active Git write; neither claims the lock. The shared index is empty and source HEAD remains `08c89d63f9e11939acd5b135ece4278252b80f43` on `main`. The unknown lock is preserved. The reviewed changes, new evidence and source patch are saved in the canonical checkout and the task's runtime folder; integration can resume after the lock's owner releases it.
