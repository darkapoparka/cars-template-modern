# Modern mobile polish — 30 September 2026

Working copy: `L:/CODEX/cars/templates/modern`, Cars `main`, starting HEAD `807e2d6ee76aaa26fc08ffab64221faece3a2fdb`.

## Result

- Home, inventory, import, sell and lease entry controls share readable 16px, normal-weight typography, muted text and consistent control styling. Overlay inputs use the same muted text and retain focus restoration and clear behavior.
- Vehicle spec badges retain year, mileage, fuel and gearbox. Narrow cards wrap safely; wider mobile cards use aligned columns with more internal padding. The shared spec text is 13px.
- Mobile PDP similar cars reuse the inventory card, including all four badges. The redundant location row is gone. The related rail remains swipeable and links to the actual listing. The original desktop related-card presentation is retained.
- PDP stat tiles use less vertical padding and readable 15px values. Recognized trim packages such as `AMG Line` and `M Sport` use their short package label; the complete source version remains in the accessible value and title.
- Finance and showroom use one reusable CTA banner with centered, full-width copy, short headlines and a visible button. The finance link carries the selected vehicle into leasing. Showroom directions and the expandable map retain their existing destinations.
- The original bottom navigation assets are restored exactly from the pre-edit baseline. Its asset consumers and licenses are preserved.
- Only the opened menu drawer uses the new, consistent Lucide icons. Secondary links have a small white icon tile; contact actions and close controls use the same stroke treatment.

This request is mobile-only. Desktop source presentation, dealer copies, providers and deployment configuration were not redesigned.

## Source changes

Shared UI: `packages/marketplace-ui/components/{dealer-bottom-nav,dealer-vehicle-facts,listing-cta-banner,listing-detail-content,listing-location,listing-specs,mobile-dealer-discovery-header,mobile-marketplace-overlay,related-listing-card,vehicle-card-content}.tsx`; `packages/marketplace-ui/lib/{mobile-form-control,mobile-overlay-styles}.ts`; `packages/design-system/styles/tokens.css`.

Route controls: `apps/web/app/[locale]/components/mobile-sell-vehicle-hero.tsx`, `apps/web/app/[locale]/imports/components/mobile-import-source-search.tsx`, and `apps/web/app/[locale]/lease/{lease-car-selector,lease-selected-vehicle}.tsx`.

Editable field styling: `apps/web/app/[locale]/components/{mobile-sell-vehicle-policy,mobile-sell-vehicle-details-drawer,public-contact-fields,mobile-financing-form}` and `imports/components/{import-request-policy,import-request-fields}`. Shared responsive text classes apply the muted treatment on mobile while retaining desktop field styling.

The existing Sell overlay title assertion in `apps/e2e/specs/modern-mobile-completion.spec.ts` now matches the shared 18px heading.

## Verification

- Node 22.23.2 / pnpm 11.4.0.
- Marketplace UI Vitest: 84 tests passed; web Vitest: 186 tests passed, each with two workers.
- Web typecheck passed. The final production build passed compilation, TypeScript and all eight generated static pages, using the documented demo environment and isolated `.next-public-e2e-lease-polish-20260930-demo` output.
- Biome passed for all 24 task source/test files; scoped whitespace checks passed.
- During lease/badge work, the complete Chromium mobile suite passed 65 tests; the bounded WebKit completion/architecture suites passed 25. Fourteen affected badge, leasing and accessibility checks then passed across both engines.
- After the PDP, form and icon changes, rendered Bulgarian and English GLS detail pages were inspected at 320, 360, 390 and 430px. Bulgarian related cards measured 156px tall, retained four visible facts each and had no location row. Finance and showroom action labels each occupied one line at normal text size. Leasing navigation selected the GLS (`vehicle=am-1010`).
- Home, import, sell, lease and inventory were inspected at 320 and 390px. The mobile menu opened and closed. The initial 16px / 500 field treatment was subsequently changed to muted 16px / 400 after the owner's feedback.
- The final focused Chromium and WebKit checks passed 34 tests, covering listing reflow, badges, leasing, form focus and drafts, menu/gallery dismissal and automated accessibility. This run preceded the final field color/weight correction and navbar restoration.
- After the final field and drawer corrections, 12 focused Chromium/WebKit tests passed again: Sell draft/focus preservation, Sell type/contrast, import field clearing, leasing selection and menu/gallery dismissal. The final production build also passed with the corrected source (`runtime/mobile-lease-polish-2026-09-30/build-owner-corrections.log`).
- After the final corrections, all five route entry labels at 320 and 390px measured 16px / 400 with the muted token color `rgb(87, 91, 98)`. Filled Sell VIN, year, mileage and notes fields, including placeholders, matched that treatment. The menu and Sell form had no serious automated accessibility violations. All five bottom-nav icons used the original generated assets; only drawer icons used Lucide. No browser page or console errors were recorded.
- Final PDP checks at 320 and 390px found no serious automated accessibility violations, loaded both banner artworks, opened and collapsed the map, and followed a related card to its actual Mercedes E 63 S listing. No page or console errors were recorded.
- The final fresh browser matrix passed after recovery: no page or console errors, no horizontal overflow at the inspected widths, and no clipped spec badges. At 320px with the root text size verified at 32px (200%), the PDP still reflows without horizontal overflow and retains all four related-car facts; the finance action wraps naturally at the enlarged size.
- The 3001 App banners were inspected as the requested reference; that working copy was not edited.

Screenshots, logs, baseline copies and browser metrics are under ignored `runtime/mobile-lease-polish-2026-09-30/`.

## Remaining delivery state

The existing 6462 development process began returning HTTP 500 with a logged Turbopack async panic. After the user explicitly authorized its restart, the preview was restored in a foreground tool session using Node 22.23.2. One verified empty image-cache entry was moved to the task runtime directory for preservation, and the server was restarted with the remaining cache intact. The affected routes return HTTP 200 again, and the fresh browser matrix passed.

The Cars index lock predates this task (`L:/CODEX/cars/.git/index.lock`, 30 September 07:24:30 local time). It is preserved along with the nine unrelated staged paths. Commit/push remain pending until the lock owner releases it. No template release or dealer deployment was made.

Existing unrelated edits in Modern's instructions, route loading, vehicle-card wrapper and mobile-card layout remain outside this task's staged scope. Baselines preserve prior overlapping facts and bottom-navigation work; only the requested drawer-icon changes were applied to the existing nav container.
