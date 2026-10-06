# Template reference — Modern

## Identity
- Repository: `darkapoparka/cars` · authoritative master: `templates/modern`
- Key: `modern`
- Portfolio role: **core**
- Design position: premium minimal / inventory-first showroom
- Stack: Next.js monorepo + pnpm/Turborepo
- Desktop discovery: `/`
- Inventory browsing and primary mobile entry: `/cars`
- Suggested standalone review port: `6462`

This is a **template master**, not a sendable dealer demo. The baseline intentionally preserves source/sample material for design fidelity; every lead copy requires a complete identity and content sweep.

The current desktop Home uses the finalized Boxcar Home 10 direction through native Next.js/React components: a contained 1320 px frame, compact photographic hero, white search bar and stock immediately below. The Home banner is 400–440 px tall, with a 52 px headline cap and the full-height 76 px search bar; its photo crop keeps both wheels visible. Existing mobile presentation is preserved below 1024 px. [Compact Home verification](docs/HOME-BANNER-COMPACT-2026-10-05.md) records the current geometry, screenshots and checks; [the preceding Home 10 implementation](docs/HOME10-DESKTOP-FINAL-2026-10-03.md) records the original composition.

Desktop Cars carries Home's configured photograph, frame and white search-box styling into its inventory hero. Type is the first capsule field and switches between Cars, Motorbikes, Vans and Trucks through the existing category routes. It preserves budget, year and sort while clearing category-dependent Make and Model. Make, Model, Price and Search open focused dialogs from that capsule. Filters and Sort sit together in a compact centered row on the white page below the photographic banner, above the vehicle cards. The result count is announced to assistive technology without a visible count heading. A fixed View button opens Grid/List choices and, in the master preview, Quick/Sidebar choices. The inventory follows the hero directly, with applied-filter chips only when needed. Showroom cards keep the model and price prominent, with compact badges for year, full variant, body style, mileage, fuel and gearbox across Home, inventory and related stock. The Details action uses the configured brand fill (blue in Modern), white text and visible keyboard focus; full-card link behavior is retained. Long variant badges wrap instead of truncating, and the same details remain readable in Grid and List. [Card-badges verification](docs/DESKTOP-CARD-BADGES-2026-10-05.md) records the desktop checks and matched mobile captures. Hero image preloading is owned by `DealerDesktopHero` and limited to desktop; inventory and related image sizing follow their layout owners. [Type and centered-controls verification](docs/DESKTOP-INVENTORY-TYPE-AND-CENTERED-CONTROLS-2026-10-05.md) records the current composition and category behavior; [controls-below-banner verification](docs/DESKTOP-INVENTORY-CONTROLS-BELOW-BANNER-2026-10-05.md) records the preceding placement; [control-polish verification](docs/DESKTOP-INVENTORY-CONTROL-POLISH-2026-10-05.md) records the preceding size, hover and focus review; [banner-controls verification](docs/DESKTOP-INVENTORY-BANNER-CONTROLS-2026-10-04.md) records the layout and View menu; [the preceding filter controls](docs/DESKTOP-INVENTORY-FILTER-CONTROLS-2026-10-04.md), [the earlier search box](docs/DESKTOP-INVENTORY-SEARCH-BOX-2026-10-04.md) and [browse polish](docs/DESKTOP-BROWSE-POLISH-2026-10-03.md) are retained as history.

Desktop inventory uses one shared frame below the hero, followed by removable applied-filter chips when present. The compact 960 px full dialog opens five groups: Vehicle type (“Какво”), Make and model (“Марка и модел”), Price and year, Specifications, and More options. All 13 supported sections remain available once each. Vehicle type owns Cars, Trucks, Motorbikes and Vans; Make and Model use two adjacent cards with independent searches, dependent clearing and an optional body-style disclosure. Keyword, location, origin, delivery destination and seller type sit under More options. Price, year and mileage sit in three compact cards with two-column presets. The fixed footer contains Reset and Show results. One controlled draft preserves choices across groups; Show results applies it, while dismissal discards edits and restores focus to the trigger. Category changes use the appropriate supplied taxonomy and clear incompatible vehicle/body choices. Empty categories explain the missing options and return to Vehicle type; an inventory pair supplies a fallback where no maintained taxonomy exists. Model counts are withheld while unapplied draft criteria differ from their result set. Focused hero dialogs retain their searchable Make/Model/body stages and section-only clearing. Quick/Sidebar choices share the floating View menu with Grid/List and remain gated by the master preview identity. Quick shows the wider vehicle grid; Sidebar restores the white sidebar without changing applied filters, sorting or Grid/List selection, and an unsubmitted sidebar draft stays mounted while switching. The optional `desktopInventoryFilterLayout` in `lead-site.ts` selects `"quick"` or `"sidebar"` for a dealer. A versioned dealer-scoped cookie remembers a preview selection and seeds server rendering on reload. Both layouts reuse the existing filter options and URL search state. [Filter width verification](docs/DESKTOP-FILTER-WIDTH-2026-10-04.md) records the current compact presentation; [filter logic verification](docs/DESKTOP-FILTER-LOGIC-2026-10-04.md) records the grouping; [inventory options verification](docs/DESKTOP-INVENTORY-OPTIONS-2026-10-04.md), [the earlier search](docs/DESKTOP-INVENTORY-SEARCH-2026-10-04.md) and [layout evidence](docs/DESKTOP-INVENTORY-LAYOUTS-2026-10-04.md) are retained as history.

