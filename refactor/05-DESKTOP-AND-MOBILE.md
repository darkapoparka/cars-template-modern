# Desktop composition and mobile preservation

The user's current assessment is the design direction: mobile has useful patterns; desktop is not accepted. A code refactor cannot substitute for explicit visual decisions. This document specifies review criteria, not a claim that an approved final mockup already exists.

## Desktop composition to establish first

Use one consistent width/gutter system across navigation, hero/search, taxonomy, inventory, services and footer. Choose a neutral page canvas and reserve contained surfaces for meaningful units. Do not put every section inside another rounded card. Start with the existing black/inverse dealership header and hero direction, not a borrowed reference header or a generic SaaS landing page.

The main search/buy area belongs within the hero's composition and reading order. Its relationship should work with long text and at 1024–1280px, not depend solely on a fixed-height hero plus `bottom: -68px`. A deliberate overlap is allowed only when the flow, reserved space, focus visibility and short-height layouts remain sound. Hero car artwork is decorative and configured; it must not carry essential copy or imply real stock availability.

Taxonomy tiles must have consistent art scale, label placement and usable interaction. Show complete, meaningful filtering affordances, not unstyled text scattered on grey. Use actual reusable image assets and declared fallbacks; missing brand artwork must degrade to a clean text/monogram treatment. Empty taxonomy results must be truthful rather than fabricated counts.

Inventory sections share card semantics: media crop, title hierarchy, compact spec treatment, year/mileage placement, strong price and honest secondary finance context. Keep shared vehicle pricing and fact policies. Desktop landing cards and search-result cards may use explicit presentation variants, but not contradictory typography, status colors or price meaning. Decide column count from useful minimum card width and the approved composition. Four or five columns is a design decision to test at wide widths, not a hardcoded requirement at every screen.

Do not hide fourth-and-later cards using `nth-child` to make a narrower grid fit. Define the collection limit and layout behavior: wrap, controlled horizontal scroller, or a small preview with an explicit “view all” action. The content rule belongs to collection policy, not an incidental selector.

## Route-family completion matrix

| Family | Current owners to inspect / change | Acceptance |
| --- | --- | --- |
| Header, navigation, footer | `public-marketplace-frame`, `marketplace-masthead`, dealer chrome, footer, desktop-header CSS | Shared alignment and tokens; correct active state; phone/map links; no mobile duplicate header |
| Discovery and filtered inventory | `marketplace-shell`, desktop discovery/bar/toolbar/filters/results | One search/filter policy; committed URL state; back/forward; empty/unavailable states; no layout jump between landing and results |
| Make/model and vehicle categories | category and make-model route composers, taxonomy policies | Same desktop grammar for cars/vans/trucks/motorbikes; appropriate artwork and empty data behavior |
| Listing detail and contact | listing summary/content/gallery/seller components and contact route | Gallery, facts, price, financing and contact hierarchy; related inventory and map as intentional surfaces; no duplicate mobile specs |
| Sell, import, finance | service page composers and existing drawers/policies | Shared headings/controls and clear steps; unfinished drafts survive; unavailable delivery offers honest phone fallback |
| Blog/guides and article | current blog/guides routes and content adapters | Consistent content/search/filter pattern, readable article typography; choose canonical content destination with redirects before removing URLs |
| Contact and legal | contact page, map, public content shell/legal layout | No leftover identity/copy; accessible map fallback; coherent text width rather than stretched paragraphs |
| Loading/error/not-found | route loading files, recovery frame and shared states | Same route geometry and tokens; no obsolete skeleton/header; helpful recovery, no secret/error-detail disclosure |

Do not claim a route family complete after checking `/cars` alone. Inventory URLs and real article/listing slugs from the running fixture before testing; do not invent a slug and mislabel a 404 as a route failure.

## Mobile invariants to protect

Preserve the bottom navigation/menu and clearance above safe areas; the mobile brand/search hierarchy; quick-filter chips; drawer/overlay ownership; one scroll owner; focus return; unfinished form drafts; gallery and back navigation; loading/error handling; the detail Overview/Details pattern without duplicate specifications. Preserve honest financing language: user preferences must not imply a recalculated financial quote unless a real policy computes one.

Desktop styling must not alter mobile typography, radii, contrast, hit targets, drawer handles, menu geometry or fixed-action clearance incidentally. Shared primitives may improve mobile only in a separately reviewed change. A screenshot comparison must use the current audited mobile code or a newly owner-approved baseline, not silently revert to an old historical commit.

Control hierarchy matters. A compact chip, icon action, primary button and field need not all look 44px tall. Validate target size/spacing and touch usability as well as visible size. Preserve focus-visible and keyboard access, reduced motion, zoom, form labels and status announcements. See [WCAG target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) and [Radix accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility).

## Viewports and states

Minimum public review widths: **320, 360, 390, 430, 768, 1023, 1024, 1280, 1440 and 1920px**. Add 1535/1536 and 1599/1600 for changes touching the existing discovery/image breakpoints. Include a short desktop height, mobile landscape and keyboard-open forms. Exercise Chromium and a bounded WebKit mobile set. Test BG and EN, short/long titles, missing images, no inventory, many results, unavailable providers and both approved test themes.

Automated geometry checks should reject horizontal overflow, overlapping interactive elements, clipped focus rings and fixed controls covering content. Image-complete screenshots need settled data, fonts and visible images. A screenshot of skeletons or missing harness images is not a visual approval artifact.

## Design decisions requiring owner acceptance

Before broad implementation, present the first real desktop composition at 1280 and 1440 plus a wide view: header integrated with hero, search position, page canvas/surface separation, taxonomy tiles and one row of real cards. Decide that composition before rolling it across the site. Choose whether the wide grid uses four or five useful cards based on those examples. Do not claim “1:1 implementation” without comparing rendered output to the accepted artifact.

Default recommendation: preserve the established mobile design, use a restrained neutral canvas, contained functional cards, and a single inverse header/hero. This is a proposal for approval, not a new requirement to put everything in a white box.
