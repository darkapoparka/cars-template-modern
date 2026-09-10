# Day & Night Modern — Design System

This file records the incumbent visual and interaction system that has been proven in the rendered Day & Night client demo. It is a preservation contract for future polish, not permission to redesign the product.

## Mobile refinement — September 6, 2026

The owner's phone review supersedes the older masthead guidance below. All mobile masthead actions share one softly filled circular style from `mobile-header-icon-action.ts`: 44px borderless circular targets with a 10% current-color fill, 15% hover, 20% pressed and a faint inset highlight on every route and 24px Hugeicons Stroke Rounded SVGs from `dealer-mobile-header-icon.tsx`, using their original 1.5px strokes, matching fill feedback and focus outlines. Use white on black/red headers and dark foreground on yellow/pale headers for contrast. This includes Home/Cars category and filters, the scrolling header, service info/call, Contact location/call, secondary pages, and loading shells. Keep the 144px logo. Cars uses Car01, filters use FilterHorizontal, help uses MessageQuestion, phone uses Call02, and location uses Location01 from Hugeicons 4.3.0. The used icon definitions are vendored unchanged with their MIT license; mobile service cards, main-menu actions, and overlay controls use the same family. Mobile pill rails retain a 16px inset and a 12px fade only on edges with hidden content. Active filters retain the red count badge. Dialog close/back controls retain their existing surfaces.

The leasing vehicle picker initially focuses its dialog so visitors can browse without opening the keyboard; tapping search starts text entry. The combined About/Contact page uses the shared inline mobile hero geometry on a black background, with the original white/red wordmark, centered white title, and matching translucent location/call controls. Its white rounded content surface contains grey telephone, showroom, and service-link cards with 8px gaps. Keep copy to labels and the address; do not reintroduce separator lines or repeated marketing paragraphs. Desktop retains its existing content layout.

Cars and Leasing share `DealerVehicleFacts` for compact specification pills and transmission labels. Mobile portrait crops request 240px source widths to avoid visibly soft landscape images. Leasing retains selection behavior and displays the existing monthly estimate with an indicative label. Preserve the three Instagram, YouTube and Facebook tiles; unconfigured destinations retain their existing disabled state. Always retain the Imports country quick pills and the original catalog empty state. Do not replace them with an explanatory request panel.

Sell uses a single 44px neutral manual-entry quick pill below the VIN capsule, aligned with the other routes' quick rows. Keep its page title accessible but visually hidden; do not add a visible title, subtitle, or a full-width red fallback button above inventory. The pill opens the existing details drawer.

Mobile leasing search, import-link entry, and VIN entry share 52px rounded-full overlay fields and 16px input text from `mobile-marketplace-overlay.tsx`. The leasing picker focuses the dialog for browsing. The Sell VIN capsule opens the existing details overlay with VIN focused; manual entry focuses the dialog without opening the keyboard. VIN values persist when closing, and focus returns to the initiating capsule or pill.

## Product hierarchy

The public experience should make four decisions easy, in this order:

1. Find a relevant vehicle.
2. Compare its price and essential facts.
3. Trust the listing and dealer.
4. Call, visit, request leasing/import help, sell a vehicle, or keep browsing.

The interface is a compact showroom inventory and lead experience, not a multi-location marketplace, dealership-theme cliché, or generic SaaS dashboard. Day & Night red is reserved for primary actions and the active bottom-navigation destination; selected quick pills use black. White, near-white, zinc gray, black text, and vehicle imagery carry the rest of the experience.

## Mobile browse anatomy

The approved top-to-bottom composition is:

1. One compact black showroom masthead with separate 44px circular vehicle-category and full-filter actions balancing the centered Day & Night logo. The metallic white/red logo asset supplies the visual rationale for the dark surface; the category artwork does not need repeated text or a visible dropdown chevron.
2. One full-width 52px white search control directly beneath the masthead actions. The search uses the same full-capsule radius as the search field inside its overlay and remains the dominant discovery action.
3. One horizontally scrolling 44px quick-filter row for focused criteria such as price and year. Across Cars, Import, and the financing form, inactive quick-selection pills use `zinc-200`, hover/pressed uses `zinc-300`, and selected pills use zinc-950 black with semibold white text. Search fields and standalone capsule actions remain lighter because they are not selection pills. The always-visible full-filter action stays in the discovery row instead of being duplicated in this rail; category, search, filters, and every quick filter remain independent tap targets.
4. Dense horizontal inventory cards separated by an 8px rhythm.
5. A fixed five-destination dealer dock with matching document padding.

