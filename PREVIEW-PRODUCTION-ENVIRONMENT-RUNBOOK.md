# AutoMarket Preview and Production Environment Runbook

## Contract and release boundary

This is the operator source of truth for configuring AutoMarket in Vercel. It covers the public marketplace in `apps/web`, the authenticated workspace in `apps/app`, the service application in `apps/api`, and local-only Prisma Studio safety in `apps/studio`.

Environment configuration is necessary but does not prove provider acceptance, database migrations, webhook delivery, DNS ownership, alert routing, or recovery. The preflight reports names and states only; it never prints secret values. No value in this document is a usable credential or deployable URL.

The release topology is fixed:

| Vercel project | Root Directory | Public role | Canonical origin variable |
| --- | --- | --- | --- |
| Marketplace | `apps/web` | Public marketplace and SEO | `NEXT_PUBLIC_WEB_URL` |
| Workspace | `apps/app` | Account, seller, dealer, and admin | `NEXT_PUBLIC_APP_URL` |
| Service | `apps/api` | Webhooks, cron, feeds, and service routes | `NEXT_PUBLIC_API_URL` |

Create three Vercel projects. Select Next.js, retain pnpm from the root `packageManager`, and enable access to workspace source outside each Root Directory. Do not put secrets in `vercel.json`; the checked-in files only select Next.js and, for the API, declare cron schedules.

Preview and Production each require three distinct exact origins. An exact origin has a scheme and host only: no credentials, path, query, fragment, or trailing slash. Local development may use the loopback origins in the examples. Vercel Preview and Production require remote HTTPS origins. Preview origins, database targets, and secrets must differ from Production.

## Configuration states

The release contract uses these states consistently:

| State | Meaning |
| --- | --- |
| `disabled` | The operator explicitly set the capability intent to `false`. |
| `misconfigured` | Intent is absent/invalid or required values are absent, malformed, partial, or inconsistent. |
| `unavailable` | Intent is `true`, but a required repository adapter is not configured. |
| `ready` | Intent is `true` and all code-owned adapters/configuration checks pass. External proof can still remain. |

The current repository has no configured adapters for auth recovery, billing projection, private inventory storage/scanning/credential resolution, or KYB private-document retention. Therefore every launch environment must explicitly use:

```dotenv
AUTOMARKET_ENABLE_AUTH_RECOVERY=false
AUTOMARKET_ENABLE_BILLING=false
AUTOMARKET_ENABLE_KYB_RETENTION=false
AUTOMARKET_ENABLE_PRIVATE_IMPORTS=false
```

`AUTOMARKET_ENABLE_BILLING` must match in `apps/app` and `apps/api`. Setting any current capability intent to `true` fails preflight; supplying provider credentials alone cannot make an unavailable adapter ready.

## Exact variable matrix

In the tables, “P/P” means configure separate Preview and Production values in the named Vercel project. “Optional group” means set every member of that group or omit all of them. Values beginning with `NEXT_PUBLIC_` are browser-visible and must never contain secrets.

### Public marketplace: `apps/web`

