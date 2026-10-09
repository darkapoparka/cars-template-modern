# Mobile Services compact tiles

The owner selected the Compact tiles comparison. Services now uses two columns below 1024px, with the existing artwork above short localized titles and a decorative corner arrow. Each tile remains one navigation link. This supersedes the earlier horizontal mobile cards in the [card balance note](MOBILE-SERVICES-BALANCE-2026-10-06.md).

Task changes are in apps/web/app/[locale]/services/page.tsx and apps/web/app/[locale]/services/services.module.css. The existing search, service data, quick pills, route gating, header and bottom navigation are reused. Image size hints now reflect the narrower mobile tiles. Descriptions and full titles remain available in the existing search data and desktop presentation.

## Verification

- Scoped Biome check passed for both edited source files.
- Production build passed with Node 22.23.2 and the existing pnpm workspace. TypeScript, route generation and static page generation succeeded. Build output is isolated in .next-public-e2e-mobile-services-tiles-20261006-demo.
- BG/EN at 320px and 390px: four loaded illustrations, two tile columns, no clipped titles or horizontal overflow. Both locales were also inspected at 1440px.
- BG at 1023px uses mobile titles and two columns; 1024px restores desktop titles and styling.
- Search for the visible mobile title Продай автомобил finds Sell. Clear resets the results and returns focus to search. The Selling pill and the empty/reset flow work.
- Keyboard focus has the existing 2px ring. Enter on Stock completes navigation to /bg/cars; a pointer click on Sell completes navigation to /bg/sell. The other service destinations remain /bg/imports and /bg/lease.
- At 1440px, BG desktop card text, card/artwork/heading/description/action rectangles exactly match the saved pre-edit measurements.
- A fresh page load has no console errors. The development tab recorded transient Turbopack CSS update errors while source was changing; fresh-load verification is saved in fresh-console.json.
- The build-generated next-env.d.ts was restored byte-for-byte after checking its changes belonged to this build. tsconfig.json retained its preimage hash.

Evidence: [before/after](mobile-services-tiles-2026-10-06/before-after.jpg), [BG 320px](mobile-services-tiles-2026-10-06/after-bg-320.jpg), [EN 390px](mobile-services-tiles-2026-10-06/after-en-390.jpg), [measurements](mobile-services-tiles-2026-10-06/checks.json), [breakpoint checks](mobile-services-tiles-2026-10-06/breakpoint.json).

This is a local template change. No commit, release promotion, dealer update or deployment was requested. Unrelated work is preserved. The original generated MODERN logo is still awaiting its source artwork; this slice does not substitute another logo.
