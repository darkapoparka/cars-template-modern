# Mobile frontend audit and polish — 4 September 2026

> The 5 September finalization section below supersedes the earlier visual descriptions of the bottom navigation, selected Lease state, term rail, header geometry and outstanding VIN test. Earlier results remain as session history.

Implemented locally on `codex/mobile-ui-polish-20260904`, starting at `14a3c82374478412f96c05b6385e53dcef4c5309`, in `M:\leads-cars\projects\bulgaria\day-night-auto-group` (`darkapoparka/day-and-night-modern`). Existing uncommitted service-page, Sell drawer and image work was preserved. No commit, push or deployment was performed.

## Findings and changes

| Priority | Finding | Resolution |
|---|---|---|
| P1 | The selected vehicle's full price was invisible on Lease. A legacy positional selector treated it as a field label and applied `display:none`. | Removed superseded positional Lease rules from `styles.css`. The named price slot now visibly shows the full vehicle price above its monthly estimate. |
| P2 | Import and Lease inserted 40px of empty space between the logo bar and their main control. | Reduced that gap to 8px and bottom spacing from 28px to 20px. Headers are 132px instead of 172px. |
| P2 | Large centered banner subjects were obscured by the search controls, and the service art did not share a composition suited to a shallow header. | Generated two matching charcoal photographic backgrounds with the subject on the right and a quiet logo area. Shipped responsive WebP assets, approximately 27 KB and 19 KB. |
| P2 | Bottom navigation used dense solid icons, tiny labels and a styling override that removed active font weight. | Five consistent Lucide outline icons, 12px labels, 64px targets, stronger active stroke/weight and a short red indicator. Secondary routes orient through Menu. |
| P2 | Shared dock typography was overridden in two stylesheets, making component styles unreliable. | Removed the dealer-dock overrides. Shared frame and Sell height now reserve the larger dock space. |
| P2 | Long inventory names were forced onto one line, hiding model/trim distinctions. | Two-line mobile names; desktop clamping preserved. Verified long Mercedes and BMW names at 320px. |
| P2 | Lease's two-column specification cells truncated mileage and transmission on the narrowest viewport. | Below 360px, the selected vehicle uses one column of facts; wider mobile keeps the two-column grid. |
| P2 | Quick filters and country/term chips were 40px tall. | Shared chip targets are now 44px. They remain separate from category, search and full filters. |
| P2 | Import card actions and Menu close controls were 40px tall. | Raised both to 44px. |
| P2 | Home logo links, guide actions and listing “View all” actions had targets below 44px. | Enlarged the hit areas without enlarging logos or changing desktop button sizes. |
| P2 | Old ID-based Menu styling overrode the current sheet, creating competing backgrounds and border/shadow treatments. | Removed obsolete Menu selectors; retained the existing accessible drawer, contact actions and secondary navigation. |
| P2 | Lease term selection changed the enquiry preference while leaving the listing estimate unchanged; the relationship was unclear. | Added an accessible term-group label and explicit copy explaining that the number is a listing estimate and the payment for the chosen term is confirmed separately. No unsupported loan calculation was invented. |
| P2 | Import failure guidance was small and low in hierarchy inside another gray panel. | White recovery surface and more readable 14px explanatory text. The existing “Describe vehicle” recovery remains available. |
| P3 | Contact's mobile intro used desktop-scale spacing before useful information. | Reduced mobile vertical padding and group gaps; desktop geometry preserved. |
| P3 | Sell placed its main task unnecessarily low below the brand bar. | Reduced top padding and excess content-bottom spacing; retained VIN/manual entry and the inventory drawer. |

The audit preserved the established white/zinc/red identity, separate filtering decisions, horizontal inventory cards, real source boundaries and existing Dialog/Drawer primitives. It did not replace inventory photographs with generated vehicles.

## Rendered coverage

The mobile route sweep covered Home, Cars, Import, Germany import unavailable state, Sell, Lease, Contact, Guides, one guide article, one listing detail, China import information, Trucks, Vans and Motorbikes. This samples all major public mobile page families; it does not enumerate every vehicle, make/model combination, legal article or provider response.

