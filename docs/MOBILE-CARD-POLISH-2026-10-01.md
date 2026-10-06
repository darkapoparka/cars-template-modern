# Modern mobile card badges — 1 October 2026

Cars `main`, starting commit `437c9d24b1afc6dfe81af5d1172f7b7fd30b5c6a`.

## Result

The live Navara Modern variant reproduced the reported defect at 375px: the
last letter of `Електро` wrapped below the rest of the word. Its previous badge
rows used unequal columns, with a wrapping fallback on narrower cards.

- Every mobile fact row now has two equal columns, including at 320px.
- Badge text stays on one line and uses an ellipsis when space runs out.
- Automatic transmission reads `Автом.` in Bulgarian and `Auto` in English on
  mobile. Full values remain in accessible text and the badge title.
- Badge text uses regular weight (400), with 6px inline padding and a 24px
  minimum height. Title, price, image and desktop presentation are retained.
- The shared component applies to inventory, selected vehicles and related
  cars. Only the matching component, policy and policy test were copied to
  `clients/navara-car/modern`.

## Verification

Runtime: Node 22.23.2 / pnpm 11.4.0, using the complete workspace and demo data.

- Modern marketplace UI: 19 files / 84 tests passed.
- Modern web typecheck and production build passed.
- Navara Modern production build passed with `/variant-2` as its base path.
- Focused Chromium and WebKit checks passed for the four badge widths
  (320, 375, 390 and 430px), Bulgarian and English labels, 320px inventory
  semantics, desktop selected-vehicle markup, make/model search, and
  menu/gallery dismissal with focus return.
- Leasing selection, persisted selection, phone handoff, dismissal and reset
  were checked in both engines. The final reset reload waits for DOM readiness
  and retains the existing reset-state assertion, avoiding unrelated
  image-load waits.
- The requested in-app Browser inspected Navara at 320, 360, 375, 390, 430,
  768, 1024 and 1440px. All 14 mobile inventory cards retained four badges;
  their rows had equal widths, 24px heights and 400 weight. No wrapped badge
  text, horizontal page overflow or broken visible images were found.
- English inventory was also inspected at 320, 375, 390 and 430px.
- Navara search filtered to the actual Tesla results. Listing navigation,
  related cards, gallery navigation/dismissal, and mobile menu dismissal were
  exercised in the Browser. Listing facts retain the full fuel and gearbox
  values. Preview console inspection recorded no errors.
- Matched desktop screenshots retained the geometry and full labels; the
  pixel comparison changed approximately 0.04% of channels by more than 10/255.

Existing focused command, with `E2E_BASE_URL=http://127.0.0.1:6462`:

```powershell
pnpm --filter e2e exec playwright test --config=playwright.modern.config.ts --grep 'mobile spec badges|320px inventory|selected-vehicle desktop|menu and gallery|leasing selection|make and model search'
```

The first run passed 17 of 18 tests. WebKit's final leasing reload timed out
waiting for all page resources. The reset reload now waits for DOM readiness;
the original selection, handoff, persistence and reset assertions are retained.
Development compilation and hydration delays were diagnosed separately.
Badge assertions were retained throughout.
The final leasing rerun passed in both Chromium and WebKit: two tests in 49.3s.

## Evidence and delivery boundaries

Matched live-before/local-after images and JSON geometry measurements are
preserved under `L:/CODEX/cars/runtime/modern-card-polish-2026-10-01/`, including
`tesla-before-after-375.png` and `navara-before-after-375.png`.

Local mounted preview: `http://127.0.0.1:6600/variant-2/bg/cars`.
Live baseline: `https://cars-navaracar.vercel.app/variant-2/bg/cars`.

The mounted preview uses the exact served public four-design switcher as a QA
asset. The older three-design source was not substituted or repackaged.
Other dealer variants, unrelated dirty paths, ownership, contacts, providers,
lockfiles and deployment configuration were preserved.

An empty index lock created at 05:58:30 local time had no open file handle and
remained unchanged across ownership checks. Only read-only Git commands were
active. It was moved into this task's runtime directory as
`recovered-index-lock-20261001-055830.lock`; its original timestamps and path
are recorded in `index-lock-recovery.json`. No recovery evidence was deleted.
An identical empty lock created at 06:16:41 was checked the same way and
preserved separately before scoped staging. Other staged work was absent.

Automatic approval review rejected starting the local production preview with
`blocked by policy`. Both production builds passed; browser interactions used
the development previews. No public deployment or immutable template release
was performed. Hosted acceptance remains a separate step.

## Brand label follow-up

The mobile card now shows the actual make as a muted 12px line above its
single-line model title. A complete matching make prefix is removed from the
visible title; unfamiliar prefixes remain intact. The complete vehicle name
is retained as the accessible heading and tooltip. Desktop titles are retained.
Inventory, related cars and mobile financing selection use the same policy.

The text block distributes its remaining space so that the brand line starts
at the photo's top and the bottom badges end at its bottom. In the matched
Tesla example, card height remains 156px: photo and text stack both measure
132px. The original text stack measured 111px. Equal badge columns and
single-line truncation are retained.

The Browser checked all 14 Navara cards at 320, 375, 390 and 430px with no
misaligned columns, page overflow or broken visible images. English inventory
was checked at the same widths; desktop at 1440px retains full titles and has
no visible brand label. The actual Tesla detail and its three related cards
were also inspected. The complete model name remains in the listing heading.

Validation: 85 marketplace UI tests and both master/Navara web typechecks
passed. Fourteen focused Chromium/WebKit checks covered the brand/fact geometry,
desktop selection markup, leasing persistence/phone handoff, and menu/gallery
dismissal with focus return. The first run passed 13; one WebKit 390px check
lost its execution context during a development reload before assertions.
The unchanged check passed when rerun. Its original trace is preserved.
Biome and scoped whitespace checks passed. The React Best Practices review
confirmed derived text without additional state, effects or dependencies.

The matched comparison was captured at the browser's 356px viewport and is
preserved as `runtime/modern-brand-eyebrow-2026-10-01/tesla-brand-before-after.png`,
alongside geometry JSON and the reload trace. This follow-up uses the existing
development previews; production builds were not repeated for this label
iteration. No public deployment was performed.
