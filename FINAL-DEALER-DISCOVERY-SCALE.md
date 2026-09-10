# Final dealer discovery scale handoff

Date: 2026-07-22

## Scope

This pass keeps the approved dealer-directory cards and filter rail, while making the public `/bg/dealers` and `/en/dealers` discovery state bounded, deterministic, shareable, and recoverable across navigation.

## Before and after

| Concern | Before | After |
| --- | --- | --- |
| Demo scale | Eight organizations did not expose dense-data or pagination defects. | 120 deterministic organizations cover long BG/EN names, all supported roles, several countries and cities, 0/1/many inventory, verified/unverified core identities, and missing avatar/preview media. Generated demo identities remain explicitly synthetic and unverified. |
| Result bound | The small fixture hid the result-limit contract. | The public view renders 18 organizations per page, clamps out-of-range pages, and exposes seven pages for the 120-entry fixture. |
| View state | Grid/list relied on a browser-local preference and could not be shared. | `view=grid|list` is part of the directory URL. URL intent wins; local storage is used only when the URL omits `view`. |
| Hydration | An early view click could be lost while stored preference hydration was pending. | View controls are disabled/inert until hydration. The server and initial client render the same grid state plus a same-size filter placeholder, then apply a valid local fallback. A deterministic script-blocking regression proves both paths. |
| Navigation | Some filter/reset transitions could silently discard view state. | Search, filters, sorting, pagination, clear/reset, locale changes, reload, browser back/forward, and browser return from a profile retain their applicable URL state. |
| Ordering | Equal primary sort values depended on input order. | Every directory sort has a final stable `id` tie-breaker and filtering does not mutate the source array. |
| Render/network cost | A dense page could fan out route-prefetch work for every card action. | Only 18 organizations render per page and directory card/profile/preview actions opt out of eager route prefetch. A browser regression records zero generated-profile prefetches before activation. |
| Accessibility | Count changes and pagination navigation did not consistently restore context. | Visible/mobile and screen-reader/desktop result counts are live and atomic, include page position, pagination exposes the current page, and keyboard pagination focuses the results heading. |
| Narrow layout | The result summary and import CTA caused document overflow at 360px. | The summary stacks below 380px and the CTA becomes full width; document overflow is absent from 360px through 1918px and at the 200% reflow equivalent. |

## State contract

Directory state is encoded by `q`, `type`, `country`, `origin`, `brand`, `availability`, `verified`, `official`, `sort`, `page`, and `view`. Invalid values fall back through the typed schema. Page is omitted at page 1 and is clamped to the available result range on the server.

View precedence is deliberately:

1. Valid URL `view` intent.
2. Valid local-storage preference when URL intent is absent.
3. Grid default.

The server always emits deterministic markup. Until client hydration completes, grid/list controls remain disabled and the interactive desktop filter bar is represented by an inert same-size placeholder. This avoids both lost early clicks and server/client input-style mismatches.

## Scale and performance evidence

- Dataset: 120 unique ids and slugs; four supported organization roles; eight country/city combinations; 0, 1, 7, and 21 inventory states; missing avatars and listing previews; deliberately long Bulgarian and English names.
- Algorithm: filtering is linear in the source count and sorting is `O(n log n)` with stable id tie-breaking.
- Bound: 18 result cards/rows per response; 18 on pages 1-6 and 12 on page 7.
- Focused scale unit test, including filter/sort stability and immutability, completes well below its 500 ms ceiling.
- Browser matrix loaded only 7-8 image resources for an 18-card viewport and emitted no generated-profile prefetch requests before activation.
- No duplicate React keys, client stalls, broken images, page errors, console errors, or document overflow were observed in the rendered matrix.

## Route and state matrix

| Route/state | Evidence |
| --- | --- |
| BG and EN, grid and list | Both localized routes render 120 total results with 18/page; URL view persists through reload and locale changes. |
| Search/filter/sort | Query, organization type, country/origin, availability/trust facets, and sort serialize into the URL and survive history navigation. |
| Pagination | Keyboard activation advances to page 2, retains other params, announces `120 results · page 2 / 7`, and focuses the results heading. |
| Bounds | `page=999` clamps to page 7 and renders the final 12 entries. |
| Zero results | Zero count is announced, the empty state renders, and pagination is absent. |
| Profile and browser return | Profile links resolve; browser Back restores the complete directory URL and view. |
| Hydration/local storage | Stored list preference applies only after hydration when URL omits view; URL list intent remains authoritative over a conflicting stored grid preference. |
| Missing media | Deterministic generated initials/avatar presentation and local listing-media fallbacks render without remote dependencies or broken images. |

## Rendered QA

The following widths were exercised against the current combined checkout: 360, 390, 768, 1024, 1280, 1440, and 1918 pixels, plus a 720-by-450 viewport representing 200% reflow from a 1440-pixel desktop. At every width the document scroll width remained within the viewport. The intended mobile navigation/type rows remain internally scrollable without creating document overflow. Visible cards within each grid row remained aligned, and the desktop sort/view group remained visible at 1024-1918px.

Automated WCAG 2 A/AA, 2.1 A/AA, and 2.2 A/AA scans at 390px and 1440px reported no violations. Keyboard pagination, focus restoration, accessible view names/states, live counts, and empty-state behavior were also exercised.

## Screenshots

- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-360x844.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-390x844.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-768x844.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-1024x900.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-1280x900.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-1440x900.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-grid-page2-1918x754.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-en-list-page2-1440x900.png`
- `M:\automarket-forge\.codex-artifacts\dealer-discovery-scale\dense-reflow-200pct-equivalent-720x450.png`

## Verification

- `pnpm --filter @repo/marketplace test -- directory.test.ts`: 19 passed.
- `pnpm --filter web test -- lib/public-organization-directory-view.test.ts lib/default-organization-avatar.test.ts`: 9 passed.
- `pnpm --filter @repo/marketplace typecheck`: passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter e2e typecheck`: passed.
- Deterministic hydration regression through both `public-mobile-chromium` and `public-desktop-chromium`: 4 passed, no retries.
- Final full organization-directory browser suite through both public projects: 14 passed in 4.5 minutes, no retries.
- Canonical `CI=true node apps/e2e/run-public-gate.mjs`: every directory case passed in mobile and desktop. The overall gate exited 1 after 91 passes because four out-of-scope listing-contact assertions received 404 responses, with one unrelated sell-page flaky retry. Evidence: `M:\automarket-forge\.codex-artifacts\public-e2e\public-demo-13400-mrvfbkxh`.

## Remaining ownership boundary

Browser Back and Forward preserve the complete directory state. The profile page's explicit “Back to dealers” link still targets the plain locale directory URL and therefore does not restore search params. That link is owned by the excluded dealer-profile route, so it was intentionally not changed in this directory-only pass.
