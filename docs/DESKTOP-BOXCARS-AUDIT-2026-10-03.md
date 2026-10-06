# Modern desktop Boxcars audit — 3 October 2026

## Result and scope

The existing curated Boxcars composition is retained. The desktop master now uses a reusable **Modern** wordmark, shared Tailwind v4 design tokens and the existing Next.js App Router/data boundaries. This is a desktop review candidate; it is not an approved immutable template release or a deployed dealer.

Canonical source: `L:/CODEX/cars/templates/modern`, in `darkapoparka/cars` on `main`. Implementation began from Cars commit `6fde646bb479363585a60284accc2f3985f5d430`. Before captures came from the existing production preview on port 6482. The final production artifact is `.next-public-e2e-boxcars-audit-acceptance-20261003-demo`, built with Node 22.23.2, pnpm 11.4.0, Next.js 16.3.8, React 19.2.4 and Tailwind CSS 4.3.0.

The local reference at `http://127.0.0.1:6455/` is `templates/boxcar-updated`. Its PDP provides a useful comparison for the gallery, sidebar and information-panel hierarchy. Modern retains its existing native vehicle data, gallery, search, shortlist, locale and phone/finance journeys. The reference's single-image thumbnail strip was not added to the one-photo sample listing; the gallery now clearly shows the actual `1 / 1` count. This review does not claim parity with every page or feature in the complete commercial Boxcar package.

## Findings resolved

| Finding | Final behavior and owner |
| --- | --- |
| Master identity was coupled to the sample dealer logo | `DealerDesktopLogo` supplies Modern for the source-bound static master. A personalized slug uses the configured dealer raster logo, including its inverse variant. Header, footer, desktop About and the PDP identity share this boundary. |
| Desktop CSS repeated palette, geometry and typography literals | Thirteen desktop CSS modules now consume `packages/design-system/styles/desktop-tokens.css` and the existing Tailwind v4 spacing/type tokens. The existing palette, image coverage and page composition remain. |
| Home card styling depended on its ancestor's global markup | An explicit `desktopSurface` presentation prop selects the existing landing/inventory treatment. Service tile tones and the transaction price also have explicit selectors. |
| Narrow PDP related cards cramped prices and specifications | At 1024–1199px, related vehicles use three columns. Card price rows wrap when needed, specifications stay within their card, and long title/prose content can wrap. Wider desktop composition remains. |
| PDP image sizing described a wider image than the rendered gallery | Desktop `sizes` follows the gallery/sidebar geometry. The mobile `100vw` hint remains. The photo count is desktop-only and hidden from duplicate screen-reader output. |
| Safari's PDP map emitted a fullscreen permission-policy error | The desktop iframe now grants fullscreen permission, as the existing mobile/contact map already does. A fresh WebKit run loads the map without the error; the external map handoff stays usable. |
| Persisted shortlist content could contain an external backslash route | Saved snapshots accept bounded native listing paths and approved image sources, deduplicate IDs and cap entries. Storage is scoped to the dealer and mounted base path. The legacy master key is read safely without deleting it. |
| Saved links/prices carried the locale in which they were stored | Native links open in the active locale; new money snapshots format for that locale. Backdrop, Escape, button dismissal and focus return are verified. |
| Hero artwork and image-host rules were duplicated | Configurable desktop banner artwork uses the existing site-artwork/base-path boundary. `public-images.ts` supplies the optimizer and shortlist allowlist. |
| Full-workspace architecture/environment checks had drifted | The missing public locale-menu export and direct environment-read registrations are corrected. The optional AI trial-limit schema, Turbo inputs, runbook and contract coverage agree. No provider is enabled by this work. |
| Dependency audit included a critical Next.js advisory | All Next.js dependencies/peers are pinned consistently to 16.3.8; published axios, brace-expansion, fast-uri and undici fixes are applied through the retained workspace lockfile. |
| Windows AVIF work stalled and left transparent icons unfinished | Windows uses one encoder worker with the native libvips operation cache disabled. Image formats, source assets and responsive hints remain. Cold/repeated transparent-PNG AVIF responses and browser loading are checked. |
| Small footer demo disclosure failed contrast | The existing unobtrusive disclosure now uses opaque white on the blue desktop footer and passes the automated contrast check. |

The master remains a demo. Its sample inventory/contact data, the original mobile identity and existing metadata are preserved within the requested mobile boundary. Actual dealer copies must receive their own identity, permitted imagery, contacts, metadata and truthful inventory through the Cars adapters and dealer QA.

## Verification

