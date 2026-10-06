# Modern desktop refresh

## Current desktop design tokens

Desktop presentation values now come from the existing design-system palette, typography, radius, spacing, and elevation tokens, plus `packages/design-system/styles/desktop-tokens.css` for desktop layout settings. Component styles no longer contain their own literal colours, lengths, timings, or typography values. The frame, header, search, filters, inventory, cards, detail page, service pages, lease picker, and desktop dialogs use those shared settings. Standard spacing utilities and scale multipliers remain valid token consumers.

The category row and primary filters use automatic equal columns based on their rendered children. Their layouts no longer assume four categories or six filter controls. Responsive inventory/service column settings and custom desktop utility breakpoints live in the design system. The existing boxed composition, category artwork, underline, inset submit icon, and Mileage control remain in place. Native desktop form selects no longer embed a fixed-colour SVG arrow.

The existing refactor contract suite now also rejects local desktop palettes, dimensions, timings, and typography values in component styles, and local palette/arbitrary dimension utilities in desktop components. Breakpoint conditions, structural proportions, intrinsic image dimensions, and country-flag artwork remain layout/asset data. Mobile rules and the mobile Make/Model branch were preserved.

Validation on 2 October 2026 with Node 22.23.2 and pnpm 11.4.0:

- Web typecheck and the public-demo production build passed. The build reused the completed physical project output with `E2E_PUBLIC_RUN_ID=desktop-category-pills-final-local-20261002`. All 271 Web/Marketplace UI unit tests and all seven refactor contracts passed. Biome checked the 32 changed source/style/test files; the scoped Git whitespace check passed.
- The in-app browser checked eight Bulgarian routes (Home, inventory, vehicle detail, imports, sell, lease, contact, and guides) and English Home/inventory at actual 1024, 1440, and 1920px widths: 30 views without horizontal overflow or broken completed visible images. Search views retained four loaded category images, six equally sized 48px filters, and the submit target inside the field.
- Interaction checks verified the Mileage dialog and 100,000 km search (four results), advanced filter expansion without duplicate Mileage, reset/keyboard submission, BMW search (five results), Make/Model dialog sizing and Escape dismissal, and ascending price sorting. Opening the sorting menu preserved the boxed frame's position. The search and Make/Model dialogs resolved their shared width/height settings correctly. Fresh verification recorded no application errors.
- Sixteen fresh mobile before/after comparisons covered the same eight Bulgarian routes at 320 and 390px. All 673 persistent measured elements retained text, geometry, typography, foreground, and background. Temporary skeleton nodes were excluded. No mobile view overflowed or mounted the desktop category images. This is measured UI preservation, not a pixel-identical decoding claim.

Evidence is in ignored `runtime/desktop-tokens-2026-10-02/`, including the source replacement audit, route screenshots, mobile comparison, dialog captures, interaction results, and `modern-desktop-tokens-1440.png`. Browser verification used the in-app browser; the separate Playwright/WebKit suites were not rerun.

Local preview: http://127.0.0.1:6482/bg/cars. Dealer configuration, sample inventory, provider behavior, and unrelated working changes were preserved. This is shared source styling work; owner visual acceptance, template release selection, and dealer deployment remain separate.

## Previous underlined categories and inset search

The category artwork now sits above its label in four flat tabs immediately above search. The selected tab has a full-width red underline; the category tabs have no filled pill backgrounds. The existing generated car, truck, motorcycle, and van cutouts render at 88 by 48 CSS pixels. The existing category links continue to control search and preserve its URL parameters.

Search is one full-width field with its submit icon inside the right edge. The icon is 20px inside a 44px accessible submit target. The primary filter row now contains Make, Model, Price, Year, Mileage, and More filters in six equal columns, all 48px tall. Mileage uses the existing range picker, appears only once, and no longer increments the More filters count. All styling remains scoped to desktop widths of 1024px and above.

Validation on 2 October 2026 with Node 22.23.2 and pnpm 11.4.0:

