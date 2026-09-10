# AutoMarket launch audit — 2026-07-16

## Decision

`FAIL — NOT AUTHORIZED TO RELEASE`

All locally fixable P0/P1 findings discovered in this continuation were
remediated and the local quality gates are strong. Release remains blocked by
the absence of a configured immutable three-project Preview, an isolated
database with applied migrations, authenticated synthetic personas, provider
delivery evidence, recovery/alert drills, and Bulgarian/EU legal approval.
No deployment, migration, provider mutation, secret change, staging-data
mutation, or external message was performed.

## Candidate and evidence boundary

- Revision: `b01c65f32e9e` plus a shared dirty checkout with 450 status entries
  at final audit time. Existing user work was preserved; the evidence is not
  tied to an immutable commit.
- Toolchain: Node `22.22.0`, pnpm `11.4.0`, Turbo `2.9.16`, Next.js `16.2.6`,
  React `19.2.4`, and workspace Playwright `1.61.1`.
- Topology: exactly three Vercel projects rooted at `apps/web`, `apps/app`, and
  `apps/api`. Storybook is a local/CI artifact, not a fourth deployment.
- Browser boundary: `agent-browser` was requested and its skill was followed,
  but the CLI was not installed on this host (`agent-browser` was not
  recognized). The documented fallback was the repository's pinned Playwright
  Chromium gate. This is local evidence, not staging evidence.
- Capacity: the public runner keeps a hard 2 GiB free-space guard and owns a
  disposable `.next/public-e2e` directory. Generated build/browser artifacts
  were removed between capacity-sensitive runs where permitted.

## Current official baseline

The audit used current first-party material, not an older scaffold snapshot:

