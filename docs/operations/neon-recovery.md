# Neon recovery drill

## Current limitation

No connected AutoMarket Neon project was available during Task 09. This is a
repeatable, approval-gated procedure; it is not evidence that restore succeeds.

## Safety gate

Use an isolated non-production Neon project or branch containing synthetic
fixtures only. Explicit approval must name the project, source branch, recovery
timestamp, operator, and cleanup owner. Never paste connection strings into
logs or the audit report.

## Drill

1. Record branch ID, current migration version, row-count checksums for selected
   fixture tables, and the UTC recovery point.
2. Insert a uniquely named synthetic marker and verify it is visible.
3. Simulate loss only in the isolated branch, for example by deleting the
   marker and one synthetic fixture row.
4. Use Neon Time Travel or create a point-in-time branch at the recorded UTC
   point. Inspect it read-only before any branch reset.
5. Verify schema migration version, fixture counts, organization boundaries,
   listing lifecycle rows, media metadata, and lead linkage.
6. Point an isolated preview at the recovery branch and run readiness plus the
   critical persistent E2E loop.
7. Record recovery-point objective achieved, recovery time, cold-start or
   connection interruption, and every manual step.
8. Delete the temporary branch only after explicit cleanup approval.

## Proposed launch targets

- RPO: 15 minutes for marketplace transactional data.
- RTO: 60 minutes to a verified isolated recovery branch.

These are proposed objectives until an executed drill supplies evidence.
Retention and available restore history depend on the configured Neon plan and
project settings and must be checked before the drill.

References: [Neon branch restore](https://neon.com/docs/introduction/branch-restore)
and [branching guide](https://neon.com/docs/guides/branching-intro).

