# Mobile service titles — 6 October 2026

Sell now explains the action before the VIN entry. Import and Leasing use the same optional title slot in the shared mobile service header: centered white 22/28 px text, followed by 12 px of space and the existing 48 px input/selector. All three retain the configured charcoal header, brand row and help/call actions.

The Sell heading moved out of the grey content panel. Its manual-entry button and next-steps card retain their existing vertical positions at 390 px. Home, Cars, Services and Guides keep their search-led headers without an extra visible title. About and Contact already introduce their content in the header.

Sell retains its existing details overlay and review-before-call journey. The VIN and manual entry controls still open the same overlay; VIN entry focuses the VIN field. Escape restores focus to the control used to open it. No additional wizard steps or delivery claims were introduced.

## Changed source

- `apps/web/app/[locale]/components/mobile-dealer-service-hero.tsx`: optional reusable title and title ID.
- `apps/web/app/[locale]/components/mobile-sell-vehicle-hero.tsx`: move the existing heading into that slot.
- `apps/web/app/[locale]/imports/page.tsx`: expose its existing localized mobile heading above the listing-link entry.
- `apps/web/app/[locale]/lease/lease-mobile-selection.tsx`: expose its existing heading above vehicle selection, retaining the `lease-mobile-title` focus target.
- `apps/e2e/specs/mobile-chrome.spec.ts`: preserve brand/control alignment assertions while distinguishing titled service headers from compact browsing headers.

## Verification

Biome and scoped diff checks passed for all five changed files. Direct web TypeScript checking passed. The isolated provider-free Next production build passed compilation, TypeScript and page generation with Node 22.23.2 / Next 16.3.8 at `.next-public-e2e-service-titles-build-20261006-demo`.

Browser captures verified Sell, Import and Leasing in BG/EN at 320 and 390 px. Each title occupies one 28 px line at y=68; the primary control is 48 px tall at y=108, and the rounded content panel begins at y=168. No horizontal overflow was observed. Home/Cars retain primary-control y=68 and content y=128; Services retains its search position at y=68. At 1440 px all three changed mobile heroes are hidden and the existing desktop headings remain visible. Sell manual/VIN opening, Escape dismissal and focus restoration passed at 320 px, with no errors in the inspection tab's console.

The existing browser suite covers navigation at 320/360/390/430 px and 844 px landscape, VIN continuation/edit/reload, leasing selection/reopening/phone handoff, and Import draft/country-picker preservation. Final suite results are recorded in `mobile-service-titles-2026-10-06/verification.json`.

[Matched Sell comparison](mobile-service-titles-2026-10-06/sell-before-after.jpg), route captures, DOM measurements and overlay focus evidence are in `docs/mobile-service-titles-2026-10-06/`. Source preimages, build logs and generated-file evidence are retained in ignored `runtime/mobile-service-titles-20261006/`.

This is a local master refinement on Cars `main` at `08c89d63f9e11939acd5b135ece4278252b80f43`; previous dirty work was preserved. These checks do not constitute a template release or hosted dealer acceptance.
