# Centered desktop buy box — 19 September 2026

Source before this change: 1cbe6bb. Scope: desktop discovery, not mobile or dealer operations.

## Layout

The hero has one short centered headline and a live inventory count. A buy box no wider than 640px sits in the center; existing configured vehicle artwork frames its left and right sides. It no longer sits below an oversized illustration. The search retains category, make, model and price, with all remaining choices in the full filters dialog and an explicit search/browse button.

Inventory follows immediately: one centered section heading and the existing shared vehicle-card grid. Body-type tiles, brand cards and three repeated collection introductions were removed. The server-provided order and supplied listings are rendered directly, instead of slicing them into artificial collections. Retired collection/artwork lookup modules and their collection-specific tests were removed; configured artwork assets themselves remain available.

The compact search suggestions are a readable single-column list below the whole buy box. They cannot cover the primary button or render underneath inventory cards. An odd last suggestion no longer creates an implicit second grid column. Existing option IDs, keyboard selection, Escape and focus behavior remain intact.

Mobile presentation and mobile snapshot expectations were not changed. Desktop-only styling remains scoped to the 1024px breakpoint and existing semantic tokens. No new dependency, provider, schema or generated artwork was introduced.

## Verification

The isolated production preview used port 6742 and the dedicated Next output directory .next-public-e2e-centered-buybox-demo. The existing development app remains on port 3002.

The final responsive suite passed all 22 tests without snapshot-update mode: mobile baselines at 320/360/390/430, desktop snapshots and search at 1024/1280/1440/1920, landscape/breakpoint behavior, representative service/content/detail routes, theme/focus inheritance, production payload budgets, empty-query browse and button search/price controls. Only the four deliberately changed desktop screenshot expectations were updated after rendered inspection.

The production build and TypeScript validation passed. A fresh production browser reported no page errors; keyboard active-descendant IDs resolved to existing options. Focused lint, package type, boundary and architecture checks are recorded alongside the browser run.

Evidence: .codex-artifacts/desktop-centered-buybox-2026-09-19/ (local captures and command logs). The first new heading assertion incorrectly included the 12 individual vehicle titles; it was corrected to assert the inventory section heading explicitly. Earlier failing checks are not reported as passes.

This is a local implementation checkpoint, not owner visual acceptance, a Cars release, or dealer deployment. Earlier unpublished commits are preserved. Rollback is a scoped revert of this change.
