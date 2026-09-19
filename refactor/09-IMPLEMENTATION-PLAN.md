# Dependency-ordered implementation plan

**Planning complete does not mean implementation complete.** All application tasks start pending. Estimates below are relative scope, not promises of hours; re-estimate after the first verified slice. One checkout has one writer. Parallel reviewers may inspect separate concerns, but do not run competing writers/builds against the same worktree.

## Phase 0 — Evidence and operating contract

**RF-01–RF-03.** Confirm the source baseline and current branch state; establish provider-free rendered mobile and desktop evidence; add a desktop test entry point. Resolve the image/browser harness problem before accepting screenshots. Mark previous refactor docs historical. Choose the first desktop composition with the owner.

Exit: reproducible image-complete captures, known route matrix, current command ledger, no false “approved desktop” assumption. No design or shared token changes precede mobile baselines. This audit supplies source findings and green source checks, not the missing full rendered matrix.

## Phase 1 — Product/configuration separation

**RF-04–RF-05**, then the foundation of **RF-07**. Define typed identity/services/theme/data/readiness ownership while preserving `leadSite` compatibility and Cars markers. Replace the overloaded `staticDemoMode` consumers by concern. Establish fixture-only two-brand tests.

Exit: demo/live/unavailable data never chooses the dealer-vs-marketplace visual product accidentally; provider absence is honest; no credentials enter public config. Rollback through the compatibility projection. Do not create a multi-tenant control plane.

## Phase 2 — Design foundations and first desktop slice

**RF-06–RF-09.** Inventory current tokens and computed values, add missing brand/inverse roles, and implement one coherent header + hero + search + taxonomy slice. Use the existing mobile defaults unchanged. Review this composition at 1024, 1280, 1440 and wide desktop before extending it.

Exit: one styling owner per component, intentional search placement, real art, coherent widths and controls, two-brand state coverage, mobile parity. Delete superseded desktop selectors in the same slice. Do not append another final-polish override file.

## Phase 3 — Cards, route families and server composition

**RF-10–RF-12**, with **RF-17** baseline measurement. Reconcile landing/results card variants around shared rules; move static server-owned content out of the client graph; apply the design contract to details/services/content/errors. Verify URL/overlay/form behavior after each family.

Exit: consistent desktop across route families, preserved mobile, bounded payloads and real performance measurements. Do not wait until the whole website is rewritten to inspect it. Do not force identical DOM just to claim reuse.

## Phase 4 — Evidence-based cleanup

**RF-13–RF-17.** Review dependency policy, responsibility hotspots, public exports, assets and measured performance. Remove proven obsolete owners only after preceding migrations. Retain generated/schema/security/operational sources unless their complete contract is retired.

Exit: each deletion has a consumer/entry-point check; no stale duplicate implementation; source assets/derivatives are purposeful; production budgets agreed and measured. No broad framework/provider/major-version migration bundled with this cleanup.

## Phase 5 — Dealer workspace and enquiry lifecycle

**RF-18–RF-20.** Reuse durable actors, existing lead/conversation models and inbox pagination. Add the small dealer workflow, trace all public request destinations, then wire actual persistence/notification/readiness semantics in a disposable environment. Keep platform admin separate.

Exit: direct requests are tenant-authorized, viewer/sales/manager/owner behavior is explicit, enquiry status/assignment is audited, public success is truthful. This phase can be scoped after the public template is stable; it is not a prerequisite for a provider-free sales demo.

## Phase 6 — Clone and release qualification

**RF-21–RF-23.** Test two fixture dealers, update Cars adaptation where required, run exact-commit standalone and mounted gates, finalize visual acceptance and publish the release record only when authorized.

Exit: a reusable approved template snapshot with known configuration schema, migration notes, actual checks, owner acceptance and rollback. Do not update existing dealer deployments automatically.

## First implementation session

Read this folder and refresh HEAD/status. Execute RF-01–RF-03 without changing UI: resolve the browser issue, capture the mobile preservation set and desktop before-state, verify meaningful selectors and one search/detail-return flow, add the desktop gate. Then perform RF-04/RF-05 as the first architecture slice, with tests proving the visual product does not depend on demo mode. Stop at a verified checkpoint rather than starting global file moves.

The next session should have a small accepted desktop example and reliable tests before migrating shared tokens. It should not “clean the entire repo” in a single commit. Follow [TASKS](TASKS.md) for concrete acceptance and [DECISIONS](DECISIONS.md) for choices still requiring approval.
