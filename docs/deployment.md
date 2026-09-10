# AutoMarket deployment configuration

AutoMarket uses three independent Vercel projects. Git integration may create deployments, but this repository's CI workflow only validates code and never deploys, promotes, or mutates Vercel configuration.

| Vercel project | Root directory | Product responsibility | Local port |
| --- | --- | --- | --- |
| Public marketplace | `apps/web` | Browsing, listing pages, public dealer pages, guides, and SEO | `3001` |
| Authenticated workspace | `apps/app` | Buyer account, seller flows, Dealer Studio, billing, and admin | `3000` or `3100` |
| Service application | `apps/api` | Webhooks, cron jobs, callbacks, imports, and feeds | `3002` |

## Project settings

For each Vercel project:

1. Set the Root Directory to the matching `apps/*` directory.
2. Keep pnpm lockfile detection enabled; the repository pins pnpm `11.4.0` and Node `22.22.0`.
3. Configure Development, Preview, and Production variables separately as described in `docs/environment.md`.
4. Use canonical cross-app URLs for the target environment.
5. Allow Vercel's Turborepo integration to skip unaffected projects where supported.

Do not share a production database credential with Preview. Team-level variables are appropriate only when the same value and access level are genuinely valid for all three projects.

## CI and previews

`.github/workflows/ci.yml` uses full Git history, a frozen lockfile, global formatting and boundary checks, and affected Turbo tasks for unit tests, typechecking, and builds. Optional `TURBO_TOKEN` and `TURBO_TEAM` settings enable remote caching; CI remains functional without them.

The React Email application is local preview tooling, not a deployable production project. Its dependency-heavy preview bundle is built explicitly with `pnpm --filter email preview:build`; the release gate validates the shared email package through typechecking instead of coupling production builds to the preview server.

Preview deployments should be created through the Vercel Git integration after CI succeeds. Production promotion, rollback, domain changes, and environment mutation remain explicit operator actions outside this workflow.

## Release gate

A release candidate must pass on Node `22.22.0` and pnpm `11.4.0`:

```powershell
pnpm install --frozen-lockfile
pnpm release:preflight:contracts
pnpm release:preflight:test
pnpm check
pnpm boundaries
pnpm unit
pnpm typecheck
pnpm audit --prod --audit-level=high
$env:SKIP_ENV_VALIDATION = "true"
pnpm build
```

For a real Preview or Production build, do not bypass validation; configure every required variable with an environment-appropriate value.

Before preview browser verification, run `pnpm release:preflight` against the
three project-specific environment files. The release Playwright configuration
then requires three immutable remote HTTPS origins, a candidate identifier, an
isolated database branch/endpoint identity, a fixture version, exact deployment
metadata, protected Clerk test keys, and the five documented persona
email/user-ID pairs. Its setup project signs those existing identities in and
creates fresh temporary Playwright storage states for the run. It starts no
local servers and forces readiness, authenticated, authorization, and
performance suites on.
