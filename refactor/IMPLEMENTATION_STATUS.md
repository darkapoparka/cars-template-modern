# Refactor implementation — delivered 19 September 2026

## Result

The source refactor is implemented in the canonical Modern template on `main`. The interrupted sessions' code was recovered and completed, not discarded. Consolidated implementation commit: `edbcffa91c975b859da74186e62aab7ffd6b7075`; the subsequent qualification commit contains the strict-mode environment fix, additional identity checks, reviewed desktop regression images, payload gates and this handoff. Consult Git history for the exact follow-up commit.

This is a locally qualified source implementation, **not approval to publish dealer copies or enable live integrations**. [TASKS.md](TASKS.md) distinguishes delivered source from blocked live, owner-acceptance and Cars-mounted gates. Do not restart the audit or recreate the refactor.

## Implemented

- Typed public identity, market, services and artwork configuration; compatible Cars authoring markers; dealership identity independent of demo/database mode; fail-closed server tenant binding.
- Shared Tailwind v4 theme tokens, validated brand/foreground pairs including mid-gray contrast edge cases, portal inheritance and explicit inverse-surface roles. Desktop styling belongs to header/toolbar/discovery/card modules rather than a global override stylesheet.
- Connected desktop header/hero with real existing artwork and an in-flow search box; consistent gutters and simpler section surfaces; shared vehicle cards and explicit collection policies. Static discovery content enters the interactive shell through a server-created slot.
- Dealer enquiry inbox and detail route, filtered cursor pagination beyond 50 records, permitted status changes, same-organization assignment, optimistic concurrency, audit history and viewer redaction. Reassignment does not reset an existing closure time.
- General/import/sell/finance request intake can persist to the existing Lead model using trusted server binding. Readiness and received/sent/failure meanings remain explicit; optional notification failure cannot erase a saved enquiry.
- Focused backend/tooling decomposition, dependency/runtime declaration alignment, retired duplicate desktop owners, six optimized asset derivatives with preserved originals and working old-URL redirects.
- Continuous desktop/mobile screenshot, behavior, architecture, tenant-policy and initial-payload gates; current configuration and operational documentation.

## Verification

| Check | Final recorded outcome |
| --- | --- |
| Lint/format | Pass, 1,023 files; final `source-final` exit 0. |
| Workspace boundaries | Pass. |
| Refactor contracts | 6 passed. |
| Full typecheck | 28 tasks passed; initial run had zero cache hits, final follow-up had 18. |
| Full workspace build | 23 tasks passed, one cache hit; web/app/API/Storybook completed and prerequisite unit tests passed. |
| Release contract suite | 86 passed. |
| Production dependency audit | No reported advisories. |
| Focused dealer workflow/inquiry/scope tests | 22 passed with isolated database mocks. |
| Marketplace/configuration suite | 108 tests passed. |
| Mobile Chromium flows | 63 passed. |
| Focused WebKit flows | 25 passed on the final IPv4 production preview. |
| Complete responsive/visual/payload suite | 20 passed, including four unchanged mobile screenshots, four reviewed desktop screenshots and two initial-load budgets. |
| Asset verification | Four dimension-preserving derivatives are pixel-identical; all six legacy URLs returned 308 to existing derivatives. Resized sprites are identified separately. |

Eight live database integration cases were skipped by the existing test configuration. No live database/identity-provider success is inferred from mocked tests. Final production tests used the exact bound origin `http://127.0.0.1:57376`; the existing Modern dev server at `http://127.0.0.1:3002/cars` was also rechecked and returned HTTP 200 with the desktop hero. Port 3001 belongs to another project and was not touched.

The detailed [evidence ledger](evidence/IMPLEMENTATION.md) records earlier image/process/network failures and their resolution instead of rewriting failed attempts as passes. It also records measured bytes, cleanup dispositions, cache/skips and artifact locations. The four desktop images are technically reviewed regression baselines, not the owner's design acceptance.

## Where to work next

Use [site configuration](../docs/SITE-CONFIGURATION.md) for identities, services, tokens, artwork, server binding and enquiry behavior. The authoritative application owners remain in the existing apps/packages; no new framework, generic page builder, CRM platform or provider was introduced.

The remaining gates are specific: owner desktop acceptance; authorized disposable Postgres/Clerk and delivery qualification; two standalone + Cars-mounted client copies; and an explicit publication/promotion decision. No production migration, seed, provider provisioning, external message, dealer deployment or Cars snapshot promotion was performed. The work is committed locally, not pushed over the pre-existing unpublished desktop commits.

Rollback is a reviewed, scoped revert of the implementation and qualification commits, preserving subsequent/unrelated work. There is no new schema migration to reverse.
