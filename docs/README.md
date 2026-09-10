# AutoMarket Docs

This folder is the source of truth for building AutoMarket in the next-forge repo.

AutoMarket is a mobile-first vehicle marketplace for browsing, leasing, selling, saving, managing, and advertising vehicles. The public marketplace is the product surface, not just marketing content.

## Canonical Decisions

- Public marketplace lives in `apps/web`.
- Authenticated account, seller, dealer, and admin workspaces live in `apps/app`.
- Webhooks, cron, and service-only routes live in `apps/api`.
- Shared product logic must live in packages instead of being duplicated inside apps.
- The legacy prototype at `M:\automarket` is a visual and interaction reference, especially the mobile `/lease` header.

## Documents

- [Product PRD](./product-prd.md): product vision, users, requirements, success metrics, and full scope.
- [Architecture](./architecture.md): next-forge app split, route ownership, packages, data flow, and growth rationale.
- [Frontend UX](./frontend-ux.md): mobile-first layout rules, search/filter behavior, cards, drawers, desktop adaptation, and visual QA.
- [Data Model](./data-model.md): conceptual entities, enums, permissions, search facets, and lifecycle.
- [Dealer Studio Plan](./dealer-os-plan.md): supply-side wedge, Listing Factory phases, provider adapter rules, and dealer data model direction.
- [Dealer Studio Phase 1A Prompt](./codex-phase1-prompt.md): scoped kickoff prompt for the data and adapter foundation only.
- [Engineering Standards](./engineering-standards.md): commands, testing, environment handling, code quality, and release expectations.
- [Roadmap](./roadmap.md): staged build plan from foundation to marketplace scale.
- [Decision 0001](./decisions/0001-next-forge-app-split.md): why `web` is the marketplace and `app` is the workspace.
- [Decision 0002](./decisions/0002-mobile-search-filter-pattern.md): the mobile search and filter interaction pattern.
- [Decision 0003](./decisions/0003-dealer-studio-supply-wedge.md): why Dealer Studio is the supply-side wedge and how it maps to next-forge.
- [Agent Rules](../AGENTS.md): repo-level rules for future coding agents.

## Current State

The new repo has been scaffolded with next-forge and stabilized for pnpm/Node local development. The public marketplace shell, listing detail, authenticated workspace surfaces, dealer/admin mock flows, marketplace domain package, database search foundation, and mobile UI polish have initial implementations. The old single-app prototype remains useful as design reference but should not be extended as the long-term production architecture.

## Near-Term Build Direction

The next major planning direction is Dealer Studio Phase 1A: create the data and adapter foundation for the supply-side Listing Factory without overbuilding the full dealer product. Keep implementation milestone-scoped:

1. schema, types, org mapping, and provider stubs.
2. real dealer inventory persistence.
3. Listing Factory draft flow.
4. publish/feed/public rendering.
5. QR/short-link print card and visual polish.

Do not use a prompt that attempts all five milestones at once.
