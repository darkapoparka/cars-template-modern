# Audit baseline and execution record

## Identity and scope

Audit date: **19 September 2026**. Actual source: `J:\template-repos\cars-template-modern`, remote `darkapoparka/cars-template-modern`, branch `main`, HEAD **`baca6cad2d013810d5bd0395ffa8ffd2075b59ed`**. Fetch confirmed the checkout was three commits ahead of `origin/main`, with no uncommitted changes before documentation writing. Those pre-existing commits were not created by this audit.

Modern's existing public dev server was on **127.0.0.1:3002**. Port 3001 belonged to a different project. `J:\cars` is another checkout with client work; it was not changed. Runtime checks used Node **22.22.0**, pnpm **11.4.0**. No production configuration or secret `.env` contents were inspected or exposed.

Coverage: all tracked paths and all workspace manifests; mechanical source/style/import/asset/route scans; targeted reading of high-risk public composition, tokens, configuration, admin authorization/enquiry, schema and operational code; existing source checks; a limited browser attempt. This is **not** a claim of line-by-line review of all 146k scanned lines, a completed all-route visual audit, a live provider test or a penetration test.

## Inventory methodology

Tracked paths from `git ls-files`: **1,402**. Workspace manifests: **30** (8 apps, 22 packages). Source extensions `.ts`, `.tsx`, `.mjs`, `.css`, `.prisma` excluding `/generated/`: **944 files / 146,363 lines**, including tests, fixtures and other generated declarations. Explicit leading `use client` directives: **135**; transitive browser modules were not measured.

Three desktop CSS owners: `desktop-header.css` (481 lines/47 hex/4 important), `dealer-desktop-discovery.module.css` (632/52/3), `desktop-landing-vehicle-card.module.css` (241/21/0). Total **1,354 lines / 120 hex literals / 7 important occurrences**. Raw grep counts do not distinguish repeated values, valid exceptions or runtime output.

`leadSite.staticDemoMode`: **97 references / 33 non-test application/package files** under the scan's source filter. Public asset scan: **108 images/fonts / 54,750,275 bytes**; no byte-identical assets. Literal URL absence produced three candidates, not verified dead files. Test/spec source scan found no `toHaveScreenshot` or `toMatchSnapshot`; external visual service history was not inspected.

The reproducible machine inventory is on the audited computer at `.codex-artifacts/refactor-audit-2026-09-19/repo-inventory.json`. It contains manifests, import/dependency graph, routes, assets and scan candidates, not secret configuration. Large local logs/screenshots stay outside tracked source by default.

## Commands actually executed

| Command | Outcome | Scope / caveat |
| --- | --- | --- |
| `git fetch origin` and status/log inspection | Completed | Main ahead 3, clean before doc edits |
| `node --version`, `pnpm --version` with pinned PATH | 22.22.0 / 11.4.0 | System default runtime was not used for checks |
| `pnpm check` | **Exit 0**; 976 files checked, no fixes | Lint/format, not visual review |
| `pnpm boundaries` | **Exit 0**; 1,012 files in 30 packages, no issues | Installed Turbo 2.9.16 |
| `pnpm unit` | **Exit 0**; 19 successful tasks, 0 cache hits; 4m42.935s | Workspace unit task result; not full authenticated/browser verification |
| `pnpm typecheck` | **Exit 0**; 28 successful tasks, 2 cache hits; 3m14.631s | Includes dependency tasks, route type generation and cached Prisma client generation; not a production app build |
| `pnpm audit --prod --audit-level=high --json` | **Exit 0**; zero advisories in all reported severities | Point-in-time registry result: 777 dependencies + 219 optional, 996 total; not a security guarantee |
| Production application build | **Not run** | No full release or production bundle claim |
| Full Playwright mobile/desktop suite / authenticated preview | **Not completed in this audit** | No all-route or tenant-runtime sign-off |
| Migrations, seeding, live submissions, provider provisioning, deployment | **Not run** | Outside documentation audit authorization |

Logs: `.codex-artifacts/refactor-audit-2026-09-19/{check,boundaries,unit,typecheck}.log` and `dependency-audit.log`. PowerShell wrapped ordinary stderr in `NativeCommandError` records; actual process exit codes above determine status. Expected negative validation tests produced messages; they were not test failures.

## Browser attempt and why it is not an approval baseline

A read-only Playwright Chromium context loaded `/bg/cars` at 1440×1000: HTTP 200, expected localized title and desktop headings, 42 image elements, no captured page errors in the initial attempt and no observed horizontal overflow in that sample. Mutating requests were blocked. The first capture showed loading skeletons; the later capture showed desktop geometry but images had empty `currentSrc`, zero natural width and did not settle in that harness. The cause was not established. This does **not** prove the application's assets are broken.

A second Chrome-channel attempt timed out waiting for network idle. The separate named `agent-browser` session failed to connect with OS error 10060. No successful all-route/mobile rendered matrix resulted. The audit-owned stuck Node/browser process tree was terminated; unrelated dev servers were not deliberately stopped.

Local `cars-1440.png` is geometry/debug evidence only, not an image-complete accepted snapshot. RF-02/RF-03 must resolve the harness, capture real images/fonts, and establish the actual preservation/design baselines before changing UI. Do not recycle this file as passing visual evidence.

## Official documentation review

Context7 was used for Next, Tailwind and next-forge; current primary sources were retrieved for core framework, theming, accessibility, testing, validation, authorization and several infrastructure contracts. Exact versions, links, source depth and retrieval limitations are recorded in [02-STACK-AND-OFFICIAL-DOCS.md](../02-STACK-AND-OFFICIAL-DOCS.md). Latest documentation was not treated as automatic permission to update the installed stack.

## Documentation delivery checks

The delivered folder is an audit/plan, not an implemented refactor. Validate internal Markdown links, task IDs, file completeness, transfer hashes and `git diff --check` when writing it into the checkout. Runtime application source, dependencies, assets, schema and provider settings must remain unchanged by this delivery. Record any commit/push separately; no template approval, dealer promotion or deployment is implied.

### Delivery verification completed

All 15 Markdown files were written into the canonical checkout after a full payload SHA-256 check and per-file content comparison. All 24 internal Markdown links in the delivered plan resolved. The four existing routing/history documents received only small entry-point notices. The bundled Next 16.3.3 server/client guide and the current mobile Playwright configuration were checked during final documentation verification. Final staging checks and commit identity are recorded in the delivery handoff, separately from this application baseline.
