# Modern mobile Services and branding — 6 October 2026

The reusable Modern master now places Services search inside the mobile brand header, followed by a horizontal quick-service rail and compact artwork-and-copy cards. It uses the existing MobileDealerChrome, MobilePillRail and mobile quick-pill styles. Search, enabled-service filtering, clearing, result announcements and empty states retain their existing catalogue data and destinations. Keyboard focus reveals the full quick pill, including the last option at 320 px. Desktop Services keeps its current hero, search, four-column catalogue and compact actions.

The shared mobile brand bar and footer mark reuse the existing MODERN preview wordmark on the source-bound static master. The existing site-configuration guard retains configured raster branding for personalized dealers. The bottom dock blends the generated icon sheets with its surface, removing the opaque white rectangles while preserving the artwork and destinations.

The earlier source colours were red for Leasing and pale blue for Sell. The existing charcoal/neutral palette is preserved; Sell currently uses its neutral grey header.

## Changed source

- `apps/web/app/[locale]/services/page.tsx`
- `apps/web/app/[locale]/services/service-catalogue.tsx`
- `apps/web/app/[locale]/services/services.module.css` — mobile rules only; the concurrent desktop action work is preserved.
- `packages/marketplace-ui/components/dealer-mobile-brand-bar.tsx`
- `packages/marketplace-ui/components/dealer-bottom-nav-icon.tsx`
- `packages/marketplace-ui/components/marketplace-masthead.tsx` — preview footer mark.

## Verification

- Node 22.23.2, pnpm 11.4.0; existing preview listener remains at `127.0.0.1:6482`.
- Scoped Biome check: all six changed source files passed.
- `@repo/marketplace-ui` TypeScript check passed.
- Existing `site-config.test.ts`: 30 tests passed, including master/dealer preview identity separation.
- Final isolated provider-free Next.js production build passed, including web TypeScript. Output: `apps/web/.next-public-e2e-mobile-services-patterns-20261006-demo/`. Generated `next-env.d.ts` was restored byte-for-byte; `tsconfig.json` was preserved.
- Chromium Services checks: BG/EN at 320 and 390 px, BG at 768 and 1440 px. Four enabled cards, loaded artwork, 48 px search, 44 px quick pills and no horizontal page overflow. Desktop uses its existing search placeholder and hides the new mobile header.
- Interactive checks: text search, service selection, empty state, reset, search-clear focus, keyboard access to the last pill, keyboard activation of Sell and correct destination, Menu Escape and restored trigger focus. Sell, Leasing, Imports and Cars rendered the new wordmark and clean dock without horizontal overflow; Sell and Leasing had the correct active item. The Leasing vehicle selector opened, dismissed with Escape and restored its trigger focus. No browser console errors were recorded.
- Browser checks used the existing development preview. Automatic approval review rejected both temporary production-server launch attempts with “blocked by policy” and supplied no more specific reason; no server was started on 6492. No hosted verification, commit, release selection or dealer publication was performed.

## Screenshots

Matched 390 px Services: [before](mobile-services-patterns-2026-10-06/before-services-390.jpg), [after](mobile-services-patterns-2026-10-06/after-services-bg-390.jpg).

Matched 320 px Services: [before](mobile-services-patterns-2026-10-06/before-services-320.jpg), [after](mobile-services-patterns-2026-10-06/after-services-bg-320.jpg).

Additional EN, tablet, desktop, Sell, Leasing and menu captures plus measured geometry are in [the evidence folder](mobile-services-patterns-2026-10-06/). Task preimages are preserved under ignored `runtime/mobile-services-patterns-20261006/`.