Primary flows were rendered at 320, 360, 390 and 430px widths, plus 844×390 landscape. Desktop Cars, Import, Sell and Lease were checked at 1440×900. English-prefixed Import and Lease URLs were opened at 390px; follow-up verification showed the dealer demo redirects these to Bulgarian, so this is not English-language acceptance. The final narrow Lease confirmation used 320×700.

- No page-level horizontal overflow in the recorded route/viewport samples.
- No visibly broken images in those samples.
- No axe WCAG A/AA violations on the 14 mobile route samples. Automated results are not a complete manual accessibility certification.
- Thirteen interaction checks passed: Menu, category, full filters and price picker open/close/focus return; search and empty-query recovery; import URL draft and invalid URL handling; country unavailable/request recovery; Lease price and term selection; vehicle picker; financing enquiry overlay; Sell manual form and VIN preservation; final-card dock clearance; 200% root text-size overflow check on Cars.
- Drawers and form screenshots were captured with transitions settled. Existing overlays retain one body scroll owner and reachable in-flow actions.
- Desktop mobile headers and dock are hidden; original desktop composition remains.

## Source validation

- Web and marketplace-ui typechecks passed.
- Marketplace UI tests: 68/68 passed.
- Web suite: 127 tests passed and one VIN-normalization expectation failed; an additional integration suite initially could not import Prisma. After restoring the missing installed Prisma package, its two tests passed.
- The remaining VIN test expects the normalizer to remove `U`, whereas the current allowed-character implementation retains it. Neither the existing test nor normalizer was changed by this polish; this requires a separate test-policy correction.
- Production web build passed and generated 44 static pages. The final semantic term-group markup and copy also passed targeted Biome validation and rendered confirmation.
- Targeted Biome and `git diff --check` passed. Impeccable detector returned no findings. The clean-product scanner flagged only the pre-existing backdrop blur in the alternative marketplace dock, which is not rendered in the dealer demo.

## Remaining issues and limits

1. **Import data availability:** the connected import feed returned an unavailable/error state during this audit. The Germany tab also correctly remains unavailable. The UI fallback works, but this is not evidence of a working live external inventory feed. No provider credentials, source agreements or production settings were changed.
2. **Inventory content:** this checkout is a static dealer demo with inherited listing imagery and estimates. Generated assets here are decorative banners only. Real listing-photo accuracy and production data need separate verification.
3. **Financing:** the term selector records an enquiry preference; there is no verified live lender calculator. The interface now states that limitation next to the estimate.
4. **Validation:** the existing VIN test mismatch remains. Actual iOS/Android keyboards, VoiceOver/TalkBack, real-device safe-area behavior and completed lead delivery were not verified; browser touch emulation, focus and form behavior were checked without sending enquiries.
5. **Runtime:** disk exhaustion and stale Turbopack CSS initially prevented reliable confirmation. Four empty installed dependency packages were restored at their existing versions: `require-in-the-middle@8.0.1`, `import-in-the-middle@3.0.1`, `prettier@3.8.3`, `@prisma/client@7.4.2`. No manifest or lockfile change. The old dev cache is preserved at `J:\codex-artifacts\day-night-mobile-polish-20260904\dev-cache-before`; current source was rendered after a fresh dev-cache rebuild. Development logs still contain Vercel Toolbar configuration and LCP advisories. No production performance score is claimed.

## Assets and evidence

- `apps/web/public/images/import/day-night-mobile-terminal-v2.webp`
- `apps/web/public/images/lease/day-night-mobile-studio-v2.webp`
- Generation method and full prompts: `day-night-mobile-v2.prompt.md` beside each asset. Built-in image generation was used, followed by Sharp WebP optimization. Original generated PNGs remain in Codex generated images.
- Local before/after screenshots, route metrics, interaction results and runtime logs: `artifacts/mobile-polish-20260904/` (ignored QA artifacts).
- Main machine-readable files: `audit-results.json`, `interaction-results.json`, `confirmation.json`.

Open the local review at `http://localhost:6212/imports`, `/lease`, `/cars` and `/sell` using a mobile viewport.

## Finalization — 5 September 2026

This pass audits the public mobile frontend and preserves the approved card layout, menu buttons, photographic service headers, inset rails and compact bottom navigation. The dock has a faint top border, red active icon/text and no active background block. Lease starts without a selected car; the full-height image/specification card and its clear button remain intact. No publishing or customer enquiries were performed.

