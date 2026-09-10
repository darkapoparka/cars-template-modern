# AutoMarket database production cutover

This runbook covers these two ordered Prisma migrations:

`20260718110000_revoke_inactive_dealer_conversations`

`20260722133000_drop_inventory_import_attempt_lease_default`

Frozen ordered manifest for this release:

```text
20260718110000_revoke_inactive_dealer_conversations a06c9243940819cbc40743940fa5b531e7bc5c40bfb63dd8536180b6e7732b5e
20260722133000_drop_inventory_import_attempt_lease_default 3bda5cc15a35f82a4d0b4d3d3d6c18547a541724964a5f57713b32bbd20e028d
```

It is an operator procedure. Repository validation performed on 2026-07-22 used
read-only Neon status checks and isolated local PostgreSQL only. No Neon branch,
schema, migration, or production row was mutated while preparing this runbook.

## Reviewed migration behavior

The migration closes `ConversationParticipant` rows whose dealer membership is
not active, has a disable/deletion timestamp, or belongs to a deleted
organization. It never opens participation, changes messages, changes a
conversation's tenant, or changes public marketplace schema. It does not read or
write `Lead` or `AuditLog`, and the local upgrade contract proves an existing
durable dealer lead receipt remains unchanged through failure, rollback, apply,
and idempotent re-execution.

The migration is one atomic `UPDATE`. PostgreSQL takes row locks on affected
conversation-participant rows and ordinary read locks on the joined membership
and organization tables. It uses the existing
`ConversationParticipant_dealerMemberId_conversationId_idx` join index. It sets
`lock_timeout` to 5 seconds and `statement_timeout` to 30 seconds, so contention
or unexpected volume fails the migration without a partial update. Before the
update, it fails closed if any dealer participant's account, member organization,
or conversation organization disagree.

The second migration removes a `CURRENT_TIMESTAMP` default that was only needed
to backfill existing `InventoryImportChunkAttempt.leaseExpiresAt` rows. It is a
metadata-only `ALTER TABLE`; current import code supplies an explicit fenced
lease expiry. Both migrations use five-second lock and 30-second statement
timeouts.

A read-only Neon check on 2026-07-22 first reported the conversation migration
as pending. Local full-history replay then found the applied-schema default
drift, so it is corrected with the new forward-only migration rather than by
rewriting an applied migration. The wrapper requires exactly these two pending
migrations, rechecks every applied checksum during the apply invocation's
preflight, and hashes the exact pending SQL into the apply token.

## One-time local evidence

Run from the repository root before any Neon work:

```powershell
pnpm --filter @repo/database migration:audit
pnpm --filter @repo/database migration:contract
pnpm --filter @repo/database typecheck
```

If PostgreSQL binaries are not auto-discovered, set only
`AUTOMARKET_PG_BIN` to one directory containing `initdb`, `pg_ctl`, `postgres`,
and `psql`. The legacy `PG_BIN` alias and incomplete canonical toolchains are
deliberately refused so local contract execution cannot silently select a
different PostgreSQL installation than the declared tool identity.
The isolated contract and release wrapper also remove ambient
`SHADOW_DATABASE_URL` from every Prisma subprocess; the reviewed release path
uses only the explicitly guarded `DATABASE_URL` target.

The isolated migration contract starts a disposable loopback-only PostgreSQL
cluster. It proves all migrations on a fresh database, an upgrade from the first
15 migrations, existing-row timestamp behavior, the five-second lock timeout,
statement atomicity after a lock timeout, transaction rollback simulation,
idempotent re-execution, lease-default rollback/restoration and final removal
with its scheduling index preserved, durable `Lead`/`AuditLog` receipt
preservation, machine-readable PASS/data-blocker output, the readiness SQL,
reviewed Prisma schema drift, and generated Prisma Client compatibility. It
refuses to use `DATABASE_URL` and never connects to Neon.

Migration-history audit conclusions:

- All 17 migration directories are uniquely named and lexically ordered.
- No migration uses `CREATE/DROP INDEX CONCURRENTLY`, `VACUUM`, `CREATE DATABASE`,
  or another operation that cannot run in the normal Prisma migration session.
