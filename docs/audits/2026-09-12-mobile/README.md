# Mobile finalization audit — 12 September 2026

## Decision
**Not ready for mobile sign-off.** Preserve the current design direction; repair the confirmed interaction/layout defects and simplify their existing owners. A framework rewrite or another global CSS patch layer is not the next step.

## Audited snapshot
- Repository: `J:\template-repos\cars-template-modern`; remote: `darkapoparka/cars-template-modern`.
- Local branch: `astra`, base commit `f640061`, with substantial pre-existing uncommitted work. Findings describe that working tree, not a clean remote branch.
- Actual implementation: Next.js 16.2.11, React 19.2.4, TypeScript, Tailwind CSS, shared workspace packages. This is not a Svelte application.
- Public development server: `http://127.0.0.1:3001`, loopback-bound, Node 22.22.0, static dealership/demo experience.
- No application-source fixes, dependency upgrades, commits, pushes, production deployments, real lead submissions, or database migrations were performed during this audit.

## Read in this order
1. [Mobile finalization plan](MOBILE-FINALIZATION-PLAN.md): ordered work packets and acceptance criteria.
2. [Mobile visual and interaction audit](MOBILE-VISUAL-AUDIT.md): reproducible defects, source owners, and design decisions.
3. [Codebase audit](CODEBASE-AUDIT.md): security, architecture, configuration, CSS ownership, and test contracts.
4. [Verification matrix](VERIFICATION-MATRIX.md): executed checks, route/viewport evidence, limitations, and harness corrections.

## Highest-priority findings
| ID | Priority | Finding |
| --- | --- | --- |
| C01 | P0 | Installed Next.js version is affected by two current critical advisories; patch before exposing or deploying. |
| M01 | P1 | Listing map margins expand a 390px page to 406px in Chromium and WebKit. |
| M02 | P1 | Sell handoff discards VIN; editing supplied vehicle details opens an empty mobile form. |
| M03 | P1 | Last content-filter drawer option is unreachable at 844×390. |
| M04 | P1 | Sell step numbers wrap; Sell and content pages fail measured text contrast checks. |
| C02 | P1 | Lint, package-boundary, export, and release-contract checks are not green. |

## Coverage and evidence
The inventory contains 1,004 source/configuration files and 151,937 lines, including generated material; these are not claimed as manually reviewed authored lines. An automated source-pattern pass read 893 application/package TS/JS/CSS files. Manual review concentrated on public mobile routes, shared components, data/configuration boundaries, and the failing contracts.

The Chromium baseline captured 87 route/viewport scenarios covering 49 requested URLs, with top/bottom/full-page images. It includes 320, 360, 390, and 430px portrait widths and 844×390 landscape. Forty baseline scenarios received Axe checks. Additional interaction probes, settled-state confirmations, and six WebKit route smoke checks are recorded separately. This is broad public-mobile coverage, not proof of every possible data combination or a physical-device certification.

Evidence directories: `browser/`, `interactions/`, `confirmed/`, and `final-checks/`. Logs and source inventories are adjacent to this document. The early exploratory interaction screenshots include animation frames; use settled confirmations for final visual judgments.

## Environment note
The machine defaults to Node 24, outside this repository's declared Node 22 range. The server was started with a process-local Node 22 path, without changing the machine-wide runtime. A separate existing E2E run exhausted drive J: while writing its isolated Turbopack cache; the runner exited and cleaned that cache. About 2.8GB was available afterward. Provision more build/test headroom before retrying concurrent builds; do not delete user files or the active server's cache indiscriminately.

## Reproduce the development session
```powershell
Set-Location 'J:\template-repos\cars-template-modern'
$env:Path='C:\Users\radev\AppData\Local\nvm\v22.22.0;'+$env:Path
$env:SKIP_ENV_VALIDATION='true'
$env:AUTOMARKET_PUBLIC_DATA_MODE='demo'
$env:NEXT_PUBLIC_WEB_URL='http://localhost:3001'
$env:NEXT_PUBLIC_API_URL='http://localhost:3001'
$env:NEXT_PUBLIC_APP_URL='http://localhost:3001'
pnpm --filter web exec next dev -H 127.0.0.1 -p 3001
```
These single-host settings are for this static demo, not the whole monorepo's deployment contract. For repository typechecking/build verification, distinct web/app/API origins were needed; see the verification document. Loopback binding reduces exposure but is not a substitute for patching vulnerable dependencies.

## Deferred sign-off
Physical iPhone/Android keyboard behavior, safe areas on actual hardware, screen-reader journeys, enlarged text, live lead delivery, authenticated account/admin workflows, and production service integration are not certified here. Desktop redesign is intentionally deferred. No numerical “10/10” rating replaces those checks.

## Final handoff check
The server was rechecked after all audit/test work: `/cars` returned HTTP 200, listening on `127.0.0.1:3001` (server process 27224). The five Markdown reports are present in this directory. Existing dirty application changes remain uncommitted; the audit added documentation, logs, screenshots, and four explicitly named `.modern-mobile-*-20260912.mjs` audit scripts under `apps/e2e/`.

The subsequent broader non-E2E run reports 898 passing assertions, nine failing assertions, seven skipped, and 16/18 successful tasks (eight cached). Eight failures are locale-contract assertions; the database failures are blocked integration checks against an intentionally unreachable local database. See the final sections of CODEBASE-AUDIT.md and VERIFICATION-MATRIX.md. The 312 public-unit passes are included in that total.

Large screenshots/logs are evidence, not production assets. Do not stage the entire binary collection without an explicit retention decision. Application fixes and desktop redesign remain unimplemented.
