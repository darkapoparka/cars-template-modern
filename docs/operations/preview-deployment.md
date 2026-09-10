# Approval-gated preview deployment

No preview or production deployment was performed while authoring this
procedure. The three apps are separate Vercel projects rooted at `apps/web`,
`apps/app`, and `apps/api`.

## Required approval and inputs

- Explicit approval naming the Vercel team and target preview environment.
- Linked project IDs for all three apps.
- Preview-scoped environment variables; previews must not use production
  database, webhook, storage, email, or payment credentials.
- An isolated database branch and deterministic fixture set.

Core capability groups required by the current contract are:

- shared: three distinct HTTPS app origins and one consistent isolated
  `DATABASE_URL` target;
- public web: Resend sender/token and Upstash REST URL/token;
- authenticated app: Clerk secret/publishable keys and Blob write token;
- API: Clerk secret/webhook secret, strong Cron secret, Blob write token, and
  Upstash REST URL/token.

Analytics, enhanced observability, payments, collaboration, notifications,
AI, and private inventory/scanner/KYB adapters may remain completely disabled.
Do not partially configure an optional capability group.

## Controlled procedure

1. Verify the candidate locally using the release gate.
2. Pin the Vercel CLI version in CI.
3. Pull preview configuration for each project without printing values.
4. Build each project once and deploy that exact prebuilt artifact.
5. Run E2E against the immutable preview URLs.
6. Verify logs, readiness, consent, robots/canonical behavior, and alerts.
7. Record deployment IDs and evidence, then remove preview-only test data.

Promotion is a separate approval gate. Prefer promoting the verified preview
artifact rather than rebuilding it. Rollback must point to a previously
verified deployment and be followed by the smoke and readiness suite.

Reference: [Vercel deployments](https://vercel.com/docs/deployments) and
[environment variables](https://vercel.com/docs/environment-variables).

## Secret-safe preflight and release E2E

Pull each approved Preview project's variables into that app's ignored
`.env.local`; never pull at repository root. Before any build or provider call:

```powershell
pnpm release:preflight
```

The command prints only checks and variable names. A pass proves local contract
shape, not provider connectivity or delivery.

Set the immutable Preview origins and evidence identity in the operator shell.
The protected release runner also requires the exact deployment/project
metadata, Clerk Preview keys, and five persona email/user-ID pairs documented
in `AUTHENTICATED-PREVIEW-RELEASE-RUNBOOK.md`. It signs those existing
identities in and writes fresh storage state under a temporary directory; do
not create or persist `E2E_*_STORAGE_STATE` values yourself.

```powershell
$env:E2E_WEB_URL = "https://<immutable-web-preview>"
$env:E2E_APP_URL = "https://<immutable-app-preview>"
$env:E2E_API_URL = "https://<immutable-api-preview>"
$env:E2E_CANDIDATE_ID = "<commit-or-deployment-set-id>"
$env:E2E_DATABASE_BRANCH_ID = "<isolated-preview-branch-id>"
$env:E2E_FIXTURE_VERSION = "<fixture-version>"
pnpm --filter e2e e2e:release
```

The release configuration refuses localhost or non-HTTPS origins, missing
evidence identity, incomplete persona contracts, stale or invalid sessions, and
shared origins. It disables local server startup and makes `/ready = 200`,
persona traversal, cross-role denial, and the production performance budget
mandatory rather than skipped.
