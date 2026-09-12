# Repo-wide architecture cleanup: preserve the frontend

## Mission
Audit the entire repository, then implement evidence-backed structural cleanup that makes future work easier. Preserve the current frontend appearance and user behavior 1:1 on mobile and desktop. This is shared-template maintenance, not a dealer skin, redesign, framework migration, or another small mobile-polish pass.
This document is the next-session brief, not a completed architecture audit or a claim that performance has improved.

## Starting point observed on 2026-09-12
- Repository: `J:/template-repos/cars-template-modern`, on the authorized remote Windows machine.
- Local branch: `astra`. HEAD before this documentation commit: `b57b291`.
- Earlier checkpoints: `7bad6bb` (accumulated work), `ffd46d6` (shared service-help drawers).
- Newer commits: `1c9dc57` (defer financing form) and `b57b291` (server-supplied inventory search summaries). Read their actual diffs and report before repeating or changing that work.
- Preview listener: `127.0.0.1:3001`, PID 42588. Recheck the process and route response; another container's localhost is not this preview.
- Root manifest requires Node `>=22.22.0 <23` and pnpm `11.4.0`. Verify the actual runtime; do not change the global runtime merely to run checks.

Seven pre-existing uncommitted source files were observed. They are preserved and were not evaluated for completion in this documentation-only session:
- `apps/web/app/[locale]/components/mobile-financing-form.tsx`
- `apps/web/app/[locale]/imports/components/import-request-fields.tsx`
- `apps/web/lib/public-support-submission.ts`
- `apps/web/app/[locale]/components/public-contact-fields.tsx` (untracked)
- `apps/web/lib/financing-contact-payload.test.ts` (untracked)
- `apps/web/lib/financing-contact-payload.ts` (untracked)
- `apps/web/lib/public-contact-contract.ts` (untracked)
Reinspect HEAD, status, staged changes, and these files on arrival. Preserve newer changes. Understand existing work before integrating it; do not discard it, blindly commit it, or build a competing implementation. Concurrent edits are not permission to overwrite their owner.

## Read order and scope
Read this brief, `AGENTS.md`, `TEMPLATE.md`, `docs/LEAD-BUILD.md`, `docs/QA.md`, and `docs/implementation/MOBILE-HANDOFF.md`.
Then read the current `ARCHITECTURE-REPORT.md` and relevant implementation sections in `docs/implementation/2026-09-12-mobile-continuation/`.
Inspect `docs/architecture.md` and `docs/refactor/README.md`, `AUDIT.md`, `PLAN.md`, `IMPLEMENTATION_STATUS.md`, `TARGET_ARCHITECTURE.md`, and `QA_AND_MIGRATION.md`; reconcile their claims with current code. An old ledger is not automatic authorization to revive its backlog.
The user's new scope is repository-wide architecture, including desktop internals, while freezing both frontends. Earlier mobile-first notes do not restrict inspection to three service pages.

## Frontend and behavior freeze
The live local state at session start, including newer owner changes, is the baseline. Do not reset to an older screenshot or commit.
Preserve layouts, headers, heroes, cards, drawers, menus, typography, spacing, colors, imagery, icons, breakpoints, text, labels, ordering, loading/error/empty states, and interaction behavior. Do not standardize visibly different designs as part of an internal refactor.
Preserve URLs, query parameters, filtering, history/back behavior, selection, drafts, validation, focus, keyboard access, scrolling, and contact destinations. Preserve static-demo and configured-live behavior without inventing data or delivery success.
When extracting components or moving CSS, retain effective styles, specificity, import order, inheritance, semantics, and event behavior. No unexplained visual differences may be accepted by simply updating snapshots.
Record existing defects separately. A fix that necessarily changes the visible product, data semantics, or workflow needs a separate decision; continue other safe cleanup rather than stopping the whole task.