- Web typecheck, the public-demo production build, all 271 Web and Marketplace UI unit tests, and Biome for the three changed source/test files passed. The build reused the completed normal project output with `E2E_PUBLIC_RUN_ID=desktop-category-pills-final-local-20261002`.
- The in-app browser checked Bulgarian and English Home and inventory at actual 1024, 1440, and 1920px widths. All twelve views had equal filter widths and heights, unclipped default labels, four loaded category images, an inset submit target, and no horizontal overflow or broken completed visible images.
- Selecting a maximum mileage of 100,000 km stayed as a draft on Home, then submitting through the inset icon navigated to `/en/cars?mileageMax=100000` and returned the correct four vehicles. More filters retained its unnumbered label, and expanding it showed no duplicate Mileage control. Reset and keyboard submission returned twelve vehicles. A BMW query submitted through the inset icon returned five vehicles at `/en/cars?q=BMW`.
- Fresh mobile before/after comparisons covered Bulgarian Home and inventory at 320 and 390px. All 302 persistent measured elements retained their text, geometry, typography, foreground, and background. Four temporary image-loading placeholders in the 320px Home baseline were excluded. No view overflowed or mounted desktop category images. This verifies measured mobile preservation, not pixel-identical image decoding.
- Fresh navigation and interaction checks recorded no new application errors. The existing desktop layout test assertions were updated to require the submit target inside the search field; separate Playwright/WebKit suites were not rerun.

Current screenshots and JSON evidence are in ignored `runtime/desktop-inline-search-2026-10-02/`, including `modern-desktop-inline-search-1440.png`, the twelve desktop captures, Mileage and text-search results, and this revision's mobile comparison.

Local preview: http://127.0.0.1:6482/bg/cars. Mobile components, dealer identity, sample inventory, provider behavior, and unrelated working changes were preserved. Owner visual acceptance, template release selection, and dealer deployment remain separate.

## Previous category image pills and filled controls

The desktop category row now sits immediately above vehicle search as four compact image pills. The selected pill uses a subtle grey fill and a short, centred red underline. The matching graphite car, truck, motorcycle, and van cutouts add category recognition without another heavy navigation bar. The existing category links continue to select the search category and retain the established URL behavior.

Search and Make/Model/Price/Year use filled grey surfaces, consistent rounded corners, and aligned chevrons. Selected quick filters use a solid charcoal fill. Expanded filters follow the same treatment without the previous horizontal divider. Inventory Filters, sorting hover/open state, and grid/list controls use matching grey fills. The existing boxed inventory and header remain in place.

The four transparent assets were generated with the built-in imagegen tool and copied into `apps/web/public/images/categories/desktop-category-*-v1.png`. The original generated outputs and existing category assets were preserved. [Asset manifest and exact prompts](assets/DESKTOP-CATEGORY-ARTWORK-2026-10-02.json) record the files and generation details. The desktop row renders the cutouts through the existing mount-aware Next Image wrapper at 72 by 44 CSS pixels. The existing desktop viewport hook prevents these images from mounting below 1024px; mobile category artwork was not replaced.

Validation on 2 October 2026 with Node 22.23.2 and pnpm 11.4.0:

- Web typecheck passed. The final isolated public-demo production build passed with `E2E_PUBLIC_RUN_ID=desktop-category-pills-final-local-20261002`. The final Web and Marketplace UI suites passed all 271 tests. Biome checked the three changed source files.
- The in-app browser captured Home and inventory in Bulgarian and English at actual 1024, 1440, and 1920px widths. All twelve views had four loaded category images, a centred category row, no horizontal overflow, and no broken completed visible images.
- Clicking Trucks completed navigation to `/en/trucks?category=truck`, selected the correct image pill, and displayed its 32px underline. The filled-control checks also verified a BMW draft stayed on Home until Search, returned five vehicles when submitted, expanded the advanced filter grid, and dismissed sorting with focus returned to the trigger.
- Fresh mobile comparisons covered Bulgarian Home and inventory at 320 and 390px. All 302 persistent measured elements retained the same geometry, text, typography, foreground, and background. None of those views overflowed or mounted the new desktop category images. This is measured UI preservation, not a pixel-identical image-decoding claim.

Current evidence is in ignored `runtime/desktop-category-pills-2026-10-02/`. Its mobile baseline is this pass's `runtime/desktop-filled-controls-2026-10-02/mobile-before.json`; the earlier filled-control interaction captures remain in that folder. Browser verification used the in-app browser; separate Playwright/WebKit suites were not rerun.

