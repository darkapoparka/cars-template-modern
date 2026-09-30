# Modern mobile final pass — 29 September 2026

## Verdict

The reviewed mobile flows are usable and visually consistent. This is a focused
manual browser review, not a claim of complete WCAG conformance or production
performance acceptance. No dealer release or deployment was performed.

## Change from this pass

`packages/marketplace-ui/components/mobile-inventory-search.tsx`:

- Search result price and specifications now have separate lines. Names and
  specifications wrap instead of hiding most of the mileage at 320px.
- Search thumbnails use empty alternative text because the adjacent button text
  identifies the vehicle. This removes redundant, sometimes Bulgarian, image
  descriptions from English search results.
- The search field group has a visible focus ring in addition to its caret.

The inventory card design, desktop search and dealer source were not changed.

## Browser evidence

Reviewed the running demo at `http://127.0.0.1:6462` using the Codex in-app browser.
Viewport overrides included 320, 390 and 430 CSS pixels, plus 844 × 390 landscape
for the financing sheet. This browser reserves space for a desktop scrollbar;
its content area can be narrower than the requested viewport.

| Surface | Observed result |
| --- | --- |
| English cars and mobile homepage | No page-level horizontal overflow; year/mileage stay on one line; title/price hierarchy is distinct; last card clears fixed navigation. |
| Bulgarian cars at 320px | Featured badge, prices, specifications and bottom navigation fit. |
| Search | BMW X5 suggestion produces two vehicles; long Mercedes names and full specs remain readable after the change, in English and Bulgarian. No clipped search-result text in the checked Bulgarian results. |
| Filters | Price controls are labelled; applying a 40,000 BGN cap to BMW X5 produces the empty state; Clear filters restores inventory. Loading status is exposed during filtering. |
| Vehicle detail | Details/Description tabs work; photo dialog opens, Escape closes, and focus returns to its trigger. Main landmark exists. Call target is 52 × 52px. |
| Financing | Selection is preserved in the URL; the call sheet shows the selected car and truthful next-step copy. Sheet and call action fit at 320px and in short landscape. No call was placed. |
| Import | The details form has associated labels, optional fields and truthful call preparation copy; scrollable at 320px. No request was sent. |
| Sell | The manual details overlay is usable at 320px; empty review invokes native validation and focuses Year. No request was sent. |
| Menu and contact | Menu keyboard focus wraps inside the drawer; contact details and primary links remain readable. Locale preferences open and can be dismissed. |
| Guides and article | Guide cards and a representative article reflow at 320px; article body is 16px; skip target exists. |
| Images | First inventory images loaded; subsequent images loaded while reaching the end of inventory. No broken visible image remained in that check. |

Main inventory header and filter controls measured at least 44px high. Detail tabs
measured 40px high: above the WCAG 2.2 AA minimum, although below the stronger 44px
touch target recommendation. The viewport meta tag does not disable user zoom.
Representative search text contrast is approximately 7:1 for specifications and
18:1 for titles/prices against their light background; this is a spot check, not
a complete contrast scan of every state or raster icon.

Screenshots are local, ignored evidence under
`runtime/mobile-final-pass-2026-09-29/`: `cars-en-320.png`, `cars-en-390.png`,
`cars-bg-320.png`, `search-320.png`, `search-390.png`, `import-320.png`,
`home-bottom-430.png`.

## Checks

- `pnpm --filter web typecheck` — passed.
- `pnpm --filter @repo/marketplace-ui test` — 83 tests across 19 files passed.
- `pnpm --filter web build` with documented demo environment and Node 22.23.2 — passed.
- Scoped `git diff --check` — passed.

No new browser automation test was added for this small presentation change.
An axe scan was not run in this pass. Existing accessibility tests are not being
represented as freshly executed evidence.

## Remaining acceptance limits

- Real iOS/Android devices, VoiceOver/TalkBack, 200% text resizing, forced colours
  and reduced-motion behavior were not exercised in this pass. Source contains a
  reduced-motion rule; that alone does not verify its rendered behavior.
- Production Core Web Vitals and throttled-network loading remain unmeasured.
  A successful production build does not establish loading performance. The dev
  console reported the desktop studio image as lazy-loaded LCP; inspect that
  during the separate desktop/performance pass.
- The original in-app browser tab crashed once during search entry. Repeating
  search in a fresh tab succeeded. No application cause was established.
- A Turbopack CSS hot-reload error occurred after the edit. Reload recovered the
  page, and the production build passed. Do not suppress development errors to
  claim a clean run.
- Scrollable filter rails intentionally show partial next controls. Raster
  navigation artwork deserves a real-device visibility check, especially the
  grey icons on coloured headers. No measured WCAG failure is claimed for it.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
[Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html),
[decorative images alongside text](https://www.w3.org/WAI/tutorials/images/decorative/).
