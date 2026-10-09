# Desktop hero correction — 3 October 2026

The previous desktop pass joined the header and hero into one frame on a grey
background. This correction follows the locally available Boxcars homepage:
a white header above a separately rounded photo hero, on a white homepage.
The blue-car image, title, search composition and existing white cards remain.

## Changes

- `packages/marketplace-ui/components/dealer-desktop-header.module.css`: remove
  the outer header frame and top margin; align the navigation with the hero's
  1392px maximum width and 24px minimum side gutters.
- `packages/marketplace-ui/components/dealer-desktop-hero.module.css`: restore
  all four 20px hero corners and remove the frame shadow.
- `apps/web/app/[locale]/desktop.css`: replace the homepage's grey gradient with
  a flat white surface. Inventory and finance retain their existing grey canvas
  and white components.
- `apps/e2e/specs/desktop-panel-flows.spec.ts`: update the existing geometry
  assertions for the white surround, contained navigation and separate hero.

All three CSS changes are inside `min-width: 1024px`. No mobile component,
content, data, image, provider or dealer source was edited.

## Verification

Evidence is retained locally under
`runtime/desktop-hero-correction-20261003/` in this template. It includes source
hashes, command logs, screenshots, route receipts and failed-run traces.

| Check | Result |
| --- | --- |
| Biome on the four edited source files | Passed |
| Web unit tests | 186 passed |
| Marketplace UI unit tests | 85 passed |
| Web and E2E TypeScript checks | Passed |
| Isolated optimized web build | Passed; eight static pages generated |
| Fresh Chromium and WebKit visual captures | 23 states, HTTP 200, no page exceptions, horizontal overflow or broken images |
| Mobile positions, sizes and font sizes | Seven of seven matched the baseline |
| Desktop browser actions | All eight selected cases passed across Chromium and WebKit |

Desktop captures cover the Bulgarian and English homepage at 1024, 1440 and
1920px, plus Bulgarian inventory and finance at 1440px. Mobile captures cover
the homepage, inventory and finance at 320 and 390px, and the homepage at 1023px.
The existing browser cases check the hero and page proportions across seven
other routes, client navigation, filter drafts and vehicle detail interactions.
The first Webpack run retained three route-compilation timeouts and one early
client-navigation failure. Warm-route runs passed both geometry cases and the
vehicle detail case. A subsequent WebKit run exposed a null initial header
measurement. The navigation test now waits for a visible header and the
existing search input's hydration readiness before measuring; both engines
passed with all navigation and geometry assertions intact. No timeout,
retry or skip was added. See `stable-browser-results.json`,
`warm-chromium-results.json`, `warm-webkit-results.json` and
`navigation-ready-results.json` for the complete sequence.

Mobile preservation was also checked using the same Turbopack pipeline before
and after the source edits: all seven geometry/style records match exactly.
Three screenshots are pixel-identical; the other four differ by 174 color
channel values in total, with a maximum channel difference of eight.
`mobile-same-bundler-comparison.json` retains those results.

The final preview uses Webpack. Its raw comparison against the Turbopack
baseline is retained in `mobile-comparison.json`: color serialization and
rendering differ, so those screenshots and full color strings are not claimed
to be identical. The separate `mobile-layout-report.json` confirms all seven
positions, sizes and font sizes still match.

## Preview and preservation

The source-backed preview is `http://127.0.0.1:6482/bg`, with Node 22.23.2,
pnpm 11.4.0 and Next 16.3.3, using `next dev --webpack`. Turbopack development
chunk failures observed during WebKit checks are retained in the earlier
receipts. A fresh Webpack output directory resolved those failures.

Generated output is on the C drive through an ignored output-directory
junction. Each generated-cache dependency link resolves to its canonical
Modern workspace dependency; source dependencies were not replaced. Earlier
failed cache directories and traces were preserved. The inherited Vercel
Toolbar configuration warning was not addressed by linking or publishing.

`workspace-doctor.mjs --fetch` confirms Cars is on main and in sync with its
remote. Other template drafts, independent repositories, recovery worktrees,
session data and existing locks are outside this change and preserved.
This receipt records local implementation and QA; template promotion, owner
visual acceptance and dealer deployment remain separate actions.