## Audit the system before selecting fixes
Map every first-party app and package, entry points, public exports, dependencies, route families, server/client boundaries, configuration, scripts, assets, and test responsibilities. Include authenticated/admin/API surfaces even when the public demo does not exercise them.
Exclude dependency folders, generated clients, caches, build products and raw captures from manual source review, but inspect the scripts/configuration that produce or consume them. Do not claim to have read excluded or merely scanned files.
Use repository-wide scans to locate risks, then read actual implementations and trace callers/imports/data flow. File length, duplicate-looking markup, grep counts, TODO counts, and passing tests are not architectural findings by themselves.
Maintain a coverage table distinguishing detailed review, automated scan, generated/excluded, and blocked areas. Record concrete paths and symbols for findings, affected consumers, root cause, impact, recommended change, and regression risk.
Do not assume a fixed folder count or invent a quota of findings or commits. A well-structured area can be marked reviewed with no change needed.

### Component ownership and reuse
Find duplicated responsibilities across routes, services, mobile/desktop views, forms, filters, search, cards, details, overlays, and content pages. Check whether a shared component actually owns the repeated structure instead of sharing only a small button or class string.
Extract at real responsibility boundaries. Keep route orchestration, reusable presentation, domain policy, and data access understandable. Keep genuinely different variants explicit rather than adding a universal component with many boolean modes.
Consider existing shared components first, including the service-help drawer already consolidated at `ffd46d6`. Do not recreate them or claim that work as new.

### Next.js and React boundaries
Trace transitive imports from each important `use client` entry, including barrels and providers. Identify server-only code, private configuration, unnecessarily serialized data, and static composition pulled into client bundles.
Inspect server data access, layouts, metadata, route handlers/actions, loading/error boundaries, hydration, effects, derived state, and event-listener ownership. Judge correctness and actual cost, not the number of client directives.
Reduce client scope where it is safe, retaining interactive state, serializable contracts, immediate feedback, and SSR behavior. Do not hide hydration problems with blanket client-only rendering or suppressions.
Review caching, invalidation and rendering choices against the installed Next.js/React versions and official documentation before changing them. Never cache private data across users or trade correct freshness for an attractive benchmark.

### Data and business contracts
Trace inventory, search projections, filtering/sorting, URL parsers, editable drafts, validated submissions, locale/currency formatting, dealer configuration, and server validation through all consumers.
Consolidate genuinely duplicated contracts in browser-safe or server-only owners as appropriate. Do not expose full records or secrets merely to share a helper.
Inspect the newer search and financing commits and unfinished contact/form extraction before starting another version. Preserve preview/live separation, authorization, rate limits, validation and error behavior.

### Styling, dead code and repository maintenance
Review CSS ownership, cascade layers, repeated overrides, positional selectors, tokens, and component-local styling. A move or deduplication must preserve the current computed result at all affected breakpoints and states.
Review unused exports, duplicate helpers, obsolete wrappers, unreachable modules, scripts, assets, tests, package boundaries and dependency cycles. Verify runtime/dynamic references, file-based routes, package exports, configuration and supported variants before removing anything.
Retain license/provenance material and existing raw evidence. No broad deletion, `git clean`, root autoformat, dependency-upgrade sweep, lockfile regeneration, package collapse or framework replacement as a cleanup shortcut.
Review instruction files and active versus historical documentation for conflicts. Keep durable conventions concise; do not create a documentation framework or copy a generic skill into the repo unnecessarily.
Business data, dealer identity and shared rules should have clear sources of truth. Ordinary CSS values and sensible local constants do not all need configuration or a generic abstraction.

### Performance with evidence
Inspect initial client modules, JS/CSS transfer, serialized payloads, request waterfalls, repeated queries, render churn, media/font delivery, loading boundaries and unnecessary global providers.
For a proposed speed improvement, capture a comparable before/after measurement with the same data, environment, browser, cache state and viewport. Prefer production-build measurements for delivered bundle size and load behavior.
Use an isolated local build/output directory and port when needed, leaving the user's preview intact. Check machine resources and existing runners first. Do not start multiple competing full builds.
Label development observations and laboratory measurements honestly. A smaller source file, fewer client directives, one Lighthouse run, or more passing tests is not proof of better real-user performance. Do not promise production Core Web Vitals without production evidence.

