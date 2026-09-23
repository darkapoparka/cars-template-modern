# Compact desktop leasing and shared panels — 23 September 2026

This supersedes the desktop panel dimensions and financing layout in the earlier same-day stable-hero and form-control notes.

## Result

Desktop leasing now presents a vehicle column, financing preferences and a financing summary. The vehicle column includes its selector, image, mileage, price and separately labelled advertised monthly figure. Deposit and term use native radio groups styled as segmented choices. The summary calculates the initial payment and remaining principal in the vehicle's currency; changing the vehicle or deposit updates these amounts. Monthly payment, interest and fees remain subject to the actual offer, rather than pretending the inventory estimate was recalculated.

Desktop starts with 20% initial payment and 48 months as editable preferences. Explicit flexible choices persist in the URL. Mobile retains its existing defaults and layout. The action remains the genuine phone handoff; no delivery provider or lender rate was invented.

The shared desktop panel minimum is 280px from 1280px and 320px at narrower desktop widths. Hero padding is 24px above/below, its heading allocation is 48px, and the heading-to-panel gap is 16px. The hero is therefore 392px or 432px tall. Compared with the prior implementation, the total hero is 72px shorter on wide desktop and 104px shorter below 1280px. Expanded optional content may grow naturally.

Shared panel padding is 20px and standard controls/actions are 44px. Search bars retain their inset actions. Sell uses one compact desktop row, including at 1024px. Home/inventory retain every filter and their shared component; centered inventory filter/sort and grid/list controls remain outside the buy box.

Import previously combined a blue input outline with an outer red ring. It now uses one brand-colored form outline, without a second outline or shadow around the input. Keyboard focus remains visible.

## Source ownership

- Shared sizing and controls: `packages/marketplace-ui/components/dealer-desktop-hero.module.css`, `desktop-action-panel.module.css`, `dealer-hero-search.module.css`.
- Leasing: `apps/web/app/[locale]/lease/lease-desktop-controls.{tsx,module.css}`, `lease-finance-policy.ts`, its unit test, `lease-vehicle-selector.tsx`, and `page.tsx`.
- Import and sell: their route pages plus `apps/web/app/[locale]/components/public-desktop-layout.module.css`.
- Browser coverage: `apps/e2e/specs/desktop-panel-flows.spec.ts`.

## Verification

Checked the existing static-demo server at `http://127.0.0.1:6462` with installed Chrome through Playwright (agent-browser CLI unavailable):

- Six desktop tests passed: category navigation; matching hero/panel/banner geometry on all five routes in English and Bulgarian at 1024/1440/1920px; stable geometry during route loading; shared home/inventory filtering with centered inventory controls; financing principal/preferences through details, Back, reload and flexible selection; import focus and listing-link handoff into the request form.
- Two mobile tests passed at 390px: leasing selection with phone handoff; import draft and country picker.
- Visual captures of all five routes at English 1440px, Bulgarian 1024px and English 390px showed no horizontal overflow. Inspected leasing, sell, home and import, including focused import. Also inspected leasing at 1920px after images loaded.
- Additional browser check passed for radio arrow-key behavior, updated principal, changing vehicle and zero page errors across the five desktop routes.
- `pnpm --filter web --filter @repo/marketplace-ui test`: 268 passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web build`: passed with the documented static-demo environment.
- Scoped Biome and whitespace checks passed.

Preserved unrelated contact/mobile-content source edits, the older desktop-polish ledger and all existing untracked artwork/components. No dealer deployment or live enquiry submission. Local verification does not establish owner visual acceptance or public/mounted release verification.
