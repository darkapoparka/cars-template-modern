# Desktop context and image-quality polish

## Scope and recovery

Continues the interrupted desktop polish from `b8e4b78`. The saved application work was recovered and reviewed rather than discarded. This is a public-desktop improvement, not an admin redesign or dealer deployment. Mobile layouts, inventory data, draft handling and existing mobile screenshot expectations remain the preservation contract.

## Implemented ownership

- `DealerDesktopHero` owns landing, page and compact desktop mastheads. Routes supply titles, descriptions and their real controls rather than copying hero markup. Service pages use a shorter version; reading/recovery pages use the compact treatment. Inventory results and vehicle details retain task-focused content instead of repeating the large homepage hero.
- `DealerDesktopHeader` is consistent across public routes and now also appears in desktop loading states. Mobile loading and navigation retain their separate implementations.
- The shared public desktop layout owns form panels, contact/service cards and editorial surfaces. Sell, import, financing, contact, article browsing, article details, legal, enquiry and recovery routes use the same hierarchy; the editorial collection route also joins the compact masthead.
- The buy box retains the existing search, category, make/model and price handlers. Filters have a visible label; buttons have deliberate focus/hover states. Selected result filters and their clear actions share the same height and semantic surface, without important-color overrides.
- Desktop article search reuses the existing filter/URL state and restores focus to the visible input. Mobile search behavior is preserved.

## Hero asset

`lead-car-showroom-scene-v3.webp` is a 2172 × 724, 149,282-byte derivative of a separately saved generated source, not an enlarged crop of the UI reference. The original and hashes are retained under `provenance/assets/`. No UI or text is baked into it. The image is decorative, not evidence of actual dealership premises or stock.

The scene is served at its already optimized source quality through the existing Image layout/lazy-loading behavior, without a second lossy runtime encode. This also removes the hero's dependency on a cold image-optimizer request. Other images keep their existing optimization. Mobile must not request this desktop-only artwork.

## Verification and limits

Final command results and rendered evidence: `.codex-artifacts/desktop-context-finish-2026-09-20/`. The final results are appended after qualification. No database migrations, provider provisioning, customer enquiries, release promotion or deployment are authorized by this polish.

## Final qualification

- Final public production build (including TypeScript and 50 static pages): passed.
- Lint/source check, E2E types, workspace boundaries and six refactor contracts: passed.
- UI unit tests: 81 passed. Web unit tests: 169 passed. Configuration tests: 18 passed.
- Complete responsive gate against the final native-scene build: 29 passed, covering desktop composition, contextual pages, search, filters, service controls, carousel behavior, payload ceilings and direct full-resolution image delivery.
- Mobile interaction suite: 63 passed on the build immediately preceding the desktop-only scene delivery change. The final responsive run also passed the unchanged 320/360/390/430 inventory screenshots and 768/1023 boundary cases.
- Nine 390 × 1000 mobile route captures were compared with the interrupted run's before images. No layout changes were observed; small raster differences (0–0.53%) are recorded in mobile-route-parity.json rather than described as byte-identical.
- Desktop captures at 1024/1280/1440/1920 were inspected before updating desktop baselines. No mobile expected image was updated.

Earlier failed runs are retained in the evidence, not erased: a desktop selector matched both a labelled form and its input; this now selects the combobox by role. Cold local image-optimizer requests for existing mobile icons and the new hero stalled. Source decoding/encoding and direct file serving were checked; mobile production code was preserved and its complete suite passed on the subsequent preview. The final pre-optimized desktop scene is served directly, eliminating its extra encode and preserving prepared detail. Accessibility checks use rendered-page readiness instead of unrelated network-idle conditions; serious/critical violation assertions remain unchanged.

No live provider or tenant integration qualification was performed in this visual task. The original mobile UI, actual inventory and existing business handoffs remain in place.

Development preview was restarted after a stalled worker. The verified review origin is `http://localhost:3002`: `/cars` and `/sell` returned 200 with the updated scene/context hero and no browser page errors. An initial cold IPv4-origin request returned a local proxy error; production qualification used the isolated preview and passed.
