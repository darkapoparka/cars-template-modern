# Modern verification

The current rendered template and [TEMPLATE](../TEMPLATE.md) are the visual contract. Historical polish reports describe their own revisions; do not restore superseded layouts, dimensions, colours or controls from those reports. Architectural work preserves both mobile and desktop.

## Source and scope

Work in `cars/main`, `templates/modern`. The standalone repository is a publishing mirror. A local test or build is not dealer-release, mounted-path or public-hosting acceptance. Read [Cars integration](CARS-INTEGRATION.md) before publication. Never send live enquiries or contact leads during QA.

## Local preview

Use Node `>=22.22.0 <23` and pnpm `11.4.0`. Install the complete workspace with `pnpm install --frozen-lockfile`, then generate the database client with `pnpm --filter @repo/database build` when needed. Do not invent provider credentials.

The following environment is for a local static-demo review only. Verify port ownership first and substitute the actual free port consistently:

```powershell
$env:SKIP_ENV_VALIDATION='true'
$env:AUTOMARKET_PUBLIC_DATA_MODE='demo'
$env:NEXT_PUBLIC_WEB_URL='http://127.0.0.1:6462'
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:6466'
$env:NEXT_PUBLIC_APP_URL='http://127.0.0.1:6467'
pnpm --filter web exec next dev -H 127.0.0.1 -p 6462
```

Do not replace or stop another task's preview. For an isolated production build, set `AUTOMARKET_PUBLIC_E2E=true`, a unique `E2E_PUBLIC_RUN_ID`, and `E2E_PUBLIC_MODE=demo` before both `next build` and `next start`. This uses the existing per-run output directory rather than overwriting the active development output. QA-only Turbopack and Webpack filesystem caches are disabled; ordinary runs retain their cache policy.

## Code checks

Run checks proportionate to the changed boundaries:

```text
pnpm --filter @repo/marketplace-ui test
pnpm --filter web test
pnpm --filter @repo/marketplace-ui typecheck
pnpm --filter web typecheck
pnpm refactor:contracts
pnpm release:preflight:contracts
pnpm release:preflight:test
pnpm --filter web build
```

Use the documented preview environment for the web build. Run the repository formatter/linter on changed files, and retain existing server/client, dealer-binding and package-boundary contracts. Do not update screenshot baselines merely to make an unexpected change pass.

## Browser checks

With the correct preview already running, set `E2E_START_SERVERS=false` and `E2E_WEB_URL` for the default Playwright config. The focused architectural regressions are `architecture-persistence.spec.ts` and `browser-preference-resilience.spec.ts`; run them with `--project=desktop-chromium`. The persistence suite explicitly exercises 320, 390 and 1440 px. Existing `desktop-inventory-search.spec.ts` covers BG/EN category transitions, focused dialogs and draft cancellation. Historical geometry cases must agree with the current visual contract before being used as acceptance evidence.

For mobile, set `E2E_BASE_URL` and use `playwright.modern.config.ts`. Run the relevant mobile suites in Chromium and WebKit; `modern-mobile-architecture.spec.ts` and `modern-mobile-completion.spec.ts` provide focused coverage. Returning-visitor fixtures dismiss the welcome overlay through the local preferences endpoint. Welcome tests use a fresh session separately.

Minimum representative routes: localized Home, Cars, a supplied listing, Contact, Imports, Sell and Lease. Include BG and EN. Match before/after captures at 320/390 px, the 1023 px boundary and 1440 px when touching public state or rendering. Extend to 1024/1280/1920 px and a 600 px-high desktop viewport when a changed control warrants it. Wait for hydration, fonts and visible images; hidden lazy images must not block capture completion. Record exact routes, widths, browser, source state and errors.

### Interaction invariants

Applied inventory filters live in the URL. Check filter application, independent clearing, sort, reload, category transitions, listing navigation and browser Back. Category changes retain compatible budget/year/sort while clearing incompatible make/model/variant values. Counts and cards must agree with the applied query. Empty results must remain navigable, not acquire demo records in live mode.

Pending filter changes remain drafts until Apply/Search. Escape or dismissal discards the pending draft and returns focus to the opener. Check focused Make/Model, Price and keyword dialogs, the full filter groups, range input commits and mobile drawers. Only one overlay is active; body locking and visible scrollbars must not shift the shared frame or duplicate scrollbar compensation.

Grid/List and Quick/Sidebar preferences survive reload where storage is available. Malformed, denied or full storage must not break browsing. Shortlists are isolated by dealer and base path, synchronize across tabs, keep stable unchanged snapshots and preserve visit-only state on storage failures. Returning from a listing preserves the appropriate inventory URL and scroll context.

Check mobile menu, bottom navigation, horizontal pill rails, search, gallery/Photos/Details tabs, keyboard dismissal and touch interactions. Check desktop Save independently from card navigation. Native dialogs must close and restore focus appropriately when crossing to mobile.

### Visual and asset invariants

Keep the shared desktop frame, graphite discovery artwork, Type/Make/Model search capsule with its small Type cutout, rounded refinement pills, card facts, quiet arrow actions and compact Sort/View controls described in TEMPLATE. Home has four refinement pills; Cars has six. Verify that Home retains its draft until Search, cancelled dialog edits are discarded, category changes clear incompatible make/model and retain compatible ranges, and dialogs/Type menus close across the desktop breakpoint. Preserve all mobile composition, spacing, typography and artwork. Check missing images, overflow, clipped text, card/action collisions and visible keyboard focus; do not redesign them during architectural work.

On Windows, retain the bounded image encoder and disabled libvips operation cache. Check cold and warm optimized transparent-image requests, including AVIF, rather than trusting a warm cache. Standalone image optimization and mounted raw-asset behaviour are separate deployment contracts. Preserve source artwork, licences, provenance and compatible dealer overrides.

### Forms and dealer adaptation

Static-demo forms must clearly retain their existing local/phone handoff rather than simulate delivery. Import links and unfinished Sell/finance details remain editable; optional sections and dismissal must not lose the intended draft. Inspect validation without sending enquiries. Real persistence, notification, rate limiting, credentials and fail-closed readiness require separately authorized integration checks.

Dealer copies require an identity/content/contact/metadata/asset sweep through the existing configuration boundaries. Search for inherited source names, phones, domains, social links and unsupported claims; historical provenance is not active dealer content. Keep static fixtures distinct from live inventory and do not personalize the reusable master as one dealer.

## Artifact lifecycle and completion

Store transient screenshots, traces and logs in ignored `runtime/` or the existing Playwright output directories. Loose images in the E2E source root are not fixtures. Keep intentional `specs/*-snapshots`, executable regressions, unresolved reproductions, licences and asset provenance. Retired captures remain available in Git history. Never follow directory links during cleanup or delete output owned by a live process.

Report the actual checks and their limits. Source verification, a production build, public-hosted behaviour, mounted-path behaviour and owner visual acceptance are separate facts. Do not claim a full release is flawless from unit tests or a localhost HTTP 200 alone.

Local development previews disable Turbopack filesystem caching. Their compiler
stays warm in memory; restarting recompiles instead of keeping another large
persistent cache on the Windows temporary drive.
