**Modern desktop audit and proposed improvements — 5 October 2026**

The desktop needs a focused typography and CSS cleanup. The strongest findings are a font mismatch within Bulgarian content and a floating control that covers a vehicle action. Card readability and inconsistent type roles are the next priorities. The existing automotive artwork, centered discovery layout and charcoal palette provide a useful base to preserve.

This audits the current working tree served at [the local Modern preview](http://127.0.0.1:6482/bg/), including its existing uncommitted desktop changes. Cars is on main at HEAD 08c89d63f9e11939acd5b135ece4278252b80f43. This is an audit and proposal: no template source, mobile styles, release selection or dealer deployment was changed. New files contain audit evidence only.

| Order | Finding | Proposed improvement |
| --- | --- | --- |
| 1 | Desktop DM Sans has no Cyrillic glyphs; Bulgarian falls back to Inter while Latin names and numerals use DM Sans. | Use the already loaded Inter consistently for desktop content in both locales. |
| 2 | At 1024 × 900, the fixed View control overlaps about 46% of the visible Details button on the third vehicle. | Give View a reserved location in the results controls, preserving the centered Filters/Sort pair and all menu choices. |
| 3 | Showroom specifications are 12 px; monthly finance text is 11 px. | Raise supporting text to 14 px and retune line height, badge wrapping and card spacing together. |
| 4 | Home section headings use 28 and 36 px, while the viewing callout uses 52 px; repeated card roles also vary across pages. | Define a small desktop type scale by visual role and use it through the actual shared components. |
| 5 | The hero stylesheet has 597 lines and five desktop media blocks; obsolete description, eyebrow and breadcrumb styling remains. The component still accepts props it ignores. | Remove obsolete API/style branches and consolidate the current variants before adding further visual rules. |
| 6 | Active header navigation differs from inactive navigation almost only by two similar dark colors. | Add a restrained visible current-page indicator while retaining aria-current. |

The first two are confirmed defects. The text-size and hierarchy changes are design recommendations; they need a matched visual review. CSS debt is a confirmed maintenance problem, but the number of lines or media blocks alone is not a defect.

**The font problem is in the desktop font stack.**

[fonts.ts](L:/CODEX/cars/templates/modern/apps/web/lib/fonts.ts:5) loads the local DM Sans file and separately loads Inter with Cyrillic and Latin subsets. [desktop.css](L:/CODEX/cars/templates/modern/apps/web/app/[locale]/desktop.css:32) puts DM Sans first in the dealership desktop font stack. Inspection of the actual WOFF2 cmap found 222 mapped Unicode characters and zero Cyrillic characters, including no А, а or ѝ. That forces Cyrillic text onto a fallback family while Latin model names and available digits remain in DM Sans. Browser computed styles confirm that this stack is applied to the desktop headings and cards.

The asset is a valid variable font with weight 100–1000 and optical-size axes. The problem is glyph coverage, not a falsely declared weight range. [The saved font inspection](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/font-inspection.json) records the result; [Google Fonts' DM Sans metadata](https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/METADATA.pb) also lists Latin subsets.

My recommendation is to change the desktop dealership font-family override to Inter first, using the existing font setup. Keep this within the 1024 px desktop boundary. This makes mixed strings such as BMW names, Bulgarian specifications and lev prices visually consistent without adding a font dependency. Any future font alternative should be checked against actual Bulgarian glyphs and numeral metrics before selection.

**The floating View control needs a space of its own.**

[dealer-inventory.module.css](L:/CODEX/cars/templates/modern/packages/marketplace-ui/components/dealer-inventory.module.css:217) fixes the control 24 px from the bottom and right of the viewport, above the card layer. On the initial 1024 × 900 inventory view, its rectangle is approximately x=880, y=828, 105 × 48 px. The third card's Details rectangle is x=850, y=816, 102 × 36 px. Their intersection covers 46.24% of the latter rectangle. The card retains its full-card link, but the visible action is partially covered and the overlapping area belongs to View.

![View covers part of Details at 1024 pixels](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/cars-bg-1024-resumed-viewport.jpg)

Keep the View feature and its existing choices. Place it in a reserved desktop toolbar area or a separate row when space is tight, with Filters/Sort remaining centered. Avoid solving this by increasing z-index or by adding arbitrary padding to every card. [Measured intersection](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/view-control-overlap.json).

**Improve readability through a coherent desktop type scale.**

[vehicle-card-desktop.module.css](L:/CODEX/cars/templates/modern/packages/marketplace-ui/components/vehicle-card-desktop.module.css:241) currently renders 18 px medium model names, 12 px specification badges, 20 px bold prices, 11 px finance text and 13 px Details labels. The contrast and layout generally hold, but the small supporting text makes the cards harder to scan. Preserve the year, full variant, body style, mileage, fuel and gearbox; enlarge their text and allow wrapping rather than dropping information.

The measured Home section headings are 28/36 px for stock, 36/44 px for services and journal, and 52/59.8 px for the viewing callout. Contact's two column headings are 30/39 and 24/31.2 px. These differences are not all inherently wrong: a photo callout, footer heading and detail-page subsection have different roles. The improvement is to make those roles deliberate and shared, rather than normalizing every h2 to one size.

| Desktop role | Proposed size / line height | Weight |
| --- | --- | --- |
| Masthead display | 40 / 48 px | 600 |
| Main section | 32 / 42 px | 600 |
| Detail subsection | 24 / 32 px | 600 |
| Vehicle title | 18 / 26 px | 600 |
| Vehicle price | 22 / 30 px | 600 |
| Body copy | 16 / 26 px | 400 |
| Supporting copy and card facts | 14 / 22 px | 400 |
| Controls | 15 / 22 px | 500 |

Treat this as a proposal to review in the actual pages. The photographic viewing callout can retain a deliberate display exception, with 40–44 px a useful starting point for Bulgarian wrapping. Raising card text may require taller cards at narrow desktop widths; check full variant names and aligned action rows together.

The existing [desktop tokens](L:/CODEX/cars/templates/modern/packages/design-system/styles/desktop-tokens.css:12) provide a starting point, but the section token is not consumed by the audited page/component sources. Many newer font sizes are calculated from the spacing unit. Use semantic text tokens for text size and line height so a spacing adjustment cannot silently change typography.

**Clean up the current hero contract and cascade.**

[DealerDesktopHeroProps](L:/CODEX/cars/templates/modern/packages/marketplace-ui/components/dealer-desktop-hero.tsx:21) still accepts description and eyebrow, but [the component implementation](L:/CODEX/cars/templates/modern/packages/marketplace-ui/components/dealer-desktop-hero.tsx:137) does not read either. Discovery and service-page callers still supply descriptions. The current title-led composition intentionally omits them; adding them back would contradict the current direction. Remove the unused props from the desktop API/call sites and delete the corresponding unused CSS, including breadcrumb rules whose elements are no longer rendered.

[The hero CSS](L:/CODEX/cars/templates/modern/packages/marketplace-ui/components/dealer-desktop-hero.module.css:20) has accumulated base rules, variant rules and later overrides for the same heading and surface. Consolidate one desktop base, explicit appearance/variant differences and the required narrow-desktop adjustments. Preserve rendered geometry during the cleanup, then apply the typography proposal. The existing shared React/Next boundaries are usable; this does not require a framework rewrite or another parallel component system.

[Header navigation CSS](L:/CODEX/cars/templates/modern/packages/marketplace-ui/components/dealer-desktop-header.module.css:63) gives active and inactive links the same medium weight. The inspected active Cars link is #30343b versus #232323 for inactive links. A modest underline or neutral selected surface would make the current route visible without adding decoration across the page.

Two lower-priority layout proposals are also worth reviewing. On Contact, the large banner and map push the form/contact area close to or below the fold; bring the enquiry and contact choices earlier, with the map below or more compact. On Imports, Sell and Lease, the shared default hero actions lead to Cars and Contact; use the current service form as the primary destination where appropriate. These are product choices, not confirmed regressions, and should preserve demo form semantics.

The current technical references also retain older desktop composition paragraphs after the current refinement, including descriptions of breadcrumbs, subtitles and earlier banner/control styles. Once the cleanup is implemented, make the current contract unambiguous in TEMPLATE and QA while preserving older evidence as history.

Implement in three focused groups: first the desktop font and card text; then the type roles and CSS/API cleanup; finally the View placement and header state. Capture matched BG/EN Home, Cars and listing views for each meaningful group. Close out at 1024, 1280, 1440 and 1920 px, including shorter desktop windows, Grid/List, long variants and keyboard navigation. If implementation is later requested, retain matched 320/390 and 1023 px evidence to prove mobile preservation.

**Actual audit coverage and limits.**

The initial live inspection covered BG Home, Cars, listing detail, Services, About, Contact, Imports, Sell, Lease and Guides at 1440 × 1000, plus EN Home/Cars. Blog redirects to Guides and was not counted as a separate design. Home, Cars and listing detail were checked at 1024 × 900. The full Filters dialog was visually inspected at 1440 px. After resuming, Cars was checked at 1280 × 900 and 1920 × 1080, Home at 1920 × 1080, and the 1024 px Cars overlap was reproduced.

Captured desktop states had no horizontal overflow or broken visible images. The browser console checks returned no errors; this was not a full performance or accessibility audit. No source tests or production build were run because source was not changed. No mobile audit, hosted verification or release acceptance is claimed.

The preview listener stopped during the pause and was restarted with the existing demo environment using Node 22.23.2 and a separate audit build directory. The original runtime logs and source changes were preserved. A browser navigation timed out during the fresh compile, then the page loaded and the remaining checks completed; this was not treated as a site regression.

Evidence: [initial rendered measurements](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/rendered-measurements.json), [resumed width measurements](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/continued-measurements.json), [BG Home at 1440](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/home-bg-1440.jpg), [BG Home at 1920](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/home-bg-1920-viewport.jpg), [BG Cars at 1440](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/cars-bg-1440.jpg), [listing at 1440](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/pdp-bg-1440.jpg), [Contact at 1440](L:/CODEX/cars/templates/modern/docs/desktop-audit-2026-10-05/contact-bg-1440.jpg). The initial Home measurement was taken after scrolling; its y coordinates are viewport-relative. Some AX text artifacts contain incremental observations, not full-page trees; the measurement JSON and screenshots are the evidence used here.
