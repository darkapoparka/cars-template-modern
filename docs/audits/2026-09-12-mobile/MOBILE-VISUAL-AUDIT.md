# Mobile visual and interaction audit

Snapshot: 12 September 2026, local `astra` working tree. Priorities: P0 = security/release blocker; P1 = fix before mobile sign-off; P2 = consistency, maintainability, or design refinement. Code paths below are relative to the repository root. Evidence paths are relative to this audit directory.

## Preserve the current foundation
The black inventory header, integrated search, quick-filter pills, compact white vehicle cards with fact badges, service-specific header colors, and five-destination illustrated bottom navigation already form a recognizable mobile system. Do not replace them with the older generic marketplace header or import a desktop reference's navigation/buy box. Correct defects inside this system. Keep action hierarchy: a small secondary control need not look as large as the primary submit action.

## M01 — P1 — Listing detail overflows the viewport
**Reproduction:** open `/listing/bmw-x5-m50d-sofia-2020` at 390×844, then scroll to the map. The layout viewport is 390px but document scroll width is 406px. The map section begins at x=-16 and is 422px wide. The same representative overflow is present in WebKit; other listing fixtures and narrow-width captures share it.

**Source owner:** `packages/marketplace-ui/components/listing-location.tsx`, the section using `-mx-4`. Its mobile placement in `listing-detail.tsx` is now an unpadded purchase-column wrapper, not the padded article that would justify those negative margins.

**Proof:** `interactions/results.json`, entry `listing-overflow-probe`, records document width 406 before and 390 after a browser-only removal of the map's side margins. `final-checks/results.json` records WebKit scrollWidth=406. Source files were not modified for the probe.

**Fix:** give the map section explicit, parent-independent mobile container geometry and the agreed rounded surface/gutters. Keep the related-listing rail's intentional internal horizontal scrolling. Do not hide the defect with global `overflow-x:hidden`.

**Acceptance:** document scroll width does not exceed its client width at 320/360/390/430px and landscape, with map loaded, both tabs visited, and bottom action visible. Related cards remain independently scrollable. Evidence: `browser/_listing_bmw-x5-m50d-sofia-2020-320x700-bottom.png`.

## M02 — P1 — Sell loses vehicle data between steps
**VIN reproduction:** load `/contact?intent=sell&category=car&vin=WBA12345678901234` with the synthetic audit VIN. The handoff says the details are ready but renders a vehicle summary of dashes. Its edit URL is `/bg/sell?category=car`: the VIN is discarded.

**Edit reproduction:** load `/sell?category=car&make=BMW&model=X5&year=2020&mileage=80000`, then open the manual entry drawer. The mobile form's model/year/mileage values are empty. The visible “X5”, “2022”, and mileage examples are placeholders, not restored values.

**Source owners:** `apps/web/app/[locale]/contact/page.tsx` omits VIN from `sellContext`; `sell/page.tsx` parses initial values for the desktop form but passes only locale/contactHref to `MobileSellVehicleExperience`; the mobile experience/drawer starts from empty state.

**Fix:** define one small typed sell draft and shared parse/serialize functions. Carry VIN through handoff, summary, edit, and the mobile form's initial state. Do not introduce a global store, database-backed draft system, or parallel mobile-only field schema for this flow.

**Acceptance:** VIN-only and manual-entry round trips preserve every supplied field through continue, edit, refresh, and back. Invalid entries remain blocked. A call-first handoff must not claim a lead was sent or that staff will contact the visitor when no contact details were collected. Evidence: `final-checks/vin-handoff.png`, `manual-edit-restoration.png`, and corresponding JSON entries. Only local GET navigation was used; no lead was submitted.

## M03 — P1 — Content filter drawer cannot reach its last option in landscape
**Reproduction:** at 844×390, open `/guides`, then the content filter control. Attempt to select the final “Обяви” option. Playwright finds it visible/enabled/stable but cannot bring it into the viewport; the click times out with “element is outside of the viewport.” The screenshot shows the list cut off below the display.

**Owner:** `apps/web/app/[locale]/components/mobile-content-hub.tsx`, the DrawerContent/header/options composition. Unlike the existing full-screen marketplace overlay, this drawer lacks a clearly bounded scrolling options body and an explicit close action.

**Fix:** reuse the existing drawer primitives with a non-shrinking header, one `min-height:0; overflow-y:auto` options body, a viewport/safe-area maximum height, and an accessible close action. Do not solve it by making every mobile choice a full-screen page.

**Acceptance:** all categories can be reached with touch scrolling, pointer, and keyboard at 320×700 and 844×390; last option can be selected; Escape/backdrop/close restore focus and page scrolling. Evidence: `final-checks/hub-landscape-last-option.png` and JSON error. Re-test after animation settles rather than judging the first animation frame.

## M04 — P1 — Sell step numbers wrap and muted text fails contrast
The Sell page renders 01/02/03 on two lines, including at 390px, because the number flex item can shrink within a break-words ancestor. At 320px the issue is especially visible. Owner: `mobile-sell-vehicle-experience.tsx`, `sell-next-steps` list. Give the number a non-shrinking, non-wrapping slot and reuse the existing localized how-steps records instead of another inline copy of the content.

Axe reports approximately 2.62:1 contrast for the 12px light-gray step numbers on white. Content-hub metadata/count and article eyebrows also fail: approximately 4.22:1 for zinc-500 text on the light canvas, below the 4.5:1 normal-text threshold. Nine baseline scenario records have contrast violations: Sell, both hub entry URLs, and six articles. The hub alias is not a separate template defect.

