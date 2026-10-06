# QA contract — Modern

Passing a build is necessary but not sufficient. A lead variant must also be inspected as a dealership experience.

## Install/run
- Install: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/database build`
- Preview: `pnpm --filter web exec next dev -H 127.0.0.1 -p 6462`

## Modern local preview environment
For this repository only, a local static-demo review can use these PowerShell values before starting the web app:
```powershell
$env:SKIP_ENV_VALIDATION='true'
$env:AUTOMARKET_PUBLIC_DATA_MODE='demo'
$env:NEXT_PUBLIC_WEB_URL='http://127.0.0.1:6462'
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:6466'
$env:NEXT_PUBLIC_APP_URL='http://127.0.0.1:6467'
pnpm --filter web exec next dev -H 127.0.0.1 -p 6462
```
These values are for local review, not hosted production configuration. Do not invent provider credentials.

On Windows, the web configuration uses one image-encoder worker and disables the native libvips operation cache to prevent AVIF stalls under concurrent local browser checks. AVIF/WebP formats, source assets and responsive image hints stay intact. Verify cold and repeated optimized transparent PNG requests with an AVIF `Accept` header, then inspect header icons and ordinary route loading after runtime changes. A warm image cache alone can hide an encoder problem. Other operating systems retain the existing optimizer settings.

For Vercel static-demo deployments, the web app derives the deployment HTTPS origin from Vercel-provided metadata and intentionally collapses web/app/api public origins to that one host. This exception is enabled only when `leadSite.staticDemoMode` is true; full production mode still requires distinct real service origins.

## Framework checks
- `pnpm --filter web typecheck`
- `pnpm --filter web build  # with the documented preview environment`

For desktop changes, also run `pnpm refactor:contracts`, `pnpm release:preflight:contracts` and `pnpm release:preflight:test`. The desktop browser suites are `desktop-panel-flows.spec.ts`, `boxcar-desktop-actions.spec.ts` and `modern-desktop-reuse.spec.ts`; inventory changes also use `desktop-inventory-search.spec.ts`, `desktop-inventory-layouts.spec.ts` and `desktop-category-navigation.spec.ts`, `desktop-filter-logic.spec.ts` and `desktop-overlay-scrollbar.spec.ts`. Qualify Chromium and WebKit against the same production output. Review complete pages at 1024, 1280, 1440 and 1920 px, plus BG/EN routes, keyboard focus, shortlist persistence, gallery dismissal and local-only form states. Check the hero Type selector across all four category routes, budget/year/sort preservation, Make/Model clearing, Escape focus and browser Back; focused Make/Model, Price and keyword dialogs from the hero; Filters/Sort centered together below the banner above the cards; the floating View menu containing Grid/List and the secondary master Quick/Sidebar choices. Verify that the View button keeps its viewport position when scrolling, exposes the selected radio choices, dismisses with Escape and restores focus. The vehicle count remains a screen-reader announcement without visible count text. Verify applied-filter removal, unsubmitted sidebar drafts, preference reload and invalid/blocked preference storage. Closing a focused dialog must discard its draft and restore focus; clearing it must retain unrelated applied filters. For the full dialog check all 13 sections across its five groups, shared draft preservation, numeric input commits when leaving a group by pointer or keyboard, independent clearing and reset/apply. Check independent full-dialog Make/Model searches, category-specific taxonomy, inventory fallback, empty-category return focus, stale-count suppression and body-variant clearing. The hero picker retains its Make/Model stage keyboard navigation. Include 600 px-high desktop viewports to verify scrolling options and the fixed footer, waiting for layout to settle after viewport changes. Wait for a preview menu's close animation to finish before opening it again. Capture 320/390 px and the 1023 px boundary before and after a desktop-only change to prove mobile preservation. [Banner-controls evidence](DESKTOP-INVENTORY-BANNER-CONTROLS-2026-10-04.md) records the banner row and floating menu; [Filter width evidence](DESKTOP-FILTER-WIDTH-2026-10-04.md) records the 960 px dialog, three range cards and two-column presets; [Filter logic evidence](DESKTOP-FILTER-LOGIC-2026-10-04.md) records the current grouping; [Filter-controls evidence](DESKTOP-INVENTORY-FILTER-CONTROLS-2026-10-04.md) records the preceding controls qualification; [search-box evidence](DESKTOP-INVENTORY-SEARCH-BOX-2026-10-04.md) and [desktop options evidence](DESKTOP-INVENTORY-OPTIONS-2026-10-04.md) are retained as history. None of these local checks replace mounted/public release evidence or owner visual acceptance.

## Browser matrix

[Desktop card badges](DESKTOP-CARD-BADGES-2026-10-05.md) replace the showroom subtitle with visible year, full variant, body style, mileage, fuel and gearbox badges. Check Home, Cars in Grid/List, and related stock in BG/EN at 1024, 1280, 1440 and 1920 px. Long variants wrap within their badge, price and the filled brand-color Details action do not overlap, and keyboard activation of the card opens the correct listing. Keep matched 320/390 and 1023 px captures for mobile preservation.

[Compact desktop Home](HOME-BANNER-COMPACT-2026-10-05.md) keeps the banner between 400 and 440 px, with a 52 px headline cap and 76 px search bar. Check BG/EN at 1024, 1280, 1440 and 1920 px: the configured photo keeps both wheels visible and the first stock row starts before 800 px. Run the Home frame and search/sidebar cases in `desktop-panel-flows.spec.ts` against Chromium and WebKit. Compare matched Home captures at 320, 390 and 1023 px, plus Cars and Leasing at 1440 px, to confirm the change stays within desktop Home.