### Additional issues fixed

| Priority | Finding | Final behavior |
|---|---|---|
| P1 | Closing Sell, Import or financing discarded entered details. | The current page retains drafts in React memory; reopening restores vehicle fields, contact fields and financing preferences. Changing the financing vehicle starts a separate request. Successful submission clears the retained draft when closed. No local/session storage of personal data. |
| P1 | Escape in the nested country drawer could dismiss the entire Import request. | The shared overlay dismisses only the top open surface, and the mixed Vaul/Dialog country picker handles Escape explicitly. The parent request and its draft remain open. |
| P2 | Cancelling the make picker could focus the disabled model trigger. | Focus returns to the control that opened the picker. Sell overlay field IDs are distinct from its hidden desktop form. |
| P2 | Switching from make to model left command-list ARIA references pointing at removed options. | Each make/model dataset has its own command instance; keyboard selection continues into the new search field with valid active-option references. |
| P2 | Taxonomy pickers repeated the misleading automatic first-row highlight. | Only the actual selected value receives a fill/checkmark. Keyboard navigation has a separate outline. |
| P2 | Search results and the selected Lease-picker row had insufficient metadata contrast. | Darkened secondary text; the final affected states pass the axe contrast check. |
| P2 | Form/picker titles, close-control alignment, field radii and heights differed. | Shared 17px overlay header and 44px close actions; Sell, Import and financing use consistent 48px mobile inputs with gray fills and 12px corners. |
| P2 | Country options could become unreachable in landscape. | The option list scrolls while the drawer header/close button remain reachable. |
| P2 | Numeric fields clamped each typed digit, interrupting manual year/budget entry. | Raw input remains editable until blur, then normalizes to the allowed range. Sliders and presets still update the values. |
| P2 | Numeric quick choices wrapped; search shortcuts were only 40px. | Numeric presets scroll in one horizontal row on mobile. Search shortcuts have 44px targets. Desktop preset grids are preserved. |
| P2 | Recovery/legal/listing-contact navigation had small mobile targets. | Enlarged the relevant actions to at least 44px, with compact error-page branding. Error recovery respects the resolved Bulgarian route locale. |
| P2 | Sell copy said all details were optional although manual vehicle fields were required without a complete VIN. | Copy now accurately explains the VIN-or-manual-details choice. |
| P3 | The VIN unit test expected U to be removed, conflicting with every existing domain VIN schema. | Corrected the assertion to preserve U and explicitly reject I/O/Q; the input-normalization implementation is unchanged. |

### Final verification

- **41 route/viewport samples**, including 23 mobile route/state samples: Home, category and make/model inventory, Import default/unavailable/request, Sell, Lease empty/selected, Contact, Guides/article, listing/detail contact, China import, collection, legal pages and 404. Primary mobile widths: 320, 390 and 430px; landscape 844×390; desktop 1440×900.
- **23 overlay/state samples** across Menu, category, full filters, numeric/fuel filters, search/default/results/empty, import URL/request/country/make/model, Lease picker/information/financing, Sell information/inventory/details/make and gallery. Final affected states have no axe WCAG A/AA violations. This is browser automation, not a screen-reader certification.
- **21 behavior scenarios passed** across the dedicated behavior/flow runs, including cancelled versus applied filter drafts, reset, browser Back/Forward, numeric typing, custom model entry, form draft restoration, required-field validation, selected-car clearing, horizontal rails, nested Escape, focus return, gallery focus trap, Menu navigation, 200% root text and reduced motion. Two flow checks were repeated after waiting for nested picker exit transitions; both passed. The final keyboard-specific run also verifies make-to-model focus, valid ARIA references and two-level Escape.
- No page-level horizontal overflow or visibly broken images in the route sweep. Narrow and landscape form actions and close controls remain reachable. Final desktop Cars/Import/Sell/Lease screenshots preserve their existing composition and hide the mobile dock.
- Marketplace UI tests **68/68**, web tests **131/131**. Web and marketplace-ui typechecks passed. Production build passed, including TypeScript and 44 generated static pages. Targeted Biome, `git diff --check` and the clean-product scan passed.
- The initially intermittent Guides recovery screen resolved in subsequent rendered checks. The same checkout's dev server was restarted to release accumulated memory; current evidence uses the restarted local server. No cache or user files were deleted.

