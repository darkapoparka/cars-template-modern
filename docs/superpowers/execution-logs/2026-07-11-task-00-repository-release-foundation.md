# Task 00 — Repository release foundation execution log

**Date:** 2026-07-11  
**Scope:** Repository/toolchain/package manifests/CI/environment and deployment documentation only

## Delivered

- Converted the root from a publishable next-forge CLI manifest to private AutoMarket application metadata.
- Removed npm publishing, Auto release configuration, CLI source, and `tsup` packaging.
- Pinned Node `22.22.0` and pnpm `10.31.0`; Node `22.20.0` was rejected by the locked `posthog-node` engine requirement.
- Added root `unit`, `typecheck`, affected-CI, and aggregate verification commands.
- Switched Turbo to strict environment mode with environment-aware cache inputs and independent unit/typecheck/build tasks.
- Declared missing `@repo/email` for `apps/api` and `@repo/auth` for `apps/web`. The accepted buyer-search slice's existing `apps/app` → `@repo/email` declaration was preserved.
- Made empty marketplace test suites explicit with `--passWithNoTests` until product tests are added.
- Removed invalid typecheck scripts from source-less/mis-scoped workspaces (`apps/email`, `apps/studio`, `packages/typescript-config`, `packages/rate-limit`).
- Kept optional BaseHub generation and the React Email preview build as explicit developer commands instead of secret/dependency-coupled release tasks.
- Added frozen-lockfile, full-history, affected GitHub CI plus local/environment/deployment documentation.
- Preserved the pre-existing `pnpm-workspace.yaml` `allowBuilds` block and all product UI, SEO, audit, plan, and buyer-search changes.

## Verification

Passed on Node `22.22.0` and pnpm `10.31.0`:

- `pnpm install --frozen-lockfile`
- `pnpm boundaries` — 404 files checked, no boundary issues
- `pnpm unit` — API 1 test, app 2 tests, marketplace no-test package exits successfully
- `SKIP_ENV_VALIDATION=true pnpm build` — `web`, `app`, `api`, database generation, and Storybook passed
- `pnpm exec turbo run test typecheck build --affected --dry-run=json` — affected graph resolved with strict env mode
- `git diff --check`
- JSON parsing for owned manifests/configuration
- No unfinished markers in Task 00 documentation

## Out-of-scope blockers exposed by the new gates

`pnpm check` fails with 25 existing product-code diagnostics across:

- `apps/api/app/feed/dealer/[...slug]/route.ts` (1)
- `apps/app/app/(authenticated)/search/page.tsx` (3)
- `apps/web/app/[locale]/listing/[slug]/page.tsx` (2)
- `packages/ai/{index.ts,listing-copy.ts}` (3)
- `packages/database/dealer-studio.ts` (3)
- `packages/marketplace-ui/components/{desktop-marketplace-controls,marketplace-shell,vehicle-card}.tsx` (6)
- `packages/marketplace/providers.ts` (3)
- `packages/storage/{index.ts,photo-processing.ts}` (4)

`pnpm typecheck` fails in four implementation areas:

- `packages/notifications/index.ts:6` — Knock constructor expects `ClientOptions`.
- `packages/payments/ai.ts:10` — Stripe toolkit `Configuration` no longer accepts `actions`.
- `packages/design-system/components/ui/{chart,resizable}.tsx` — Recharts and react-resizable-panels API/type drift.
- `apps/storybook/stories/drawer.stories.tsx:57` plus the inherited design-system errors.

These files are outside Task 00 ownership and were not edited. CI is intentionally enforceable and will remain red until their owners repair them.

## Non-blocking build warnings

- Better Stack reports its expected no-credentials fallback during secret-free validation builds.
- Storybook warns about the same resizable-panel API drift captured by typecheck.
- Turbo reports Windows link-name length warnings while caching `.next` outputs.

## Handoff decision

Task 01 should not start under the master-plan release gate until the check and typecheck handoffs above are resolved and both commands pass.
