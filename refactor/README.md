# Modern template — refactor program

**Audit date:** 19 September 2026. **Status:** implementation delivered and locally qualified; formal release gates remain separate. Start with [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md), [the evidence ledger](evidence/IMPLEMENTATION.md) and [current configuration](../docs/SITE-CONFIGURATION.md). The findings below describe the original audited baseline, not the current implementation.

**Repository:** `darkapoparka/cars-template-modern`
**Checkout:** `J:\template-repos\cars-template-modern`
**Audited application baseline:** `baca6cad2d013810d5bd0395ffa8ffd2075b59ed` (`main`).

## Decision in one paragraph

Keep the existing Next.js/React/TypeScript, pnpm/Turborepo, Tailwind v4, and next-forge-derived architecture. Refactor it incrementally around a clearly defined dealership product. Protect the successful mobile patterns. Redesign desktop composition deliberately rather than preserving an unapproved desktop or expecting code cleanup alone to improve its design. Consolidate existing tokens, component ownership, configuration, and data boundaries before adding more UI variants. `apps/web` remains the dealership's public website; `apps/app` is the natural home for its authenticated dealer workspace. The agency's prospects, template portfolio, and client provisioning remain a separate Cars concern.

## What the audit established

The repo is not missing a design system. It already has semantic colors, typography, control dimensions, shadows, dark-mode values, and Tailwind `@theme inline` aliases. Recent desktop styling frequently bypasses those foundations. Three desktop stylesheets alone contain 1,354 lines and 120 hexadecimal color occurrences. These counts identify a consolidation target, not 120 independently proven bugs.

The larger architectural problem is product/configuration coupling: `leadSite.staticDemoMode` is referenced 97 times across 33 non-test application/package source files. It influences website identity and navigation as well as provider/data behavior. A production dealership should not have to abandon the dealership UI to use real data.

There is useful code to retain: domain/UI/server separation, extracted filtering and card policies, mobile overlay ownership, server-only modules, durable organization authorization, import/audit protections, and existing tests. A wholesale framework change, package deletion sweep, or new generic page-builder would add risk without fixing the observed inconsistency.

## Read in this order

| Document | Purpose |
| --- | --- |
| [00-AUDIT.md](00-AUDIT.md) | Findings, evidence, severity, uncertainty, and retained strengths |
| [01-PRODUCT-SCOPE.md](01-PRODUCT-SCOPE.md) | Website vs dealer workspace vs agency leads; demo/live separation |
| [02-STACK-AND-OFFICIAL-DOCS.md](02-STACK-AND-OFFICIAL-DOCS.md) | Actual versions, official documentation, upgrade policy |
| [03-ARCHITECTURE.md](03-ARCHITECTURE.md) | Package responsibilities and gradual target structure |
| [04-TOKENS-AND-THEMING.md](04-TOKENS-AND-THEMING.md) | Tailwind v4 token ownership, brand overrides, migration mechanics |
| [05-DESKTOP-AND-MOBILE.md](05-DESKTOP-AND-MOBILE.md) | Desktop visual contract, route coverage, mobile invariants |
| [06-DATA-ADMIN-SECURITY.md](06-DATA-ADMIN-SECURITY.md) | Dealer workspace roadmap, data contracts, authorization and integrations |
| [07-CLEANUP-PERFORMANCE.md](07-CLEANUP-PERFORMANCE.md) | Dead-code evidence, asset strategy, client boundaries and budgets |
| [08-TESTING-RELEASE.md](08-TESTING-RELEASE.md) | Test layers, responsive matrix, clone checks and release gates |
| [09-IMPLEMENTATION-PLAN.md](09-IMPLEMENTATION-PLAN.md) | Dependency-ordered phases and first implementation slices |
| [TASKS.md](TASKS.md) | Actionable backlog with dependencies and completion evidence |
| [DECISIONS.md](DECISIONS.md) | Proposed decisions and unresolved product choices |
| [AGENTS.md](AGENTS.md) | Rules for agents maintaining or executing this program |
| [evidence/BASELINE.md](evidence/BASELINE.md) | Actual audit scope, command results, limitations and evidence locations |

Implementation has already been executed. Do not restart RF-01 through RF-05 or recreate the refactor. Use the current task/status ledger to resolve the remaining release gates.

## Scope and authority

This program replaces the old `docs/refactor/` program as the planning entry point for this request. The older files remain historical evidence of previous work, not proof of current approval or current test status. Their references to `gpt-web`, a different baseline, and an approved desktop are not the operating contract for this program.

Root `AGENTS.md`, `TEMPLATE.md`, `docs/QA.md`, and `docs/CARS-INTEGRATION.md` still govern repository identity, lead-copy ownership, and operational safety. The subsequent user request authorized source implementation. It did not authorize production data changes, provider provisioning, migration execution, external messages, dealer deployment or Cars promotion.

## Completion means

A dealer copy can change identity, approved assets, market formatting and service availability through typed configuration without searching through JSX/CSS. The public website stays a dealership in both demo and live modes. Desktop uses one deliberate composition and a small set of repeatable surfaces. Mobile retains its navigation, drawers, draft handling and accepted geometry. Client payloads and assets have measured budgets. Only proven-unused code is removed. Dealer operations are tenant-scoped and truthful about delivery. Every change has focused tests, rendered evidence and a rollback boundary.

A green linter, a large test count, fewer lines, or a generic claim of “perfect code” is not that completion evidence.