### Evidence and remaining limits

Raw audit, confirmation screenshots and logs are in `artifacts/mobile-final-20260905/`. `acceptance.json` consolidates the final results without replacing the earlier evidence. `confirmed/` contains final overlay, narrow/landscape and desktop screenshots. `keyboard-final.json` supersedes the initially detected model-picker ARIA failure.

The external import feed still returns its honest unavailable state; feed/provider operation is outside this UI completion. The financing provider remains unconfirmed, so no new financing promises or calculated offers were added. Actual iOS/Android keyboards and screen readers, real-device safe areas, successful lead delivery and production hosting were not verified. Local validation blocked outgoing form POSTs; no customer enquiry was sent.

## Leasing drawer and API follow-up — 2026-09-05

- Moved the leasing explanation and information action above the selected car. Added an inset rounded inventory drawer entrance with tap/swipe-up support, searchable full-size horizontal cards, and a checkmark only on the actual selection. Kept clear-selection, URL synchronization, and the existing request form.
- Search now distinguishes no matches from an empty inventory. Import copy distinguishes an unconfigured catalogue from an unavailable provider.
- Confirmed next-forge monorepo identity. Local web runs on 6212 (PID 67316); API runs on 3002 (PID 77744). API startup required an ignored apps/api/.env.local with local origins and the existing development validation bypass; no database or provider credentials are configured. README documents local startup and these limits.
- API evidence: /health 200, status ok; US inventory returns disabled/not_configured; DE returns disabled/unsupported_origin. /ready is 503/not_ready because database, auth, and other service configuration is missing. Liveness does not establish production readiness or restore external listings.
- PASS: 9 rendered states across 390x844, 320x700 and desktop 1440x900, with zero page errors, horizontal overflow, or axe WCAG A/AA findings. Search/empty state, keyboard selection, actual-selection checkmark, clear and URL reset, Escape/focus return, swipe entrance, scroll to last car with search still visible, and request-offer overlay were exercised. No enquiry was submitted.
- PASS: web typecheck, 2 lease policy tests, Biome on the four changed UI files, UI scanner (zero findings), and git diff --check. No new full build in this follow-up; prior finalization build remains separate evidence.
- Evidence: artifacts/mobile-final-20260905/lease-drawer-check.json, lease-gesture-check.mjs and lease-before.png / lease-after.png / lease-drawer-after.png. No commit, push or deployment.

## Corrected leasing hierarchy and persistent sheet — 2026-09-05

This supersedes the preceding leasing drawer entrance: the white header vehicle selector is restored. How leasing works is an on-page heading and three visible steps; the conditions/documents action opens the detailed information. Vehicle cards and the selected-card clear action remain unchanged.

The inventory sheet is anchored above the 60px bottom navigation and safe area. Its collapsed header can be tapped or dragged; pointer movement reveals the real search/list content progressively, then snaps open or closed. The collapsed surface is an ordinary page region, with inert offscreen controls; expanded mode uses the shared modal focus and dismissal primitive. This avoids a hidden modal intercepting Escape from information, financing or menu overlays. Reduced-motion styling disables the snap transition.

PASS: lease-real-sheet.mjs covers 7 states at 390x844, 320x700 and 1440x900, zero page errors, axe violations or horizontal overflow. Drag position changed by 190px before release. lease-sheet-interactions.mjs verifies real Chromium touch drag, downward drag, header/dock focus restoration, search and empty state, selection, and Escape in the menu/financing overlays; no request submitted. Typecheck, scoped Biome, UI scanner and scoped git diff --check pass. Updated screenshots: lease-real-sheet-home.png, lease-real-sheet-open.png, lease-real-sheet-selected.png, lease-real-sheet-320.png and lease-sheet-mid-touch.png in artifacts/mobile-final-20260905.

## Leasing steps visual refinement — 2026-09-05

