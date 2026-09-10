# Refactor Plan

## Batches

### DNR-B01 — shared policy and primitives

- `DNR-001` Freeze the accepted UI/behavior contract in refactor docs.
- `DNR-002` Consolidate marketplace filter configuration and label/active-state policy.
- `DNR-003` Extract the shared mobile marketplace overlay shell and viewport hook.

Acceptance: no visual/route change; shared modules have focused tests; no new runtime dependency.

### DNR-B02 — marketplace shell

- `DNR-004` Decompose `marketplace-shell.tsx` into orchestration, result presentation, taxonomy picker, filter overlays, and bottom navigation.

Acceptance: `MarketplaceShell` owns URL state, overlay coordination, header wiring, and composition only. Extracted modules preserve existing public behavior and use the shared overlay/filter policy.

### DNR-B03 — desktop discovery

- `DNR-005` Decompose `desktop-discovery-bar.tsx` and remove duplicated marketplace filter catalogs.

Acceptance: desktop search, quick-filter controls, and lead service controls have explicit owners; shared filter config is consumed instead of redefining city/range/fuel/transmission data.

### DNR-B04 — cards and service flows

- `DNR-006` Continue separating card/detail/directory policy from presentation where a clear reusable policy exists.
- `DNR-007` Isolate Import, Lease, and Sell mobile interaction owners without creating generic page factories.

Acceptance: route files remain server/composition focused; interactive islands expose typed inputs; current UI hierarchy remains unchanged.

### DNR-B05 — financing and styling ownership

- `DNR-008` Isolate financing intent/interception behind a typed, tested contract with the normal contact URL retained as progressive fallback.
- `DNR-009` Replace brittle positional selectors in touched polish CSS with explicit `data-slot`/component ownership.

Acceptance: no primary UI behavior depends on a specific `nth-child`/sibling position in touched surfaces.

### DNR-B06 — package and runtime cleanup

- `DNR-010` Audit domain/server/data responsibilities and keep business policy in marketplace/domain rather than app JSX.
- `DNR-011` Tighten exports, client/server boundaries, dead code, and obvious bundle/hydration waste while preserving the workspace dependency graph.

Acceptance: architecture tests remain authoritative; no package cycle or new low-level dependency is introduced.

### DNR-B07 — release proof

- `DNR-012` Run formatting, architecture, unit, typecheck, build, public E2E, accessibility/focus checks, console/network checks, and responsive comparison.

Required viewports: 320, 360, 390, 430, 768, 1024, and 1440px plus mobile landscape.

## Commit strategy

Keep batches bisectable. B01, B02, B03, B04/B05, and B06/B07 should be separate commits when possible. A failed architectural direction must be revertible without discarding unrelated polish.

## Scope guard

This plan does not authorize dependency upgrades, backend feature work, route redesigns, new inventory sources, visual redesign, or replacing the existing design system. Any such change requires a separate owner decision.
