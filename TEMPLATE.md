# Template reference — Modern

## Identity
- Repository: `darkapoparka/cars-template-modern`
- Key: `modern`
- Portfolio role: **core**
- Design position: premium minimal / inventory-first showroom
- Stack: Next.js monorepo + pnpm/Turborepo
- Primary entry: `/cars`
- Suggested standalone review port: `6462`

This is a **template master**, not a sendable dealer demo. The baseline intentionally preserves source/sample material for design fidelity; every lead copy requires a complete identity and content sweep.

## Install and run
```text
corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/database build
pnpm --filter web exec next dev -H 127.0.0.1 -p 6462
```

## Primary personalization surface
- `packages/marketplace/lead-site.ts`
- `packages/marketplace/`
- `apps/web/public/`
- `apps/web/app/`

Do not assume these are the only identity consumers. Search every retained route, data module, metadata definition and static asset before declaring a skin complete.

## Representative QA routes
- `/cars`
- `/bg/cars`
- `/bg/listing/bmw-x5-m50d-sofia-2020`
- `/bg/contact`
- `/bg/imports`
- `/bg/sell`
- `/bg/lease`

## Required checks
- `pnpm --filter web typecheck`
- `pnpm --filter web build  # with the documented preview environment`

## Current constraints
Keep the whole monorepo. Static demo mode provides preview inventory; provider services are not automatically configured. Do not split packages or simplify the runtime during a lead skin.

For `modern`, local preview also requires the environment documented in `docs/QA.md`; provider services remain unconfigured unless a lead task explicitly wires them. For `carwow`, use direct Vite for a selectable port because the inherited source dev wrapper fixes port 6517.

## Source lineage
Split on 2026-09-10 from the live working tree at `J:/cars/templates/modern`. The split deliberately captured local working-tree changes, including changes newer than the `cars` repository HEAD. Historical root instructions were archived under `docs/legacy/from-cars-2026-09-10/`; use them only for provenance, never as current operating instructions.

## Portfolio policy
Standard showroom lead = three variants: `auto-best`, `carwow`, `modern`. Add `import` only when the dealer's real offer includes sourcing/import/transport/order-from-Europe or equivalent. Do not add a fourth design merely to increase the count.
