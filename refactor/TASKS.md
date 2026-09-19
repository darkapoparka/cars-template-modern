# Execution backlog

The source implementation is delivered; the table below retains the original acceptance contract. Current qualification is recorded after it and in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). “Verified” describes the named evidence, never an unperformed live/owner/mounted check. Relative size S/M/L describes scope, not elapsed time.

| ID | Task / primary owners | Depends on | Size | Acceptance and required evidence |
| --- | --- | --- | --- | --- |
| RF-01 | Refresh baseline, ownership and documentation authority; root docs and evidence ledger | None | S | HEAD/status/listener recorded; historical docs linked; no unrelated changes; task-specific handoff |
| RF-02 | Mobile preservation baseline; e2e and current public UI | 01 | M | Image-complete 320/360/390/430 + landscape; overlay/search/detail-return paths; current source commit captured |
| RF-03 | Desktop route/state baseline and named test configuration; e2e/Storybook | 01 | M | 1024/1280/1440/1920 before-state; functional/geometry checks; capture recipe; initial composition approval process |
| RF-04 | Typed public site config and compatibility projection; marketplace/web | 01 | M | Identity, services, theme and market schema; invalid-input tests; preserve adaptation markers and existing output |
| RF-05 | Split demo/product/data/readiness decisions; web/UI facade consumers | 02,03,04 | L | Each former demo branch mapped to correct concern; dealer UI in demo/live/unavailable; provider-free preview retained |
| RF-06 | Token inventory and missing semantic roles; design-system | 02,03 | M | Current computed values recorded; token ownership; no unexplained mobile change; no second palette |
| RF-07 | Validated brand/artwork/theme projection and portal inheritance | 04,06 | M | Two fictional brands; normal/hover/focus/disabled/error states; root/portal consistency; no raw arbitrary CSS input |
| RF-08 | Desktop header/hero/search composition; frame/masthead/discovery | 03,05,07 | L | Accepted real rendered composition; shared gutters; search flow works at 1024 and short height; no mobile regression |
| RF-09 | Desktop taxonomy/filter/search states; discovery policies/controls | 08 | M | Reusable tiles/art fallbacks; URL/back/clear flows; explicit collection policy, no nth-child data hiding |
| RF-10 | Vehicle card variants and shared public view model; marketplace-ui | 07,09 | M | Shared price/fact/media rules; deliberate variants; long/missing/sold/finance cases; landing/results/mobile evidence |
| RF-11 | Server/client composition and bounded DTOs; web + marketplace-ui | 05,09,10 | L | Static content server-owned where justified; interactive state unchanged; payload/bundle comparison; no secret/provider leakage |
| RF-12 | Detail, services, content, contact, loading/recovery parity; web/UI | 08,10 | L | Every route family reviewed; mobile preserved; obsolete global overrides removed with replacements; canonical content URLs retained/redirected deliberately |
| RF-13 | Dependency/runtime policy hygiene; manifests/lockfile/tooling | 01 | M | Review latest/ranges/Node types/peer alignment; no broad update; resolved versions and targeted tests recorded |
| RF-14 | Split mixed backend/tooling responsibilities; database/release scripts | 01 | L | Stage/transaction/state characterization tests; coherent ownership; unchanged public contracts and atomicity |
| RF-15 | Export/entry-point/dead-code map; all workspace owners | 05,11 | M | Static, dynamic, route, codegen and Cars consumers checked; candidate ledger distinguishes retain/remove/unknown |
| RF-16 | Asset and obsolete-source cleanup; web public/assets/imports | 07,12,15 | M | Dynamic paths checked; source/derivative roles; dimensions/crop/provenance; no broken routes or dealer-copy assets |
| RF-17 | Production payload/image performance baseline and improvements | 03; changes follow 10,11,16 | M | Isolated production measurements; agreed budgets; actual network/trace evidence; no invented Lighthouse score |
| RF-18 | Dealer actor/permission and tenant-scoped data contract consolidation | 05; relevant 14 | L | Existing durable actor reused; operation policy; direct/cross-tenant/disabled-role tests; no layout-only authorization |
| RF-19 | Enquiry inbox/workflow MVP; app dealer/leads and database | 18 | L | Existing Lead/Conversation reused; >50-item paging; details, allowed statuses, assignment/audit; useful empty/error states |
| RF-20 | Trace and reconcile public request persistence/delivery/readiness | 04,05,18; inbox integration after 19 | L | Route-to-destination register; general/import/sell/finance mapped; truthful state meanings; disposable idempotency/failure/receipt tests |
| RF-21 | Two-dealer adaptation and Cars mounted compatibility | 04,07,12,16; live features after 20 | L | Two fixture identities; no active source-brand leakage; standalone/mounted URLs/assets/actions; packaging updates coordinated |
| RF-22 | Continuous visual/behavior/security/performance gates | 02,03; integrated through phases | M | CI meaningful desktop/mobile assertions; pinned captures; tenant tests; budgets; no unreviewed snapshot updates |
| RF-23 | Exact-commit qualification and handoff | All in release scope verified | M | Owner-approved desktop, mobile parity, builds/checks, clone evidence, known limits, rollback and explicit release authorization |