Replaced the red numbered markers with consistent 20px outline icons in a 24px column aligned to each title's 24px line. Shortened Bulgarian and English step copy and reduced the section heading to 18px. Header selector, inventory sheet, cards and information overlay behavior are preserved. Rendered at 390x844 and 320x700: all three icon/title center offsets measure 0px, no overflow or axe findings, and details opens/closes with Escape. Web typecheck, scoped Biome and UI scanner pass. Evidence: artifacts/mobile-final-20260905/lease-steps-check.mjs and lease-steps-390.png / lease-steps-320.png.


## Leasing inventory inline — 2026-09-05

Supersedes the persistent inventory sheet. Mobile leasing now shows the existing selectable car cards in normal page flow, with search in the white header field. How leasing works is a labeled action opening the steps and FAQs in a single scrollable information drawer. Selection shows the original selected card and request CTA; clear/change returns to the list and focuses the heading without opening the phone keyboard. Removed the obsolete vehicle-picker module and its state. Desktop controls are preserved.

PASS: lease-inline-check.mjs covers default, search/no results, selected car/URL, financing overlay, clearing/focus, information drawer/Escape, 320px list end and desktop. Five rendered states have no axe violations, overflow or page errors. Web typecheck, scoped Biome, UI scanner and diff checks pass. Information scroll area is keyboard-focusable with an explained scoped lint exception. Screenshots/results: artifacts/mobile-final-20260905/lease-inline-*.png and lease-inline-check.json. No request submitted.

## Shared mobile keyboard handling and leasing filters — 2026-09-05

The latest leasing layout keeps cars inline and uses the existing Cars quick-filter components for Price, Year and Fuel. The inset rail scrolls horizontally; active pills show their values, filters combine, and Reset restores the inventory. Filtering uses numeric price/year and the vehicle fuel enum. Selection preserves the approved car card and offer action; clearing restores the list and pills. The redundant visible leasing heading is now screen-reader-only. How leasing works remains a visible action opening the information drawer. Empty results now explain both filter and search recovery.

Shared overlays follow VisualViewport height and offset when a mobile keyboard reduces or pans the visible area. Focused fields scroll inside the overlay, close controls and form actions remain reachable, inputs use 16px text, and the bottom navigation is hidden while the keyboard occludes it. Removed height-transition lag during keyboard resizing and corrected gallery positioning under the shared viewport contract. Pinch zoom is ignored and mobile viewport attributes are cleaned up on desktop. Quick-filter dismissal restores focus to its initiating pill.

- PASS: 28 simulated overlay states and 31 fields across inventory search/filters/menu, Import forms/taxonomy, financing, leasing information/filters, Sell forms/taxonomy/inventory and gallery. Includes visual viewport shrink/pan and 320px-wide resized layouts; zero reported page errors. Pinch-zoom handling and desktop cleanup pass.
- PASS: leasing combined filters, inclusive boundaries, empty results/reset, selection/clearing, focus restoration, inset rails at 320px and 390px, and no axe violations in the checked leasing states.
- PASS: 200 unit tests (132 web, 68 marketplace UI), two permanent mobile keyboard Playwright regressions, web and marketplace UI typechecks, scoped Biome/UI scanner/diff checks. Screenshot captures wait for entrance animations to settle.
- NOT TESTED: physical iPhone/Android keyboards and Safari. Chromium viewport/touch emulation is supporting evidence, not real-device keyboard certification. No new production build, deployment, or enquiry submission in this pass.
- Evidence: `artifacts/mobile-final-20260905/keyboard-acceptance.json`, `lease-pills-check.mjs`, `lease-quick-pills-390.png`, `lease-quick-pills-320.png`, and `keyboard-financing-visible-area.png`. Permanent regressions: `apps/e2e/specs/mobile-keyboard.spec.ts`.

## Service artwork and complete leasing filters — 2026-09-05

Supersedes the photographic mobile headers and three-pill leasing rail. Leasing now has the same five condition pills as Cars (price, year, mileage, fuel, transmission), plus the shared full filter overlay for make/model and additional criteria. All exposed criteria apply to typed vehicle data; local country names resolve to country codes for origin/destination matching. Reset and selected-car behavior are preserved. Fixed the shared full-filter overlay's missing focus return.

The leasing information action is now a visible crimson banner inside a solid red header with generated key/percent artwork. Import has a warm yellow header with generated car/container artwork above the existing link field. Both use the original logo on a dark backing; existing car cards and desktop artwork remain intact. Full prompts and saved image paths are in `docs/service-artwork-2026-09-05.md`.

