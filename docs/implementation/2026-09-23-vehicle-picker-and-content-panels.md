# Desktop vehicle picker and content-sized import panel

Desktop leasing now starts with an unselected grey card and a plus icon. Clicking opens a searchable vehicle modal built from the existing design-system Dialog and `LeaseSelectedVehicle` cards. Desktop and mobile pickers share `searchLeaseVehicles`; mobile presentation is unchanged. The modal handles empty results, marks the current vehicle, restores focus to its trigger and resets the search when reopened.

Choosing a car produces a lightly tinted card with a red border, checkmark, image, title, price and change action. Vehicle details remain a separate link. Selection persists in the existing query state, and explicit incoming vehicle links still load their selection. No default vehicle is silently selected on desktop. Financing amounts and the phone action become available after selection. Existing deposit, term, calculation and delivery behavior is preserved.

Sell's extra divider above optional details was removed. Import uses a new `fitContent` option on the shared `DesktopActionPanel`, so the white panel ends after its country controls instead of reserving unused space. Its hero frame, title position and banner geometry remain consistent with other routes. The intentional import panel-height difference is covered separately from the stable hero geometry checks.

## Changed source

- `apps/web/app/[locale]/lease/lease-desktop-vehicle-picker.{tsx,module.css}`
- `apps/web/app/[locale]/lease/lease-desktop-controls.{tsx,module.css}`
- `apps/web/app/[locale]/lease/lease-vehicle-selector.tsx`, `lease-finance-policy.ts`, `lease-car-selector.tsx`
- `packages/marketplace-ui/components/desktop-action-panel.{tsx,module.css}`
- `apps/web/app/[locale]/imports/page.tsx`
- `apps/web/app/[locale]/components/public-desktop-layout.module.css`
- `apps/e2e/specs/desktop-panel-flows.spec.ts`

## Local verification

Used the existing static-demo listener at `http://127.0.0.1:6462`, installed Chrome and Playwright:

- Six desktop tests passed. Includes all five routes in English/Bulgarian at 1024, 1440 and 1920px; stable hero frame during navigation/loading; shorter import panel; centered inventory controls; vehicle search, no results, selection, selection marker, reopened search reset, restored focus, changing vehicle, finance preferences, details/Back/reload; import focus and listing-link handoff.
- Two mobile regression tests passed at 390px: leasing selection/phone handoff and import draft/country picker.
- Captured all five routes at English 1440px, Bulgarian 1024px and English 390px with no horizontal overflow. Inspected empty and selected leasing cards, the modal and its result cards, compact import and sell. Additionally checked selection, Escape and focus restoration in English at 1440px and Bulgarian at 1024px.
- `pnpm --filter web --filter @repo/marketplace-ui test`: 268 passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web build`: passed with the documented static-demo environment.
- Scoped Biome and whitespace checks passed.

Unrelated contact/mobile-content edits, the older desktop-polish ledger and existing untracked artwork/components were preserved. No dealer deployment, live enquiry submission or provider changes. Owner visual acceptance and public/mounted release verification remain separate from these local checks.