| Variable | Visibility and timing | Environment | Requirement and source |
| --- | --- | --- | --- |
| `DATABASE_URL` | Server; build validation and runtime | Local, P/P | Required. Obtain a pooled Postgres connection from the environment-specific Neon branch/project. Same target as app/API within one environment; different target across Preview and Production. |
| `RESEND_FROM` | Server runtime | Local, P/P | Required for launch. Plain verified email address accepted by the runtime schema; use a monitored Preview/Production mailbox from the matching Resend domain. |
| `RESEND_TOKEN` | Server runtime secret | Local, P/P | Required for launch. Restricted environment-specific Resend API key beginning with `re_`. |
| `UPSTASH_REDIS_REST_URL` | Server runtime | Local, P/P | Required for launch. HTTPS REST URL for the environment-specific Upstash database. |
| `UPSTASH_REDIS_REST_TOKEN` | Server runtime secret | Local, P/P | Required for launch. Token for the matching Upstash database. |
| `ARCJET_KEY` | Server runtime secret | Optional P/P | Optional Arcjet key beginning with `ajkey_`. |
| `BASEHUB_TOKEN` | Server/build secret | Optional P/P | Optional BaseHub token beginning with `bshb_pk_`. |
| `FLAGS_SECRET` | Server/local tooling secret | Local only | Local Vercel toolbar. Never set in Preview or Production. |
| `BETTER_STACK_SOURCE_TOKEN` + `BETTER_STACK_INGESTING_URL` | Server runtime secret + URL | Optional group P/P | Better Stack log source token and HTTPS ingest endpoint from the same source. |
| `BETTERSTACK_API_KEY` + `BETTERSTACK_URL` | Server runtime secret + URL | Optional group P/P | Better Stack status API key and status endpoint. |
| `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` + `NEXT_PUBLIC_SENTRY_DSN` | Build secret/identifiers + public runtime DSN | Optional group P/P | Sentry project integration. The DSN is browser-visible; the auth token is not. |
| `NEXT_PUBLIC_WEB_URL` | Public build/runtime origin | Local, P/P | Required. This project’s exact origin. |
| `NEXT_PUBLIC_APP_URL` | Public build/runtime origin | Local, P/P | Required. Matching workspace origin for the same environment. |
| `NEXT_PUBLIC_API_URL` | Public build/runtime origin | Local, P/P | Required. Matching service origin for the same environment; included in CSP `connect-src`. |
| `NEXT_PUBLIC_DOCS_URL` | Public build/runtime origin | Optional P/P | Exact remote HTTPS docs origin if a separate docs surface is active. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public build/runtime identifier | Optional P/P | Google Analytics measurement ID beginning with `G-`. |
| `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` | Public build/runtime identifier + URL | Optional group P/P | PostHog project key beginning with `phc_` and its exact host. |

Preview activation of public contact paths requires the Preview-only `DATABASE_URL`, both Upstash values, `RESEND_TOKEN`, and a verified, monitored `RESEND_FROM`. Missing values are `misconfigured`, not intentionally disabled. Structural preflight does not prove Resend accepted a message.

### Authenticated workspace: `apps/app`

| Variable | Visibility and timing | Environment | Requirement and source |
| --- | --- | --- | --- |
| `AUTOMARKET_ENABLE_BILLING` | Server build/runtime intent | P/P | Required and currently exactly `false`; match the API project. |
| `DATABASE_URL` | Server; build validation and runtime | Local, P/P | Required. Same environment-specific Postgres target used by web/API. |
| `BLOB_READ_WRITE_TOKEN` | Server runtime secret | P/P | Required. Vercel Blob read/write token for the environment’s media store. |
| `CLERK_SECRET_KEY` | Server runtime secret | Local, P/P | Required. Preview uses a test instance `sk_test_...`; Production uses a separate live instance `sk_live_...`. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public build/runtime key | Local, P/P | Required matching Clerk key: `pk_test_...` in Preview, `pk_live_...` in Production. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Public build/runtime route | P/P | Required exact value `/sign-in`. |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Public build/runtime route | P/P | Required exact value `/sign-up`. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Public build/runtime route | P/P | Required exact value `/`. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Public build/runtime route | P/P | Required exact value `/`. |
| `NEXT_PUBLIC_WEB_URL` + `NEXT_PUBLIC_APP_URL` + `NEXT_PUBLIC_API_URL` | Public build/runtime origins | Local, P/P | Required and identical to the same environment’s values in web/API; all three origins remain distinct from each other. |
| `NEXT_PUBLIC_DOCS_URL` | Public build/runtime origin | Optional P/P | Exact docs origin if active. |
| `OPENAI_API_KEY` | Server runtime secret | Optional P/P | Optional restricted OpenAI project key used only by typed AI adapters. |
| `LIVEBLOCKS_SECRET` | Server runtime secret | Optional P/P | Optional Liveblocks secret beginning with `sk_`. |
| `RESEND_FROM` + `RESEND_TOKEN` | Server runtime address + secret | Optional group P/P | Optional authenticated-workspace email provider configuration. Not the public-contact launch gate. |
| `KNOCK_SECRET_API_KEY` + `NEXT_PUBLIC_KNOCK_API_KEY` + `NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID` | Server secret + public identifiers | Optional group P/P | Optional Knock notification project values from one environment. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public build/runtime identifier | Optional P/P | Optional GA measurement ID beginning with `G-`. |
| `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` | Public build/runtime values | Optional group P/P | Optional PostHog project key and host. |
| `BETTER_STACK_SOURCE_TOKEN` + `BETTER_STACK_INGESTING_URL` | Server runtime secret + URL | Optional group P/P | Optional Better Stack log transport. |
| `BETTERSTACK_API_KEY` + `BETTERSTACK_URL` | Server runtime secret + URL | Optional group P/P | Optional Better Stack status integration. |
| `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` + `NEXT_PUBLIC_SENTRY_DSN` | Build secret/identifiers + public runtime DSN | Optional group P/P | Optional Sentry project integration. |
| `FLAGS_SECRET` | Server/local tooling secret | Local only | Local toolbar only; forbidden in Preview and Production. |

