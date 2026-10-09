# Modern mobile header icon system — 6 October 2026

The nine header artworks were regenerated together in one transparent 3×3 contact sheet: car, motorcycle, truck, van, guides, filters, help, location and call. This replaces the preceding v2 header family with a single generated family. The four vehicles share a frontal camera, satin silver surfaces, graphite sides and upper-left lighting. The upright symbols use the same materials; the handset has a deliberate diagonal orientation.

Every delivered icon uses a transparent 112×112 px canvas displayed in one 28×28 px slot. Framing follows visible alpha bounds rather than the margins in the generated sheet. Vehicles are horizontally centered and share a 24 px wheel baseline inside the artwork canvas. The category group has one common 2 px lift for the existing chevron. Other symbols are centered in both axes. There are no per-icon CSS sizes or position overrides. The 36 px frame and 44 px header touch targets remain intact.

The nine WebP delivery files total **36,778 bytes**. The original sheet, exact prompt, preparation script, source/output hashes, alpha bounds and alignment checks are preserved in [v3 provenance](../provenance/assets/mobile-header-system-v3/README.md). All nine delivered hashes and the original source hash were rechecked at closeout. Older source images and v2 provenance remain preserved.

Header artwork now loads eagerly. Initial navigation inspection caught delayed motorcycle and van images; the final capture and browser checks verify loaded images after navigation. The existing mobile navigation test gained a loaded-image assertion based on this observed failure.

## Current correction

- `packages/marketplace-ui/components/dealer-mobile-header-icon.tsx`: select the complete v3 family, use one 28 px slot and load these visible header assets eagerly.
- `apps/web/public/images/services/header-system-*-v3.webp`: nine new delivery files.
- `provenance/assets/mobile-header-system-v3/`: original generation and reproducible preparation evidence.
- `apps/e2e/specs/mobile-chrome.spec.ts`: check that all visible header images finish loading after route transitions.
- This report and `docs/header-icon-system-2026-10-06/`: screenshots, measured geometry and browser evidence.

The earlier 18 px mobile heading refinement, bottom navigation artwork, and pre-existing test/source edits were preserved. The current correction does not claim those starting changes as newly authored.

## Verification

- Final production build passed compilation, TypeScript and static page generation after the eager-loading change. Isolated output: `apps/web/.next-public-e2e-header-icon-system-20261006-demo`. Runtime: Node 22.23.2, pnpm 11.4.0, Next 16.3.8.
- Marketplace UI Vitest: **101 passed**. Web Vitest: **188 passed**. These runs verified the new family before the subsequent eager-loading prop and loading assertion; the final build and browser run include those final changes.
- Final Playwright run: **four passed**, covering the existing mobile navigation checks at 320/390 px in Chromium and WebKit, including the new loaded-image assertion.
- Biome checked the component and browser specification without changes. Scoped `git diff --check` passed.
- **30 unique route/width measurements**: BG Home, Cars, Motorbikes, Trucks, Vans, Guides, Services, Imports, Lease, Sell, About and Contact at 320/390 px, plus EN Cars, Imports and Guides at both widths. Every header image loaded. All artwork slots measured 28×28 px, all header controls measured 44×44 px, horizontal slot/button centers matched exactly, and no horizontal overflow was found. Headings remained 18/28 px.
- The new handset loaded in the existing **52×52 px** listing call action at `/bg/listing/bmw-x5-m50d-sofia-2020`, with its `tel:` destination intact and no overflow. No call was initiated.
- Services at 1440 px retained its 40/48 px desktop heading. Mobile artwork was hidden and no overflow was found. This is a current desktop inspection, not a matched desktop pixel comparison.
- A fresh final Imports reload had loaded v3 help/call images, the 18 px heading, no horizontal overflow, no error overlay and **no new console errors**.

Browser command:

    E2E_BASE_URL=http://127.0.0.1:6482 pnpm --filter e2e exec playwright test --config=playwright.modern.config.ts mobile-chrome.spec.ts --grep 'at (320|390)px' --output='../../runtime/header-icon-system-20261006/browser-results-final'

[All nine in their actual header controls](header-icon-system-2026-10-06/all-nine-in-header-controls.png) shows exact 44 px control crops enlarged 2×. [Matched Imports header before/after](header-icon-system-2026-10-06/imports-header-before-after.png) uses equal 390×168 px crops from 390×844 px screenshots. Individual route captures, `layouts.json`, the desktop check and the final reload are in the same evidence folder. An early screenshot capture used stale capture dimensions; affected family screenshots were recaptured and the comparison preparation asserts exact 390×844 px inputs. Early deferred-image captures are retained separately as failure evidence.

Build, unit and browser logs are under ignored `runtime/header-icon-system-20261006*`. `runtime/header-icon-system-20261006/prepare-evidence.mjs` prepares the labeled contact sheet from unmodified browser captures; it does not repaint the artwork.

## Integration and preservation

The saved Cars checkout remains on `main`, HEAD `08c89d63f9e11939acd5b135ece4278252b80f43`. The pre-existing zero-byte `L:/CODEX/cars/.git/index.lock`, dated 5 October at 05:43 local time, remains present. No index bypass, staging, commit or push was performed. The reviewable local result is complete; the requested push is blocked by that shared index lock.

Build-generated `apps/web/next-env.d.ts` and the browser session fixture were restored byte-for-byte to their task-start preimages after checking that only task-generated changes were present. `apps/web/tsconfig.json` retained its starting hash. Other dirty template/fleet work was preserved. The existing 6482 listener (PID 19968) remains running. The user's Imports tab was restored and the temporary viewport override was cleared.

The isolated build output is retained. No generated output or recovery evidence was recursively deleted in this correction. No template release, dealer deployment or hosted acceptance is claimed.