- next-forge `6.0.2` and its current repository/configuration:
  [release](https://github.com/vercel/next-forge/releases/tag/v6.0.2),
  [structure](https://www.next-forge.com/docs/structure),
  [environment](https://www.next-forge.com/docs/setup/env),
  [Vercel deployment](https://www.next-forge.com/docs/deployment/vercel),
  [stock turbo.json](https://raw.githubusercontent.com/vercel/next-forge/main/turbo.json),
  and [stock package.json](https://raw.githubusercontent.com/vercel/next-forge/main/package.json).
- Next.js:
  [proxy.ts](https://nextjs.org/docs/app/api-reference/file-conventions/proxy),
  [cookies](https://nextjs.org/docs/app/api-reference/functions/cookies),
  [CSP](https://nextjs.org/docs/app/guides/content-security-policy),
  [server security](https://nextjs.org/blog/security-nextjs-server-components-actions),
  [Image](https://nextjs.org/docs/app/api-reference/components/image),
  and [JSON-LD](https://nextjs.org/docs/app/guides/json-ld).
- Turborepo/Vercel:
  [configuration](https://turborepo.com/docs/reference/configuration),
  [environment variables](https://turborepo.com/docs/crafting-your-repository/using-environment-variables),
  [Vercel monorepos](https://vercel.com/docs/monorepos/turborepo),
  [Vercel environment variables](https://vercel.com/docs/environment-variables),
  and [Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
- Providers/privacy:
  [Clerk cookies](https://clerk.com/docs/guides/how-clerk-works/cookies),
  [Vercel Analytics privacy](https://vercel.com/docs/analytics/privacy-policy),
  [Google consent](https://developers.google.com/tag-platform/security/guides/consent),
  and [PostHog privacy](https://posthog.com/docs/privacy/data-collection).
- Security patch baseline: Next.js `16.2.6` includes the fix identified by
  [GHSA-26hh-7cqf-hhc6](https://github.com/vercel/next.js/security/advisories/GHSA-26hh-7cqf-hhc6).

The next-forge documents are treated as scaffold conventions. AutoMarket's
three-surface ownership rules are project requirements. Conclusions about the
suitability of a deliberate deviation are audit inferences, not claims that
next-forge mandates AutoMarket's product architecture.

## Audit matrix

| Requirement / source | Current evidence | Severity | Action in this continuation | Verification | External blocker |
| --- | --- | --- | --- | --- | --- |
| Three app-owned deployables; packages remain composable ([next-forge structure](https://www.next-forge.com/docs/structure)) | `web`, `app`, and `api` retain their fixed responsibilities; 707 files in 31 packages have zero boundary findings | P0 | Removed the stale Storybook Vercel/Bun manifest; kept product-specific layered packages where boundaries are explicit | `pnpm boundaries` PASS | Immutable Vercel project roots are not connected |
| Turbo cache and environment correctness ([Turbo config](https://turborepo.com/docs/reference/configuration)) | Strict env mode; env files are global inputs; launch names are declared; build depends on dependency builds and tests | P1 | Aligned build dependencies with current next-forge; declared cron/callback/inventory inputs and the local pnpm verification pass-through | Contract preflight PASS; 27/27 typecheck tasks PASS | Remote cache behavior requires CI/Preview evidence |
| Toolchain and CI agree ([next-forge package](https://raw.githubusercontent.com/vercel/next-forge/main/package.json)) | Node and pnpm are pinned; CI uses frozen install; Playwright is exact in `apps/e2e` | P1 | Added release-contract tests and a guarded public browser CI job with failure-only artifacts | Contract preflight 23/23 checks PASS | GitHub CI has not run on an immutable candidate |
| Environment schemas normalize blank optional values ([next-forge env](https://www.next-forge.com/docs/setup/env)) | All composed schemas use `emptyStringAsUndefined`; client exposure remains limited to public names | P0 | Normalized all app/package schemas; app/API tests prove blank optionals disable and blank core values reject | App env 5/5 and API env 2/2 tests PASS | Required Preview values are absent |
| Public web degrades truthfully; authenticated surfaces fail closed | Web shows inventory unavailable without `DATABASE_URL`; app requires DB, Clerk, and Blob at schema/build boundaries | P0 | Strengthened core contracts and readiness; removed fake VIN/provider success | Production-unavailable browser tests 2/2 PASS; readiness tests 5/5 PASS | Real database and provider capability checks remain unproved |
| API liveness/readiness are distinct | `/health` is process liveness; `/ready` probes required configuration and the critical listing table, redacts details, and returns 503 when degraded | P0 | Implemented structured redacted readiness and correlation/security headers | API health/readiness unit suites PASS | Preview `/ready = 200` requires configured services and applied migrations |
| Cron ownership and authorization ([Vercel Cron](https://vercel.com/docs/cron-jobs/manage-cron-jobs)) | Only four configured GET schedules remain and each maps to an authenticated route | P0 | Removed schedules for intentionally unconfigured adapters; made media cleanup GET/POST compatible and capability-aware | Static cron route contract PASS | Real cron invocation/log evidence is absent |
| Cookie/storage writes are minimal and owned ([Next cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)) | See cookie inventory below; no unread sidebar cookie remains | P1 | Hardened locale cookie and removed unused design-system cookie | i18n tests 11/11 and browser cookie assertions PASS | Clerk cookie attributes/custom domain must be verified on Preview |
| Non-essential browser analytics require consent ([Google](https://developers.google.com/tag-platform/security/guides/consent), [PostHog](https://posthog.com/docs/privacy/data-collection)) | Default is unknown/denied; GPC/DNT deny; consent is versioned, localized, persisted when possible, reopenable, and revocable | P0 | Isolated GA, PostHog, and Vercel Analytics behind consent; disabled PostHog autocapture/session recording and removed cookies on revoke | Analytics tests 13/13 and consent browser scenarios 4/4 PASS | Legal basis/text and provider dashboards need legal/Preview review |
| Locale routes and preference remain honest | Public locales are exactly `en`/`bg`; explicit route wins over cookie/header; unsupported locale reaches 404 | P0 | Hardened negotiation/prefetch behavior; full-document locale switch preserves deep path/query; added mobile control | Locale unit tests and mobile/desktop browser scenarios PASS | Authenticated app/email Bulgarian coverage remains a product/legal decision |
| Canonical, alternates, sitemap, and noindex boundaries | CMS-generated English-only content does not leak into Bulgarian routes; legal fallbacks and listing contact noindex are explicit | P1 | Added alternate-locale control; localized pagination; constrained CMS blog/legal/sitemap output | SEO 7/7, sitemap 2/2, 404 browser checks PASS | Search-console/Rich Results validation requires deployed URLs |
| Security headers and lightweight proxy composition ([Next proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy), [CSP](https://nextjs.org/docs/app/guides/content-security-policy)) | API uses Nosecone; web CSP admits only configured analytics/Sentry origins and public image sources; app CSP derives exact provider origins | P0 | Added API proxy headers, sanitized origins, Arcjet denial/error separation, and Vercel Analytics sources only when enabled | Security 11/11 and app CSP 3/3 tests PASS | Public production CSP retains `unsafe-inline` for static Next bootstrap/style compatibility; nonce hardening is P2 architecture work |
| Server actions/routes re-authorize and scope organization data ([Next security](https://nextjs.org/blog/security-nextjs-server-components-actions)) | Existing branded authorization and tenant checks remain; collaboration identities now require durable active users | P0 | Made inactive collaboration actors 403; stabilized upload errors and redacted server logs | App authorization/collaboration/upload tests PASS | Cross-persona Preview traversal is not run |
| Webhooks, idempotency, optional analytics, and cron fail safely | Signatures and secrets fail closed; replay mutates once; analytics flush cannot fail a core webhook | P0 | Added safe optional analytics wrapper and semantic API/database lint refactors | API 89/89 tests PASS | Real Clerk/Stripe delivery and replay evidence is absent |
| Performance and Next 16 media conventions ([Next Image](https://nextjs.org/docs/app/api-reference/components/image)) | Above-fold images now use explicit eager loading rather than deprecated `priority`; no LCP image warning in the final targeted browser pass | P1 | Updated marketplace, gallery, directory, blog, and collection images | Final mobile/desktop marketplace pass 6/6 | Production transfer/DOM budgets require immutable Preview |
| Accessibility and responsive public shell | Automated serious/critical Axe gate, keyboard control reachability, honest 404, and discovery run at 390×844 and 1440×1100 | P0 | Added locale/consent scenarios and fixed mobile switch placement/navigation behavior | Full public gate 18/18 demo + 2/2 unavailable PASS | Manual assistive-technology review and authenticated viewports remain |
| Dependency security | `pnpm audit --prod --audit-level=high` reports 5 moderate and 2 low; zero high/critical | P0 high/critical, P2 residual | Upgraded to patched Next.js baseline in the existing candidate; did not add unverifiable overrides under low disk | Audit exits 0 | Moderate/low transitive refresh is deferred until lockfile/install can be reproduced with capacity |
| Local code quality | Root check originally exposed 248 backend/provider diagnostics | P1 | Resolved them semantically without excluding files or weakening rules; added rate-limit type coverage | 668 files, zero diagnostics; 14/14 unit tasks; 27/27 typecheck tasks | None locally |
| Production build truth | Fresh web/app builds compile with validation bypass; earlier API/Storybook compile checks also pass | P1 | Kept schemas strict and recorded bypass builds as compile evidence only | Next 16.2.6 web and app route generation PASS | Strict three-project build fails until required Preview values exist |

## Environment and capability contract

The deterministic preflight reports names/status only and never values.

| Surface | Required for launch | Optional/deferred capability groups |
| --- | --- | --- |
| `apps/web` | `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `DATABASE_URL`, `RESEND_FROM`, `RESEND_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | BaseHub CMS, Arcjet, GA, PostHog, Sentry, Better Stack, feature flags |
| `apps/app` | `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `BLOB_READ_WRITE_TOKEN` | collaboration/Liveblocks, Knock, payments, analytics/observability, AI |
| `apps/api` | `NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Stripe, analytics/observability, private import/storage/scanner/KYB adapters, optional callback secrets |

Resend is required by the current public contact launch contract, but no real
delivery was invoked. Product analytics, collaboration, payment, enhanced
observability, and private inventory/KYB adapters are disabled when their
complete configuration is absent. Partially configured optional providers fail
preflight rather than pretending to be disabled.

## Cookie and browser-storage inventory

| Owner | Storage | Technical behavior | Launch conclusion |
| --- | --- | --- | --- |
| Internationalization | Host-only `Next-Locale` cookie | `HttpOnly`, `SameSite=Lax`, `Path=/`, one-year max age, `Secure` in production; explicit locale routes win; prefetch does not mutate | Locally verified |
| Analytics consent | `automarket.analytics-consent` localStorage | Version 1 JSON with decision/timestamp; missing/malformed/blocked storage is not consent; GPC/DNT deny | Locally verified |
| PostHog | localStorage after grant | No cookies, autocapture, or session recording; identified-only profiles; opt-out and cleanup on revoke | Locally verified; dashboard settings unverified |
| Google Analytics | Provider cookies only after grant | Default-denied/disabled before grant; known GA cookies are expired on revoke | Locally verified; deployed provider behavior unverified |
| Vercel Analytics | Provider script only after grant and only on Vercel | Not mounted for provider-free browser tests/local non-Vercel runtime | Locally verified |
| Marketplace view | localStorage | Grid/list preference only; no cross-origin credential behavior | Non-essential preference |
| Theme | localStorage/provider state | Appearance preference only | Non-essential preference |
| Clerk | Clerk-owned auth/session cookies | Expected only on authenticated app; project code does not override provider security attributes | Must be inspected on custom-domain Preview |
| Liveblocks/Knock/other SDKs | None while capability disabled | Providers are not mounted without complete configuration | Locally verified by capability composition |

Consent is origin-scoped, so `web` and `app` maintain independent decisions.
No cross-origin one-click save or credentialed CORS flow is claimed. Server
operational/security telemetry still needs an approved purpose, retention, and
legal basis; browser consent does not authorize raw PII in logs.

## Verification ledger

| Command / evidence | Result |
| --- | --- |
| `pnpm release:preflight:contracts` | PASS, 23 named contract checks |
| `pnpm release:preflight:test` | PASS, 8/8 |
| `pnpm release:preflight` | FAIL as designed: required URLs, DB, Clerk, Blob, Upstash, Cron and Resend configuration absent; values not printed |
| `pnpm check` | PASS, 668 files, zero diagnostics |
| `pnpm boundaries` | PASS, 707 files across 31 packages |
| `pnpm unit` | PASS, 14/14 Turbo tasks; DB integration tests requiring a real DB remain 8 skipped |
| `pnpm typecheck` | PASS, 27/27 tasks across 31 packages |
| `pnpm audit --prod --audit-level=high` | PASS threshold; 0 high/critical, 5 moderate, 2 low |
| `pnpm --filter web build` with `SKIP_ENV_VALIDATION=true` | PASS, compile evidence only |
| `pnpm --filter app build` with `SKIP_ENV_VALIDATION=true` | PASS, compile evidence only |
| API direct compile check with `SKIP_ENV_VALIDATION=true` | PASS after the final API package change; compile evidence only |
| Storybook direct compile check with `SKIP_ENV_VALIDATION=true` | PASS earlier in this continuation; its later change only removed the deployment manifest |
| Live local API smoke | `/health` 200 with `no-store`; `/ready` 503 with eight named, redacted failed checks, `no-store`, and `nosniff` |
| Public Chromium gate | PASS, 18/18 provider-free demo + 2/2 production-unavailable |
| Final marketplace browser rerun | PASS, 6/6 mobile/desktop after image/Toolbar cleanup |
| `git diff --check` | PASS |
| Ports 3000/3001/3002/3100 | No listeners left |

React emits a development-only warning when JSON-LD `<script>` elements are
encountered during client rendering. The escaped implementation matches the
current official Next.js JSON-LD recommendation and the data remains valid SEO
markup; replacing it with a non-script workaround would be a regression.

## Remaining release blockers

### Code

No discovered P0/P1 code blocker remains locally. Residual P2 work includes a
reproducible dependency refresh for the seven moderate/low advisories, possible
nonce-based public CSP architecture, and fuller Bulgarian coverage in the
authenticated workspace and provider emails.

### CI and infrastructure capacity

- Run the unchanged CI workflow on an immutable commit. The local 2 GiB guard
  passed after generated-cache cleanup, but shared-drive headroom remains low.
- Prove remote-cache correctness and artifact cleanup in CI.

### Required core configuration

- Configure three distinct HTTPS origins and one consistent isolated database
  target across the three Vercel projects.
- Configure Clerk for app/API, Blob for app/API, Upstash for web/API, a strong
  Cron secret, and Resend sender/token for the public contact capability.
- Apply/verify migrations and make Preview API `/ready` return 200 without
  `SKIP_ENV_VALIDATION`.

### Optional/deferred integrations

Stripe, GA/PostHog, Sentry/Better Stack, feature flags, Liveblocks, Knock, AI,
and private inventory/scanner/KYB callbacks can remain disabled. Any enabled
group needs complete scoped configuration and provider-specific smoke evidence.

### Staging evidence

- Buyer, seller, dealer, importer, and admin journeys with synthetic Clerk
  accounts and organization isolation.
- Real webhook/cron signature, replay, idempotency and delivery checks.
- Database persistence/degradation, point-in-time restore, RPO/RTO, synthetic
  alert acknowledgement, production performance budgets, domain/canonical/CSP
  response capture, and manual accessibility review.

### Legal review

Bulgarian/EU counsel or an authorized privacy owner must approve consent and
privacy text, controller/processor disclosures, retention/deletion periods,
cookie/provider categorization, lawful bases, cross-border transfers, contact
lead handling, and the final English/Bulgarian policy parity. This audit makes
technical findings only and is not legal advice.

## Files changed by this continuation

This was a pre-existing 419-entry dirty shared tree. The list below comes from
the continuation's operation log and identifies the files this continuation
created, deleted, or edited; it intentionally does not claim ownership of the
other user changes visible in `git status`.

### Root, CI, release, and browser harness

- `.github/workflows/ci.yml`
- `turbo.json`
- `scripts/release-preflight.mjs`
- `scripts/release-preflight.test.mjs`
- `apps/storybook/vercel.json` (deleted)
- `apps/e2e/playwright.public.config.ts`
- `apps/e2e/run-public-gate.mjs`
- `apps/e2e/run-public-web-server.mjs`
- `apps/e2e/specs/public-consent-i18n.spec.ts`

### API

- `apps/api/.env.example`
- `apps/api/env.ts`
- `apps/api/package.json`
- `apps/api/proxy.ts`
- `apps/api/vercel.json`
- `apps/api/app/cron/listing-media-cleanup/route.ts`
- `apps/api/app/ready/readiness.ts`
- `apps/api/app/ready/route.ts`
- `apps/api/app/webhooks/auth/route.ts`
- `apps/api/app/webhooks/payments/route.ts`
- `apps/api/lib/analytics.ts`
- `apps/api/lib/auth-recovery.ts`
- `apps/api/lib/inventory-http.ts`
- `apps/api/lib/inventory-import-workers.ts`
- `apps/api/lib/kyb-workers.ts`
- `apps/api/lib/provider-adapters.ts`
- `apps/api/lib/signed-callback.ts`
- `apps/api/__tests__/env-schema.test.ts`
- `apps/api/__tests__/readiness.test.ts`
- `apps/api/__tests__/service-boundaries.test.ts`

### Authenticated app

- `apps/app/env.ts`
- `apps/app/security-policy.ts`
- `apps/app/app/layout.tsx`
- `apps/app/app/actions/users/get.ts`
- `apps/app/app/actions/users/search.ts`
- `apps/app/app/api/collaboration/auth/route.ts`
- `apps/app/app/api/dealer-profile-media/upload/route.ts`
- `apps/app/app/api/listing-media/upload/route.ts`
- `apps/app/__tests__/collaboration-auth.test.ts`
- `apps/app/__tests__/env-schema.test.ts`
- `apps/app/__tests__/security-policy.test.ts`

### Public web

- `apps/web/env.ts`
- `apps/web/next.config.ts`
- `apps/web/proxy.ts`
- `apps/web/app/[locale]/layout.tsx`
- `apps/web/app/[locale]/blog/page.tsx`
- `apps/web/app/[locale]/blog/[slug]/page.tsx`
- `apps/web/app/[locale]/collections/chinese-ev-hybrids/page.tsx`
- `apps/web/app/[locale]/contact/actions/contact.tsx`
- `apps/web/app/[locale]/legal/[slug]/page.tsx`
- `apps/web/app/[locale]/listing/[slug]/contact/page.tsx`
- `apps/web/app/sitemap.ts`
- `apps/web/app/sitemap.test.ts`
- `apps/web/lib/public-data.ts`

### Shared packages

- `packages/ai/keys.ts`
- `packages/auth/keys.ts`
- `packages/cms/keys.ts`
- `packages/collaboration/keys.ts`
- `packages/database/keys.ts`
- `packages/email/keys.ts`
- `packages/feature-flags/keys.ts`
- `packages/next-config/keys.ts`
- `packages/notifications/keys.ts`
- `packages/payments/keys.ts`
- `packages/rate-limit/keys.ts`
- `packages/security/keys.ts`
- `packages/storage/keys.ts`
- `packages/webhooks/keys.ts`
- `packages/analytics/consent-copy.test.ts`
- `packages/analytics/consent-copy.ts`
- `packages/analytics/consent.test.ts`
- `packages/analytics/consent.ts`
- `packages/analytics/instrumentation-client.test.ts`
- `packages/analytics/instrumentation-client.ts`
- `packages/analytics/provider.module.css`
- `packages/analytics/provider.module.css.d.ts`
- `packages/analytics/provider.tsx`
- `packages/database/auth-sync.test.ts`
- `packages/database/inventory-imports.test.ts`
- `packages/database/inventory-imports.ts`
- `packages/database/inventory-ingestion.ts`
- `packages/database/inventory-sources.ts`
- `packages/database/kyb-documents.ts`
- `packages/database/organization-verification.ts`
- `packages/database/organizations.integration.test.ts`
- `packages/database/organizations.test.ts`
- `packages/design-system/components/ui/sidebar.tsx`
- `packages/email/index.ts`
- `packages/feature-flags/components/toolbar.tsx`
- `packages/feature-flags/lib/toolbar.ts`
- `packages/internationalization/proxy.test.ts`
- `packages/internationalization/proxy.ts`
- `packages/marketplace/inventory-csv.test.ts`
- `packages/marketplace/inventory-csv.ts`
- `packages/marketplace/providers.ts`
- `packages/marketplace-ui/components/desktop-marketplace-controls.tsx`
- `packages/marketplace-ui/components/listing-gallery.tsx`
- `packages/marketplace-ui/components/marketplace-locale-switch-link.tsx`
- `packages/marketplace-ui/components/marketplace-pagination.tsx`
- `packages/marketplace-ui/components/marketplace-shell.tsx`
- `packages/marketplace-ui/components/organization-directory-card.tsx`
- `packages/marketplace-ui/components/vehicle-card.tsx`
- `packages/marketplace-ui/lib/public-path.test.ts`
- `packages/marketplace-ui/lib/public-path.ts`
- `packages/payments/index.ts`
- `packages/rate-limit/idempotency.ts`
- `packages/rate-limit/tsconfig.json`
- `packages/security/proxy.test.ts`
- `packages/security/proxy.ts`
- `packages/seo/metadata.test.ts`
- `packages/seo/metadata.ts`
- `packages/storage/inventory-imports.test.ts`
- `packages/storage/inventory-imports.ts`
- `packages/storage/private-documents.test.ts`
- `packages/storage/private-documents.ts`
- `packages/verification/stub.test.ts`
- `packages/verification/stub.ts`

## Smallest next authorization

Authorize one isolated Preview release rehearsal and provide/confirm the three
Vercel project IDs, isolated database branch, synthetic Clerk personas, scoped
core environment values, and the legal/privacy owner. That is sufficient to
run strict builds, `/ready`, migrations, role E2E, provider smoke checks,
alerts, recovery, and production-like performance without touching production.
