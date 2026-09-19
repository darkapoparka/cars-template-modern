# Actual stack and official documentation

Reviewed 19 September 2026 against the audited checkout. This is a **version-aware reference**, not permission to upgrade. The lockfile and installed package are authoritative for implementation; a manifest range is not an installed version. Current documentation can describe APIs newer than this repository.

## Runtime and core stack

| Area | Observed version / declaration | Refactor direction |
| --- | --- | --- |
| Runtime | Node 22.22.0 used; engine `>=22.22.0 <23` | Keep the repository runtime; do not use the machine's default Node 24 by accident |
| Package manager | pnpm 11.4.0 pinned and executed | Frozen lockfile; explicit workspace dependencies |
| Next.js | 16.3.3 installed and pinned | App Router; server-first composition; small interactive boundaries |
| React / React DOM | 19.2.4 declared consistently | Keep; remove redundant state only when behavior is understood |
| TypeScript | 5.9.3 installed | `strict` already enabled; improve boundary types, not a cosmetic strict-mode migration |
| Tailwind CSS | 4.3.0 installed; manifests `^4.2.1` | CSS-first theme, semantic variables, intentional source scanning |
| Turborepo | 2.9.16 installed; manifest `^2.8.14` | Preserve dependency graph and isolated task outputs |
| Biome / Ultracite | 2.4.6 / 7.2.5 declared | Keep existing checks; avoid broad auto-format or ignore-rule churn |
| Design system | shadcn-style owned source; Radix 1.6.7 installed | Keep owned primitives; replace manifest `radix-ui: latest` deliberately, not by reinstalling blindly |
| Validation | Zod `^4.3.6`; T3 env `^0.13.10` | Typed public configuration; server-only provider readiness; validate external input |
| Database | Prisma/client/Neon adapter 7.4.2 declared | Existing models and committed migrations; no schema rewrite for a styling task |
| Testing | Vitest `^4.0.18` / `^4.1.8`; Playwright 1.61.1; axe 4.12.1 | Behavior tests plus reviewed screenshots; separate provider-free and authenticated gates |
| Component workshop | Storybook `^10.2.16`; Chromatic `^15.2.0` | Add real product stories and theme/state matrices; do not assume an external visual run exists |

Installed-version confirmations were made for Node, pnpm, Next, Tailwind, Turbo, TypeScript and Radix. Other numbers above and below are **manifest declarations**, unless separately verified in a future task. `next-forge` is source lineage and an architecture reference, not a runtime dependency with a version that can be upgraded in isolation.

## Context7 and source hierarchy

Actual Context7 queries used `/vercel/next.js`, `/tailwindlabs/tailwindcss.com` and `/vercel/next-forge`. They supported server/client composition, CSS-first shared themes and the deployable-app/shared-package distinction. Context7 returned some canary Next material, an old Tailwind preview snippet, and unrelated provider migrations. Those are not adopted as repository requirements.

Use this order when implementing: installed package and bundled/versioned docs; current official guide with compatibility checked; official upstream source; Context7 retrieval with source/version inspected. For this checkout, bundled Next docs are under `apps/web/node_modules/next/dist/docs/`. Read the guide for the API being changed. Never assume a public “latest” guide is exactly 16.3.3.

The next-forge website could not be fully retrieved in this audit. Its official upstream README, Context7-indexed upstream documentation and the available next-forge skill supplied architecture guidance. The Turborepo structure page also had a retrieval-format limitation. This is not a claim to have read every page of either documentation site.

## Primary official sources and applied decisions

