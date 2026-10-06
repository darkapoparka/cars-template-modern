# Modern desktop hero frame

Started 2 October 2026; verification continued after midnight on 3 October. Local preview: http://127.0.0.1:6482/bg. Read-only Boxcars reference: http://127.0.0.1:6455/.

The shared header previously spanned the page while its navigation could reach 1600px and the photo hero stopped at 1392px. This made the two elements separate on wide screens. The desktop header now shares the hero's centered 1392px maximum and 24px outer gutter. Its white navigation forms the top of the rounded homepage frame, with the photo filling the lower portion. The frame has a 20px outer radius and a small pale-grey surround; the stock section below retains its white background and unboxed layout.

Boxcars reference variants 7 and 8 were inspected, along with the city variant and current curated homepage. The result adapts their rounded-photo and navigation/hero relationship to the existing Modern composition. The current blue actions, image, title typography, 680px photo height and 76px search bar remain.

At controlled 1440px viewport width, the header is x=24, y=24, width=1392, height=90. The hero is x=24, y=114, width=1392, height=680; their edges meet. At 1920px both center at x=264. Other desktop routes use the same header dimensions with all four corners rounded. Their content moves down by the intentional 24px top inset; the Cars sidebar starts at y=348 at 1440px.

All styling consumers are scoped to min-width 1024px. The two new desktop tokens have no mobile consumers. No mobile source, artwork, navigation, form logic or public-data boundary changed.

Changed paths:

- `packages/marketplace-ui/components/dealer-desktop-header.module.css`
- `packages/marketplace-ui/components/dealer-desktop-hero.module.css`
- `packages/design-system/styles/desktop-tokens.css`
- `apps/web/app/[locale]/desktop.css`
- `apps/e2e/specs/desktop-panel-flows.spec.ts`
- This receipt.

The existing desktop proportion test now checks matching header/hero edges and the combined outer corners, and updates the intentional vertical positions. Its other geometry, image, control, grid and overflow assertions remain, as does its 180-second timeout.

## Verification

- Scoped Biome passed for the four CSS files and existing browser test.
- All 271 existing web and marketplace UI unit tests passed (186 web, 85 UI).
- Web and E2E TypeScript checks passed with isolated public-demo run ID `desktop-hero-frame-20261002-build`.
- The final optimized web build passed after the last frontend edit, using that same isolated run ID. Compilation, build TypeScript validation and route generation completed successfully.
- Final Chromium captures cover EN/BG Home at 1024/1440/1920px, plus BG Cars and Lease at 1440px. All eight desktop states returned 200 with no page exceptions, horizontal overflow or completed broken images. Manual inspection covered laptop, standard and wide desktop framing and the Cars heading/cards.
- All seven mobile stable-geometry comparisons match: BG Home, Cars and Lease at 320/390px, plus Home at 1023px. Three screenshots are pixel-identical; the other four differ by 460 channel bytes total, with maximum delta 13. Only transient vehicle image-skeleton markers are excluded from stable geometry. Strict all-pixel equality is not claimed.
- The first browser run passed six of eight selected case/project combinations. WebKit's full route sweep hit a navigation timeout on BG legal content; its header-navigation case measured a transient empty initial header during a reload. These failures occurred while the separate TypeScript check was running. After TypeScript completed, the isolated WebKit rerun passed all four selected cases with no retries, skips or assertion/timeout changes. All eight distinct Chromium/WebKit combinations passed across those runs: EN/BG proportions at 1024/1440/1920px, client navigation/header stability, Home search/sidebar drafts, and listing gallery/phone handoff. The original reports, screenshots and traces are retained.

Evidence is retained in ignored `runtime/desktop-hero-frame-20261002/`, including the source baseline, initial and final captures, visual audit, mobile comparison, browser reports/traces, typecheck/build logs and fetch-backed workspace inspection. The first post-edit captures preceded a CSS specificity/formatting correction; `final-chromium/` was captured after that correction. Frontend/test SHA-256 fingerprints were checked again after the successful build.

The canonical Cars checkout remains on main. The clean Modern baseline was recorded at `5c75456d34fb15e1ae9ddbb3e65aebe324fe6e4e`; unrelated dealer/template changes, existing recovery worktrees and independent Admin divergence are preserved. The reviewed path manifest and scoped integration evidence are retained with this task's runtime handoff. The existing preview/reference listeners were preserved, temporary review tabs were closed and the browser viewport override was reset. This is reusable master source work; template promotion, dealer refresh, deployment and outreach are outside this pass.