PASS: 9 rendered route/overlay states at 320, 390 and 1440px with no axe A/AA findings, horizontal overflow or page errors. Mileage, transmission, full make/model filtering, combined filters, reset, information dismissal and focus return exercised. Three policy tests and two permanent keyboard regression tests pass. Web and marketplace UI typechecks, scoped Biome, UI scanner and diff checks pass. No production build, deployment or enquiry submission in this follow-up. Real phone keyboard testing remains unverified.

## Compact service-header correction — 2026-09-05

Removed the added black backing/padding around both service logos. Removed the import promotional headline/subtitle and its 104px row; retained the generated illustration beside the brand bar, with the link input directly below. Reduced leasing information banner from 104px to 64px and removed its subtitle, retaining the single action label, artwork and drawer interaction. PASS: nine responsive route/overlay samples, axe A/AA, overflow, filter/reset and focus checks; scoped Biome and UI scanner pass. Updated `*-service-*.png` evidence. No inventory-card changes.

## Service-logo contrast — 2026-09-05

Added explicit wordmark tones to the shared mobile brand bar: white lettering on the red leasing header and dark lettering on the yellow import header. The original wheel emblem, exact letter shapes, logo dimensions and transparent background are preserved through clipped CSS rendering of the same source asset. Other pages retain the original logo. No image generation or raster regeneration needed for this rendering change.

PASS: both routes rendered at 320px and 390px; logo layers align, source loads, and link background is transparent. The fresh 320px run reports no page or console errors. Marketplace UI typecheck, scoped Biome and UI scanner pass. Evidence: `artifacts/mobile-final-20260905/lease-wordmark-320.png`, `imports-wordmark-320.png` and corresponding 390px captures.

## Leasing information below filters — 2026-09-05

Moved the information trigger out of the red header into a compact inset 64px red banner directly below the filter pills. Search now follows the logo. Preserved generated artwork and drawer contents; selected-car state retains the banner with 12px spacing before its card. PASS at 320/390: measured banner below rail, absent from header, open/Escape/focus return, no horizontal overflow or page errors. Scoped Biome and UI scanner pass. Evidence: `artifacts/mobile-final-20260905/lease-banner-below-pills-390.png` and `lease-banner-below-pills-320.png`.

## Service help controls and restored leasing selector — 2026-09-05

Supersedes the inline leasing search and information banner. The white leasing capsule is a real button opening a searchable full-screen car selector using the shared keyboard-aware overlay and the original vehicle cards. Change car opens the same selector; cancelling preserves the current selection, the selected row alone has a checkmark, selecting focuses the offer action, and the card X still clears selection. Inline inventory and full/quick filters remain available.

All three mobile service headers now place a shared 44px help button at the top right, with a route-specific accessible label. Leasing retains its steps and FAQs, Import opens its existing request/delivery FAQs, and Sell opens its existing selling instructions. Removed the leasing banner and moved import header decoration out of the help control's space. Sell uses a pale blue solid header, dark logo lettering, VIN entry directly below the brand bar, and a manual-entry action in the rounded content area. Desktop layouts remain unchanged.

Fixed a Sell help-to-form transition race: the details form now opens after the help drawer has closed, rather than after an arbitrary 120ms timer, so Escape is handled by the active form.

PASS: 14 rendered states across all three routes at 320/390 mobile and 1440 desktop, their help drawers, leasing search and simulated keyboard shrink. No axe A/AA findings, horizontal overflow or page errors. Selection/search/empty/cancel/clear, help focus return and Sell help-to-form dismissal passed. Three new permanent navigation regressions and the two existing keyboard regressions pass. Web typecheck, scoped Biome and UI scanner pass. Physical phone keyboards remain unverified; no enquiry submitted or deployment performed.

Evidence: `artifacts/mobile-final-20260905/service-help-selector-check.json`, `*-help-390.png`, `*-help-320.png`, `lease-selector-search.png`, `lease-selector-keyboard.png`; permanent tests in `apps/e2e/specs/mobile-service-navigation.spec.ts`.

## Sell inventory in normal page flow — 2026-09-05

