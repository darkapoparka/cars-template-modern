# Modern mobile header artwork polish — 6 October 2026

All nine mobile header icons were reviewed at their actual 28/34 px display sizes. The car, motorcycle, truck, van, guide book, filters, help and location artwork remain visually consistent and readable. Their original composition and transparent margins were retained. The narrow dark phone was replaced with a generated diagonal handset with broad silver front surfaces; this improves recognition in both the 44 px header actions and the existing 52 px listing call button.

The nine delivery files are now transparent WebP images at four times their CSS display size, totaling **43,134 bytes**. They use the existing mount-aware `PublicImage` wrapper with `unoptimized`, because these files are already prepared at the intended resolution. This also avoids the oversized 3840 px image-optimizer requests observed in the initial browser state. The original PNGs remain preserved. [Asset provenance](../provenance/assets/mobile-header-silver-v2/README.md) includes the original generated phone, exact prompt, reproducible preparation script, source/output hashes, alpha corners and visible bounds.

The current 18/28 px page heading, 36 px artwork frame, 44 px header touch targets and category chevron positions were preserved. The five bottom navigation icons from the preceding pass were checked at their existing 30×24 px display size. No further replacement was needed.

## Changed source

- `packages/marketplace-ui/components/dealer-mobile-header-icon.tsx` — select the nine prepared WebP assets and serve them directly.
- `apps/web/public/images/services/header-silver-*-v2.webp` — nine delivery assets.
- `provenance/assets/mobile-header-silver-v2/` — phone generation and asset preparation evidence.
- This report and `docs/header-icon-family-2026-10-06/` — matched screenshots and browser measurements.

The smaller icon sizes and adjusted chevron offset already existed uncommitted when this continuation began. This pass does not claim those preceding edits as newly authored. Other template/fleet changes were preserved.

## Verification

- **Production build passed**, including compilation, TypeScript and static page generation, in the isolated provider-free `header-family-polish-20261006` output. Runtime: Node **22.23.2**, pnpm **11.4.0**, Next **16.3.8**.
- Web Vitest: **188 passed**. Marketplace UI Vitest: **101 passed**.
- **Eight existing browser checks passed** in Chromium and WebKit: mobile header navigation and shared Sell/Import/Lease help drawers, each at 320 and 390 px. The help checks cover closing, focus restoration, equal presentation and serious/critical accessibility violations at 390 px.
- Biome and scoped `git diff --check` passed for the changed component.
- Browser inspection covered BG Home, Cars, Services, Sell, Imports, Lease, Guides, About and Contact at **320/390 px**. Header images loaded, visible headings measured **18/28 px**, header targets remained **44×44 px**, and no horizontal overflow was found.
- EN Cars, Services, Sell, Imports, Lease and Guides were checked at **320 px**, with Services, Sell and Guides also at **390 px**. Headings and icons remained readable, with no overflow or missing header images.
- All four category icons were exercised through the selector at **320 px**. The motorcycle, truck and van used their 34 px slots; the car used 28 px. Their loaded artwork and category headings were verified.
- Inventory Filters, Guides Filters and bottom Menu opened and dismissed. Phone/map destinations were inspected without initiating a call or external map navigation.
- A real inventory card transition to `/bg/listing/bmw-x5-m50d-sofia-2020` verified the updated handset in the **52×52 px** call action at **390 px**, with an intact `tel:` destination and no overflow.
- Services at **1440 px** retained a visible **40/48 px** desktop title; mobile header artwork was hidden and no overflow was found. This is a current desktop inspection, not a matched desktop pixel comparison.
- The final fresh `/bg/cars` reload had loaded header images, the 18 px title, no overflow, no error overlay and **no new console errors**. Earlier CSS hot-reload errors at 11:58 UTC were historical and did not recur on the final reload.

The browser command was:

    E2E_BASE_URL=http://127.0.0.1:6482 pnpm --filter e2e exec playwright test --config=playwright.modern.config.ts mobile-chrome.spec.ts modern-mobile-service-help.spec.ts --grep 'at (320|390)px' --output='../../runtime/header-family-polish-20261006/browser-results'

[Matched Services before/after](header-icon-family-2026-10-06/before-after.png) uses two 390×844 px captures. [The full family at mobile display size](header-icon-family-2026-10-06/family-at-mobile-size.png), route screenshots, category captures and measurements are in the same evidence folder. Build/unit/browser logs and start-of-task preimages are under ignored `runtime/header-family-polish-20261006/` and adjacent named logs.

## Preservation and integration status

The canonical Cars checkout remains on `main`, based on HEAD `08c89d63f9e11939acd5b135ece4278252b80f43`. The existing zero-byte `L:/CODEX/cars/.git/index.lock`, dated 5 October at 05:43 local time, remains present. No index bypass, commit or push was performed. Integration remains blocked until the shared index can be used; the current work is visible and reviewable in the saved checkout.

Build-generated `apps/web/next-env.d.ts` and the browser session fixture were restored byte-for-byte to their task preimages. `apps/web/tsconfig.json` retained its starting hash. The user's Cars tab was restored, the temporary viewport override was cleared, and the existing 6482 listener (PID 19968) was preserved.

The inactive isolated build output was retained because the cleanup preflight found directory junctions beneath its `node_modules` folder. No recursive deletion was attempted against that tree. Local source/build/browser evidence does not establish a promoted template release or a hosted dealer deployment.