| Check | Result |
| --- | --- |
| Full workspace unit suite, `pnpm unit` | 1,152 tests passed; 19 Turbo tasks succeeded. |
| Full workspace `pnpm typecheck` | 28 tasks succeeded. The final production build also performed Next's TypeScript check. |
| `pnpm check` | 1,107 files checked; no fixes or errors. |
| `pnpm boundaries` | 1,143 files in 30 packages; no boundary issues. |
| `node --test scripts/*.test.mjs scripts/lib/*.test.mjs` | 98 passed, including architecture, environment, localization and refactor contracts. |
| Cars workflow check and script tests | `node scripts/check-workflow.mjs` passed; 315 Cars script tests passed. |
| Production web build | Node 22 / pnpm 11.4, `pnpm --filter web exec next build --webpack`, static demo environment; passed. |
| Desktop browser suites | 26 passed across Chromium and WebKit. Following the final map permission fix, all four focused PDP cases passed again. |
| Mobile browser suites | 148 passed across Chromium and WebKit, including 320/360/390/430px and landscape checks, dialogs/history/focus, search/forms and automated accessibility. |
| Desktop accessibility | Thirteen BG/EN pages, WCAG 2 A/AA and 2.1 AA axe rules: zero reported violations after the footer correction. |
| Internal links | 85 distinct reachable internal destinations returned HTTP 200. |
| Shortlist probes | Unsafe external route discarded; unsupported thumbnail sanitized; duplicates reduced to one saved entry; EN links retained the current origin. |
| Rendered pages | Home, Cars, PDP, About, Contact, Import, Sell, Finance, Blog and Guides; EN Home/Cars/PDP at 1440px. Home/Cars/PDP also checked at 1024, 1280 and 1920px; five core WebKit frames at 1440px. No remaining observed overflow, broken visible images, duplicate IDs, empty buttons or application/console errors in the completed final frames. |

### Mobile preservation

Twenty-one before/after frames cover the ten BG routes above at 320 and 390px plus Home at 1023px. Every frame has identical rendered dimensions, geometry, typography, CSS colors and backgrounds. The visible mobile components/styles and source raster assets are unchanged.

The security/runtime update changes optimized image bytes, so these are **not pixel-identical screenshots**. All changed pixels are within image bounds or the existing translucent mobile dock, whose unchanged backdrop filter reflects the images beneath it. There are zero unexplained pixel differences outside those regions. The hidden desktop photo-count span changes parent `textContent` on the two mobile PDP frames; its `aria-hidden` state leaves the visible and accessible mobile gallery text intact.

The complete raw captures, browser reports, build/typecheck/unit logs and image diagnostics are in ignored `runtime/boxcars-audit-20261003/`. The compact receipt and representative screenshots are retained below. Earlier failed image/permission checks are superseded by the final reruns, not counted as passes.

## Before / after evidence

| Page | Before | After |
| --- | --- | --- |
| Home, 1440px | [Full frame](assets/modern-desktop-audit-20261003/home-before.png) | [Full frame](assets/modern-desktop-audit-20261003/home-after.png) |
| PDP, 1024px | [Full frame](assets/modern-desktop-audit-20261003/pdp-before.png) | [Full frame](assets/modern-desktop-audit-20261003/pdp-after.png) |

[Compact verification receipt](assets/modern-desktop-audit-20261003/verification.json).

## Remaining release gates

The production dependency audit decreased from 1 critical / 15 high / 14 moderate / 5 low to **0 critical / 1 high / 3 moderate / 1 low**. The remaining high advisory is [`braces` stack exhaustion](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), reached through the Vercel Toolbar dependency graph. The registry's current 3.0.3 has no published patched replacement; the advertised 3.0.4 is unavailable. The static public demo disables the toolbar, but the complete workspace's `pnpm audit --prod --audit-level=high` still fails. No advisory is suppressed and no fictitious override is added. The full `pnpm verify` release gate is therefore not established.

`templates.lock.json` still selects Modern commit `b66693e3a475ef563ab45f51e4297e7073830ec1`. That immutable source passes the existing release integrity check; the working master is intentionally newer. The new source needs exact-commit native localization, mounted and public deployment acceptance required by [Cars template promotion](../../../docs/TEMPLATE-PROMOTION.md), along with the dependency resolution and owner visual review. Local desktop/browser success cannot fill those fields. Dealer source and deployments are not changed by this task.

Use the existing release CLI to inspect this committed candidate and bind repository, revision, subtree, Git tree and normalized digest. Subsequent client builds must consume the reviewed immutable release through the Cars tools. See [site configuration](SITE-CONFIGURATION.md), [template boundaries](../TEMPLATE.md) and [Cars coordination](../../../docs/COORDINATION.md).

Unrelated Cars/template work and the pre-existing untracked `docs/DESKTOP-HERO-CORRECTION-2026-10-03.md` are preserved. Only the reviewed Modern task paths belong in this commit. Final review artifacts remain available while owner acceptance and the release gates are pending.