| Official source | Applied decision |
| --- | --- |
| [Next server/client components](https://nextjs.org/docs/app/getting-started/server-and-client-components) | A client module imports its transitive client graph; server-rendered children can pass through client slots. Move composition, not just directives. |
| [Next data security](https://nextjs.org/docs/app/guides/data-security) and [authentication](https://nextjs.org/docs/app/guides/authentication) | Server-only data access, minimal public DTOs, authenticated/authorized mutations, untrusted client arguments. |
| [Next Image](https://nextjs.org/docs/app/api-reference/components/image) | Correct responsive sizes and loading intent; distinguish source-file size from transferred optimized bytes. |
| [Tailwind theme](https://tailwindcss.com/docs/theme) | Extend the existing `@theme inline` aliases; share tokens in CSS; do not introduce a v3 JavaScript theme configuration. |
| [Tailwind source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files) | Explicit package sources where needed; complete static class names instead of dynamically constructed utility fragments. |
| [shadcn theming](https://ui.shadcn.com/docs/theming) | Semantic background/foreground pairs and owned component source; no `add --all --overwrite`. |
| [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility) | Retain focus, keyboard, state and ARIA behavior when changing visual wrappers. |
| [next-forge upstream](https://github.com/vercel/next-forge/blob/main/README.md) | `web` is public, `app` is authenticated, `api` owns external endpoints, packages are shared. Upstream defaults do not override this repository's engine or scripts. |
| [React effects](https://react.dev/learn/you-might-not-need-an-effect) | Derive values during rendering when appropriate; retain real synchronization and unfinished-form drafts. |
| [TypeScript strict](https://www.typescriptlang.org/tsconfig/strict.html) | Strict mode is already present. Investigate unsafe boundary casts and overly broad domain objects instead. |
| [Zod basics](https://zod.dev/basics) and [T3 env Next.js](https://env.t3.gg/docs/nextjs) | Parse external/configuration data; public shape is deliberately smaller than server configuration. |
| [Prisma v7 development/production](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production) | Review committed migrations in disposable environments, then use the existing production migration workflow; never substitute `db push`. |
| [Clerk organization roles](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions) | Combine authenticated identity with durable, tenant-scoped permissions; verify provider-plan assumptions before relying on features. |
| [Playwright screenshots](https://playwright.dev/docs/test-snapshots) | Pin browser/OS/fonts/fixtures; review baseline changes, do not automatically accept them. |
| [Storybook stories](https://storybook.js.org/docs/writing-stories), [Vitest](https://vitest.dev/guide/), [Biome configuration](https://biomejs.dev/guides/configure-biome/) | Reuse the existing tools. Current guides may describe newer majors/minors; check installed APIs. |
| [WCAG 2.2 target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Do not equate every control's visible height with a universal 44px rule. Check minimum targets, spacing exceptions and actual usability. |
| [pnpm settings](https://pnpm.io/settings) | Keep lockfile, reviewed overrides and reproducible workspace policy. |

## Integration inventory and depth of review

The audit inventoried every workspace manifest, but it did **not** perform a live security/operational certification of every provider. The following contracts remain conditional on configured products. Do not install a replacement simply because a provider is optional.

| Packages / declared dependency family | Official reference | Required contract / review depth |
| --- | --- | --- |
| `auth`: Clerk Next `^7.0.1`, themes `^2.4.57` | Clerk roles guide above | Local authorization helpers reviewed; live auth/session/revocation not exercised |
| `database`: Neon serverless `^1.0.2`, Prisma 7.4.2 | [Neon driver](https://neon.com/docs/serverless/serverless-driver), Prisma v7 above | Schema and high-risk modules sampled; no live DB or migrations. Neon page retrieval limited |
| `storage`: Vercel Blob `^2.3.1` | [Blob SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk) | Authorization, MIME/size, owner-bound paths, private/public separation. Newer docs do not authorize a SDK upgrade |
| `email`: Resend `^6.9.3`, React Email components 1.0.8 | [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [React Email](https://react.email/docs/introduction) | Existing receipt/failure contracts retained; no delivery attempted |
| `payments`: Stripe `^20.4.1`; API Svix `^1.86.0` | [Stripe webhooks](https://docs.stripe.com/webhooks), [Svix docs](https://docs.svix.com/) | Signature, event identity, replay and retry tests. Stripe guide reviewed; Svix reference for implementation follow-up |
| `security`: Arcjet and Nosecone Next 1.2.0 | [Arcjet](https://docs.arcjet.com/get-started/), [Nosecone](https://docs.arcjet.com/nosecone/quick-start/) | Keep abuse and headers controls; production readiness separate from demo styling |
| `rate-limit`: Upstash Redis `^1.36.3`, rate limit `^2.0.8` | [Rate limit overview](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview) | Preserve fail-closed production behavior; no public secret configuration |
| `analytics`: PostHog JS `^1.359.1`, node `^5.28.0`; Vercel Analytics `^1.6.1` | [PostHog Next](https://posthog.com/docs/libraries/next-js), [Vercel Analytics](https://vercel.com/docs/analytics/package) | Consent and event schemas; public/demo requests remain provider-free where intended |
| `observability`: Sentry `^10.42.0`, Logtail Next `^0.3.1` | [Sentry Next](https://docs.sentry.io/platforms/javascript/guides/nextjs/), [Better Stack](https://betterstack.com/docs/logs/javascript/) | Redacted logs and production-only wiring. Full provider guide retrieval not completed |
| `collaboration`: Liveblocks `^3.15.0` | [Authentication](https://liveblocks.io/docs/api-reference/authentication) | Server authorization and tenant-scoped rooms; optional product capability |
| `internationalization`: next-international `^1.3.1`, locale matcher `^0.8.1`, negotiator `^1.0.0` | [App setup](https://next-international.vercel.app/docs/app-setup) | Keep BG/EN routes, localized copy and formatting; no i18n migration required |
| `ai`: AI SDK `^6.0.116`, OpenAI adapter `^3.0.41` | [AI SDK docs](https://ai-sdk.dev/docs/introduction) | Manifest/usage inventory only; official page retrieval failed. Keep optional/off by default; provider-specific review before changes |
| `cms`: Basehub `^9.5.3` | [Basehub docs](https://docs.basehub.com/) | Manifest/usage inventory; preserve generated declarations and codegen requirements |
| `notifications`: Knock node `^1.29.1`, React `^0.11.7` | [Knock docs](https://docs.knock.app/) | Manifest/usage inventory; verify tenant recipient and delivery behavior before enabling |
| `feature-flags`: flags `^4.0.3`, toolbar `^0.2.2` | [Flags SDK](https://flags-sdk.dev/) | Manifest/usage inventory; flags never substitute for authorization |
| Design interactions: Vaul `^1.1.2`, next-themes `^0.4.6`, cmdk, Embla, Sonner, CVA, tailwind-merge | [Vaul](https://vaul.emilkowal.ski/), [next-themes](https://github.com/pacocoursey/next-themes), shared design sources above | Preserve existing behavior; consult versioned APIs when a task touches a primitive |
| Forms/charts: React Hook Form `^7.71.2`, resolvers `^5.2.2`, Recharts `^3.8.0` | [React Hook Form](https://react-hook-form.com/docs), [Recharts](https://recharts.org/) | Inventory only; no replacement or broad rewrite established |

References marked inventory/follow-up are not represented as fully reviewed guides. Additional direct dependencies such as icons, date helpers, schema metadata and syntax utilities belong in the usage audit, not individual architecture projects. The full machine-generated manifest inventory is recorded at the evidence location in [BASELINE](evidence/BASELINE.md).

## Upgrade policy

Do not upgrade the entire stack as phase zero. Review `radix-ui: latest`, Node-25 type declarations against the Node-22 runtime, the older `@next/third-parties` declaration and the existing security overrides in one focused dependency task. Each proposed change needs resolved versions, release notes, peer compatibility, tests and rollback. A version difference alone is not proof of a vulnerability. The production dependency audit is a point-in-time advisory check, not a security guarantee.