Removed the viewport-height/flex spacer and bottom-anchored inventory entrance from Sell. Existing car cards now appear immediately after the VIN/manual-entry section under “Обмисляте бартер?”, with a 44px “Всички коли” link to the full inventory. Removed the unused MobileSellInventoryDrawer component. The form remains the first action; help and vehicle details still use overlays.

PASS: 320/390 rendered mobile states with inventory beginning at y=329/308 respectively and exactly 16px after the manual-entry action; no axe A/AA violations or horizontal overflow. Manual form, help dismissal and full-inventory navigation work; desktop inline section remains hidden. No page errors. Scoped Biome/UI scanner pass. Evidence: `artifacts/mobile-final-20260905/sell-inline-check.json`, `sell-inline-390.png`, and `sell-inline-320.png`.

## Import canvas color parity — 2026-09-05

Changed the mobile import filter strip and listings/empty-state surround to the shared `bg-background` token used by Leasing. Removed the white filter-strip band and darker zinc-100 surround while retaining white cards and the yellow header. Desktop listings background override remains unchanged. PASS: computed backgrounds equal Leasing (`lab(97.912 0 0)`) at 320/390; no overflow/page errors. Scoped Biome/UI scanner pass. Evidence: `artifacts/mobile-final-20260905/import-background-matched-390.png` and corresponding 320px capture.

## Menu social controls — 2026-09-05 (profile URLs partially pending)

Added a compact three-column social link component with platform icons and labels, matching existing gray menu buttons. Links open a separate tab with noopener/noreferrer. Centralized optional YouTube/Instagram/TikTok destinations in leadSite.socialLinks; only configured platforms render. Instagram uses https://www.instagram.com/dayandnight_autogroup/, identified in the dealership Instagram attribution in https://www.youtube.com/watch?v=aqEH-BS5InA. Exact YouTube and TikTok profile URLs were requested from the user and remain pending; no guessed destinations or inert buttons are published.

PASS: Instagram menu control at 320/390, destination/new-tab attributes, Escape and no horizontal overflow. Scoped Biome and marketplace UI typecheck pass. Evidence: `artifacts/mobile-final-20260905/menu-social-390.png` and corresponding 320px capture. This follow-up is not complete for YouTube/TikTok until their profile URLs are provided.

## Menu social placeholders — 2026-09-06

User explicitly requested YouTube and Facebook placeholders. Added both as disabled icon buttons alongside the existing Instagram link; configured URLs automatically turn them into links. Accessible labels identify coming-soon state. Facebook added to the social-link config type. PASS: rendered 390px menu, both placeholders visible and disabled, Instagram remains a link; scoped Biome and UI scan pass. Evidence: artifacts/mobile-final-20260905/menu-social-placeholders-390.png.


## Shared mobile header geometry — 2026-09-06

Measured before: Cars search y=64/content y=136/pills y=148; Lease search y=68/content y=128/pills y=144; Import search y=68/content y=128/pills y=140. Logo image height also varied slightly after decode. The route-loading skeleton still used an unrelated short white header.

Added MobileDealerChrome and a shared content-surface class for Home/Cars, Lease, Import and Sell. Shared geometry: 12px minimum safe-area top, 44px brand/action row, 8px gap, reserved 52px primary control, 24px bottom space and 12px surface overlap. The logo now reserves its aspect ratio before image decode. Removed Lease rail margin/padding duplication and aligned Cars/Lease inventory starts and 16px card gutters. Import empty/listings region follows the same spacing. Removed the flow height of the Cars sticky-header sentinel while retaining its intersection target. Replaced Cars/Lease loading headers with the same chrome and correct Lease color; removed the old mobile loading summary spacer. Existing route colors, cards, overlays and actions retained.

Rendered at 320/390: all four top surfaces start at y=128, primary controls at y=64; Cars/Lease first inventory at y=196. Desktop 1440 shows no mobile chrome; no page errors or horizontal overflow in the 12-route/viewport capture. Evidence: artifacts/mobile-final-20260905/chrome-alignment.json and chrome-aligned-{cars,lease,imports,sell}-{320,390,1440}.png. Permanent navigation geometry regression: apps/e2e/specs/mobile-chrome.spec.ts (320/360/390/430 plus 844px landscape, route transitions and Back).

