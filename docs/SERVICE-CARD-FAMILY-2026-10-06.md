# Service artwork family — 6 October 2026

The owner subsequently requested the same artwork on mobile Services. [The mobile extension](SERVICE-CARD-MOBILE-REFRESH-2026-10-06.md) records that update; the desktop-only selection and mobile-preservation findings below describe this preceding stage.

The preceding service illustrations had inconsistent foreground scale and canvas placement. Imports also reused a comparison image without a freight cue. The user requested Image Gen artwork with a similar automotive style across the cards.

Desktop Home and Services now use one generated set with photographic white cars, charcoal glass and props, matching soft lighting, right-facing three-quarter views, transparent 720 × 405 px exports and a shared bottom margin. Browse keeps a two-car group; Imports has a car with a charcoal shipping container and crates; Leasing uses a calculator and coins; Sell uses a car key. These are decorative illustrations, not dealer inventory or evidence of a specific delivery method.

| Services before | Services after |
| --- | --- |
| ![Before](service-card-family-2026-10-06/before-services-cards.jpg) | ![After](service-card-family-2026-10-06/after-services-cards.jpg) |

| Home before | Home after |
| --- | --- |
| ![Before](service-card-family-2026-10-06/before-home-cards.jpg) | ![After](service-card-family-2026-10-06/after-home-cards.jpg) |

The [generated master](service-card-family-2026-10-06/generated-master-v1.png) and [provenance receipt](../apps/web/public/images/services/desktop-card-family-v1.provenance.json) retain the references, exact prompt, original path, hashes and derivative settings. Four production WebPs total 231,850 bytes. Export only separates transparent groups, trims near-invisible exterior padding and fits proportionally; it does not recolour, mirror, distort or repaint subjects. Existing source images are preserved byte-for-byte.

The optional `desktopServiceCards` artwork role lives in the existing public configuration schema and defaults. Desktop Home uses it; Services selects it through a mount-aware `<picture>` source at 1024 px. Mobile Services and the individual Imports/Sell/Leasing pages keep `desktopServices`. An older dealer's explicit service set remains authoritative unless that dealer supplies the new card-specific role. The original 144 px image areas, spacing, typography, 40 px catalogue actions, 48 px Home actions and destinations are unchanged.

Verification:

- Eight local BG/EN Home/Services desktop views at 1024/1440 px: four loaded illustrations, correct sources, contained text/actions and no horizontal overflow. Matched BG 1440 px geometry and typography are identical before/after.
- Six matched BG Home/Services pairs at 320/390/1023 px have identical measured geometry/styles. The three Services screenshots are pixel-identical and use the original image URLs. Home was inspected visually; its captures have inventory-image and small control rendering differences, so no pixel-identity claim is made for Home. The desktop service row stays hidden on mobile.
- Imports filtering gives one correct cargo card; All restores four; an unmatched search gives zero; clearing restores the set. Tab gives the first card its visible 2 px outline, and Enter opens `/bg/cars`. Cards retain one link with no nested buttons/links.
- Scoped Biome: six product files passed. Web TypeScript check (`pnpm --filter web exec tsc --noEmit --incremental false`) passed. Public site configuration: 31 tests passed, including independent card artwork, older dealer compatibility and invalid-path rejection. Refactor contracts: 7 passed. Release-preflight contracts passed; existing preflight tests: 87 passed.
- Both service stylesheets, `next-env.d.ts` and all four original service WebPs match their task-start preimages/hashes. Scoped diff whitespace checks passed. Final fresh Home/Services reloads had loaded images, no overflow and no fresh errors; the exact observations are retained with the captures.

[Measurements](service-card-family-2026-10-06/measurements.json), [verification](service-card-family-2026-10-06/verification.json), [interactions](service-card-family-2026-10-06/behavior.json) and [fresh reloads](service-card-family-2026-10-06/reload-verification.json) retain the browser evidence. Full viewport JPEGs are preserved; comparison crops use the same logical rectangle and account for native screenshot dimensions.

Task-start preimages and technical export/verification scripts remain under ignored `runtime/service-card-family-20261006/`. Existing dirty work is preserved. This is local source/preview work; no production build, WebKit qualification, mounted-release check, commit, promotion or dealer deployment was performed.
