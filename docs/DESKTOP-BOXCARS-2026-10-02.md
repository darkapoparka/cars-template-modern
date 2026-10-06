# Modern desktop correction from Boxcars

Modern's desktop pages now follow the rendered local Boxcars project at http://127.0.0.1:6455/. This replaces the earlier desktop composition from commit bc99fe54d; that earlier layout was rejected by the owner. Mobile remains the existing Modern presentation.

The later [desktop surfaces, inventory and article polish](DESKTOP-SURFACES-2026-10-02.md) establishes the current grey canvas, white containers, stronger rails and regenerated blue banner. The composition and Git handoff below describe their original verification points; the follow-up receipt and Git history record the subsequent integration.

## Final desktop composition

- Uses the reference's local DM Sans font, navy text, blue actions, white page, pale panels, 16px cards and 12px controls. The original mobile Inter font and red accent remain.
- Home uses the actual blue BMW reference photograph, a 90px header, 680px hero, centered 70px title at 1440px, four dropdowns in one 76px pill and a 1392px maximum hero width. Stock starts at y=834px, with eight cars in a four-column grid at 1440px and three columns at 1024px. The carousel was replaced.
- The lower homepage uses four illustrated service cards with centered text and actions, a centered photo banner, three real articles and the rounded blue footer. Service destinations are Modern's real inventory, sell, finance and import routes.
- Cars and the other vehicle categories use a 280px filter sidebar, 32px gap and three listing columns at 1440px. At 1024px the sidebar is 240px and results use two columns. Filters remain draft values until Search; category changes preserve applicable price/year/sort filters and browser Back restores previous state.
- Vehicle detail uses a 1300px content frame, 46px title, landscape gallery, labelled Print/Share actions and one bordered purchase/dealer panel. Gallery, keyboard tabs, phone link and finance destination retain their existing behavior.
- Finance uses one centered 1120px white panel on a pale grey service canvas: a horizontal vehicle selector, adjacent preference fields and a horizontal finance summary. Selected vehicle details include its actual year, mileage and price; the existing picker, URL state and phone handoff remain.
- Sell and Import use the same centered white panel, a short illustrated header and wider horizontal controls. The old half-page photographs were replaced with the existing reference service artwork. Sell uses three field columns and a selected-vehicle row that spans two columns.
- Contact uses a shallower 220px showroom banner, a horizontal phone/address panel, a centered conversation action and four service cards (two at narrower desktop widths). It keeps the phone handoff while enquiry delivery is unavailable; configured enquiry forms retain their own centered, left-aligned surface.
- Guides/blog, article, legal and recovery pages use the same desktop typography, gutters, image treatment and footer. Legal copy and existing public content were retained.

All presentation overrides are scoped to min-width: 1024px or existing desktop-only components. Separate optional desktop artwork roles preserve the mobile asset mappings and allow dealer overrides. Copied reference asset hashes, the font license and generated service-art provenance are retained in apps/web/public/desktop-boxcars/README.md.

## Service-page polish verification

Local preview: http://127.0.0.1:6482/bg. Node 22.23.2, pnpm 11.4.0, provider-free demo data.

The owner accepted the blue desktop direction and requested fewer equal-width photo/form columns. This pass keeps Home, inventory and the vehicle detail composition, and refines Finance, Sell, Import and Contact. Service headings are centered; a neutral grey canvas, white panels, grey controls and blue primary actions give each element a consistent role.

- 271 relevant unit tests passed: marketplace UI 85 and web 186. Web and E2E TypeScript checks passed; the final optimized demo build passed after the last frontend change, with run ID desktop-service-polish-20261002-build.
- Scoped Biome checks passed for the 11 changed frontend files; git diff --check passed.
- Eight focused desktop checks passed in Chromium and WebKit: stable navigation, finance selection/preferences/Back/reload/clearing, import link handoff and canonical selected Sell values. After the final button widths were adjusted, the four affected finance/Sell cases passed again in both engines. The final Sell row alignment was checked separately in EN/BG at 1024 and 1440px: four passed, with the selected vehicle spanning two columns, 52px fields, a bottom-aligned 54px action and one canonical make/model value each.
- Thirty-six desktop states were inspected in EN/BG at 1024, 1440 and 1920px, including selected Finance/Sell and China import routes: all HTTP 200, no page exceptions, missing visible images or horizontal overflow. A fresh capture after preview recovery verified another 24 service-page states (16 mobile, eight desktop) with the same checks passing.
- Twelve final service states returned HTTP 200 without page exceptions or horizontal overflow; the selected Finance actions fit their English and Bulgarian labels. The four final selected Sell screenshots were recaptured after its row alignment change, with the preference dialog dismissed through the existing demo endpoint.
- The first focused mobile run passed both Chromium cases; its two WebKit cases failed during navigation. Traces showed failed development chunks and page reloads. Only the verified Modern preview process was restarted on port 6482, with fresh build directory .next-public-e2e-desktop-service-polish-verified-20261002-demo; the Boxcars process on 6455 was preserved. The two unchanged WebKit tests then passed in 28.6s. Failed and successful traces/results remain separately recorded.
- Mobile preservation: all 16 measured layouts match the fresh baseline across Finance, Sell, Import and Contact at 320, 390, 767 and 1023px. Twelve screenshots are pixel-identical. Four differ by 6–64 channel bytes each (142 total), confined to small rasterization edges; the strict pixel comparison therefore does not pass. No mobile layout or asset mapping was changed.

