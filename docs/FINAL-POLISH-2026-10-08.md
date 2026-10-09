# Modern polish closeout - 8 October 2026

The current reusable Modern design is ready for source delivery. Home and Cars
share Type/Make/Model search, refinements and aligned vehicle cutouts. Blog and
Services use matching desktop mastheads; About and Contact retain their distinct
photographic scenes. Desktop collection spacing, rounded actions, compact result
utilities and the More navigation menu follow the current TEMPLATE contract.
Mobile retains its existing composition and artwork.

Sorting no longer hides applied chips or moves the car grid. Clear all is a quiet
dark text action, and active desktop navigation uses colour without underlines.
Entering Cars normally starts at the top; the listing Back action explicitly
restores the saved inventory context. Dealer artwork overrides remain supported.

## Checks completed at closeout

| Check | Result |
| --- | --- |
| Marketplace UI unit tests | 124 passed, 23 files |
| Public web unit tests | 200 passed, 38 files |
| Marketplace unit tests | 179 passed, 17 files |
| Design-system unit tests | 21 passed, 2 files |
| Marketplace UI and E2E TypeScript | Passed |
| Next.js production Webpack build, including web TypeScript | Passed |
| Refactor contracts | 8 passed |
| Release preflight contracts | Passed |
| Release preflight harness | 87 passed |
| Biome on changed code/styles/tests | 50 files passed |
| Scoped whitespace check | Passed |
| Both photographic sets' source and served hashes | All six match provenance |

The production build used Node 22.22.0, pnpm 11.4.0 and the existing complete
workspace installation in static demo mode. Its isolated run ID was
`closeout-reviewed-20261008`. Development output was preserved and generated
`next-env.d.ts` was restored byte-for-byte. No UI source changed during closeout;
the configuration reference was updated to describe the final presentation.

## Browser evidence and limits

Earlier native in-app-browser checks in this session covered Home, Cars, Blog,
Services, About and Contact in BG/EN, relevant 1024/1280/1440/1920 widths and the
600 px-high desktop case. Matched mobile and breakpoint checks covered
320/390/1023 px. They checked draft cancellation and focus, Type/category
transitions, Home Search URLs, result layouts and navigation.

The final Sort checks passed in BG/EN at 1024/1440/1920: chip and card rectangles
stayed fixed while opening Sort, Escape restored focus, sorting retained price,
year and fuel, reload retained the selection, and Clear all kept the sort order.
Matched 320/390/1023 checks retained 34 measured nodes and ten vehicle cards at
each width. These are geometry/style comparisons, not a pixel-identical claim.
The persistent six-case Sort regression was typechecked; it was exercised
through native browser control rather than a Playwright CLI run.

Closeout rechecked source hashes against the saved evidence: 30 files matched
an evidence manifest. Three final navigation/editorial files had later edits
than their individual manifests, predating the final Sort/navigation review;
they received the current source, unit, type and formatting checks. Captures
remain in ignored `runtime/modern-hero-live-preview-2026-10-07/`.

The stopped development preview was restarted at `http://127.0.0.1:6482` and
Cars returned HTTP 200 with the inventory markup. A fresh visual rerun was
blocked because the browser tool could not operate on its cached `data:`
connection-error page. Existing browser evidence is therefore reported
separately from the fresh closeout source checks.

## Delivery scope

The scoped commit contains Modern frontend, tests, artwork and provenance,
plus the current template/configuration/QA references. Raw QA captures,
historical untracked reports, concurrent coordination edits and pending
dependency updates remain outside the commit. Other templates' staged and
unstaged work is preserved.

GitHub main source delivery does not update dealer clients, promote a pinned
template release or deploy a site. Mounted/public-hosted checks and live
inventory/email qualification remain separate release work. No enquiries were
sent and no live providers were changed.
