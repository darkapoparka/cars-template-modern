# Refactor Audit

## What is already strong

The repository has deliberate package boundaries and tests that protect them. `@repo/marketplace-domain` is intentionally dependency-light/browser-safe, the workspace graph is checked for cycles, package exports are explicit, and root verification already composes formatting, architecture, unit, type, audit, and build gates. Those constraints are assets and must remain.

## Primary debt

### `packages/marketplace-ui/components/marketplace-shell.tsx`

The file combines:

- route synchronization and transitions;
- mobile header visibility;
- modal focus restoration;
- mobile search/filter chip policy;
- result layout and empty state;
- category selection;
- make/model/derivative taxonomy navigation;
- full-filter state machine;
- quick-filter state machine;
- range-filter presentation;
- dealer bottom navigation and menu.

The problem is not React itself; it is mixed ownership. Changes to one interaction require reading unrelated systems.

### `packages/marketplace-ui/components/desktop-discovery-bar.tsx`

The file combines:

- duplicate filter catalogs/ranges/localization;
- quick filter dialogs;
- range dialogs;
- category search surface;
- desktop search assistant orchestration;
- lead-specific Sell and Import surfaces;
- service shortcuts;
- masthead/sticky-band composition.

Desktop and mobile previously defined overlapping city, price, year, mileage, fuel, transmission, body, and category configuration independently.

### Other hotspots

`vehicle-card.tsx`, `organization-directory-card.tsx`, listing detail/gallery surfaces, and several route-specific mobile service experiences are sizeable because presentation, policy, localization, state, and route wiring are mixed together. They should be split only where an ownership boundary is clear; line count alone is not a reason to fragment code.

## Risks to avoid

- Converting a few large files into dozens of tiny pass-through components.
- Generic config-driven page factories that make service routes harder to understand.
- Moving app/server concerns into UI packages.
- Moving marketplace product rules into the generic design system.
- Reimplementing Dialog/Drawer focus and scroll behavior outside the design system.
- Replacing URL state with hidden client-only state.
- Refactoring domain modules solely to reduce line count.

## Refactor priorities

1. Shared search/filter policy and overlay contract.
2. Marketplace shell decomposition.
3. Desktop discovery decomposition.
4. Explicit route/service boundaries.
5. Card/detail policy extraction where behavior is currently embedded in JSX.
6. Structural CSS ownership cleanup.
7. Export/client-server/dead-code audit.
8. Regression evidence and release verification.