Evidence is retained in runtime/desktop-service-polish-20261002/, including before/verified captures, mobile-final-comparison.json, the desktop/mobile test runs and reruns, and final selected-state checks. The preview run ID is desktop-service-polish-verified-20261002.

## Initial desktop correction verification

- Web and E2E typechecks passed.
- 419 relevant unit tests passed: domain 21, marketplace 127, marketplace UI 85 and web 186.
- The final optimized demo build passed after the last frontend source change. Browser verification uses the local development preview; these are separate checks.
- Scoped Biome checks and git diff --check passed.
- Twelve initial final desktop routes returned the expected status (eleven 200 and the intended 404), with no page exceptions or horizontal overflow. Twelve additional inspected states covered 1024px Bulgarian pages, service cards, footer, article, China import and motorbike inventory; all returned 200, all visible images decoded, and the footer's measured radius was 30px 30px 0px 0px.
- Desktop behavior matrix: all 14 unique cases are verified across Chromium and WebKit. The final full run passed 12/14; its two WebKit failures were an initial development document reload and the total finance test timeout at its last reload. Category continuity now waits for initial network/font readiness before recording the document, and the multi-step finance test has a 120s budget. All existing behavior assertions remain. The targeted rerun of category and finance passed 4/4 across both engines (55.9s), with no frontend source changes between these runs. The full-run and targeted JSON/traces are retained separately.
- A fresh final capture after preview recovery covered 12 routes again: expected HTTP statuses, no page exceptions and no horizontal overflow.
- The focused mobile menu/gallery/Escape/focus/Back journey passed in Chromium and WebKit, 2/2, after preview recovery.

- Mobile baseline: Home, Cars, vehicle detail, Finance, Import, Sell and Contact at 320, 390, 767 and 1023px, 28/28 HTTP 200 with no page exceptions or horizontal overflow. All 28 measured layouts, fonts and colors are unchanged. 22 screenshots are pixel-identical; the other six differ by 18–83 channel bytes each (237 total), confined to image/card/icon edge rasterization. The strict comparator exits 1: it also reports the desktop-only breadcrumb text in the four Finance DOM snapshots even though all four Finance screenshots are pixel-identical. This is not an all-pixels-equal or all-DOM-text-equal pass. The original strict comparator was retained; mobile-layout-report.json records the separate measured-layout result.

Evidence is in ignored runtime/desktop-boxcars-rematch-20261002/ and runtime/desktop-reference-20261002/. Captures distinguish the reference, the previous layout, development failures and the completed render; failed or incomplete captures are not counted as verification.

## Runtime recovery and source preservation

The first preview exhausted L: storage. The panic log and inactive caches were retained. Three earlier cache directories remain in the task's C: recovery folder, together with the additional boxcars-final-preview-cache (217 files, 1,397,021,274 bytes, verified before/after the move):

C:/Users/radev/.codex/visualizations/2026/10/02/01a0fcc6-e64e-7511-b822-b8be29e52d39/modern-build-cache-recovery

The later build/hot-reload cycle produced stale Turbopack client chunks, which blocked hydration in some browser checks. Only this task's Modern preview on port 6482 was stopped and restarted, with a fresh isolated development build directory. That correction used run ID desktop-boxcars-rematch-verified-20261002; the service-page follow-up now runs desktop-service-polish-verified-20261002. No source, session/database data, Git history, cache recovery files or panic logs were deleted. The reference server was not changed.

Fetch-backed workspace inspection found the Cars main checkout with unrelated dirty fleet/reference work and another task's pending main commit, plus independent Admin drift. This task preserved that work and does not integrate Admin. Only Modern source, desktop tests, reference-asset copies/provenance and this receipt belong in the task's scoped commit. Template promotion, dealer deployment and owner visual acceptance remain separate.

## Git handoff

Scoped staging of exactly 53 reviewed Modern files was initially attempted and failed because L:/CODEX/cars/.git/index.lock already existed (0 bytes, created 2 October 2026 at 19:25:23 local time). The lock was preserved. Base HEAD at that attempt was f190421c4a2a80630a2170ec5c52a27a3c1df05b.

At the final service-page check, that lock had been released and another task had advanced main to 6be4023c510b04212f8c86f667e2b619a20c7899, without any committed Modern changes. The shared index contained 132 unrelated staged Import files. They were preserved and no new index mutation was attempted. No Modern task file is staged, and this revision has no replacement commit or push. The canonical checkout contains the completed source and serves it on port 6482.

The exact 53 allowlisted paths and refreshed source hashes are retained in runtime/desktop-boxcars-rematch-20261002/task-owned-paths.json; its original staging-result.json records the earlier lock failure. Current repository state and the service-page handoff are retained in runtime/desktop-service-polish-20261002/. All 41 files outside this follow-up's 11 frontend files and QA receipt still match the previous hashes. Once the shared index is available, verify the hashes, stage only that reviewed list, commit the desktop correction on main and perform the required non-force push. Do not disturb another task's staging, delete or bypass its lock, stage unrelated fleet/reference work, promote a release or deploy dealers.
