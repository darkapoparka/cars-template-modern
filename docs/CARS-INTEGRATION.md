# Cars integration

This repository owns reusable Modern source. Open it for shared frontend/code work. Open [Cars](https://github.com/darkapoparka/cars) for dealer builds, corrections, release promotion and publication. Canonical dealer source is clients/<slug>/ in Cars; dedicated dealer repositories are publishing mirrors.

Cars snapshots use an approved immutable commit from this repository. Main is a development head, not automatic release approval. After shared polish is reviewed, use the [Cars release procedure](https://github.com/darkapoparka/cars/blob/main/docs/TEMPLATE-PROMOTION.md). New dealers consume the selected lock; existing dealers do not receive automatic updates. Cars-only refinements must be compared and ported upstream before replacing a snapshot.

## Compatibility

Standalone entry: /cars. Use Node >=22.22.0 <23, pnpm 11.4.0, and the complete pnpm workspace. Read docs/QA.md for static-demo environment and Prisma generation; keep every workspace package. A documentation-only workflow change needs focused link/command checks, not the whole application suite.

Native localization candidate: legacy /cars and /variant-2/cars entries negotiate to explicit /en/cars or /bg/cars, with the locale immediately after the configured design base. Build this Next application with NEXT_PUBLIC_BASE_PATH empty for standalone or /variant-2 for its native mounted form. The value is a build-time setting, not a visitor preference. Native Link/router destinations remain base-relative; raw anchors, public image URLs, API fetches and metadata use the explicit raw-URL helper.

The legacy Cars packager that forces Modern to its default locale is incompatible with this candidate. A future Cars-owned adoption must preserve native Next routing, route the preference endpoint under this app's base, and separately verify the existing cross-design FAB/Admin destination contract. This template session did not change that packager, pins, Services mapping or dealer applications. See docs/localization/HANDOFF.md for the actual standalone/mounted acceptance status. A standalone build is not mounted or public acceptance.

## Dealer adaptation

Use Cars new-client.mjs with approved releases. Standard trio: auto-best,modern,carwow. Intentional Import trio: auto-best,import,carwow. Import replaces Modern in Design 2; it is not an automatic fourth design. Preserve existing dealer manifests and identities.

The actual content boundaries include `packages/marketplace/lead-site.ts`, `packages/marketplace/`, `apps/web/app/`, `apps/web/public/`. Read TEMPLATE.md and the reuse/QA references for complete technical detail. A fact-pack JSON is not an application setting unless code reads it. Source/demo identity and forms remain unverified until the dealer implementation establishes them.

## Historical documents

Source-era roadmaps, audits, execution logs, migration plans, legacy copies and dated refactor evidence retain their original context. They are not new assignments. AGENTS routes current tasks. Preserve licenses and provenance; do not rewrite old results as fresh verification.
## Main is the working branch

The owner chose a main-only workflow on 13 September 2026. Use the saved checkout on `main` for routine work. Do not create another branch or worktree unless the owner explicitly requests one. One task owns writes to a checkout; concurrent tasks may review read-only or work in a different repository. Fetch and inspect status before writing, preserve other tasks' work, and finish authorized implementation with scoped commits and a non-force push to main.

An explicitly requested temporary branch/worktree must be integrated, verified and removed before the task is called complete. If blocked, record its exact repository, ref, commit, paths and next action in the handoff. Do not leave unfinished source discoverable only through a task title or old branch. Source consolidation preserves work; template release, owner visual acceptance and dealer deployment keep their separate checks.

## Source consolidation, 13 September 2026

The owner requested integration of all preserved source into main and removal of obsolete branches. Existing implementation checkpoints are committed on main; earlier reports describing an uncommitted checkout are historical. Owner visual review and an approved Cars template release remain separate requirements.
