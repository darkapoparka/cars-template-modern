# Modern mobile header polish - 1 October 2026

The existing shared header layout now aligns with the page's 16px gutters.
Its primary control is 52px tall, with a 12px gap below the 44px brand row.
Header height increases from 136px to 144px. Inventory, import, VIN and
financing entry points share the same field geometry and muted 18px icons.
Guides reuse the field geometry, use regular-weight 16px input text and have
a 44px clear button. Clearing preserves input focus and removes the query.
The smaller inventory bar shown while scrolling retains 44px controls.

The source boundaries remain `MobileDealerChrome` and
`packages/marketplace-ui/lib/mobile-form-control.ts`. Existing consumers and
loading placeholders were updated together. Route data, callbacks, dealer
identity, service colours, card geometry and desktop components are retained.
The eight frontend files are identical in the Modern master and canonical
Navara Modern copy. No dependencies, client boundaries, hooks, provider
configuration or enquiry behaviour were added.

## Verification

- Browser inspection covered inventory, import, sell, leasing, guides and
  contact at 320px and 390px, in Bulgarian and English. All 24 route/locale/
  width observations had 16px gutters, a 52px primary control and no page
  overflow or completed broken visible images.
- All six routes were checked at 1440px. Mobile headers are hidden and the
  existing desktop composition and titles remain visible without overflow.
- At 320px, the compact inventory category, search and filter controls remain
  44px tall and fit within the page. Opening and closing search restores focus
  to the compact search trigger.
- The guides input was exercised with an English query at 320px. Its input
  remains 16px / weight 400; the clear action measures 44x44px, restores input
  focus and removes the URL query.
- Both master and Navara web typechecks and production builds passed.
- The existing focused Chromium/WebKit suite passed 23 of 24 scenarios on
  its first run. One WebKit make/model case timed out waiting for the URL
  model parameter after selecting BMW X5. The unchanged case passed when
  rerun after the builds finished. Original failure evidence is preserved.
- Scoped Biome and whitespace checks passed. The React Best Practices review
  confirmed shared presentation styles with existing state and actions.

The matched inventory comparison uses two actual 390x844px screenshots and
crops them equally to retain the header and first car card. Evidence lives in
`runtime/modern-mobile-header-polish-2026-10-01/`, including
`cars-before-after.png`, raw screenshots, before/after geometry, the desktop
matrix and the initial WebKit trace. The first inventory baseline had a
viewport mismatch; it was preserved separately and recaptured before use.
The local Navara preview has the finished implementation. No public
deployment or template release was performed.
