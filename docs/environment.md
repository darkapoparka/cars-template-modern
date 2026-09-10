# AutoMarket environment configuration

AutoMarket validates environment variables through each app's `env.ts` and the package-level `keys.ts` modules it composes. Secret values belong in ignored local files or the corresponding Vercel project's environment settings. Never commit values to this repository.

The operator source of truth for Preview and Production is
`PREVIEW-PRODUCTION-ENVIRONMENT-RUNBOOK.md`. This page is the shorter developer
overview.

## Local files

| Scope | Example | Local file |
| --- | --- | --- |
| Public marketplace | `apps/web/.env.example` | `apps/web/.env.local` |
| Authenticated workspace | `apps/app/.env.example` | `apps/app/.env.local` |
| Service application | `apps/api/.env.example` | `apps/api/.env.local` |
| Database tooling | `packages/database/.env.example` | `packages/database/.env` |
| CMS tooling | `packages/cms/.env.example` | `packages/cms/.env.local` |

Only Next.js automatically loads an app's `.env.local`. Standalone package tools load variables according to their own configuration; database commands use `packages/database/.env`.

## Required categories

The minimum usable configuration depends on the surface being run:

- Cross-app URLs: `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`, and `NEXT_PUBLIC_API_URL` in every deployable app.
- Database-backed behavior: `DATABASE_URL`.
- Authenticated behavior: `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, plus the documented Clerk route variables.
- Webhook verification: the relevant Clerk, Stripe, inventory scanner, or KYB callback secret.

`NEXT_PUBLIC_*` values are embedded into browser bundles and must never contain secrets.

For the launch-core release profile, the required capabilities are stricter than
the package-level schemas, because optional schemas keep unrelated builds usable:

| Surface | Launch-core capability | Required configuration |
| --- | --- | --- |
| `apps/web` | Real inventory | `DATABASE_URL` |
| `apps/web` | Public enquiry delivery and abuse control | `RESEND_FROM`, `RESEND_TOKEN`, and both Upstash Redis values |
| `apps/app` | Authenticated workspace | Clerk secret/publishable keys and `DATABASE_URL` |
| `apps/app` | Seller and dealer public-media upload | `BLOB_READ_WRITE_TOKEN` |
| `apps/api` | Durable auth synchronization | `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, and `DATABASE_URL` |
| `apps/api` | Scheduled jobs | `CRON_SECRET` |

Run the secret-safe contract check at any time:

```powershell
pnpm release:preflight:contracts
pnpm release:preflight:test
```

After the ignored target files exist, the machine-readable promotion gates are:

```powershell
pnpm release:readiness:preview
pnpm release:readiness:production
```

They emit only the target/promotion status, capability name/status pairs, and
missing variable names. A blocked report exits nonzero. A
`configuration_ready` report proves only the repository-owned configuration
contract, not provider acceptance, migrations, DNS, monitoring, or delivery.

`pnpm release:preflight` inspects the three ignored `.env.preview.local` files
for a Preview launch. It reports variable names and capability states only,
never values. `pnpm release:preflight:production` reads the three
`.env.production.local` files and compares them with the Preview files before
the Production profile can pass.
Both commands fail on localhost URLs, synthetic or missing launch-core
values, validation bypass, inconsistent cross-app URLs/database targets, and
partially configured optional provider pairs.

## Optional integrations

Optional packages add their own variables: Resend, Stripe, PostHog, Google Analytics, Sentry, Better Stack, BaseHub, Arcjet, Liveblocks, Knock, Upstash, Vercel Blob, OpenAI, and feature flags. Consult the applicable `.env.example` and `keys.ts` before enabling one.

Stripe payments, product analytics, CMS, Arcjet, Liveblocks, Knock, OpenAI,
feature flags, and provider-specific observability remain optional until their
product capability is enabled. The current private inventory/KYB storage,
scanner, writable credential, Clerk recovery, and KYB adapters are explicitly
unconfigured code adapters; environment values alone cannot enable them.

Optional values should be omitted when unused rather than set to an empty string. In particular, URL validators such as `BETTERSTACK_URL` reject an empty value; either provide a valid URL or remove the local assignment.

The checked-in BaseHub type declarations let normal repository builds run without `BASEHUB_TOKEN`. Regenerate them explicitly with `pnpm --filter @repo/cms exec basehub build` only when the CMS schema changes and a development token is available.

## Environment separation

- Development uses local or Vercel Development values and non-production service resources.
- Local `apps/web` development defaults to curated demo inventory. Set
  `AUTOMARKET_PUBLIC_DATA_MODE=database` only when the configured development
  database is disposable and migration-current. Production ignores demo mode
  and requires durable inventory.
- Preview uses Preview-scoped values and must not receive production database or service credentials.
- Production uses Production-scoped values and real canonical URLs.
- Scoped local/CI route type generation uses `SKIP_ENV_VALIDATION=true` and explicit safe loopback origins. A Vercel Preview or Production deployment rejects validation bypass and local/test flags.

Environment changes that affect builds are declared in `turbo.json`, so strict-mode cache keys change with configuration. Turbo remote caching is optional and uses `TURBO_TOKEN` plus `TURBO_TEAM` only when configured in GitHub.

`pnpm --filter web typecheck`, `pnpm --filter app typecheck`, and
`pnpm --filter api typecheck` can run in a clean checkout. Their route-typegen
wrapper supplies the documented loopback origin triplet only to its child
process when origin variables are absent, preserves supplied origins, and
refuses its bypass under Vercel Preview or Production. Direct app startup/build
remains strict and requires the applicable `.env.local` values.

Preview public-contact activation additionally follows
`LEAD-SUPPORT-DELIVERY-RUNBOOK.md`. The guarded command is
`pnpm --filter @repo/email smoke:preview`; it is an explicit disposable send
under shell-only guards. Provider acceptance is `sent`, never `delivered`.

## Authenticated Preview release gate

The `CI` workflow exposes a manual `authenticated-preview` job protected by the
GitHub `preview-e2e` environment. Supply the immutable candidate ID, disposable
database branch ID, fixture version, and the three distinct Preview HTTPS
origins as workflow inputs. The protected environment provides test-only Clerk
publishable/secret keys plus the email address and Clerk user ID for the buyer,
private seller, dealer/importer, admin, and support/operator personas. It also
provides the dealer organization identity and role.

The job signs each existing identity in with Clerk's Playwright helper,
materializes five fresh storage states with owner-only permissions under the
ephemeral runner's temporary directory, validates their claims, and invokes
`e2e:release`. Missing metadata or identity, non-HTTPS/local origins, redirects
to sign-in, authorization drift, skipped persona coverage, console errors,
horizontal overflow, or readiness failure fails the job. Do not store
Playwright state in GitHub, and do not use Production sessions or Production
database branches. Session material is deleted in `finally` and is never
uploaded as an artifact. The complete variable and secret inventory is in
`AUTHENTICATED-PREVIEW-RELEASE-RUNBOOK.md`.

Do not run `vercel env pull` at repository root: each deployable app is a separate Vercel project. Link and pull from the intended app directory, and remember that a pull replaces the target file.