[Current inventory Type and controls](DESKTOP-INVENTORY-TYPE-AND-CENTERED-CONTROLS-2026-10-05.md) record a four-field search capsule and Filters/Sort centered together outside the banner. Check the group midpoint against the card grid, all four Type options, keyboard focus against the white page, all six sort labels in both locales at 1024 px, and both Type and View menus in a 600 px-high window. [The preceding placement](DESKTOP-INVENTORY-CONTROLS-BELOW-BANNER-2026-10-05.md) is retained as history. [The preceding control polish](DESKTOP-INVENTORY-CONTROL-POLISH-2026-10-05.md) remains historical evidence.

Desktop overlays must also be checked with an actual scrollbar: Chromium's default headless launch hides it, so use `launchOptions: { ignoreDefaultArgs: ["--hide-scrollbars"] }` for this regression. `desktop-overlay-scrollbar.spec.ts` samples header, banner and controls during opening and verifies dismissal and restored focus for Type, Make, Model, Price, Search, Filters, Sort and template preview at 1024, 1440 and 1920 px in BG/EN. A stable root gutter owns the reserved space; locked body styles must not add a second compensation. Frame width assertions use the available body width, including the OS gutter. Inspect native Saved and gallery dialogs too. On Contact, check equal-height columns, the compact configured logo, white cards with the standard soft hover against the brand-color pane, and the existing local-preview form. Run `desktop-contact-card-actions.spec.ts` for full-surface links, copy success/fallback, the static phone heading and copy-tooltip hover, keyboard focus and Escape dismissal. [Modal/Contact evidence](DESKTOP-MODAL-CONTACT-POLISH-2026-10-04.md) records the scrollbar reproduction, qualification and mobile preservation.

Test at **390px** and **1440px**. Minimum route set:
- `/cars`
- `/bg/cars`
- `/bg/listing/bmw-x5-m50d-sofia-2020`
- `/bg/contact`
- `/bg/imports`
- `/bg/sell`
- `/bg/lease`

On the tested routes, exercise navigation, mobile menu/open-close behavior, one search/filter path, one vehicle-detail transition and return path, phone/contact CTA, map/contact link, and the main sell/finance/import/enquiry path that the lead actually offers.

## Visual/content checks
- Correct dealer logo and favicon; no stretched or low-quality placeholder identity.
- No inherited dealer name, phone, address, domain, map, social account, testimonial, watermark or metadata.
- Inventory photos/titles/specs/prices/statuses agree with the sourced fact pack.
- No missing images, broken links, horizontal overflow, clipped controls or unreadable contrast.
- Mobile and desktop preserve the template's intended composition rather than collapsing into a generic rewrite.
- Currency, units, language and finance wording match the dealer's market.

## Runtime truthfulness
Check console/page errors. Forms, chat widgets and calculators may be demo interactions; record that clearly unless real delivery/integration is configured and tested. A localhost 200 response is not a deploy verification.

## Mobile request regression checks
- Import: a supplied listing link remains visible and editable; optional vehicle details expand without losing the draft. Without a link, make and model are labelled as required. Link edit and expansion controls wait for hydration.
- Delivery readiness: Import and mobile financing show the phone handoff when delivery is unavailable. Configured delivery retains contact fields and real submission; never simulate successful delivery.
- Sell: Back and dismissal preserve unfinished details, clear requires confirmation, and clearing removes draft query parameters without removing unrelated parameters. The entry and review action explain the phone handoff.
- Leasing: term and initial-payment controls describe request preferences, not recalculation of the advertised monthly estimate. Selecting a vehicle preserves existing card geometry.
- Discovery/PDP: make/model search retains filter URL state; compact mobile segments switch Overview/Details with touch and keyboard. Vehicle specifications remain in Details without a duplicate metadata row below the title. Phone, gallery and map actions remain reachable.

Run `pnpm --filter web test` and `pnpm --filter @repo/marketplace-ui test`. The web Vitest config uses automatic JSX transformation for component rendering while Next retains its own JSX configuration.

With the local demo already running, set `E2E_BASE_URL` to its actual origin and run `pnpm --filter e2e exec playwright test --config=playwright.modern.config.ts`. The suite prepares a returning-visitor cookie through the local preferences endpoint so page checks can reach the underlying UI. Separate welcome tests start with an empty session and verify dismissal persists at 320px and 390px. Tests block enquiry submissions; the welcome tests allow only the local preferences write. Static financing opens the phone handoff immediately, including when additional scripts are delayed. For a bounded WebKit check, select `modern-mobile-completion.spec.ts` and `modern-mobile-architecture.spec.ts` with `--project=modern-mobile-webkit`.

## Final identity search
Search the full lead copy for: `Day & Night|Day Night|day-night|0877 733 110|Атанас Манчев|kristiankirilov` plus the old domain/social/logo filenames. Provenance/history files can retain source names if clearly historical; active UI/data/metadata cannot.

## Done gate
Do not mark ready until checks pass or each failure is explicitly documented with impact. Report exactly which commands, routes and widths were tested.

Current cross-repository ownership, approved releases, dealer-copy workflow and standalone/mounted limits: [Cars integration](CARS-INTEGRATION.md).
