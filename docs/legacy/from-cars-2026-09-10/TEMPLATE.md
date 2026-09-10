# Modern

Key: `modern` · version: `2026.09.06-refresh-1` · family: `modern`.

Compact stock-first storefront. Full workspace retained, independently installed and verified on 6462 in existing static demo mode. Prisma generation and web typecheck passed; provider services remain unconfigured.

## Status

source-branded-candidate. Source branding/demo content is retained as a visual baseline. This is a candidate for personalization, not a finished generic config-driven template or a sendable lead demo.

## Provenance

M:\leads-cars\projects\bulgaria\day-night-auto-group; 7c635fee1c8fadca317a8a65d5887c0c455b021d plus current uncommitted files

Existing license/asset notes remain with the source. No new multi-client rights determination was made. Source instructions and old project task ledgers are historical; J:/cars/AGENTS.md governs this copy.

## Run

Use Node >=22.22.0 <23 and pnpm 11.4.0. Run `pnpm install --frozen-lockfile`, then `pnpm --filter @repo/database build` to generate the local Prisma client; this does not connect to a database. The existing `leadSite.staticDemoMode: true` supplies demo inventory. For the local public preview, set the following environment variables before the launch command. The three origins must be distinct. Ports 6466/6467 are reserved configuration here; no API or private app was started. Use appropriate distinct origins for a client copy.

```powershell
$env:SKIP_ENV_VALIDATION="true"
$env:AUTOMARKET_PUBLIC_DATA_MODE="demo"
$env:NEXT_PUBLIC_WEB_URL="http://127.0.0.1:6462"
$env:NEXT_PUBLIC_API_URL="http://127.0.0.1:6466"
$env:NEXT_PUBLIC_APP_URL="http://127.0.0.1:6467"
```

SKIP_ENV_VALIDATION is for this local review only. Hosted work requires its actual validated environment. No source credentials were copied.

From J:/cars, on a free port:

```powershell
./scripts/start-preview.ps1 -Template modern -Port 6462
```

Suggested library URL: http://127.0.0.1:6462/cars. The suggestion is not proof that a listener is running; see the audit runtime record. Original inspected source port: 6212.

`pnpm --filter web typecheck` passed. Use an appropriately configured `pnpm --filter web build` for a deployment; broader monorepo checks are documented in the source package.

## Real homepage choices

- `main`: `/cars`

Copy the whole project to retain all variants. Select a primary entry after copying; retain alternate-home choice links when requested.

## Personalization boundaries

- `packages/marketplace/lead-site.ts`
- `packages/marketplace`
- `apps/web/public`
- `apps/web/app`

These are current code/data ownership locations, not a promise that one config edits the whole app. Scan every retained route, metadata, contact value and identity-bearing asset after changes.

The full workspace was copied and hash-verified, dependencies were installed independently, and Prisma generation plus the web typecheck passed. The J: copy renders inventory, one detail and contact at both tested widths on 6462. It still has Next image-sizing/LCP and unconfigured development-toolbar warnings. Provider services and form delivery were not configured or certified. It is the least lightweight runtime here despite the compact UI.

## Representative QA routes

- `/cars`
- `/bg/cars`
- `/bg/listing/bmw-x5-m50d-sofia-2020`
- `/bg/contact`
- `/bg/imports`
- `/bg/sell`
- `/bg/lease`

Use 390 and 1440 px, plus every offered home. Exercise navigation, filters, detail return, overlay dismissal and the main contact path. Existing source data and frontend feedback do not prove real form delivery or a working provider integration.

## Source refresh 2026.09.06-refresh-1

Refreshed from the owner-approved current source including uncommitted polish. See J:/cars/audits/2026-09-06/asko96-build/refresh-plan.json and baseline backups. Existing J: README and local runtime configuration are preserved.