PASS: all 10 Chromium tests (five navigation geometry widths, two simulated keyboard models, three service navigation/help cases), web and marketplace-ui typechecks, scoped Biome and UI scan. Native phone browser/keyboard behavior is not certified by these desktop Chromium checks.

## Import capsule arrow inset — 2026-09-06

Matched Import trigger padding to Leasing: 16px on both sides instead of 4px on the right. PASS at 320/390: both arrow boxes have a 16px right inset; Import overlay opens, Escape closes and focus returns. Scoped Biome/UI scan pass. Evidence: artifacts/mobile-final-20260905/import-arrow-{320,390}.png. No new category control added; the user asked for a recommendation on its placement.

## Home search chevron and social brand marks — 2026-09-06

Added the shared 20px right chevron with 16px inset to the expanded Home/Cars search capsule. Its text truncates in the available space; compact sticky search stays compact. Replaced generic social outline icons with official local Meta/YouTube assets; Instagram uses the official white glyph over a gradient badge. Neutral menu buttons and labels retained; YouTube/Facebook remain disabled placeholders. Brand asset provenance is recorded in apps/web/public/images/social/README.md. PASS at 320/390: arrow inset, search opening/Escape/focus return, all logo assets decoded, placeholders disabled. Scoped Biome/UI scan and marketplace UI typecheck pass. Evidence: home-search-arrow-{320,390}.png and menu-branded-social-{320,390}.png in artifacts/mobile-final-20260905.

## Black selected quick pills — 2026-09-06

Changed the shared getMobileQuickPillClassName selected state to zinc-950 with white semibold text and zinc-800 hover/pressed. Applies consistently to Import origins, Cars/Lease quick filters and financing term/deposit pills. Red primary actions and active dock destination retained. Updated DESIGN.md. PASS: Import China selection and switch to Germany at 320/390, selected/previous classes and white text verified; scoped Biome pass. Evidence: artifacts/mobile-final-20260905/black-selected-pills-{320,390}.png.


## Raised branded menu and GitHub handoff — 2026-09-06

Raised Menu to the shared primary-control bottom (y=116 with standard top inset), covering the page's y=128 rounded surface. Replaced the visible Menu/dealer text with the shared 128px logo and dark wordmark; accessible dialog title/description remain. Kept 44px close control, original action buttons, branded social controls and a single independently scrolling body. Logo navigation now closes Menu before opening Home.

PASS: 390x674, 320x700, 390x844 and 844x390 menu position, visible logo, scrolling to social controls, Escape and focus return. Evidence: artifacts/mobile-final-20260905/menu-raised-{width}-{height}.png. The UI scanner's one finding concerns the pre-existing BottomMarketplaceNav backdrop blur, not the dealer menu changed here. User authorized committing and pushing accumulated mobile polish; local .tmp assets and QA scratch scripts are excluded.

Final handoff checks PASS: 200 scoped unit tests (web 132, marketplace-ui 68), all 10 Chromium navigation/keyboard/service tests, web and marketplace-ui typechecks, scoped Biome on 67 files and staged whitespace check. Menu logo navigation closes the drawer and reaches Home with no page errors. This is local validation, not a hosted deployment or physical-device certification.

Menu follow-up: lowered the sheet by 8px at the user's request, from y=116 to y=124. PASS: rendered 390x674 position and scoped Biome.

## Sell intro simplification — 2026-09-06

Removed the visible trade-in heading and All cars link above the existing inventory. Kept an accessible inventory heading. Centered the mobile title and subtext; Bulgarian copy now reads Продайте автомобила си / Въведете VIN или добавете данни, with corresponding concise English copy. Removed the unused inventoryHref prop. PASS at 320/390: subtitle occupies one 24px line, intro centered, removed text absent and manual details form opens. Evidence: artifacts/mobile-final-20260905/sell-simple-intro-{320,390}.png.

Sell VIN action follow-up: replaced the filled black circle/arrow with the same plain 20px ChevronRight as the other primary fields. Retained the 44px submit target, 16px right icon inset, focus/pressed feedback and native VIN validation. PASS at 320/390: geometry and valid VIN opens the details form; scoped Biome/UI scan pass. Evidence: artifacts/mobile-final-20260905/sell-vin-chevron-{320,390}.png.
