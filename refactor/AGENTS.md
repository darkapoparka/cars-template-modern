# Agent contract for the Modern refactor program

These instructions apply to this directory and to work explicitly executing its tasks. Root repository instructions remain authoritative. Documentation is a plan, not automatic permission to deploy or mutate services.

## Before editing

1. Read this README, the relevant task, current `TEMPLATE.md`, `docs/QA.md`, and `docs/CARS-INTEGRATION.md`. Verify checkout, branch, remote, HEAD and all existing changes. Fetch before writing when allowed. The audited baseline is `baca6cad2d013810d5bd0395ffa8ffd2075b59ed`; rebase your understanding, not the user's work, when HEAD differs.
2. Work in the canonical template master, not `J:\cars`, an arbitrary client copy, or a new worktree. Follow the root main-only workflow. Preserve unrelated changes and all pre-existing local commits.
3. Verify listener ownership before testing. At audit time Modern web was on 3002; 3001 was unrelated. Default ports are documentation, not identity checks.
4. Use Node `>=22.22.0 <23` and pnpm `11.4.0`. Do not switch global Node versions, reinstall the workspace, or upgrade dependencies just to begin a styling task.
5. Read version-matched local Next docs under `apps/web/node_modules/next/dist/docs/` and current official docs for the touched API. Context7 can return older or canary snippets: check the installed version before copying. Never run broad shadcn overwrite, npm-check-updates, db push, migrations, seeding, or recursive clean as refactor setup.

## Working method

Choose one task with satisfied dependencies. Record the intended behavior, files, tests and rollback. Finish one coherent vertical slice before starting another. Prefer existing primitives, policies and packages. Extract a component for a coherent responsibility or meaningful reuse, not an arbitrary line limit. Do not build universal page schemas, universal repositories, an event bus, a provider framework or generic CRUD generators without a demonstrated requirement.

Use the existing browser-safe domain package for pure rules; shared presentation must not import database, secrets or authentication SDKs. Server composition owns data access. Add `use client` where browser behavior is required; a Server Component cannot become server-rendered merely by removing its directive if it is still imported from a Client Component. Recompose through server-owned slots where necessary.

Do not conflate demo data, dealership identity, theme, service offerings, provider readiness and authorization. A feature flag is not an authorization check. A disabled UI is not a secured endpoint.

## Styling and mobile protection

Use existing semantic tokens first. Introduce only the missing role or component variant. Literal color values belong in approved token definitions, brand configuration or deliberately scoped artwork—not repeated component styling. Ordinary Tailwind spacing and documented geometry are not forbidden hardcoding.

Do not globally change colors, radii, fonts, spacing, drawer handles, safe-area rules or breakpoints to repair desktop. Preserve mobile at 320/360/390/430px and the 1023/1024 transition. Keep hierarchy in control sizes rather than imposing a universal 44px visual height. Preserve accessible hit areas and focus behavior.

Desktop changes need before/after rendered evidence. Mobile parity needs evidence too. Do not accept snapshot updates merely because a test now passes. Never hide inconsistent content with `nth-child` instead of defining an explicit content/layout policy.

## Data and operations

Use only authorized disposable data for integration tests. Never load or print secret `.env` values. Do not contact prospects or submit real customer enquiries. Block browser mutations in read-only audits. Do not delete audit/retention/security modules because the public site does not import them. Do not combine schema changes with a visual refactor.

## Finish every task

Run focused tests first, then applicable type/boundary/lint and browser checks. Record exact command, version, exit status, commit and evidence path. Distinguish failing assertions, infrastructure failure, cache hits, skips and unexecuted work. Update `TASKS.md` only when its acceptance evidence exists. Use scoped commits when authorized. Do not publish pre-existing unpublished commits incidentally. No force push, blanket staging or fabricated release claims.

End the handoff with what changed, what was intentionally preserved, tests actually run, remaining blockers and the next dependency-ready task. Keep one truthful status instead of adding competing “final” plans.
