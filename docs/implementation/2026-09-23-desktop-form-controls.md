# Desktop form controls — 23 September 2026

The desktop panels now share primary action styling through `DesktopActionButton` in `packages/marketplace-ui/components/desktop-action-panel.tsx`. Home and inventory search and import link entry use its inset variant; sell and finance use its regular 48px action. Route-specific button overrides were removed.

The shared panel CSS gives native desktop selects a consistent 16px chevron inset 14px from the right edge, sufficient text padding, a white surface, border, hover state and keyboard focus. These styles apply only at desktop widths.

The finance component places the vehicle thumbnail inside its selector and the vehicle-details link beside its label. Its summary presents price and indicative monthly payment as separate columns with a divider, followed by the phone action. The duplicate vehicle row and filled grey summary container were removed. Preferences still do not recalculate the advertised estimate, and that explanation remains visible.

## Changed source

- `packages/marketplace-ui/components/desktop-action-panel.{tsx,module.css}`
- `packages/marketplace-ui/components/dealer-hero-search.{tsx,module.css}`
- `apps/web/app/[locale]/lease/lease-desktop-controls.{tsx,module.css}`
- `apps/web/app/[locale]/sell/page.tsx`
- `apps/web/app/[locale]/imports/page.tsx`
- `apps/web/app/[locale]/components/public-desktop-layout.module.css`
- `apps/e2e/specs/desktop-panel-flows.spec.ts` checks that the vehicle-details destination updates after selection rather than relying on the removed duplicate title.

## Verification

On the existing local static-demo server at `http://127.0.0.1:6462`, using installed Chrome through Playwright:

- Five desktop tests passed: category navigation; matching hero/panel/banner geometry across all five routes in English and Bulgarian at 1024, 1440 and 1920px; stable navigation/loading geometry; shared home/inventory filtering with centered inventory controls; and finance selection/preferences through details, Back and reload.
- Two mobile tests passed at 390px: finance selection and honest phone handoff; import draft and nested country picker.
- Captured all five routes at English 1440px, Bulgarian 1024px and English 390px with no horizontal overflow. Inspected desktop finance, sell, import and home, plus mobile finance; also inspected finance at 1920px.
- Additional 1920px finance check passed: equal field top positions and 48px heights, identical inset chevrons, vehicle selection by keyboard, tab order through preferences to phone, and no page errors.
- `pnpm --filter web --filter @repo/marketplace-ui test`: 267 passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web build`: passed with the documented static-demo environment.
- Scoped Biome check and whitespace diff check: passed.

The shared hero dimensions, banner assets, centered inventory controls and mobile components are preserved. Existing unrelated contact/mobile-content changes, the older desktop-polish ledger and untracked artwork/components remain outside this commit. No dealer deployment or live enquiry submission was performed. These checks establish local implementation behavior; owner visual acceptance and public/mounted release verification remain separate.