Desktop About and Contact use the same configured photograph and 1320 px frame through the shared hero's `appearance="photo"` option. Their gallery and map start 40 px below the masthead. About uses four equal 3:2 photo tiles and four illustrated cards with generated blue 3D artwork. Its closing CTA uses the configured brand color with white copy, white buttons and dark button text. Contact pairs a small configured logo above the form with a solid brand-color details pane. Its heading and introduction use white text; contact details and social links sit in white rounded cards with dark text, brand-color icons and visible focus rings. The showroom, phone, viewing and optional email cards link across their whole surface and reuse the standard soft shadow and blue heading on hover or keyboard focus. The phone card keeps its heading and number visible, with a separate copy button and the shared tooltip for help and copy feedback. Number selection remains available when the clipboard is unavailable. Social links retain their individual destinations. Both columns stretch to the same height, with the form action and social card aligned along the bottom. Its local-preview form behavior is retained. The desktop root reserves scrollbar space so opening dialogs and menus preserves the page width. [Contact hover and tooltip verification](docs/DESKTOP-CONTACT-HOVER-2026-10-04.md) records the current treatment; [Contact card actions verification](docs/DESKTOP-CONTACT-CARD-ACTIONS-2026-10-04.md) records the earlier interaction changes; [White Contact cards verification](docs/DESKTOP-CONTACT-WHITE-CARDS-2026-10-04.md) records the composition; [Modal and Contact verification](docs/DESKTOP-MODAL-CONTACT-POLISH-2026-10-04.md) records the scrollbar and form changes. [Masthead verification](docs/DESKTOP-ABOUT-CONTACT-POLISH-2026-10-04.md), [About gallery/artwork verification](docs/DESKTOP-ABOUT-GALLERY-2026-10-04.md) and [CTA verification](docs/DESKTOP-ABOUT-CTA-2026-10-04.md) record the earlier desktop reviews and matched mobile captures.

Modern uses Tailwind CSS v4 for its shared styling system, with CSS Modules and shared tokens for desktop composition. The [desktop Next.js code review](docs/DESKTOP-NEXT-CODE-REVIEW-2026-10-03.md) records the current framework versions, component and image-loading improvements, and mobile preservation evidence.

The desktop master uses a Modern wordmark through the optional `desktopPreviewIdentity` in `lead-site.ts`. Its `sourceSlug` guard applies only to this static master; Cars client adaptation changes the dealer slug and automatically restores that client's configured logo, inverse logo and identity. Existing mobile identity and composition remain unchanged. [Reusable configuration](docs/SITE-CONFIGURATION.md) documents the artwork and shortlist boundaries.

## Install and run
```text
corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/database build
pnpm --filter web exec next dev -H 127.0.0.1 -p 6462
```

## Primary personalization surface
- `packages/marketplace/lead-site.ts`
- `packages/marketplace/`
- `apps/web/public/`
- `apps/web/app/`

Do not assume these are the only identity consumers. Search every retained route, data module, metadata definition and static asset before declaring a skin complete.

## Representative QA routes
- `/cars`
- `/bg/cars`
- `/bg/listing/bmw-x5-m50d-sofia-2020`
- `/bg/contact`
- `/bg/imports`
- `/bg/sell`
- `/bg/lease`

## Required checks
- `pnpm --filter web typecheck`
- `pnpm --filter web build  # with the documented preview environment`

## Current constraints
Keep the whole monorepo. Static demo mode provides preview inventory; provider services are not automatically configured. Do not split packages or simplify the runtime during a lead skin.

Local static-demo review requires the environment in docs/QA.md. Provider services remain unconfigured unless explicitly wired.

## Source lineage
Split on 2026-09-10 from the live working tree at `J:/cars/templates/modern`. The split deliberately captured local working-tree changes, including changes newer than the `cars` repository HEAD. Historical root instructions were archived under `docs/legacy/from-cars-2026-09-10/`; use them only for provenance, never as current operating instructions.

## Portfolio policy
Cars owns portfolio choices: standard Auto Best / Modern / Carwow, or Auto Best / Import / Carwow. See [Cars integration](docs/CARS-INTEGRATION.md).

Current cross-repository ownership, approved releases, dealer-copy workflow and standalone/mounted limits: [Cars integration](docs/CARS-INTEGRATION.md).
