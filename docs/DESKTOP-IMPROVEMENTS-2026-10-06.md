# Modern desktop improvements — 6 October 2026

The desktop pass fixes mixed Bulgarian/Latin typography and the View control covering Details. It also improves card readability, shares heading roles, clarifies the current navigation item and removes obsolete hero CSS/API branches. The existing graphite discovery banners, vehicle artwork, content and mobile composition are preserved.

This implements the six main recommendations in [the desktop audit](DESKTOP-AUDIT-2026-10-05.md). It uses the existing Cars checkout on main at HEAD `08c89d63f9e11939acd5b135ece4278252b80f43` and [local preview](http://127.0.0.1:6482/bg/). Changes remain uncommitted. No template release or dealer deployment was performed. Exact preimages preserve the pre-existing dirty source in `runtime/desktop-improvements-20261006/preimages/`; generated `apps/web/next-env.d.ts` is byte-identical to its preimage.

| Improvement | Result |
| --- | --- |
| Font consistency | Desktop uses the already loaded Inter for Cyrillic, Latin and numerals. Font assets and dependencies are unchanged. |
| Card readability | Facts and monthly finance are 14/22 px, titles 18/26 px and prices 22/30 px. Full variants remain available and wrap. Details has a 40 px minimum height. |
| Shared hierarchy | Mastheads 40/48 px; main sections 32/42 px; subsections and Contact column headings 24/32 px; body 16/26 px. The photo callout uses 44/52 px. |
| Results toolbar | View uses a reserved right-hand grid cell. Filters/Sort remain centered with applied chips on the left. Measured View/Details overlap is zero at 1024, 1280, 1440 and 1920 px. |
| Navigation | The existing aria-current state gets a visible underline without changing the link width. |
| Hero cleanup | The stylesheet is 409 lines, down from 597, with one desktop base and explicit width/appearance differences. Unrendered breadcrumb rules and ignored description/eyebrow props and call-site arguments are removed. |

Matched desktop screenshots were captured before the edits and after the final visual changes. Click an image to inspect the full capture.

| Page | Before | After |
| --- | --- | --- |
| Home, BG, 1440 × 1000 | ![Home before](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/before-home-bg-1440.jpg) | ![Home after](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/after-home-bg-1440.jpg) |
| Cars, BG, 1024 × 900 | ![Cars before](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/before-cars-bg-1024.jpg) | ![Cars after](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/after-cars-bg-1024.jpg) |
| Listing, BG, 1440 × 1000 | ![Listing before](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/before-listing-bg-1440.jpg) | ![Listing after](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/after-listing-bg-1440.jpg) |
| Cars, EN, 1440 × 1000 | ![English Cars before](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/before-cars-en-1440.jpg) | ![English Cars after](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/after-cars-en-1440.jpg) |
| Contact, BG, 1440 × 1000 | ![Contact before](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/before-contact-bg-1440.jpg) | ![Contact after](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/after-contact-bg-1440.jpg) |

Full-page Home, Cars, listing and Contact captures are saved in the same evidence directory. These expose the lower section headings and Contact columns as well as the initial viewport.

Actual source checks passed: marketplace-ui typecheck, web TypeScript check with incremental output disabled, 101 marketplace-ui unit tests across 21 files, 188 web unit tests across 37 files, and Biome checking all 25 task-owned source files. Node 22.23.2 and the pinned pnpm 11.4.0 were used. Existing browser E2E suites were not run; browser verification used the in-app browser.

Desktop checks covered the inventory at 1024/1280/1440/1920 px and Home at 1440/1920 px. At 1024 × 600 px, all four View choices stayed visible, Grid/List and Quick/Sidebar switched, and Filters opened and dismissed with Escape restoring focus. The measured menu bottom was 597 px. Final rendered checks also covered Services, About, Contact, Imports, Lease, Guides, Privacy and the Chinese EV/hybrid collection at 1440 px. Captured states had no horizontal overflow or broken visible images.

Mobile preservation compared Home, Cars, listing, Contact and Lease at 320/390/1023 px, all at 900 px height. Every measured text/style/geometry field and visible text matched in all 15 pairs; no overflow or broken visible images appeared. Nine JPEG pairs were pixel-identical. Six had small rendered pixel differences, chiefly in inventory images, with a maximum mean absolute channel difference below 0.49 on the 0–255 scale. They are not described as pixel-identical. Source edits to visual rules apply from 1024 px; mobile font setup, assets and layout rules were unchanged.

The verification has three limits. A full production build was not run because L: had approximately 500 MB free. The fresh browser blocked `/bg/sell` with `ERR_BLOCKED_BY_CLIENT`, so its final rendered check remains unverified. The development sessions recorded Next.js hot-refresh CSS-chunk errors and one router-initialization error during compilation/navigation; successful rendered checks do not constitute a clean production-console gate. Their actual logs are retained. Contact's map-first order and service CTA destination changes were lower-priority audit proposals and are outside this implemented typography/controls pass.

Primary source owners are `packages/design-system/styles/desktop-tokens.css`, the dealership `desktop.css`, the shared hero, header, discovery, inventory and vehicle-card components, Services/Contact desktop modules, and listing detail desktop styles. Ignored desktop hero arguments were removed from their existing page callers. TEMPLATE and QA distinguish the current contract from older composition notes. The task-local diff is recorded separately from the repository's other dirty work.

Evidence: [rendered measurements](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/measurements.json), [mobile comparisons](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/mobile-preservation.json), [desktop overlap checks](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/desktop-layout-checks.json), [interaction checks](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/interaction-checks.json), [final route checks](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/final-route-checks.json), [Biome result](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/biome-check.txt), [development console history](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/development-console-history.json), [final session console](L:/CODEX/cars/templates/modern/docs/desktop-improvements-2026-10-06/final-console-errors.json), [task-owned changes](L:/CODEX/cars/templates/modern/runtime/desktop-improvements-20261006/task-changes.json).