## Execution and verification
1. Recheck branch/status and protect owner changes. Confirm the preview. Inventory the entire repo and capture the visual/behavior baseline before modifying affected code.
2. Complete the breadth pass, trace high-risk paths, and create a short ranked plan from actual findings. Prioritize reduced duplication, clearer data/bundle boundaries and easier ownership over cosmetic source changes. Do not spend the session only generating an audit document.
3. Implement justified, reversible cleanup units without waiting for approval already given by this task. Resolve or preserve existing in-progress work first where it overlaps. Separate risky product decisions from safe structural work.
4. For each unit, review the diff, verify affected consumers and behavior, compare affected screenshots, run relevant existing checks, and commit the completed unit. Then continue to the next valuable finding instead of repeatedly rerunning unrelated suites.
5. At integration completion, run the repository-required checks and relevant production build/public smoke coverage. Broaden verification when shared scope or unresolved failures justify it. Historical passes do not verify new changes.
Use the existing browser and test infrastructure. Capture affected public routes and states at matching widths: narrow mobile, typical mobile, landscape/tablet and desktop. Include `/cars`, a listing, `/sell`, `/imports`, `/lease`, content, contact and recovery routes as their shared owners change; cover other apps when touched.
The initial representative visual baseline should include 320px, 390px, landscape 844x390, 768/1024 breakpoints and 1440px where applicable; expand to other affected routes/widths rather than applying a giant repeated matrix to every edit.
Stabilize data, fonts, animation and external content for comparisons; inspect differences rather than raising tolerances or masking product content to make tests pass.
Keep tests meaningful: protect contracts, regressions and behavior, not the exact new implementation or arbitrary file lengths. Do not remove checks to hide failures or invent tests merely to increase the reported total.
Honor existing required checks, but use affected-package checks during iteration and batch broad suites at meaningful integration points. Document pre-existing failures and real blockers accurately.

## Commits, safety and continuity
Work on the current local `astra` branch. Checkpoint hashes identify history, not reset targets. Never reset, clean, force-push, rewrite history or replace the branch from GitHub.
Commit each completed, verified unit with its relevant documentation. Stage explicit files/hunks; never sweep pre-existing or concurrent work into a commit. A clean status is not worth losing owner work.
Do not leave your completed implementation uncommitted. Leave genuinely unfinished owner work intact and identify it accurately. If a unit cannot be completed, document its exact state and do not call it done.
Local commits are authorized. Pushes, merges, deployments, live lead delivery, paid provider calls, database mutations/migrations and changes to global tooling are not part of this brief.
Use Remote Desktop Commander for the actual local tree. Use GitHub only for relevant remote/history inspection; remote contents do not replace unpushed local work. Do not print secrets or upload private source to public services.
Use parallel read-only audit tasks only if real collaboration tools are available and beneficial, with clear ownership. Do not invent subagent execution or run competing writers in the same files.
Update the existing refactor audit/plan/status documents where practical instead of creating overlapping reports. Keep current instructions separate from historical evidence. This brief should point to the actual next unfinished task when handing off.

## What counts as completion
The report must show repo-wide coverage honestly, with concrete code evidence for findings; completed structural units and their commits; important duplication or coupling removed; and relevant before/after measurements where performance is claimed.
It must identify the compared routes/states/viewports and any visual or behavioral differences, distinguish current verification from old results, and state remaining owner changes or blocked areas.
Do not certify the whole repo as perfect from a passing suite, claim every file was deeply inspected after a scan, or call two small button fixes a repo-wide cleanup. Equally, do not manufacture refactors where the current implementation is already simple and sound.
The objective is a smaller, clearer maintenance burden with the existing frontend intact. Report the actual changes first, verification second, remaining work last. Keep progress messages brief and concrete.

## Reference guidance read for this brief
- OpenAI model guidance: https://developers.openai.com/api/docs/guides/latest-model
- OpenAI Docs skill: https://github.com/openai/skills/blob/main/skills/.curated/openai-docs/SKILL.md
Read on 2026-09-12. The useful guidance here is explicit task scope, follow-through on authorized work, inspection of conflicting instructions, and verification proportional to the change. The Docs skill concerns authoritative OpenAI documentation and model/prompt guidance; it is not a Next.js architecture checklist.
Use official, version-appropriate framework documentation when technical details need verification. These references do not authorize changing the application's model/provider, installing a skill/MCP server, altering account settings or copying generic model-upgrade instructions into this project.
