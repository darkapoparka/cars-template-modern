# Modern desktop Next.js code review — 3 October 2026

This review covers the current Boxcar Home 10 desktop implementation in the reusable Modern master. The installed stack is **Next.js 16.3.3, React 19.2.4, Tailwind CSS 4.3.0**, Node 22.23.2 and pnpm 11.4.0. Modern uses Tailwind v4, CSS Modules and shared design tokens. No StyleX dependency or import was found in this workspace. Mobile uses the same Tailwind setup and its existing components.

## Changes

- The desktop saved-car button receives five display fields: id, title, price, image and href. A typed snapshot factory runs at the caller, so the server-rendered listing summary does not serialize the full listing into that client button. Existing local-storage format, labels, cross-tab updates and dialog behavior are preserved.
- Home stock, viewing-banner and journal image `sizes` follow the actual 1320 px frame, panel padding, gaps and column breakpoints. The shared vehicle-card API supports a desktop-only size hint; its existing mobile hint remains first in the media list.
- The server-rendered Home calls React's native `preload` API for its decorative hero. It applies only to the unfiltered dealership Home and uses `media="(min-width: 1024px)"`. React handles repeated resource calls during streaming. The desktop logo uses `fetchPriority="high"` with lazy loading, replacing Next's deprecated `priority` prop and allowing the hidden desktop logo to defer on mobile.
- The journal renderer respects each supplied `article.image`. The Home page supplies the same three Boxcar assets as before, keeping asset selection at the page's content boundary.
- The desktop footer imports the saved-car client component directly through a package export, instead of routing that import through the full desktop header.

No CSS, font, inventory-data or image-asset files changed. The current desktop composition is retained.

## Architecture checks

App Router pages and the listing summary retain their server ownership. Home inventory and taxonomy reads already run in parallel behind the existing Suspense fallback. Interactive search, image fallback, navigation and shortlist controls keep their established client boundaries. No async Client Component, provider dependency or new browser-state hydration branch was introduced.

The complete pnpm monorepo and existing mounted-asset helper remain in use. Static demo forms keep their unsent-preview behavior. This code pass does not promote a template release or refresh dealer copies.

## Verification

The production Webpack build, web typecheck and scoped Biome check passed. Web has 186 passing unit tests and marketplace UI has 85. All 31 captured Chromium/WebKit states returned HTTP 200 with no page errors, horizontal overflow or broken visible images. All 17 matched mobile frames have zero changed pixels and identical visible geometry, covering eight routes at 320/390 px and Home at 1023 px.

All 18 unique desktop flow checks passed across Chromium and WebKit. The full matrix exposed one listing measurement that also selected hidden streamed markup; the corrected visible selectors were rechecked in both browsers. Original results and the focused recheck are retained. The source compiled for the final captures is unchanged.

The resource audit found one native hero preload in the head at every tested width, zero hero requests at 390 px and one at each desktop width. For the sample BMW listing, this button's serialized props decreased from 1483 to 254 UTF-8 bytes. This measures the button boundary rather than overall page or bundle size.

Executed checks, rendered routes and the mobile comparisons are recorded in [checks.json](desktop-next-code-review-2026-10-03/checks.json), [mobile-preservation.json](desktop-next-code-review-2026-10-03/mobile-preservation.json), [runtime-audit.json](desktop-next-code-review-2026-10-03/runtime-audit.json) and [tested-source.json](desktop-next-code-review-2026-10-03/tested-source.json). Full logs, initial failed attempts and screenshots remain in ignored `runtime/desktop-next-code-20261003/`.

The browser regressions cover the real rendered frame against its image hints, hero loading at both sides of the 1024 px breakpoint, bookmarks from both stock and the listing page, reload and cross-tab persistence, dialog focus and resize, search/filter drafts, navigation, gallery and phone actions, import, financing and the unsent enquiry preview.

These are local static-demo checks. Framework correctness and local browser evidence do not establish live provider delivery, hosted deployment or an absolute claim of perfect code.

## Framework references

- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components): keep server-rendered content outside interactive client boundaries and pass the data those controls need.
- [Next.js Image](https://nextjs.org/docs/app/api-reference/components/image): responsive size hints, loading behavior and the Next 16 `priority` deprecation.
- [React preload](https://react.dev/reference/react-dom/preload): resource hints during component rendering and equivalence of repeated image preload calls.