- The destructive Task 08 conversion first snapshots legacy rows, then expands,
  backfills with assertions, applies constraints, and only then removes its
  temporary PII snapshots.
- Later reviewed destructive statements replace constraints or indexes in the
  same migration. The audit contract rejects destructive DDL in any new,
  unreviewed migration.
- Every `NOT VALID` constraint is validated later in the migration history.
- The conversation migration is data-only. The final migration only drops the
  reviewed temporary lease default. No already-applied migration was rewritten.

## Lead-delivery boundary

Synchronous dealer lead delivery requires no schema change in this cutover. Its
durable receipt is the existing `Lead` plus exactly one matching `AuditLog` row
with `action = 'lead.created'`, `entityType = 'lead'`, the lead ID, and the same
dealer organization. The read-only preflight rejects missing, duplicate, orphan,
or cross-tenant receipts.

Anonymous private-seller web leads remain intentionally fail-closed because no
routable anonymous seller inbox or email destination exists. The readiness
report requires that no such undeliverable rows exist. Enabling that flow needs
a separate product decision and schema/routing design; do not add a destination,
backfill, or inferred routing rule during this migration.

## Preliminary read-only data report

The currently configured Neon target was queried read-only on 2026-07-22. Its
environment classification was not assumed and this is not a substitute for the
identity/attestation gates below. It reported 15 finished migrations with exactly the
two release migrations pending; zero revocation candidates, tenant-binding
violations, dealer-receipt violations, anonymous private-seller web leads,
listing/directory duplicates, image orphans, lineage violations, invalid active
listings, and invalid published directory entries. Visible real inventory was
five cars and one each of truck, motorbike, van, and lease; imported inventory
was zero. Do not seed or synthesize rows to change these counts.

## Wrapper trust boundary

The wrapper technically verifies the connection host/port/database from
`DATABASE_URL`, the live `current_database()` and schema, applied migration
checksums, ordered pending migration names and SQL SHA-256 checksums, catalog
contracts, drift, and aggregate readiness queries.

The Neon branch ID and recovery reference are operator attestations. The wrapper
checks their presence/format and binds their exact values into the token, but it
does not call the Neon API and cannot prove that either resource exists, belongs
to the connected database, is current, or is restorable. The operator must verify
those facts independently in Neon Console before using `--confirm-branch` and
`--confirm-backup`.

Use `--format=json` for automation. A successful read-only preflight emits one
JSON object with `status = "PASS"`, empty `codeBlockers` and `dataBlockers`, the
ordered manifest, aggregate readiness counts, and operator attestations marked
`ATTESTED_NOT_TECHNICALLY_VERIFIED`. Refusals emit `status = "REFUSED"` and one
of `code_blocker`, `data_blocker`, or `operator_attestation`. Apply mode emits
newline-delimited JSON events for preflight, deploy, and post-apply verification.
Unknown, duplicated, or misspelled options are refused.

## Gate 1: identify and protect the Production target

1. In Neon Console, open the AutoMarket project and select **Branches**.
2. Select the branch serving Production. Record its branch name and immutable
   `br-...` branch ID.
3. Confirm the branch endpoint hostname, port, and database name match the
   Production `DATABASE_URL`. Do not rely on a friendly branch name alone.
4. Mark the Production branch **Protected** if the plan supports protected
   branches. A protected branch cannot be deleted or reset, and child branches
   receive separate passwords.
5. Record the current UTC time, deployment version, operator, branch ID, endpoint
   hostname, port, and database name in the release ticket.