Low free space interrupted the previous preview's image cache. The owned Modern preview was restarted on the same port with a fresh isolated cache. Temporary C-drive build attempts picked up an unrelated globally installed Next 15 package through the physical output path and failed metadata collection; those attempts are excluded from passing evidence. The final successful build used the normal project path and pinned Next 16.3.3. Automatic approval review blocked removal of the earlier completed build directory, so it was retained.

Local preview: http://127.0.0.1:6482/bg/cars. Mobile rules, dealer identity, sample inventory, provider behavior, and unrelated working changes were preserved. Owner visual acceptance, template release selection, and dealer deployment remain separate.

## Previous desktop control polish

The owner rejected the boxed revision's header, category icons, tabs, filters, and sorting controls. The boxed inventory composition remains, with the desktop controls rebuilt as one consistent set. The header has centred navigation, a compact selected state, a clearly labelled BG/EN preference link, the actual showroom map link, and a quieter phone action. Category navigation uses compact text tabs before search. The quick filters use matching 44px fields with 10px corners, consistent borders, and restrained open/selected states. Expanded filters align in a four-column grid; draft status and reset share a deliberate footer.

Desktop sorting now uses the existing Radix Select from the design system. Its selected label renders immediately, its menu matches the surrounding controls, and selections keep the existing sort URL and inventory behavior. The grid/list toggle has a clear selected state. A desktop-only scroll-lock padding override prevents portalled menus from adding a second inset around the boxed page.

Validation on 2 October 2026 with Node 22.23.2 and pnpm 11.4.0:

- Web typecheck and the isolated public-demo production build passed (`E2E_PUBLIC_RUN_ID=desktop-controls-final-20261002`). All 271 Web and Marketplace UI unit tests passed. Biome checked the eight changed source files.
- The in-app browser captured Home, inventory, listing, imports, sell, financing, and contact at actual 1024, 1440, and 1920px widths. All 21 captures had no horizontal overflow or broken completed visible images. English controls were also inspected at 1024px.
- Browser interactions verified advanced filter expansion, a Diesel draft that stayed on Home until Search, seven resulting vehicles, reset, all twelve prices in ascending order, sort dismissal with focus returned to its trigger, list/grid switching, the full filters dialog, direct country/language preferences, and completed category navigation with the correct selected tab.
- At 1440px, the body and main frame retained identical bounds before and during the open sort menu. Fresh navigation and interactions had no new application errors. Earlier CSS hot-refresh errors recovered after document navigation.
- Fourteen actual mobile captures at 320 and 390px were compared with the previous boxed revision's valid mobile evidence. All 578 persistent measured elements retained their geometry, typography, text, foreground, and background; none of the routes overflowed. This is measured UI preservation, not a claim of identical image decoding. No mobile component or styling rule was changed by this control polish.

Evidence is in ignored `runtime/desktop-controls-2026-10-02/`, including `modern-desktop-polished-1440.jpg`, the open sorting menu, route captures, and JSON measurements. The mobile comparison uses `runtime/desktop-boxed-2026-10-02/mobile-after.json` as its valid baseline. Preliminary captures which targeted the reference tab's viewport are explicitly excluded in the evidence note. Browser verification used the in-app browser; the separate Playwright/WebKit suites were not rerun.

Local preview: http://127.0.0.1:6482/bg. Existing dealer identity, sample data, mobile presentation, and unrelated working changes were preserved. This is a local source revision; owner visual acceptance and template/dealer releases remain separate.

## Previous boxed revision

The owner selected the boxed showroom at http://127.0.0.1:6474/ as the stronger direction. Both that reference and the updated Boxcar preview at http://127.0.0.1:6455/ were inspected at desktop width. Modern now uses a centred 1248px outer frame on a grey canvas, a compact desktop navigation header, a full-width search field with an adjacent submit button, category tabs, and compact filter pills. The home route renders the existing inventory results with sorting and grid/list controls. Cards use larger 3:2 photographs, model headings, inline specifications, and clear prices. The grid uses two columns on smaller desktops and three from 1200px. Vehicle details and service pages share the same frame. Opening a modal preserves its horizontal position.

All visual rules are scoped to 1024px and above. Mobile components, form behavior, navigation, and the shared mobile card policies were preserved. The mobile image-size hint remains 46vw. Existing sample inventory, dealer identity, URLs, and static-demo behavior are retained.

Validation on 2 October 2026, with Node 22.23.2 and pnpm 11.4.0:

