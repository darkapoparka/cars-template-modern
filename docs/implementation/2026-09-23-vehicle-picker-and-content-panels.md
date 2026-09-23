# Desktop vehicle picker and content-sized import panel

Desktop leasing now starts with an unselected grey card and a plus icon. Clicking opens a searchable vehicle modal built from the existing design-system Dialog and `LeaseSelectedVehicle` cards. Desktop and mobile pickers share `searchLeaseVehicles`; mobile presentation is unchanged. The modal handles empty results, marks the current vehicle, restores focus to its trigger and resets the search when reopened.

Choosing a car produces a soft green card with a one-line title, top-right clear button, photo and full-width Change vehicle button. The selected card no longer repeats year, mileage or price. The selected label, red styling and adjacent vertical separator were removed in the follow-up. The separate View vehicle link and footer were subsequently removed. The vehicle photo uses the full available card width below the title, with matching responsive image sizing and descriptive alt text. It uses `object-fit: contain` against a dark frame to show the complete source photo; portrait photos have side margins. The frame is reserved independently of source dimensions, so selecting another vehicle does not resize the card. Clearing restores the plus card and focus, removes only the vehicle query parameter, clears the displayed amounts and disables the offer action; deposit and term are preserved. Selection persists in the existing query state, and explicit incoming vehicle links still load their selection. No default vehicle is silently selected on desktop. Existing calculation and delivery behavior is preserved.

Sell's extra divider above optional details was removed. Import uses a new `fitContent` option on the shared `DesktopActionPanel`, so the white panel ends after its country controls instead of reserving unused space. Its hero frame, title position and banner geometry remain consistent with other routes. The intentional import panel-height difference is covered separately from the stable hero geometry checks.

## Changed source

- `apps/web/app/[locale]/lease/lease-desktop-vehicle-picker.{tsx,module.css}`
- `apps/web/app/[locale]/lease/lease-desktop-controls.{tsx,module.css}`
- `apps/web/app/[locale]/lease/lease-vehicle-selector.tsx`, `lease-finance-policy.ts`, `lease-car-selector.tsx`
- `packages/marketplace-ui/components/desktop-action-panel.{tsx,module.css}`
- `apps/web/app/[locale]/imports/page.tsx`
- `apps/web/app/[locale]/components/public-desktop-layout.module.css`
- `apps/e2e/specs/desktop-panel-flows.spec.ts`

## Initial picker verification

Used the existing static-demo listener at `http://127.0.0.1:6462`, installed Chrome and Playwright:

- Six desktop tests passed. Includes all five routes in English/Bulgarian at 1024, 1440 and 1920px; stable hero frame during navigation/loading; shorter import panel; centered inventory controls; vehicle search, no results, selection, selection marker, reopened search reset, restored focus, changing vehicle, finance preferences, details/Back/reload; import focus and listing-link handoff.
- Two mobile regression tests passed at 390px: leasing selection/phone handoff and import draft/country picker.
- Captured all five routes at English 1440px, Bulgarian 1024px and English 390px with no horizontal overflow. Inspected empty and selected leasing cards, the modal and its result cards, compact import and sell. Additionally checked selection, Escape and focus restoration in English at 1440px and Bulgarian at 1024px.
- `pnpm --filter web --filter @repo/marketplace-ui test`: 268 passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web build`: passed with the documented static-demo environment.
- Scoped Biome and whitespace checks passed.

Unrelated contact/mobile-content edits, the older desktop-polish ledger and existing untracked artwork/components were preserved. No dealer deployment, live enquiry submission or provider changes. Owner visual acceptance and public/mounted release verification remain separate from these local checks.

## Selected-card follow-up verification

- Targeted desktop financing test passed, including the new clear action, no accidental modal opening, focus restoration, retained preferences and cleared state after reload.
- Mobile leasing regression passed at 390px.
- Inspected the updated selected card at English 1440px and Bulgarian 1024px; modal selection, Escape and focus restoration passed at both widths.
- Web typecheck, production build with the documented demo environment, scoped Biome and whitespace checks passed.
- Scope: `lease-desktop-vehicle-picker.tsx`, its CSS module, `lease-desktop-controls.module.css`, the existing browser test and this note. Unrelated work remains preserved.

## Photo and footer follow-up

The card footer was removed rather than moving its link elsewhere. The image retains the listing's existing source and displays its full proportions; no replacement or generated listing imagery was introduced. Inspected the final selected card in English at 1440px and Bulgarian at 1024px. The targeted desktop test now verifies absence of the View vehicle link and tests persisted selection through Home/Back, reload and clearing. This test, the mobile leasing regression at 390px, web typecheck, production build and scoped formatting checks passed. Source scope is the picker TSX/CSS, the existing desktop browser test and this note.

## Portrait-photo correction

The previous contained-image treatment was only visually checked with a landscape listing and failed with portrait photos: the Mercedes rendered as a narrow strip. Replaced it with a reserved 4:3 media wrapper, a filling image and a 75% vertical focal position. Existing source photos, green surface, clear action and Change vehicle button remain. No external View vehicle link or new separator was added.

Selected and visually inspected all 12 available listings at English 1440px and Bulgarian 1024px (24 captures), including portrait Mercedes and Range Rover images. All images decoded; image frames measured approximately 160×120px and 128×96px respectively, with identical card dimensions across selections and no horizontal overflow. The desktop financing interaction test and mobile leasing regression at 390px passed, as did web typecheck, scoped Biome and whitespace checks. A production build was not repeated for this localized image-framing correction. Scope: the desktop picker TSX/CSS and this note; unrelated work preserved. These local checks do not establish owner visual acceptance or public release verification.
## Selected-card title hierarchy

Moved the selected vehicle title into a dedicated top-left header row. It stays on one line and truncates with an ellipsis before the clear button; the full title remains in the DOM and is available on hover. The photo and year/mileage/price now occupy the row below. Removed the facts' compensating top padding, tightened vertical spacing and retained the green surface, photo framing and bottom Change vehicle button. The clear action has its own grid column, so long titles cannot overlap it.

Visually checked all 12 vehicles at English 1440px and Bulgarian 1024px. Additional English checks at 1024px and 1920px verified one-line title height, title/clear separation, complete hover text, decoded images and no horizontal overflow for every vehicle. Card dimensions stayed consistent while changing vehicles. Desktop financing and mobile leasing (390px) regression tests, web typecheck, production build with the documented static-demo environment, scoped Biome and whitespace checks passed. Source scope is the desktop picker TSX/CSS and this note; unrelated changes are preserved.

## Photo-only card and preview restart — 24 September

Removed the selected card's year, mileage and price, along with the unused two-column facts layout. The photo now occupies the full available width between the title and Change vehicle button. Showing the complete image takes precedence over filling the frame: the dark frame accommodates different source proportions without cropping. The existing financing summary and calculations are unchanged.

Restarted the local static-demo Next server on 127.0.0.1:6462 after the owner's PC restart. The first desktop test and visual script timed out while the cold route compiled; both passed on the warm server. Inspected all 12 selected vehicles at English 1440px and Bulgarian 1024px, with decoded images, stable card sizes and no horizontal overflow. Desktop financing, mobile leasing at 390px, web typecheck, production build with the documented static-demo environment, scoped Biome and whitespace checks passed. This change only owns the picker TSX/CSS and this note; unrelated edits and assets remain intact. Owner visual acceptance and public deployment verification remain separate.