When the initial header scrolls away, a matching black condensed vehicle-category, search, and full-filter row becomes fixed at the top. The logo and quick filters scroll away. The initial black header extends behind the light quick-filter surface, which overlaps it by 12px with the shared rounded top corners, matching Import and Lease. The separate condensed sticky header retains its restrained lower-corner radius. Do not stack a second logo bar or duplicate quick-filter row. Horizontal chip scrolling must never create page-level horizontal movement. Home, Cars, Lease, Import and Sell share `MobileDealerChrome`: 12px minimum safe-area top inset, a 44px brand/action row, an 8px control gap, a reserved 52px primary control, and 24px bottom padding. The content overlaps by 12px, leaving 12px between the capsule and rounded content top, with 12px above pills or content. At zero safe-area inset the control begins at y=64 and the content at y=128. Cars and Lease begin inventory at y=196 with 16px side gutters. Reserve the logo aspect ratio before the image decodes. Loading headers must use these same shared slots, including the red Lease tone; never substitute the older short white skeleton header. The quick-filter surface uses the same light canvas as the listings so it reads as one continuous content area. Inactive quick-filter chips must remain visibly distinct from the light canvas through a neutral-gray fill; active chips add red, stronger type, and their clear affordance.

## Mobile Sell extension

Mobile Home and service heroes use a 44px brand row with max(12px, safe-area-inset-top) spacing, matching the overlay close control, keeping the centered logo stable during navigation. Home and Import quick-pill rails scroll inside a 16px inset on each side of their content frame, with no negative horizontal margins that let pills reach the screen edge. Lease uses that inset for its task content; term and deposit choices scroll horizontally in single rows inside the financing form. All three use the rounded-top light content transition over their black or photographic headers. These in-page surfaces do not behave as drawers.

The Sell route retains the shared dealer logo and existing VIN/manual-details flow. The logo is inline over the same photographic surface as the hero, with no separate white strip. `MobileDealerServiceHero` owns the image and shared brand bar together. Its neutral generated architectural background (`day-night-mobile-studio-v1.png`) has empty alt text and makes no claim that the fictional setting is the dealer's premises. The white VIN capsule stays over the quiet upper part of the image; landscape crops to the plain upper wall. Desktop is unchanged.

A white, rounded-top inventory shelf sits in document flow above the dealer dock, never as a fixed layer over the input. Tap or upward swipe opens the shared Vaul drawer with up to six existing inventory cards and an all-inventory link. The drawer has one scroll owner, a close action, swipe-down dismissal, Escape support, focus return, and safe-area padding. Closing it preserves the VIN. The shelf is deliberately not a permanently open non-modal sheet: keyboard entry and the primary selling task retain the page. No new vehicle data or listing photos are fabricated.

## Vehicle cards

Mobile cards are comparison tools. Preserve their information order and density:

1. Stable vehicle image with a truthful status badge.
2. Vehicle title, clamped to two lines.
3. Bold primary price.
4. Quiet monthly or negotiable context.
5. Four essential facts in a two-by-two grid: year, mileage, fuel, and transmission.

At narrow widths the image remains a fixed 7.5rem column and the content uses the remaining width. Cards use a calm white surface, a 12px radius, no hover lift, no image zoom, and no decorative shadow stack. Long Bulgarian titles and large prices must remain readable at 320px without hiding the facts.

The full vehicle remains the primary link. Do not introduce nested buttons inside that link. Any future save, compare, or contact action must have its own valid touch target and keyboard name.

## Search and filter model

There are three deliberate levels of filtering:

1. Quick chips for frequent criteria.
2. Focused pickers for one decision such as make/model, price, or year.
3. The full mobile filter surface for the complete journey.

Each decision remains a separate control. In particular, vehicle type, make/model, budget, fuel, mileage, transmission, and more filters must not be grouped into an ambiguous compound card. The showroom location is fixed and belongs in Contact/Menu, not in vehicle discovery filters.

Filter rows are full-width, at least 48px high, and show label, current value, and chevron. Values truncate before labels or navigation affordances. Draft state lives inside the overlay; Cancel discards it, Apply commits it once, and Reset returns URL and visible state to the same baseline.

