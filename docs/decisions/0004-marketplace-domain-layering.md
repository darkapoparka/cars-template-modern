# ADR 0004: Isolate marketplace domain contracts from feature composition

- Status: Accepted
- Date: 2026-07-21
- Owners: AutoMarket platform architecture

## Context

`@repo/database`, `@repo/storage`, and `@repo/ai` currently import the broad
`@repo/marketplace` feature package. The database package also imports auth
policy and consumes storage-owned branded receipts. Those reverse edges make a
public-search, route, label, or mock-data change part of the persistence and
worker build graph. Turborepo's inferred boundary check verifies that imports
are declared, but it does not express the required dependency direction.

AutoMarket needs one runtime source for shared schemas and one stable place for
pure product rules, without turning a new package into a second feature barrel.

## Decision

Add `@repo/marketplace-domain` as a dependency-light domain package.

The browser-safe package root owns:

- vehicle, listing, money, seller, dealer, lead, directory, media, and provider
  port DTOs;
- Zod schemas that validate those DTOs at trust boundaries;
- pure listing lifecycle, verification, inventory eligibility, freshness, and
  canonical identity policies;
- stable canonical listing path construction used by cross-app projections.

The Node-only `@repo/marketplace-domain/inventory-csv` subpath owns CSV
normalization, hashing, mapping, and regeneration. It is intentionally excluded
from the package root so a client import cannot pull `node:crypto` into a
browser graph.

`@repo/marketplace` continues to own feature composition and app-facing
compatibility: human labels, public mock-directory composition, formatting, and
search-parameter adapters. Pure directory matching/faceting and its stable
cross-app paths belong to the domain package. Seed fixtures live behind the
explicit `@repo/marketplace-domain/testing/mock-data` subpath and are excluded
from the package root. During this migration the feature package re-exports
domain APIs from the original subpaths so existing app and public consumers do
not acquire duplicate types or schemas.

Provider implementations stay with their adapters:

- photo-processing fallback implementation: `@repo/storage`;
- listing-copy fallback implementation: `@repo/ai`;
- feature-only VIN fallback: `@repo/marketplace` until a real VIN adapter is
  selected.

Apps compose auth, storage verification, and persistence. Database APIs accept
already-verified, neutral payloads and still enforce durable ownership,
binding, state, size, and transaction invariants. The database package does not
parse Clerk claims or consume storage package brands.

## Required dependency direction

```text
apps/app, apps/api, apps/web
  -> @repo/marketplace, @repo/database, @repo/storage, @repo/ai

@repo/marketplace-ui -> @repo/marketplace -> @repo/marketplace-domain
@repo/database ---------------------------> @repo/marketplace-domain
@repo/storage ----------------------------> @repo/marketplace-domain
@repo/ai ---------------------------------> @repo/marketplace-domain
```

The following runtime edges are forbidden:

- `database|storage|ai -> marketplace`;
- `database -> auth|storage|ai`;
- `marketplace-domain -> any @repo/* package`, Next.js, React, or provider SDK.

`@repo/marketplace-domain` may depend on Zod. Its root must remain free of
Node-only imports and must not export the CSV subpath.

## Migration sequence

1. Add an executable package-architecture contract that fails on the existing
   reverse edges and cycles.
2. Move one source of truth at a time into the domain package; replace original
   feature modules with typed re-exports or thin feature adapters.
3. Move database/storage/AI imports to explicit domain subpaths.
4. Move auth/storage verification composition to apps and pass neutral verified
   payloads into persistence.
5. Remove obsolete manifest edges, regenerate the lockfile, and prove the
   Turbo graph and runtime schemas remain compatible.

## Rejected alternatives

- **Move the entire marketplace package and rename it.** This preserves the
  coupling and creates a dumping ground containing routes, labels, mocks, and
  infrastructure contracts.
- **Duplicate package-local DTOs.** This permits schemas and TypeScript types to
  drift across API, persistence, and UI boundaries.
- **Let database repositories construct ad-hoc copies of public paths or
  storage keys.** That hides coupling as duplicated policy.
- **Add one package per individual DTO family.** The current graph does not
  justify the workspace and release overhead.
- **Keep auth/storage imports in database because they are server-only.** The
  runtime boundary is not the issue; dependency direction and independent
  rebuild/testability are.

## Consequences

Public consumers keep their current `@repo/marketplace` API while low-level
packages rebuild only when domain contracts or policies change. The domain root
stays safe for server and client consumers, and Node-only import processing is
opt-in. Future provider adapters can implement the ports without depending on
public feature code.
