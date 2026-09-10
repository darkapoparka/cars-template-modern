# Task 08 execution handoff

Date: 2026-07-11  
Runtime: Node 22.22.0, pnpm 10.31.0  
Approved source: `docs/superpowers/execution-proposals/2026-07-11-task-08-durable-marketplace-schema-and-migration-proposal.md`

## Delivered

- Reconciled the Phase 1A Dealer Studio schema into the approved durable schema. Durable account/seller/dealer ownership, lifecycle events, money snapshots, upload sessions/media jobs, VIN/copy/photo jobs, trust/moderation/audit, leads, conversations/read state, saved-search delivery, billing, subscription and promotion mappings are represented in Prisma.
- Added the four ordered Task 08 migration phases: lossless compatibility snapshot, expand, deterministic backfill plus assertions/constraints, and contract cleanup. The contract phase removes the temporary PII snapshots.
- Added durable private-seller and dealer listing create/edit/submit/publish/pause/sold flows with optimistic version checks, price snapshots and audit entries.
- Graduated Dealer Studio inventory and leads from mocks to organization-scoped queries. Added a Listing Factory route using deterministic local VIN, listing-copy and photo adapters.
- Added authenticated Vercel Blob token issuance, allowlisted MIME types, 15 MB per-file limit, 24-photo count limit, 200 MB listing quota, storage-path binding, callback metadata verification, persisted upload/photo jobs and authenticated cleanup cron retries.
- Added public lead persistence for database-backed active listings. Demo-only listings deliberately do not expose a contact action because they cannot persist a real lead.
- Added durable buyer/dealer conversation participants, idempotent messages and per-participant read state. Existing Task 07 saves/searches/inquiries now resolve through `MarketplaceAccount` instead of raw Clerk IDs.
- Replaced the obsolete `Page` keep-alive mutation with `SELECT 1`.

## Verification completed

- Prisma schema format/validate and Prisma client generation: pass.
- Focused typechecks: database, marketplace, storage, AI, app, API and web passed after the Task 08 changes. A final API rerun later encountered a concurrent, unrelated type error in `packages/analytics/provider.tsx` (`string` versus `AnalyticsConsent`); Task 08 does not own or modify that fix.
- Tests: marketplace 8/8, storage 3/3, app 9/9, API 10/10: pass.
- Focused Biome check across 28 Task 08-owned files: pass.
- Production builds: app, web and API: pass. The AI package has no build script and its typecheck passed.
- Browser verification with agent-browser 0.20.0 (the current release requires Node 24, so the Node-22-compatible release was used): public listing desktop/mobile render and dealer inventory redirects an unauthenticated visitor to Clerk sign-in with no app console errors.
- Evidence: `public-listing-desktop.png`, `public-listing-mobile.png`, and `dealer-auth-gate.png` in this directory.

## External verification blocker

The connected Neon account search returned no AutoMarket project, so no isolated Neon branch could be created. Docker is installed but its local engine is not running. Consequently, migration deployment, branch SQL assertions, restore/PITR rehearsal, Blob callback execution, and the fully persisted create → publish → discover → save → contact → lead journey could not be executed against a database in this task.

The current local `.env.local` database has not received Task 08 migrations. Public listing code safely falls back to non-production demo inventory, does not expose contact for demo rows, and logs the expected Prisma schema mismatch during development. This is not a production fallback.

## Isolated-branch completion procedure

1. Create a child branch from the approved non-production development branch and record parent/child IDs and the restore point.
2. Point a one-off `DATABASE_URL` at the child branch and run `pnpm --filter @repo/database exec prisma migrate deploy`.
3. Run `migration-verification.sql`; every count query must return zero and all four Task 08 migrations must have a non-null `finished_at` and null `rolled_back_at`.
4. Seed or copy sanitized fixtures and execute cross-user/private-seller/cross-org listing, lead, conversation and upload-abuse tests.
5. Exercise create → submit → publish → public discover → save → contact → dealer lead persistence on ports 3100/3001/3002.
6. Prove restore by creating a disposable child from the pre-migration restore point and confirming the Phase 1A schema/data counts. Delete both disposable verification branches after evidence is captured.
7. Never reverse the contract migration in place after snapshots are removed. Roll back by restoring/promoting the recorded pre-migration Neon branch/restore point, then switch application traffic only after schema and row-count checks.

## Task 09 readiness

**NOT SAFE TO EXECUTE TASK 09 YET.** Local Task 08 implementation and verification are complete, but the approved definition of done requires the isolated Neon migration/restore proof and persisted end-to-end journey above. Task 09 becomes safe only after those external checks pass.