**Fix:** select a semantic muted foreground that passes on its actual canvas and card surfaces. Keep hierarchy using size, weight, and spacing, not unreadable gray. Do not add a different corrective hex to every card. Evidence: `browser/results.json` accessibility nodes, `browser/_sell-320x700-top.png`, `browser/_guides-430x932-top.png`.

**Acceptance:** numbers stay on one line at narrow widths and enlarged text; all reproduced normal-text contrast failures pass after remeasurement; primary actions remain visually dominant. Reference: W3C SC 1.4.3, `https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html`.

## M05 — P1 consistency — Error routes revert to the old header
Invalid routes and disabled contact detail routes use a white 68px header with a tiny logo, long wordmark, and separate listings button. That is visibly different from the accepted dealer-mobile chrome. Owner: `apps/web/app/[locale]/not-found.tsx`; inspect loading/error counterparts together rather than styling only one route.

**Fix:** reuse the mobile brand/header geometry and a deliberate compact recovery surface. Decide whether bottom navigation remains present on these utility states; make the choice consistent and preserve the primary recovery action. Do not resurrect platform-only account/dealer routes that this static dealership intentionally excludes.

**Acceptance:** direct invalid URL and client navigation render the same intentional mobile error experience, correct language, recovery links, and focus behavior. A red Next.js development issue indicator in a screenshot is not itself proof of a production defect. A streamed 200 response with not-found UI is not automatically an SEO failure; verify production metadata/noindex semantics before categorizing it.

## M06 — P2 — Header and content hierarchy drift
The content hub manually recreates geometry already represented by `MobileDealerChrome` and `DealerMobileBrandBar`; its padding, logo dimensions, and safe-area treatment can diverge. Article pages and contact handoff screens also use different structural variants. Consolidate geometry through those existing primitives, with explicit slots for leading action, brand, trailing action, primary field, and optional intro. Keep route-specific colors and content instead of a giant component with dozens of booleans.

## M07 — P2 — Vehicle, finance, and editorial presentation
Related vehicles use an older portrait card treatment while primary inventory uses compact horizontal cards. A related rail may deliberately differ, but its typography, image truth, radii, and fact hierarchy should come from the same system. The current listing finance promotion is a simple text-led gray surface; reconcile it with the previously approved illustrated promotion instead of inventing a new asset or attaching a bare text link. This is a design decision, not an automated functional failure.

Editorial images are selected through hardcoded slug maps and repeated across records. Store image/category/read-time metadata on the actual content records and confirm that each image is intentional. Some vehicle fixture imagery also appears mismatched to its label; validate fixture-to-image mapping before publishing dealer inventory. This audit did not authenticate real inventory photos or financing offers.

Do not invent business facts, rates, guarantees, dealer affiliations, customer counts, reviews, or vehicle specifications to fill an attractive layout. Empty categories need honest empty states, not fake listings.

## Verified working interactions
Make/model selection applies `?make=BMW&model=X5` and survives refresh with two matching vehicles. Full-filter cancel/Escape closes the dialog, restores the trigger's focus, leaves the URL unchanged, and restores body scrolling. Text search uses `q`, produces a genuine zero-result state, and exposes a reset action. The price quick filter was confirmed at `priceMax=60000`, with zero matches for the current dataset.

The menu settles inside the viewport, passed its targeted Axe check, closes with Escape, and restores focus to Menu. Listing tabs respond to keyboard navigation; the gallery opens/closes and passed the targeted Axe check. Empty manual Sell continuation is blocked by required inputs. Import/manual, VIN, financing term/deposit, and vehicle-picker entry states were opened and inspected; successful backend delivery was not exercised.

The `/blog` index is already an alias redirecting to `/guides`; do not treat the two entry URLs as two separate hubs to rebuild. Unknown vehicle category pages present intentional empty states rather than broken image placeholders. Six representative WebKit pages load with HTTP 200 and no captured page errors; the listing overflow remains reproducible in that engine.

## Route-family finish criteria
| Family | Preserve | Finish before sign-off |
| --- | --- | --- |
| Inventory, category, make/model | Integrated header/search, badges, compact cards, URL-backed filters | All filter combinations, pagination where applicable, empty/reset behavior, history restoration, long titles, image fallbacks |
| Listing | Gallery, price-first hierarchy, equal-width mobile tabs, fixed contact action | Map geometry, related rail, finance promotion, missing data, sold/unavailable states, correct action destination |
| Imports | Link-first entry and source-country choice | Long-form scrolling, taxonomy nesting, error/validation/retry, honest delivery/contact handoff |
| Sell | VIN and manual alternatives, contained next-step cards | VIN/manual draft round trip, edit restoration, numbering, truthful call-first copy |
| Lease | Inventory reuse and financing entry | Chosen vehicle/term/deposit continuity, validation, unsupported estimates, accurate handoff |
| Guides/articles | Unified hub, searchable categories | Reachable landscape drawer, contrast, reusable header, content metadata, back/filter continuity |
| Contact/legal/errors | Clear phone/map/service actions | Same mobile geometry, locale consistency, real business copy, recovery/loading states |

## Physical-device acceptance still required
Chromium mobile emulation and Windows WebKit are not actual iPhone Safari/Android hardware. Test software keyboard resize, safe-area cutouts, rotation while a drawer is open, back-swipe, 200% text size, reduced motion, screen reader order, and the final bottom control on long forms. Target sizing should preserve hierarchy: WCAG 2.2 AA specifies 24×24 CSS pixels with defined exceptions/spacing, not a blanket requirement to make every visible control 44px. Important touch actions can retain larger hit areas without making every label a large button. Reference: `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html`.