## Overlay contract

Use the existing shared Dialog/Drawer primitives. Do not build a second fixed-div overlay system.

Full-screen mobile search and filter overlays use:

- `100dvh` height and safe-area padding;
- one body scroll owner with overscroll containment;
- a 64px header with symmetric 44px icon columns and centered 17px title;
- circular 44px close/back/reset actions with accessible names and a visible soft-gray button surface;
- a reachable 48px primary action that remains inside the body scroll flow; do not pin or sticky-fix overlay CTAs to the viewport unless the owner explicitly asks for an exception;
- background scroll lock, Escape dismissal, focus trapping, and focus return;
- one blocking overlay at a time.

Nested pickers replace the overlay body while preserving the same visible icon-action treatment and one scroll owner. Back returns to the previous picker level. The main search overlay may use a compact result list with thumbnail, title, essential metadata, and price.

## Bottom navigation and Menu

The dealer dock has five destinations: Cars, Import, Sell, Lease, and Menu. Each target is 60px high with a 24px Hugeicons Stroke Rounded icon and a 12px/16px label. Labels never wrap. A faint neutral top border separates the white dock from the page. Active state uses a red icon with a stronger stroke and a semibold red label. Keep the icon background transparent; do not add a colored block or a top indicator line. Cars uses Car01, Import uses Globe02, Sell uses Tag01, Lease uses PercentCircle and Menu uses Menu01; secondary pages orient through Menu.

The document must reserve the dock height plus `env(safe-area-inset-bottom)` so the final card and actions remain visible. Menu opens the existing bottom drawer with explicit Call and Location actions followed by secondary pages. The drawer must lock background scroll, close on Escape or its visible close action, and return focus to Menu.

The Menu sheet uses a white surface, the centered Day & Night logo with dark wordmark, and a 44px gray close control. Its accessible title remains Menu. Its top sits 8px below the shared search capsule bottom (124px with the standard 12px top inset), just above the rounded page surface behind it. The body scrolls independently on short screens; tapping the logo closes Menu and opens Home. Call is the red primary action with the phone number visible; Location is a neutral action with the city. Secondary destinations are distinct 56px rounded gray buttons with consistent outline icons, semibold labels and 8px gaps. Preserve their button appearance; do not replace them with flat rows or separator lines. The real showroom address follows the buttons without a divider. The header stays outside the single scrollable body on short landscape screens. Menu styling is owned directly by `dealer-bottom-nav.tsx`, without CSS overrides in `mobile-final-polish.css`.

Next.js development indicators stay disabled for the public web app. They are not product UI and must never cover or intercept the Menu button or an overlay CTA during a local client presentation.

## Service-route identity and Import

Service routes reuse the centered `DealerMobileBrandBar` with the clean 128px logo treatment. Sell, Import and Lease place that shared brand bar inline over their photographic hero through `MobileDealerServiceHero`, never a second raw logo. Sell retains its full-height task and optional inventory drawer. Import and Lease use a compact 140px banner (plus any larger device safe area): 60px brand bar, 8px control gap, 52px primary control and 20px bottom space, followed by a white surface overlapping 12px with rounded top corners. Page titles remain available to screen readers, not repeated over the photograph. Import uses fictional decorative terminal artwork with an anonymous graphite SUV at the right edge (`day-night-mobile-terminal-v2.webp`). Lease uses a matching dark studio and coupe detail (`day-night-mobile-studio-v2.webp`). These are not listings or dealer premises. The 1200px WebP assets are approximately 27 KB and 19 KB; generation prompts live beside the assets. The black car and quiet center keep the white/red dealer mark legible; neither banner contains generated text or manufacturer badges. Actual inventory photos remain confined to the real vehicle cards. Import retains its country rail and directly visible inventory. Lease starts with an explicit vehicle choice instead of auto-selecting the first listing. The selected-vehicle summary shows its price and facts; term and deposit preferences belong in the financing form, and no static monthly payment implies a live calculator. Import and Lease keep their existing search and vehicle-selection overlays. Empty Lease inventory retains the normal white brand bar and contact fallback.

Import uses one horizontally scrolling country-pill row as its quick origin selector. `All` is the first/default option and aggregates only connected, approved feeds; it must never pull unsupported countries into the result set. The selected origin uses zinc-950 black with white text plus stronger type and exposes `aria-current`. When a licensed feed is connected, the pills filter source-attributed external listings directly below the selector; do not repeat the same origins as a card grid merely to fill space.

