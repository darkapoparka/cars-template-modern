# Authenticated Preview release runbook

This runbook operates only against disposable Preview resources. The suite does
not create Clerk users or organizations, deploy applications, migrate a
database, or change provider configuration. An operator performs those steps,
then the protected job signs in to the five existing identities, materializes
fresh Playwright state under the runner temporary directory, validates it, runs
once, sanitizes text-only failure evidence, and deletes the state in `finally`.

Do not use Production Clerk keys, production URLs, a production Neon endpoint,
real customer identities, or a shared dealer organization. A skipped test,
retry, missing marker, 404 on an allowed route, non-404 on a denied route, 5xx,
browser console error, page error, or readiness failure blocks release.

## 1. Provision the five Clerk Preview identities

Use the Clerk **development/Preview instance** connected to the candidate app.
Create these users manually in the Clerk Dashboard. Use a controlled test email
domain and Clerk's `+clerk_test` subaddress pattern so verification and new-device
emails are suppressed. The release harness never creates or deletes users.

| Persona | Clerk user | Public metadata | Active organization | Expected boundary |
| --- | --- | --- | --- | --- |
| Buyer | `automarket+clerk_test_buyer_<marker>@<test-domain>` | `{}` | Personal account | Account, saved items/searches, messages; no dealer/admin |
| Private seller | `automarket+clerk_test_seller_<marker>@<test-domain>` | `{}` | Personal account | Seller listing creation/edit/media; no dealer/admin |
| Dealer/importer | `automarket+clerk_test_dealer_<marker>@<test-domain>` | `{}` | Disposable dealer organization | Dealer Studio plus importer inventory/sources/runs; no admin |
| Admin | `automarket+clerk_test_admin_<marker>@<test-domain>` | `{"role":"admin"}` | Personal account | Moderation, trust, and profile-claim queues; no dealer org |
| Support/operator | `automarket+clerk_test_operator_<marker>@<test-domain>` | `{"role":"support"}` | Personal account | Unprivileged personal workspace only; dealer and every admin route must return 404 |

The machine-checked release manifest registers exactly eight journeys. Persona
participation is buyer 1, private seller 1, dealer/importer 2, admin 1, and
support/operator 2. Playwright discovery must report those eight release tests
plus the single five-persona setup test; a missing, duplicate, skipped, or
unexpected journey blocks the release.

| Boundary | Allowed surfaces exercised | Fail-closed assertions |
| --- | --- | --- |
| Buyer | `/`, `/account`, `/saved`, `/saved/searches`, `/search`, `/messages` | Foreign-account saved search absent; dealer and admin direct URLs return 404 |
| Private seller | `/sell/listings`, `/sell/new`, created listing edit/media | Dealer-owned and foreign-tenant listing IDs return 404; dealer and admin roots return 404 |
| Dealer/importer | Inventory/listing factory, sources, CSV import shell, runs, leads, analytics, public-profile editor/preview, settings | Foreign inventory and lead markers absent; private-seller and foreign-tenant listing IDs return 404; admin returns 404 |
| Admin | Moderation, trust, profile-claim queues | Dealer Studio returns 404 without an active durable dealer membership |
| Support/operator | `/account`, `/saved`, `/saved/searches`, `/messages` | Buyer-owned saved listing/search and conversation absent; moderation, trust, profile claims, and Dealer Studio return 404 |
| No session | None | Account, dealer, and admin direct URLs redirect to sign-in; logout also redirects to sign-in |

Commerce-gated billing/promotions pages, individual admin case pages without a
seeded case, onboarding claim submission, and provider callback routes are not
part of this authenticated browser gate. Their repository contracts remain in
their focused tests; enabling a capability does not silently add it to this
release manifest.

In Clerk Dashboard, open **Sessions → Customize session token** and retain this
small custom claim, then save it:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

