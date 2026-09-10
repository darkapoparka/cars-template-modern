# Day & Night Modern — Refactor Program

This directory is the implementation contract for the post-polish codebase refactor. The approved mobile and desktop experience is the regression baseline; the goal is to make the implementation easier to reason about without redesigning the product.

## Non-negotiables

- Preserve routes, inventory data, brand assets, responsive behavior, static demo mode, and the accepted Day & Night visual language.
- No framework migration, design-system replacement, dependency-upgrade sweep, backend rewrite, or feature expansion inside this program.
- Keep `@repo/marketplace-domain` browser-safe and dependency-light.
- Keep the workspace dependency graph acyclic and explicit.
- Prefer focused product modules over generic “universal page” abstractions.
- Keep server composition in the apps and reusable marketplace presentation in `@repo/marketplace-ui`.

## Workstreams

1. Shared filter/search policy and mobile overlay primitives.
2. Decompose `marketplace-shell.tsx` into orchestration, results, filters, taxonomy picker, and navigation owners.
3. Decompose desktop discovery/search into search, quick-filter, and lead-service owners while sharing filter configuration.
4. Separate card/detail policy from presentation and reduce large directory/detail components where ownership is mixed.
5. Isolate Import, Lease, Sell, and financing interaction contracts.
6. Replace DOM-position-dependent polish selectors with explicit `data-slot` ownership where touched.
7. Audit server/client boundaries, exports, dead code, and package responsibilities without changing the deliberate workspace graph.
8. Run release gates and responsive/accessibility regression verification.

## Definition of done

The refactor is complete only when:

- marketplace filtering has one shared configuration source;
- the mobile overlay contract has one implementation;
- `MarketplaceShell` is a coordinator rather than a multi-thousand-line UI owner;
- desktop discovery no longer owns duplicate filter catalogs;
- product styling touched by the refactor uses explicit component/data-slot ownership instead of child position;
- no new runtime dependency is required;
- `pnpm check`, `pnpm boundaries`, `pnpm unit`, `pnpm typecheck`, and production build pass;
- public E2E and the 320/360/390/430/768/1024/1440 viewport matrix show no accepted-UI regression.

See `AUDIT.md`, `PLAN.md`, `TARGET_ARCHITECTURE.md`, and `QA_AND_MIGRATION.md` for the detailed contract.