The request form is a contextual second step, not the Import landing surface. It stays hidden until the visitor submits the top listing URL or chooses an explicit import action. The chosen URL and origin carry into the form, and Back/Forward and refresh preserve that state.

Until a licensed, refreshable marketplace or dealer feed exists, do not present synthetic vehicles as available inventory. A future external listing must preserve its source URL, attribution, original currency, last-verified state, and clearly labelled delivered-price estimate, and may reuse source imagery only when the agreement permits it.

The empty/unavailable inventory action “Опишете автомобил” opens the existing import request form in the shared full-screen mobile overlay. It preserves the selected country, keeps one scrollable form body and a visible close action, and returns focus to its trigger. The country drawer and make/model picker remain usable above the form. Desktop retains the linked inline request flow. Once an inline request is already visible, omit the redundant empty-state request action to avoid opening duplicate forms.

The current local pilot connects Auto.dev for United States dealer inventory through the API adapter. The light-gray inventory field starts directly with the white cards; there is no aggregate result-count, source, freshness, or fee strip above them. Source attribution stays available on every card through its direct source action, while freshness remains part of the provider contract. External cards reuse the approved homepage card geometry: stable media column, two-line title, dominant original-currency price, two-by-two essential-spec grid, compact location, and distinct Source/Import actions. Until image display rights are approved, the media region uses an explicit no-photo placeholder rather than copied or misleading vehicle photography. Germany, China, Japan, and South Korea must keep the honest unavailable state until their own approved sources are connected; never fill those tabs with US inventory. Production enablement remains a separate contract and deployment decision.

## Typography, color, and depth

- Vehicle title, price, result count, and primary CTA carry the strongest hierarchy.
- UI labels use sentence case and real Bulgarian copy.
- Prices, years, mileage, and monthly values use tabular numerals where available.
- Important mobile copy is not shrunk to solve layout pressure; wrap or truncate the correct secondary field instead.
- Day & Night red `#c40101` is for primary actions and active bottom navigation. Selected quick pills use zinc-950 black with white text, with zinc-800 hover/pressed states.
- Prefer flat surfaces and spacing. Use either a subtle border or a restrained soft shadow when separation is required, not both by default.
- Avoid gradients, glass effects, glow, hover lift, image zoom, decorative animation, and purple/indigo accents.

## Responsive behavior

Mobile acceptance sizes are 320×700, 360×800, 390×844, 430×932, and at least one landscape viewport. At each size verify:

- no page-level horizontal overflow;
- no clipped logo, title, price, spec, chip, focus ring, or overlay action;
- the quick-filter row scrolls independently;
- the final card sits fully above the dock;
- fixed chrome remains stable during scroll and orientation change;
- search and numeric inputs remain usable with the mobile keyboard;
- 200% zoom preserves every decision and primary action.

The desktop experience may expand density and composition at the existing `lg` boundary, but it must preserve the same state, terminology, routes, and content truth.

## Ownership map

- `packages/marketplace-ui/components/mobile-dealer-discovery-header.tsx`: brand/search/quick-filter mobile header.
- `packages/marketplace-ui/components/mobile-inventory-search.tsx`: focused inventory search overlay.
- `packages/marketplace-ui/components/marketplace-shell.tsx`: overlay policy, filter state, inventory composition, dealer dock, and Menu drawer.
- `packages/marketplace-ui/components/vehicle-card.tsx`: mobile and desktop card hierarchy.
- `apps/web/app/[locale]/components/public-marketplace-frame.tsx`: public shell and dock-safe page padding.
- `apps/web/next.config.ts`: client-demo development-indicator policy.

## Do not regress

- Do not merge separate filter decisions into one control.
- Do not add a second sticky mobile header.
- Do not move a mobile overlay CTA into a separate fixed or sticky footer; actions belong to the overlay scroll flow.
- Do not render close/back/reset as naked icons; use the shared 44px soft-gray icon-action treatment.
- Do not hide a primary action behind the dock, safe area, or keyboard.
- Do not make card actions hover-only or nest interactive controls.
- Do not scatter arbitrary high z-index values; overlays own the high layer, page chrome stays below them.
- Do not treat HTTP 200, a build, or one screenshot as visual acceptance.