Neon references: [branching workflows](https://neon.com/docs/get-started-with-neon/workflow-primer),
[protected branches](https://neon.com/docs/guides/protected-branches), and
[Backup & Restore](https://neon.com/docs/guides/branching-intro).

## Gate 2: create and verify recovery points

Do both steps when snapshots are available. The child branch is for rehearsal;
the snapshot is the lossless Production recovery point.

1. In **Branches**, choose **New branch**.
2. Set the parent to the confirmed Production branch and the data point to the
   current head. Name it `release/20260722-database-rehearsal`.
3. Create a compute for the rehearsal branch. Record its `br-...` ID and new
   connection string. Never reuse the Production credential.
4. In **Backup & Restore**, create a manual snapshot named
   `pre-20260722-database-cutover-<UTC timestamp>` from the Production branch.
5. Wait until the snapshot is ready. Record its snapshot ID, timestamp, source
   branch ID, and retention/expiry in the release ticket.
6. Use **Preview data** or Time Travel Assist at that timestamp and run the count
   sections of `packages/database/production-readiness.sql`. Confirm the recovery
   point can read `_prisma_migrations`, `ConversationParticipant`, and
   `MarketplaceListing`.

If snapshots are unavailable on the Neon plan, retain a point-in-time child
branch created immediately before apply and record the project's restore-window
coverage. Do not proceed without one independently verified recovery reference.

## Gate 3: rehearse on the Neon child branch

Set `DATABASE_URL` from the rehearsal branch's secret. Do not paste it into the
command or a shell-history file.

```powershell
$env:DATABASE_URL = '<rehearsal branch connection string from secret storage>'
pnpm --filter @repo/database migration:release -- `
  --format=json `
  --target=preview `
  --expected-host=<rehearsal-endpoint-hostname> `
  --expected-port=5432 `
  --expected-database=<database-name> `
  --neon-branch-id=<operator-verified-rehearsal-br-id> `
  --confirm-branch `
  --backup-reference=<operator-verified-production-snapshot-id> `
  --confirm-backup `
  --max-affected-rows=<reviewed-count-ceiling> `
  --minimum-public-listings=0
```

The read-only preflight must pass and prints a state-bound `APPLY-...` token plus the
full pending SQL SHA-256 proofs. Review the technically verified target identity,
proofs and affected count, and separately recheck the operator-attested Neon
resources. Then repeat the same command with these additions:

```text
--apply --confirm=<printed-APPLY-token>
```

After rehearsal:

1. Run `packages/database/production-readiness.sql` against the rehearsal branch
   using `psql -X -f`. Every integrity and tenant-violation count must be zero;
   `participantsRequiringRevocation` must be zero.
2. Start the application against the rehearsal branch and complete the
   post-migration application checks below.
3. In Neon Schema Diff, compare rehearsal with Production. The only schema
   difference must be removal of the `InventoryImportChunkAttempt.leaseExpiresAt`
   default; the conversation migration is data-only.
4. Record elapsed apply time and the rehearsal's before/after affected-row counts.
   Production's approved `--max-affected-rows` must not be lower than its actual
   preflight count or casually raised after a failure.

## Gate 4: Production read-only preflight

Choose a short maintenance window. Pause membership/organization webhook workers,
inventory-import orchestration, and administrative actions that can change dealer
membership during the apply. Public browsing can remain online because neither
migration changes public listing rows. Confirm no other Prisma migration job is
running.

Load the Production secret, then run the wrapper. Production is refused unless
`--allow-production` is present.

```powershell
$env:DATABASE_URL = '<production connection string from secret storage>'
pnpm --filter @repo/database migration:release -- `
  --format=json `
  --target=production `
  --allow-production `
  --expected-host=<production-endpoint-hostname> `
  --expected-port=5432 `
  --expected-database=<database-name> `
  --neon-branch-id=<operator-verified-production-br-id> `
  --confirm-branch `
  --backup-reference=<operator-verified-snapshot-or-backup-branch-id> `
  --confirm-backup `
  --max-affected-rows=<approved-production-ceiling> `
  --minimum-public-listings=<approved-minimum>
```

The wrapper performs only reads at this stage and refuses unless:

- URL host/port/database and live `current_database()` match the explicit target;
- operator branch/recovery attestations are present and token-bound; these Neon
  resources are not independently verified by the wrapper;
- applied migration names and SHA-256 checksums match the repository;
- exactly the two reviewed release migrations are pending and their ordered SQL
  SHA-256 checksums are captured in the preflight result and token;
- Prisma drift is limited to five catalog-verified partial unique indexes and
  the temporary lease default removed by the pending corrective migration;
- all required marketplace, sitemap, conversation, lead, and audit tables exist;
- tenant, lead-receipt, anonymous-private-seller, orphan, duplicate, lineage,
  visibility, and directory checks are zero;
- affected rows are within the approved ceiling; and
- the non-invented public listing count meets the approved minimum.

Copy the generated `APPLY-...` token and both printed pending SQL SHA-256 values
into the release ticket. A changed target, operator-attested branch/recovery
reference, pending migration name, any pending SQL byte, or affected-row count
produces a different token.

### Copy-safe token and apply invocation

After loading the correct `DATABASE_URL` from secret storage, use one argument
array for both preflight and apply. Do not reconstruct the apply command by hand.
For the disposable Preview branch:

```powershell
$releaseRunner = (Resolve-Path 'packages/database/node_modules/.bin/tsx.cmd').Path
$previewArgs = @(
  'packages/database/scripts/database-release.ts'
  '--format=json'
  '--target=preview'
  '--expected-host=<preview-endpoint-hostname>'
  '--expected-port=5432'
  '--expected-database=<database-name>'
  '--neon-branch-id=<operator-verified-preview-br-id>'
  '--confirm-branch'
  '--backup-reference=<operator-verified-recovery-reference>'
  '--confirm-backup'
  '--max-affected-rows=<reviewed-count-ceiling>'
  '--minimum-public-listings=0'
)
$previewPreflight = (& $releaseRunner @previewArgs) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or $previewPreflight.status -ne 'PASS') {
  throw 'Preview database preflight refused'
}
$expectedManifest = @(
  '20260718110000_revoke_inactive_dealer_conversations a06c9243940819cbc40743940fa5b531e7bc5c40bfb63dd8536180b6e7732b5e'
  '20260722133000_drop_inventory_import_attempt_lease_default 3bda5cc15a35f82a4d0b4d3d3d6c18547a541724964a5f57713b32bbd20e028d'
)
$actualManifest = @($previewPreflight.pendingMigrations | ForEach-Object {
  '{0} {1}' -f $_.migrationName, $_.sha256
})
if (($actualManifest -join "`n") -ne ($expectedManifest -join "`n")) {
  throw 'Preview pending migration manifest changed'
}
& $releaseRunner @previewArgs '--apply' "--confirm=$($previewPreflight.confirmationToken)"
if ($LASTEXITCODE -ne 0) { throw 'Preview database apply or verification failed' }
```

After Preview rehearsal passes and a Production recovery reference is freshly
verified, load the Production `DATABASE_URL` and use:

```powershell
$releaseRunner = (Resolve-Path 'packages/database/node_modules/.bin/tsx.cmd').Path
$productionArgs = @(
  'packages/database/scripts/database-release.ts'
  '--format=json'
  '--target=production'
  '--allow-production'
  '--expected-host=<production-endpoint-hostname>'
  '--expected-port=5432'
  '--expected-database=<database-name>'
  '--neon-branch-id=<operator-verified-production-br-id>'
  '--confirm-branch'
  '--backup-reference=<operator-verified-production-recovery-reference>'
  '--confirm-backup'
  '--max-affected-rows=<approved-production-ceiling>'
  '--minimum-public-listings=<approved-minimum>'
)
$productionPreflight = (& $releaseRunner @productionArgs) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0 -or $productionPreflight.status -ne 'PASS') {
  throw 'Production database preflight refused'
}
$expectedManifest = @(
  '20260718110000_revoke_inactive_dealer_conversations a06c9243940819cbc40743940fa5b531e7bc5c40bfb63dd8536180b6e7732b5e'
  '20260722133000_drop_inventory_import_attempt_lease_default 3bda5cc15a35f82a4d0b4d3d3d6c18547a541724964a5f57713b32bbd20e028d'
)
$actualManifest = @($productionPreflight.pendingMigrations | ForEach-Object {
  '{0} {1}' -f $_.migrationName, $_.sha256
})
if (($actualManifest -join "`n") -ne ($expectedManifest -join "`n")) {
  throw 'Production pending migration manifest changed'
}
& $releaseRunner @productionArgs '--apply' "--confirm=$($productionPreflight.confirmationToken)"
if ($LASTEXITCODE -ne 0) { throw 'Production database apply or verification failed' }
```

## Gate 5: apply once

Repeat the identical Production command immediately, adding:

```text
--apply --confirm=<printed-APPLY-token>
```

Do not run raw `prisma migrate deploy`, `db push`, or SQL by hand. The wrapper
reruns the complete preflight, applies through `prisma migrate deploy`, then
requires no pending migrations, no residual participants needing revocation, and
all integrity checks to remain clean. Immediately before invoking Prisma, it
rehashes the ordered pending SQL files and refuses if they differ from the
preflight result, closing the preflight-to-deploy file-change window.

If the command hits its five-second lock timeout or 30-second statement timeout:

1. Treat it as a safe failed attempt; the `UPDATE` is atomic.
2. Do not raise timeouts immediately.
3. Find and end the conflicting application workflow normally, or reschedule the
   maintenance window.
4. Rerun the read-only preflight. A new count requires a new confirmation token.

## Gate 6: database and application verification

Run the full read-only report without printing the connection string:

```powershell
psql "$env:DATABASE_URL" -X -f packages/database/production-readiness.sql
```

Required results:

- no missing required tables;
- all 17 migrations finished, none rolled back or failed;
- `participantsRequiringRevocation = 0`;
- `tenantBindingViolations = 0`;
- `invalidDealerLeadReceipts = 0`, `orphanLeadCreatedReceipts = 0`, and
  `receiptTenantMismatches = 0`;
- `anonymousPrivateSellerWebLeads = 0`;
- no `invalidRequiredPartialUniqueIndex` rows;
- duplicate, orphan, invalid-lineage, invalid-active-listing, and invalid-directory
  counts are zero;
- inventory totals equal the release ticket's expected real counts; and
- imported authority blocker counts are reviewed. Do not create placeholder
  listings to make a count nonzero.

Resume membership/organization and inventory-import workers, then check the
deployed applications:

1. Request the public sitemap and confirm listing, make/model, and published
   organization URLs are present at the expected counts.
2. Run one public search for each stocked category and open a legacy/private and
   an imported listing when those real data classes exist.
3. Confirm an active dealer member can list and send in an existing dealer
   conversation.
4. Confirm a disabled/deleted member cannot list, mark read, or send in that
   dealer conversation.
5. Confirm the buyer/private-seller participant in the same conversation remains
   visible and can send when the conversation is open.
6. Process one controlled membership disable and subsequent newer reactivation;
   confirm the transactional action sets `leftAt` on disable and only reopens the
   matching member's participant rows on a valid newer active event.
7. Submit one controlled anonymous dealer listing inquiry and confirm one durable
   `Lead` and one matching `lead.created` audit receipt are committed. Confirm an
   anonymous private-seller inquiry is still refused before any `Lead` is written.
8. Check database errors, Prisma migration logs, auth webhook failures, message
   authorization failures, sitemap errors, and public search latency for at least
   one normal monitoring interval.

## Rollback and compensation

There is intentionally no bulk down migration that sets `leftAt = NULL`. That
would restore access for known-inactive dealer members and create a tenant-data
exposure risk. The data change is backward-compatible with the previous
application version, so an application rollback can leave the closed
participation rows in place. The lease-default removal is also backward
compatible because callers already provide an explicit expiry; do not re-add a
default that could conceal an unfenced import attempt.

For a database rollback:

1. Stop membership/organization writes, inventory-import orchestration, and
   message sends.
2. In Neon **Backup & Restore**, select the recorded pre-cutover snapshot or UTC
   restore point.
3. Use **Preview data**/Time Travel Assist and Schema Diff before restoring.
4. Prefer the multi-step restore: create a temporary branch from the recovery
   point, run `production-readiness.sql`, and point a non-production application
   at it for verification.
5. After incident approval, finalize the restore to the Production active branch
   in Neon. Expect a brief disconnect while the compute restarts; wait for all
   Neon operations to reach a terminal successful state before reconnecting apps.
6. Re-read the active branch ID because a finalized Neon restore can replace it
   while preserving the endpoint connection string. Update the release ticket.
7. Run the complete read-only report and application checks before resuming
   writes.

If only one participant was closed incorrectly and authoritative Clerk state now
shows a newer active membership, use the existing ordered membership-event path
to reactivate it. Never run an unscoped `UPDATE ... SET "leftAt" = NULL`.

Retain the pre-cutover recovery point and rehearsal evidence until the monitoring
window and rollback deadline have both expired. Cleanup of Neon branches or
snapshots is a separate, explicitly approved operation.
