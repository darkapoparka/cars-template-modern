# Day & Night Auto Group — client showroom website

This repository contains the Day & Night Auto Group client demo: a localized,
mobile-first showroom for vehicle inventory, imports, leasing, trade-in
enquiries, and direct customer contact. It is a single-business website, not a
multi-seller marketplace or dealer platform.

The public site identity is configured in
`packages/marketplace/lead-site.ts`. Static demo mode keeps the proposal stable
without production credentials while preserving the real route and component
architecture used for the client experience.

## Repository structure

- `apps/web` — the public Day & Night showroom and SEO routes, port `3001`.
- `apps/api` — service-only routes and licensed external-inventory adapters, port `3002`.
- `packages/*` — shared design-system, inventory, infrastructure, and UI packages.
- `apps/app` — inherited private workspace infrastructure; it is not linked from the public client site.

The monorepo is based on next-forge, but it is a private application repository and is not an npm package or next-forge release source.

## Prerequisites

- Node.js `22.22.0` (see `.nvmrc` and `.node-version`).
- pnpm `11.4.0`.

```powershell
nvm use 22.22.0
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm --filter @repo/database build
```

Copy only the relevant `.env.example` files to ignored local files and add values locally. Never commit secrets. See [environment configuration](docs/environment.md).

## Development

```powershell
pnpm dev
pnpm --filter web dev
pnpm --filter app dev
pnpm --filter api next-dev
```

With the default client configuration, the public web app serves Day & Night
demo inventory in development and production even when `DATABASE_URL` is
absent. Database mode remains available for future production work by setting
`staticDemoMode: false`.

The database build command generates the ignored Prisma client required by
shared package imports. It does not connect to a database.

For local mobile review, run the showroom on `6212` with
`pnpm --filter web exec next dev -p 6212` and the API on `3002` with
`pnpm --filter api next-dev`. The API needs its own ignored
`apps/api/.env.local`, including the three `NEXT_PUBLIC_*_URL` origins.
When reviewing only the public demo without database credentials, local
`SKIP_ENV_VALIDATION=true` permits startup; it does not configure database or
provider services and must never be used in a hosted deployment.
`/health` checks API liveness, while `/ready` checks configured services.

Import listings require `AUTO_DEV_API_KEY` and
`AUTOMARKET_ENABLE_EXTERNAL_INVENTORY=true` in the API environment. The current
adapter supports US listings in local/pilot mode only; other countries return
`unsupported_origin`. Without a configured feed, the import page accepts a
listing link or a vehicle description instead.

## Release gates

```powershell
pnpm check
pnpm boundaries
pnpm unit
pnpm typecheck
$env:SKIP_ENV_VALIDATION = "true"
pnpm build
```

`pnpm verify` runs the same five gates in sequence. CI runs formatting and boundaries globally, then uses Turborepo's affected graph for unit tests, typechecking, and builds.

Deployment topology and environment scoping are documented in [deployment configuration](docs/deployment.md).