## Rendered acceptance

Before changing an accepted pattern, capture the incumbent state. After the change, repeat the same mobile sizes and test the complete path: search, quick filter, full filter, nested picker, Apply, Cancel, Reset, Back/Forward, final-card scroll, Menu, Escape, focus return, and console/page errors. Preserve a change only when the rendered result is materially better without weakening behavior.

## Mobile polish audit — 2026-09-04

The mobile price surface is owned by named component slots in `mobile-final-polish.css`; Menu styling now lives in `dealer-bottom-nav.tsx`. Removed legacy positional selectors from `styles.css`: their first-paragraph rule hid the actual Lease price and their ID-based menu rules overrode the current sheet treatment. Inventory names wrap to two lines on mobile. Import card actions, guide actions and Menu close controls provide 44px targets. The document reserves 64px plus the safe area for the dock. See `docs/mobile-ui-audit-2026-09-04.md` for verification and remaining issues.

## Mobile Lease request flow

Lease keeps the shared photographic header, aligned logo, white vehicle-picker capsule and rounded light content surface. Direct visits begin with a short instruction and no selected car or month rail. Selecting a real inventory vehicle updates the vehicle query parameter, which restores the selection on refresh. A 44px circular X inside the selection card removes the chosen car and its URL parameter, returning focus to the vehicle picker; refreshing then preserves the unselected state. Mobile listing details link to Lease with that vehicle ID; invalid IDs leave the visitor free to choose instead of silently substituting another car. Desktop keeps its existing selection controls.

Preserve the selected car card inventory layout: a full-height 120px image on the left, name and bold price on the right, and gray specification badges. The 44px clear X sits over the image inside the card without changing the content layout. Do not replace it with a small thumbnail or flat facts. There is no separate selection action row. The card styling is owned by lease-selected-vehicle.tsx; the old inventory-card CSS overrides are removed. The selected summary leads to the existing full-screen financing request overlay. Term and deposit preferences use the shared gray/red selection pills, scroll horizontally in single rows within the form gutters, and both allow To be discussed. The actual submitted contact message uses the preferences chosen in the form. The form has one scroll owner, a reachable submit action, and the shared close header with focus return. No local QA submits a customer enquiry.

How financing works opens a separate information drawer with the existing process, individual terms, documents and vehicle-availability guidance. It does not name a financing partner or imply guaranteed approval. The financing-provider identity remains to be confirmed by the owner.

## Final mobile interaction consistency — 5 September 2026

Full-screen pickers and forms use MobileMarketplaceOverlayHeader: 17px centered title, 12px/safe-area top inset, and 44px gray circular close control. Country selection keeps its drawer treatment, with the same close control and a scrollable option body in landscape. When Dialog and Vaul are nested, Escape closes the top surface and retains the underlying form.

Selection fill and checkmarks identify the saved choice; automatic command-list focus must not resemble a second selection. Keyboard movement uses an outline. Changing the make/model command dataset resets its internal active-option reference and retains keyboard access.

Sell, Import and financing drafts survive closing/reopening on the current page, in React memory only. Financing preferences remain associated with the selected vehicle. Successful requests clear the retained draft. Sell form field IDs are distinct from the hidden desktop form, and closing a taxonomy picker restores the initiating control's focus.

Mobile form controls share 48px height, 12px corners and a zinc-100 fill. Search shortcuts provide 44px targets. Numeric range shortcuts use one horizontal row within the existing gutters; editable numbers are normalized on blur so typing a year or budget does not clamp each individual digit. Desktop range presets retain their grid.

Make/model and vehicle-type pickers use separate 48px gray rounded choice buttons with 8px gaps. Vehicle type uses the shared full-screen overlay instead of a native mobile select. Search and VIN entry fields share 52px pill geometry. Mobile Sell/Import form controls use a neutral zinc-300 2px focus ring; saved choices retain a checkmark. Category and taxonomy overlays return focus to their trigger and preserve the underlying draft.

The red leasing header keeps the shared 44px action geometry with a 20% foreground fill for visible button surfaces; other header tones retain their approved 10% fill. Lease quick controls lead with term and initial-payment preferences, followed by the existing vehicle filters. Preference choices carry into the financing request without recalculating or guaranteeing listing estimates. Reopening preserves form edits; changing page preferences updates those preferences while retaining contact details.