## Completion record per task

```text
Task:
Status and blocker (if any):
Source before / after:
Changed paths and retired owners:
Behavior intentionally preserved:
Tests: command, exit code, cache/skips:
Rendered evidence: route, viewport, browser, fixture, screenshot/trace:
Performance/security/clone evidence when applicable:
Decision references and limitations:
Rollback:
Next dependency-ready task:
```

RF-13 and read-only RF-14 investigation can be reviewed alongside foundations, but no competing writer/build touches the same checkout. RF-18–RF-20 may form a later dealer-workspace release rather than blocking the public template release; RF-23 must explicitly name excluded scope. No task should be marked done solely because files moved or line counts fell.

## Current execution state — 19 September 2026

Implementation checkpoint: `edbcffa91c975b859da74186e62aab7ffd6b7075`, followed by the qualification/configuration follow-up. See [evidence](evidence/IMPLEMENTATION.md) for commands, artifacts and limitations.

| Task | Source | Qualification / remaining gate |
| --- | --- | --- |
| RF-01 | Delivered | Verified checkout, ownership, recovery and scoped commits. |
| RF-02 | Delivered | Verified four unchanged mobile image baselines; 63 Chromium and 25 WebKit behavior tests. |
| RF-03 | Delivered | Verified four desktop captures, named production configuration and geometry/interaction assertions; owner acceptance remains RF-08. |
| RF-04 | Delivered | Verified typed config, invalid input, legacy compatibility and independent fictional identity tests. |
| RF-05 | Delivered | Verified runtime-mode policy tests and provider-free demo UI; actual live deployment remains RF-18–20. |
| RF-06 | Delivered | Verified shared token ownership and preserved mobile captures. |
| RF-07 | Delivered | Verified contrast, grayscale edge cases, two brand projections and portal/focus behavior. Full branded client builds remain RF-21. |
| RF-08 | Delivered | Technical checks verified; **blocked on owner visual acceptance** for formal completion. |
| RF-09 | Delivered | Verified shared discovery policies, responsive taxonomy, filter/search/back/reset behavior. |
| RF-10 | Delivered | Verified shared card owner and existing price/fact/variant tests; no duplicate desktop landing implementation. |
| RF-11 | Delivered | Verified server-created content slot, directive boundaries and production payload measurements. |
| RF-12 | Delivered | Verified representative detail/service/content/contact/legal/recovery families in responsive tests, not every possible data-dependent URL. |
| RF-13 | Delivered | Verified manifest/type alignment, boundaries, targeted tests and current production dependency audit. |
| RF-14 | Delivered | Verified focused backend/tooling extractions and release characterization tests; live transaction proof is not inferred. |
| RF-15 | Delivered | Verified explicit retire/retain/unknown ledger and public export contracts. Unknown downstream consumers were retained, not guessed dead. |
| RF-16 | Delivered | Verified archived originals, derivative records, redirects and image-complete route captures. Cars mounts remain RF-21. |
| RF-17 | Delivered | Verified initial production measurements and conservative regression ceilings; no field-performance or historical speedup certification. |
| RF-18 | Delivered | Isolated permission/tenant tests verified; **blocked on authorized disposable identity/SQL integration qualification**. |
| RF-19 | Delivered | Inbox, details, >50-item pagination, assignments, status transitions, redaction and audit implemented; live qualification follows RF-18. |
| RF-20 | Delivered | Persistence/readiness/idempotency contracts tested; **blocked on real disposable end-to-end receipt/failure qualification**. |
| RF-21 | Fixture contract delivered | **Blocked**: two complete Cars-mounted copies and packaging/release coordination have not been performed. |
| RF-22 | Delivered | Local visual/behavior/security/payload gates verified and CI wired. Hosted CI execution is not claimed before publication. |
| RF-23 | Handoff delivered | **Blocked**: owner acceptance, live/mounted qualification and explicit promotion/publication decision. No deployment occurred. |

Do not convert the blocked qualification gates into a new unbounded source rewrite. The next session should consume the existing implementation and resolve the specific approved gate.