### Service application: `apps/api`

| Variable | Visibility and timing | Environment | Requirement and source |
| --- | --- | --- | --- |
| `AUTOMARKET_ENABLE_AUTH_RECOVERY` | Server build/runtime intent | P/P | Required and currently exactly `false`. |
| `AUTOMARKET_ENABLE_BILLING` | Server build/runtime intent | P/P | Required and currently exactly `false`; match the app project. |
| `AUTOMARKET_ENABLE_KYB_RETENTION` | Server build/runtime intent | P/P | Required and currently exactly `false`. |
| `AUTOMARKET_ENABLE_PRIVATE_IMPORTS` | Server build/runtime intent | P/P | Required and currently exactly `false`. |
| `DATABASE_URL` | Server; build validation and runtime | Local, P/P | Required. Same environment-specific Postgres target used by web/app. |
| `CLERK_SECRET_KEY` | Server runtime secret | P/P | Required. Matching test/live Clerk instance used by the workspace. |
| `CLERK_WEBHOOK_SECRET` | Server runtime secret | P/P | Required. Signing secret beginning with `whsec_` for this environment’s auth webhook endpoint. |
| `CRON_SECRET` | Server runtime secret | P/P | Required, at least 32 characters. Generate/store in Vercel; Vercel Cron sends it as a Bearer authorization value. |
| `BLOB_READ_WRITE_TOKEN` | Server runtime secret | P/P | Required for cleanup/media worker capability. Environment-specific Vercel Blob token. |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Server runtime URL + secret | P/P | Required for webhook idempotency/rate controls. Matching environment-specific Upstash values. |
| `NEXT_PUBLIC_WEB_URL` + `NEXT_PUBLIC_APP_URL` + `NEXT_PUBLIC_API_URL` | Public build/runtime origins | Local, P/P | Required cross-app contract. Despite the prefix, these contain no secrets. |
| `NEXT_PUBLIC_DOCS_URL` | Public build/runtime origin | Optional P/P | Exact docs origin if active. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Public build/runtime identifier | Optional P/P | Optional GA measurement ID beginning with `G-`; declared by the shared analytics package even though the API has no page UI. |
| `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` | Public/server analytics values | Optional group P/P | Optional PostHog project values used by shared server analytics. |
| `INVENTORY_SCANNER_CALLBACK_SECRET` | Server runtime secret | Conditional P/P | Set only with the scanner adapter and provider callback. At least 32 characters. |
| `KYB_PROVIDER_CALLBACK_SECRET` | Server runtime secret | Conditional P/P | Set only with the KYB provider adapter. At least 32 characters. |
| `KYB_SCANNER_CALLBACK_SECRET` | Server runtime secret | Conditional P/P | Set only with the KYB scanner adapter. At least 32 characters. |
| `AUTOMARKET_INVENTORY_<SOURCE>_TOKEN` and retiring variants | Server runtime secret | Conditional P/P | Dynamic credential binding named by an `env:AUTOMARKET_INVENTORY_...` database reference. Scope it to the exact organization/source/purpose. `AUTOMARKET_INVENTORY_EXAMPLE_TOKEN` in the example is not a real binding. |
| `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Server runtime secrets | Optional group P/P | Optional payment provider pair. These values do not enable billing while capability intent remains `false`. |
| `RESEND_FROM` + `RESEND_TOKEN` | Server runtime address + secret | Optional group P/P | Optional service email adapter pair. |
| `BETTER_STACK_SOURCE_TOKEN` + `BETTER_STACK_INGESTING_URL` | Server runtime secret + URL | Optional group P/P | Optional Better Stack log transport. |
| `BETTERSTACK_API_KEY` + `BETTERSTACK_URL` | Server runtime secret + URL | Optional group P/P | Optional Better Stack status integration. |
| `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT` + `NEXT_PUBLIC_SENTRY_DSN` | Build secret/identifiers + public runtime DSN | Optional group P/P | Optional Sentry project integration. |

### Automatic, local-only, and forbidden names

Do not manually add Vercel automatic variables to `.env.example` or copy them across projects: `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_REGION`, and `VERCEL_PROJECT_PRODUCTION_URL`. Next.js supplies `NEXT_RUNTIME`, Node supplies `NODE_ENV`, and CI runners supply `CI`. They are build/runtime context, not operator secrets.

Prisma Studio is local tooling. `apps/studio/.env.example` documents `DATABASE_URL`, `AUTOMARKET_STUDIO_ALLOWED_DATABASE_HOST`, and `AUTOMARKET_STUDIO_CONFIRM_REMOTE_NON_PRODUCTION`. The last two are required together only to acknowledge a specifically allowed remote non-production host. `AUTOMARKET_PG_BIN`/`PG_BIN` and `SHADOW_DATABASE_URL` are database-tool inputs; never configure Studio against Production. `LANGUINE_PROJECT_ID` is translation-tooling metadata from `packages/internationalization/.env.example`, not an application runtime value.

The Preview email proof has three shell-only guards. Never add them to Vercel application environments:

| Variable | Exact contract |
| --- | --- |
| `AUTOMARKET_DELIVERY_SMOKE_TARGET` | `preview` |
| `AUTOMARKET_PREVIEW_SMOKE_CONFIRM` | `send-disposable-preview-email` |
| `AUTOMARKET_PREVIEW_SMOKE_RECIPIENT` | One disposable, monitored Preview recipient |

`AUTOMARKET_DEPLOYMENT_TARGET=production` is an optional second shell-level refusal signal for the Preview smoke; it is not an application setting.

`AUTOMARKET_NEXT_TYPEGEN_TEST_CLI` is internal to the route-typegen unit fixture. `AUTOMARKET_PUBLIC_E2E`, `E2E_PUBLIC_MODE`, `E2E_PUBLIC_RUN_ID`, `NEXT_PUBLIC_AUTOMARKET_PUBLIC_E2E`, and `SKIP_ENV_VALIDATION` are local/CI harness inputs and must not exist in a Vercel Preview or Production environment. `SKIP_ENV_VALIDATION=true` is allowed only inside scoped tooling such as the route-typegen wrapper; deployed builds fail closed if it is present.

Deprecated/forbidden names are `KNOCK_API_KEY`, `KNOCK_FEED_CHANNEL_ID`, `LOGTAIL_SOURCE_TOKEN`, `LOGTAIL_URL`, `NEXT_PUBLIC_BETTER_STACK_CUSTOM_ENDPOINT`, `NEXT_PUBLIC_BETTER_STACK_INGESTING_URL`, `NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN`, `NEXT_PUBLIC_LOGTAIL_SOURCE_TOKEN`, `NEXT_PUBLIC_LOGTAIL_URL`, and `SVIX_TOKEN`. Replace them with the canonical names in the matrices; do not configure aliases.

## Safe configuration order

1. Create isolated Preview resources first: database branch/project, Clerk test instance, Blob store, Upstash, restricted Resend key and verified monitored sender. Record their owners and rotation locations without copying values into tickets.
2. Create/link the three Vercel projects with the Root Directories above. Assign values to the Preview environment only.
3. Allocate three distinct stable Preview HTTPS origins. Put the same origin triplet in all three projects, with each project’s own origin in its corresponding variable.
4. Configure the launch-core values. Use the same Preview database target across web/app/API, matching Clerk test instance in app/API, and environment-scoped provider credentials. Set all four capability intents explicitly to `false` in the projects where they are declared.
5. Configure provider callbacks and dashboard allowed origins only after the Preview API/app domains are stable.
6. Pull each Vercel project into its own ignored file. Run commands from the matching app directory; pulling replaces the target file:

```powershell
Push-Location apps/web
vercel env pull .env.preview.local --environment=preview
Pop-Location
Push-Location apps/app
vercel env pull .env.preview.local --environment=preview
Pop-Location
Push-Location apps/api
vercel env pull .env.preview.local --environment=preview
Pop-Location
```

7. Run contract, focused tests, and Preview preflight before any deploy/provider proof.
8. Execute the guarded disposable email proof only under `LEAD-SUPPORT-DELIVERY-RUNBOOK.md`. It is an explicit external send and is outside this environment-finalization task.
9. Create Production resources independently. Use Clerk live keys, Production database/provider resources, and three distinct Production HTTPS origins. Never promote Preview secrets by relabeling them Production.
10. Pull Production files from each linked app project as `.env.production.local`. Keep `.env.preview.local` present so Production preflight can prove cross-environment isolation.

## Origins, callbacks, redirects, trusted origins, and CSP

Use the API origin for all external callbacks:

| Provider/consumer | Exact path on `NEXT_PUBLIC_API_URL` | Secret/auth |
| --- | --- | --- |
| Clerk auth webhook | `/webhooks/auth` | `CLERK_WEBHOOK_SECRET` signature |
| Stripe payments webhook | `/webhooks/payments` | `STRIPE_WEBHOOK_SECRET` signature |
| Inventory scanner | `/webhooks/inventory/scanner` | `INVENTORY_SCANNER_CALLBACK_SECRET` |
| KYB provider | `/webhooks/verification/provider` | `KYB_PROVIDER_CALLBACK_SECRET` |
| KYB scanner | `/webhooks/verification/scanner` | `KYB_SCANNER_CALLBACK_SECRET` |
| Vercel Cron | Paths declared in `apps/api/vercel.json` | `Authorization: Bearer <CRON_SECRET>` supplied by Vercel |

Do not point callbacks at web/app, a deployment’s transient URL, or a path-bearing origin variable. The API public dealer feed is also based at the API origin; public vehicle pages remain on the web origin.

In Clerk, use separate Preview test and Production live instances. Allow only the matching workspace origin as an application origin/redirect origin. Configure `/sign-in`, `/sign-up`, and `/` redirect routes exactly as listed in the app matrix. Disable broad subdomain allowances unless an explicitly reviewed custom-domain flow requires them. Confirm the auth webhook points to the matching API environment, then copy only that endpoint’s signing secret into the API project.

The web and app CSP builders reduce configured URLs to origins and include `NEXT_PUBLIC_API_URL` in `connect-src`. Optional PostHog, Sentry, GA, and Vercel Analytics sources are added only when configured. Clerk middleware owns its request-specific nonce and Clerk frontend API source in `apps/app`; do not hardcode a development Clerk wildcard for Production. A CSP console error is a release failure, not a reason to add a broad wildcard.

## Verification commands

The contracts and unit suites do not need provider credentials:

```powershell
pnpm release:preflight:contracts
pnpm release:preflight:test
pnpm --filter @repo/email test
pnpm --filter web typecheck
pnpm --filter app typecheck
pnpm --filter api typecheck
pnpm check
pnpm boundaries
git diff --check
```

For automation and release-ticket ingestion, use the status-only readiness
commands after pulling the ignored environment files:

```powershell
pnpm release:readiness:preview
pnpm release:readiness:production
```

Each command emits JSON containing only `target`, `promotionStatus`, capability
`name`/`status` pairs, and a sorted `missingVariables` list. It never emits a
configured value, file content, URL, secret fingerprint, or explanatory message.
`blocked` exits with code 1. `configuration_ready` exits with code 0 and means
only that code-owned environment contracts passed; provider, migration, DNS,
webhook, monitoring, and recovery evidence still remain external gates. Use the
corresponding detailed `release:preflight` command when a blocked report needs
project-specific diagnosis.

`pnpm --filter web typecheck` is deterministic in a clean checkout. `scripts/next-typegen.mjs` supplies only the documented loopback origin triplet to its child process when those values are absent and scopes `SKIP_ENV_VALIDATION=true` to route generation. It does not change direct app startup/build or Preview/Production validation. For local runtime development, copy the relevant `.env.example` to `.env.local`, retain the loopback origins, and supply real non-production server values.

The wrapper preserves explicitly supplied origins, treats hidden environment-contract output as a failure, and refuses to run its provider-free bypass when `VERCEL_ENV` is `preview` or `production`. Vercel deployment builds use each app's direct `next build` script and must satisfy the real runtime schema.

Preview preflight reads the three ignored Preview files:

```powershell
pnpm release:preflight
```

Production preflight reads the three Production files and compares them with the Preview files:

```powershell
pnpm release:preflight:production
```

It fails on missing files, local/non-HTTPS/path-bearing/duplicate origins, cross-app drift, reused Preview/Production database targets or launch secrets, absent/invalid capability intent, unavailable enabled adapters, partial optional provider groups, deprecated/local-test variables, validation bypass, and malformed launch-core values. Messages contain variable names, never values.

After a Preview deployment, verify the API readiness endpoint at `NEXT_PUBLIC_API_URL/ready`. A successful HTTP response is insufficient by itself: require report `status: "ready"`, passing core checks, and capability states that are explicitly `disabled` (current release) rather than `misconfigured` or `unavailable`. Verify web/app pages load at their canonical origins without cross-origin redirects or CSP/console errors. Provider dashboards must separately confirm webhook endpoint health.

The guarded real provider proof command is exactly:

```powershell
pnpm --filter @repo/email smoke:preview
```

Follow every shell guard and evidence step in `LEAD-SUPPORT-DELIVERY-RUNBOOK.md`. Do not run it from a shell holding Production credentials, against a customer address, or without explicit approval for the disposable send. Passing proof records provider acceptance as `sent`; it never means `delivered`. Email delivery cannot be claimed until a future signed provider webhook and durable delivery receipt exist.

## Rollback

1. Set affected capability intent to `false` before removing a credential. Current unavailable capabilities must already be false.
2. Restore the previous environment-scoped value in the matching Vercel project; do not copy a value from the other environment.
3. Redeploy the last compatible artifact or use Vercel rollback only when its schema is compatible with the current database. Environment rollback does not roll back data or migrations.
4. For webhook secret rotation, retain provider overlap only where the provider and verifier explicitly support it; otherwise coordinate endpoint secret replacement and redeploy as one change.
5. Rerun contracts and the target preflight. Recheck `/ready`, canonical URLs, callbacks, and CSP. Do not rerun the email smoke against Production.

## Values operators still must supply

No real value is stored in this repository. Before Preview can be promoted, the operator must supply:

- three stable Preview HTTPS origins and three distinct Production HTTPS origins;
- isolated Preview and Production database targets, copied consistently across the three projects in each environment;
- Preview test and Production live Clerk keys, plus separate auth webhook signing secrets;
- environment-specific Vercel Blob tokens, 32+ character cron secrets, and Upstash URL/token pairs;
- restricted Resend keys and plain verified monitored sender mailboxes, plus one disposable Preview smoke recipient at proof time;
- any explicitly selected optional provider groups and conditional callback secrets, configured as complete environment-specific sets;
- external evidence for DNS/domain ownership, migrations, provider callback health, alert acknowledgement, recovery, and the guarded Preview acceptance proof.

Until those values and evidence exist, the correct status is “code-owned contract complete; provider/environment activation pending,” not Preview-ready or Production-ready.