- Web typecheck passed. The final isolated public-demo production build passed with `E2E_PUBLIC_RUN_ID=desktop-boxed-final-20261002`.
- Biome passed for all thirteen changed source/test files. The existing Web and Marketplace UI suites passed all 271 tests.
- The Codex in-app browser inspected Home, inventory, vehicle details, imports, sell, financing, and contact at 1024, 1440, and 1920px, plus English Home at 1024px. All 22 captures had no horizontal overflow or broken completed visible images.
- Desktop interaction checks verified BMW text search (5 results), a Diesel filter draft and submission (7 results), reset, ascending price order, list/grid switching, vehicle navigation, gallery opening/Escape dismissal, and specification tabs. The frame's left edge remained 88.5px both before and during the gallery modal at 1440px.
- Fourteen mobile before/after captures covered the same seven Bulgarian routes at 320 and 390px. Every persistent measured visible element retained its geometry, typography, text, foreground, and background. Four temporary image skeletons in the 390px Home baseline had finished loading in the after capture; this is not a claim of pixel-identical image decoding. No mobile capture had horizontal overflow.

Current screenshots and JSON evidence are in ignored `runtime/desktop-boxed-2026-10-02/`. The existing focused desktop test assertions were updated for the boxed frame, catalogue heading, adjacent search button, and two/three-column grid. Browser interactions in this revision used the in-app browser; the Playwright/WebKit suites were not rerun. A transient Turbopack CSS hot-refresh error occurred while editing and recovered after full document navigation. Later captures and interactions had no new application errors; inherited image-size/LCP development warnings remain.

Local review preview: http://127.0.0.1:6482/bg. The reference projects were read-only. This is a local source implementation; owner visual acceptance, template release selection, and dealer publication remain separate.

## Previous light draft (superseded)

The owner rejected the initial dark masthead. The revised desktop uses a light navigation header, a plain typographic hero, one integrated search row at 1280px and above, and two rows with matching keyboard order on narrower desktop screens. Vehicle cards have clearer specifications, quieter badges, stronger prices, and a labelled Details affordance. The hidden desktop header uses the normal logo appropriate to the lighter surface. Mobile components and styling below 1024px were preserved.

The light draft was inspected at 1440px before the final card and narrower-desktop refinements. Typecheck, Biome for all ten changed source/test files, and 271 unit tests passed. The isolated production build passed. Final visual/interaction review and fresh mobile screenshot comparison are unfinished: the browser approval check rejected opening both Boxcar and the local Modern tab, reporting a blocked URL protocol. No alternate browser or browser automation was used to bypass that rejection. Local Boxcar reference screenshots informed the source revision.

Local development preview remains http://127.0.0.1:6482/bg. The previous screenshot and browser-test evidence below belongs to the earlier revision, not this final draft. Owner visual acceptance and release selection are outstanding.

## Initial implementation evidence

The desktop layout at 1024px and above now uses a consistent 1280px content frame, a showroom hero with an overlapping search panel, quieter inventory cards, and a listing gallery aligned with the sticky price/contact panel. Boxcar informed the spacing and hierarchy; the Modern identity, existing imagery, data boundaries, URLs, and enquiry behavior remain in use. Service pages use the same frame and simpler headings/forms.

Mobile components and styling below 1024px were preserved. The environment default assignment was also corrected to avoid invalid compiled public-origin assignments in the local preview; existing configured origins retain precedence.

Validation completed on 2 October 2026 with Node 22.23.2 and pnpm 11.4.0:

- Web typecheck and isolated public-demo production build passed.
- Biome passed for all 19 changed source/test files.
- 271 unit tests passed across Web and Marketplace UI.
- Seven desktop browser checks passed, covering navigation, layout at 1024/1440/1920px, filters, financing/import flows, gallery focus, information tabs, and phone handoff.
- Eight mobile browser checks passed in Chromium and WebKit.
- Home, inventory, listing, leasing, import, and sell routes rendered successfully without horizontal overflow. All twelve mobile before/after comparisons at 320px and 390px retained the same measured geometry. Some thumbnail decoding and tiny paint differences prevent a blanket pixel-identical claim.

Local review preview: http://127.0.0.1:6482/bg. Screenshots and detailed comparison reports are in the ignored `runtime/desktop-redesign-2026-10-02/` directory. This is a source implementation and local verification record; template release selection, owner visual acceptance, and dealer publication remain separate steps.