This is required because AutoMarket authorizes only
`sessionClaims.metadata.role === "admin"`. `support` is intentionally not a
privileged product role; the operator persona proves that authenticated staff
labels cannot cross the admin boundary. Clerk documents the claims editor in
[Customize your session token](https://clerk.com/docs/guides/sessions/customize-session-tokens).

Create one disposable Clerk organization named
`AM-E2E <database-marker> dealer-importer`. Add only the dealer/importer user and
assign `org:admin` (recommended) or `org:owner`. Make that organization active
when checking the identity manually. AutoMarket maps `org:admin` to durable
`manager` and `org:owner` to durable `owner`; both can exercise importer source
management. Do not add buyer, seller, admin, or operator to any organization.

Record the five `user_*` IDs, the `org_*` ID, and the Clerk Frontend API issuer,
for example `https://<instance>.clerk.accounts.dev`. Clerk's current Playwright
guidance recommends server-side email sign-in and per-run storage state; see
[Reuse auth state across tests](https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows)
and [Test helpers](https://clerk.com/docs/guides/development/testing/playwright/test-helpers).

After Vercel creates the immutable app candidate, temporarily add exactly that
`E2E_APP_URL` origin to the development/Preview Clerk instance's trusted or
allowed web-origin configuration. Do not add `*.vercel.app`, a branch alias, a
parent domain, or any other wildcard. Record the same exact value as
`E2E_CLERK_TRUSTED_APP_ORIGIN`. The setup must successfully sign in at that
origin, and the state validator requires every session's `azp` claim to equal
it. Remove this one origin during cleanup. Clerk also recommends exact
`authorizedParties` allowlists for request authorization; see
[Configure authorized parties](https://clerk.com/docs/guides/development/deployment/production#configure-authorized-parties-for-secure-request-authorization).

## 2. Configure the protected GitHub environment

Create or update the GitHub Environment `preview-e2e`. Require a human reviewer
and restrict it to the release branch. Add these environment secrets. Never put
any of them in a dispatch input, repository variable, artifact, or
`NEXT_PUBLIC_*` value:

- `E2E_CLERK_PUBLISHABLE_KEY` (`pk_test_*`)
- `E2E_CLERK_SECRET_KEY` (`sk_test_*`)
- `E2E_VERCEL_TOKEN`, a short-lived token with only the team/project access
  needed to read the three deployment records
- `E2E_WEB_VERCEL_AUTOMATION_BYPASS_SECRET`
- `E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET`
- `E2E_API_VERCEL_AUTOMATION_BYPASS_SECRET`

The three bypass secrets are required only for targets dispatched in
`automation-bypass` mode. Each value is generated inside its matching Vercel
project and must be distinct. Vercel exposes the selected value inside that
project as `VERCEL_AUTOMATION_BYPASS_SECRET`; copy that value to the matching
namespaced `E2E_*` GitHub secret for this external runner. A single generic
bypass variable is intentionally not accepted because web, app, and API are
different Vercel projects. The workflow injects a target's value only when that
target uses automation bypass. If every target uses an exact domain exception
instead, leave the three bypass secrets unset.

Add these environment variables. Values are identifiers or disposable test
emails, not credentials:

- `E2E_CLERK_ISSUER`
- `E2E_VERCEL_TEAM_ID`
- `E2E_WEB_VERCEL_PROJECT_ID`
- `E2E_APP_VERCEL_PROJECT_ID`
- `E2E_API_VERCEL_PROJECT_ID`
- `E2E_BUYER_EMAIL`, `E2E_BUYER_USER_ID`
- `E2E_SELLER_EMAIL`, `E2E_SELLER_USER_ID`
- `E2E_DEALER_EMAIL`, `E2E_DEALER_USER_ID`
- `E2E_DEALER_ORG_ID`, `E2E_DEALER_ORG_ROLE` (`org:admin` or `org:owner`)
- `E2E_ADMIN_EMAIL`, `E2E_ADMIN_USER_ID`
- `E2E_OPERATOR_EMAIL`, `E2E_OPERATOR_USER_ID`

Do not store Playwright cookies or storage-state JSON in GitHub. The job creates
fresh state from the protected Clerk keys and existing emails. The validator
checks secure cookie structure, app and Clerk origins, issuer, authorized party,
fresh issue time, `sess_*` session ID, expiry, exact user ID, admin/support
metadata, and exact dealer organization/role claims without logging cookie or
token values. Cookie domains must match the immutable app or Clerk instance
host exactly; parent-domain states are refused.

## 3. Create the disposable Preview database and prepare the seed

Create a new Neon branch and a dedicated endpoint. Record both the branch ID and
the endpoint ID (`ep-*`). Apply the candidate migrations using the normal
release process. Never point this procedure at the production endpoint. Do not
run the fixture provisioner yet: it requires the immutable deployment contract.
Continue through section 4, then return to the environment block and seed
commands below after all three deployments and aliases exist.

In a private PowerShell session, set the following values. Use the exact Vercel
generated deployment URLs and deployment IDs once they exist; placeholders will
be rejected. No value is written to an env example or committed file.

```powershell
$env:E2E_ENVIRONMENT = 'preview'
$env:E2E_CANDIDATE_ID = '<release-candidate-id>'
$env:E2E_COMMIT_SHA = '<exact-40-character-git-sha>'
$env:E2E_WEB_URL = 'https://<immutable-web-deployment>.vercel.app'
$env:E2E_APP_URL = 'https://<immutable-app-deployment>.vercel.app'
$env:E2E_API_URL = 'https://<immutable-api-deployment>.vercel.app'
$env:E2E_WEB_ALIAS_URL = 'https://<stable-web-preview-alias>'
$env:E2E_APP_ALIAS_URL = 'https://<stable-app-preview-alias>'
$env:E2E_API_ALIAS_URL = 'https://<stable-api-preview-alias>'
$env:E2E_WEB_DEPLOYMENT_ID = 'dpl_<web>'
$env:E2E_APP_DEPLOYMENT_ID = 'dpl_<app>'
$env:E2E_API_DEPLOYMENT_ID = 'dpl_<api>'
$env:E2E_VERCEL_TEAM_ID = 'team_<owner>'
$env:E2E_WEB_VERCEL_PROJECT_ID = 'prj_<web>'
$env:E2E_APP_VERCEL_PROJECT_ID = 'prj_<app>'
$env:E2E_API_VERCEL_PROJECT_ID = 'prj_<api>'
$env:E2E_VERCEL_TOKEN = '<short-lived-deployment-read-token>'
$env:E2E_WEB_VERCEL_PROTECTION_MODE = 'automation-bypass'
$env:E2E_APP_VERCEL_PROTECTION_MODE = 'automation-bypass'
$env:E2E_API_VERCEL_PROTECTION_MODE = 'automation-bypass'
$env:E2E_WEB_VERCEL_AUTOMATION_BYPASS_SECRET = '<web-project-secret>'
$env:E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET = '<app-project-secret>'
$env:E2E_API_VERCEL_AUTOMATION_BYPASS_SECRET = '<api-project-secret>'
$env:E2E_DATABASE_BRANCH_ID = '<disposable-branch-id>'
$env:E2E_DATABASE_ENDPOINT_ID = 'ep-<disposable-endpoint-id>'
$env:E2E_DATABASE_MARKER = '<unique-marker-up-to-48-characters>'
$env:E2E_FIXTURE_VERSION = 'authenticated-preview-v2'
$env:E2E_CLERK_ISSUER = 'https://<preview-instance>.clerk.accounts.dev'
$env:E2E_CLERK_TRUSTED_APP_ORIGIN = $env:E2E_APP_URL
$env:CLERK_PUBLISHABLE_KEY = 'pk_test_<preview>'
$env:CLERK_SECRET_KEY = 'sk_test_<preview>'
$env:E2E_BUYER_EMAIL = '<buyer-test-email>'
$env:E2E_BUYER_USER_ID = 'user_<buyer>'
$env:E2E_SELLER_EMAIL = '<seller-test-email>'
$env:E2E_SELLER_USER_ID = 'user_<seller>'
$env:E2E_DEALER_EMAIL = '<dealer-test-email>'
$env:E2E_DEALER_USER_ID = 'user_<dealer>'
$env:E2E_DEALER_ORG_ID = 'org_<dealer>'
$env:E2E_DEALER_ORG_ROLE = 'org:admin'
$env:E2E_ADMIN_EMAIL = '<admin-test-email>'
$env:E2E_ADMIN_USER_ID = 'user_<admin>'
$env:E2E_OPERATOR_EMAIL = '<operator-test-email>'
$env:E2E_OPERATOR_USER_ID = 'user_<operator>'
$env:DATABASE_URL = 'postgresql://<disposable-preview-endpoint>'
```

Automation bypass is recommended. In each Vercel project, create one disposable
**Protection Bypass for Automation** secret and copy its generated value only to
the matching environment secret above. The harness sends it only to that exact
origin using `x-vercel-protection-bypass`. For an app browser context it also
requests `x-vercel-set-bypass-cookie: true` with redirects disabled, then proves
the cookie works without resending the secret. It never installs a global
Playwright header. See Vercel's
[Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation).

An exact Vercel Deployment Protection Exception is the alternative for any
target. It makes that candidate origin publicly reachable while present and is
available only on eligible Vercel plans. For example, to use it for the app:

```powershell
$env:E2E_APP_VERCEL_PROTECTION_MODE = 'domain-exception'
$env:E2E_APP_VERCEL_PROTECTION_EXCEPTION_ORIGIN = $env:E2E_APP_URL
Remove-Item Env:E2E_APP_VERCEL_AUTOMATION_BYPASS_SECRET -ErrorAction SilentlyContinue
```

The exception value must exactly equal that target's immutable URL; wildcards,
stable aliases, and simultaneous bypass credentials are refused. Mixed modes
are allowed. Remove each exception immediately after the post-run integrity
check. See [Deployment Protection Exceptions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection#deployment-protection-exceptions).

The database URL hostname must begin with the declared endpoint ID. First
validate the fixture contract without writing data, then acknowledge the
disposable target and provision it:

```powershell
$env:AUTOMARKET_E2E_DATABASE_MUTATION = 'I_ACKNOWLEDGE_DISPOSABLE_PREVIEW_DATABASE'
node scripts/provision-authenticated-preview-fixtures.mjs --dry-run
node scripts/provision-authenticated-preview-fixtures.mjs
```

The dry run validates every fixture `INSERT` table and column against the
checked-out Prisma schema before it returns a digest. The idempotent fixture
creates or repairs active durable accounts for all five Clerk IDs, a private
seller profile and baseline listing, the importer organization, durable member
and claimed directory profile, dealer inventory, buyer saved state, one
buyer/dealer conversation, one dealer lead, and one open moderation report. It
also creates a database-only foreign dealer, listing, lead, and operator-owned
saved search to prove account and tenant isolation. That foreign dealer has no
Clerk organization or member and must never be provisioned in Clerk. Every
launch-critical view contains `AM-E2E <database-marker> ...`; the browser suite
fails if the deployments point at another database or fixture version.

## 4. Deploy the immutable candidate

Before deploying, configure the same Preview-scoped public URL triplet in all
three Vercel projects:

- `NEXT_PUBLIC_WEB_URL=<E2E_WEB_ALIAS_URL>`
- `NEXT_PUBLIC_APP_URL=<E2E_APP_ALIAS_URL>`
- `NEXT_PUBLIC_API_URL=<E2E_API_ALIAS_URL>`

These are stable Preview aliases, not generated deployment URLs and not
Production domains. Review all three project settings for exact equality. An
environment-variable change applies only to a new deployment, so deploy only
after this triplet and the disposable database/provider values are correct.

Deploy the same exact commit to the `apps/web`, `apps/app`, and `apps/api` Vercel
projects using the existing Git integration. Record each generated
`*.vercel.app` deployment URL and `dpl_*` ID. Do not use a mutable branch alias
or a custom production domain as `E2E_*_URL`. Assign each recorded stable
Preview alias to its matching new deployment. Confirm all three deployments
report the same commit SHA and that the app and API use the disposable database
endpoint. Then add only the exact immutable app URL to Clerk as described in
section 1.

The protected job checks out `commit_sha`, compares `git rev-parse HEAD`, rejects
non-Vercel/non-HTTPS origins, requires three distinct origins and deployment
IDs, and requires API `/ready` to return `ready`. Immediately before and after
Playwright, it performs read-only Vercel API lookups for each target by `dpl_*`
ID, immutable hostname, and stable alias hostname. All three references must
resolve to the same expected project/deployment, exact team, `READY` non-
Production candidate, assigned alias, and `meta.githubCommitSha`. Alias movement
or candidate drift fails the job even when browser tests passed. The Vercel API
token is removed from the Playwright child environment and raw provider
responses are never logged.

Candidate readiness also checks the web/app aliases that are observable in
rendered metadata, links, and CSP. The API does not publicly expose its complete
build-time URL triplet, so preserve the reviewed three-project Preview
environment configuration as operator evidence. Deployment-to-database mapping
also remains operator evidence because the endpoint identity is intentionally
not exposed in public responses.

Now return to section 3, fill the complete private environment block, run the
fixture dry run and provision command exactly once, and then continue to section
5. This ordering ensures the fixture contract is bound to the recorded
deployment IDs, aliases, commit, database endpoint, and access modes.

## 5. Execute locally without retaining session files

With all variables above set and the candidate deployed:

```powershell
pnpm --filter e2e e2e:release
```

The wrapper creates a directory under the operating-system temporary folder,
verifies the Vercel candidate/alias set,
uses Clerk's testing helper to sign in each existing user, activates only the
dealer organization, validates and writes five `0600` state files (`0700`
directory where POSIX permissions exist), runs independent tests through one
Chromium worker with zero retries, re-verifies the candidate/alias set even after
a test-process failure, and recursively removes the directory in `finally`. A
failed journey does not put later journeys into Playwright serial skip mode.
Windows uses the current user's inherited temp-directory ACL because POSIX
modes are not available. Each app context establishes only the app project's
protection access; web/API readiness uses each target's matching mode. Clearing
the Clerk session re-establishes the Vercel access cookie before proving the
unauthenticated denial. Cookie/token values are never printed.

Do not call `e2e:release:direct`; it refuses execution unless the protected
wrapper supplies its sentinel and ephemeral paths.

## 6. Execute the protected GitHub job

Dispatch `CI` with all required inputs. Example:

```powershell
gh workflow run CI --ref main `
  -f app_url="$env:E2E_APP_URL" `
  -f app_alias_url="$env:E2E_APP_ALIAS_URL" `
  -f app_deployment_id="$env:E2E_APP_DEPLOYMENT_ID" `
  -f app_protection_mode="$env:E2E_APP_VERCEL_PROTECTION_MODE" `
  -f api_url="$env:E2E_API_URL" `
  -f api_alias_url="$env:E2E_API_ALIAS_URL" `
  -f api_deployment_id="$env:E2E_API_DEPLOYMENT_ID" `
  -f api_protection_mode="$env:E2E_API_VERCEL_PROTECTION_MODE" `
  -f candidate_id="$env:E2E_CANDIDATE_ID" `
  -f commit_sha="$env:E2E_COMMIT_SHA" `
  -f clerk_trusted_app_origin="$env:E2E_CLERK_TRUSTED_APP_ORIGIN" `
  -f database_branch_id="$env:E2E_DATABASE_BRANCH_ID" `
  -f database_endpoint_id="$env:E2E_DATABASE_ENDPOINT_ID" `
  -f database_marker="$env:E2E_DATABASE_MARKER" `
  -f fixture_version="$env:E2E_FIXTURE_VERSION" `
  -f web_url="$env:E2E_WEB_URL" `
  -f web_alias_url="$env:E2E_WEB_ALIAS_URL" `
  -f web_protection_mode="$env:E2E_WEB_VERCEL_PROTECTION_MODE" `
  -f web_deployment_id="$env:E2E_WEB_DEPLOYMENT_ID"
```

For each `domain-exception` target, also pass its optional
`web_protection_exception_origin`, `app_protection_exception_origin`, or
`api_protection_exception_origin` input with the matching immutable URL. Do not
pass an exception-origin input for an automation-bypass target.

Approve the `preview-e2e` environment only after reviewing the candidate,
deployment, database, fixture, and identity values. The protected suite covers:

- pre/post stable-alias, immutable-deployment, project, team, and exact-commit
  integrity plus candidate web/app/API reachability and API readiness;
- buyer account, saved listing, saved-search create/delete, and messaging;
- private-seller baseline access, draft creation, and real Preview media upload;
- dealer/importer inventory, sources, import runs, leads, and analytics;
- dealer/importer listing factory, CSV import shell, profile editor/preview, and
  settings;
- account ownership, direct listing-ID ownership, and cross-dealer tenant
  isolation using visible foreign markers;
- admin moderation/trust/profile-claim allowance;
- dealer/admin denial for the wrong personas;
- support/operator denial from all privileged routes;
- Clerk logout and cleared-cookie session-expiry denial on account, dealer, and
  admin direct URLs.

## 7. Failure evidence and retention

Protected screenshots, traces, and videos are disabled for every project.
HTML reporting is also disabled so no image or binary attachment can be embedded
in a report. The only file reporter is JUnit XML.

Before upload, the sanitizer allowlists only JSON, log, plain-text, and XML
files. It deletes PNG, JPEG, WebP, ZIP, WebM, HTML, every unknown extension,
oversized text, and text containing an embedded base64/data-URI payload. It
then redacts JWTs, cookie/authorization lines, email addresses, Clerk IDs, and
known Clerk keys, Vercel read token, and all three bypass-secret values. CI
uploads this text-only evidence only when the tests failed and sanitization
succeeded; otherwise nothing is uploaded. Failed evidence is retained for three
days. Console diagnostics report counts and method/path/status only, never
headers, query strings, bodies, cookies, tokens, or raw page errors.

## 8. Cleanup, in this order

1. Confirm the workflow emitted both the before-browser and after-browser
   candidate-integrity success lines. Record the three stable-alias to
   deployment mappings before changing any provider access.
2. In each Vercel project, revoke/delete the disposable automation-bypass secret
   or remove the one exact Deployment Protection Exception used for this run.
   If a generated `VERCEL_AUTOMATION_BYPASS_SECRET` is changed for later use,
   redeploy before expecting the new value inside a deployment. Revoke the
   short-lived Vercel read token and remove it plus the bypass values from the
   GitHub Environment.
3. In the disposable database, locate the seller-created listing whose title is
   `AM-E2E <marker> seller created <first-10-sha>` and record its
   `MarketplaceListingImage.storageKey` values.
4. In the Preview app project's Vercel Blob store, delete only those exact keys.
   They begin with `listings/<listing-id>/am-e2e-<marker>-<first-10-sha>`.
   Confirm no non-marker key is selected.
5. Delete the disposable Neon branch. This removes seeded rows, messages,
   moderation data, and E2E-created listing/search/message mutations together.
6. In Clerk Preview, terminate the five disposable sessions, remove the exact
   immutable app origin added for this candidate, and confirm no wildcard was
   left behind. Delete the five disposable users and organization only after
   confirming no other membership exists. The suite never performs this
   provider mutation.
7. Remove the `preview-e2e` identity and Vercel identifier variables if they
   will not be reused, and rotate/remove the two Clerk secrets according to the
   team's Preview-key policy.
8. Delete failure artifacts immediately after diagnosis; otherwise GitHub
   expires them after three days.
9. Clear the private PowerShell environment variables and close the shell.

## 9. Evidence sign-off

Record a single release evidence entry containing:

- candidate ID and exact commit SHA;
- all three immutable deployment URLs, stable Preview aliases, `dpl_*` IDs,
  `prj_*` IDs, and team ID;
- before/after Vercel proof that every ID, immutable hostname, and alias resolved
  to the same expected deployment set and exact commit;
- each target's protection mode and confirmation that its bypass secret or
  exact exception was removed, without recording secret values;
- Neon branch ID, endpoint ID, migration version, database marker, and fixture
  version;
- five Clerk user IDs, dealer organization ID/role, and confirmation that the
  instance keys are `*_test_*` (never record key values);
- exact Clerk candidate origin addition/removal and confirmation that no
  wildcard was used;
- protected workflow run URL, run ID, attempt, UTC start/end, and final status;
- `8 passed` authenticated journey count plus the single setup project result;
- API readiness result and absence of skips/retries/5xx/console/page errors;
- failure artifact ID if present and its deletion/expiry time;
- Blob keys removed, Neon branch deletion, Clerk cleanup, and operator initials.

Authenticated release success may be claimed only after this protected run
passes against the recorded immutable Preview candidate. Local unit/type/list
checks prove the harness contract only; they do not prove real authenticated
success.
