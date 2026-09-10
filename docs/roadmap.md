# AutoMarket Roadmap

## Current Focus

The public marketplace shell, listing detail, authenticated workspace surfaces, dealer/admin mock flows, dealer monetization foundations, admin trust moderation flows, database search foundation, and mobile UI v1 polish now exist in early form.

The next major product direction is **Dealer Studio**: the supply-side wedge that turns dealer inventory into public AutoMarket listings, dealer website feeds, QR/short-link vehicle pages, and later AI-assisted lead handling. Implementation must be milestone-scoped. Do not attempt the entire Dealer Studio plan in one pass.

## Phase 0: Foundation

Goal: make the next-forge repo safe to build in.

Deliverables:

- next-forge scaffold stabilized for pnpm/Node.
- docs and agent rules written.
- app split decision recorded.
- public marketplace assigned to `apps/web`.
- authenticated workspace assigned to `apps/app`.

Acceptance:

- repo builds at least the stabilized app shell.
- docs explain where future work belongs.
- future agents can start without re-arguing the app split.

## Phase 1: Marketplace Domain Package

Goal: create shared marketplace language before building more UI.

Deliverables:

- `packages/marketplace`.
- vehicle category constants.
- listing types.
- vehicle spec types.
- filter schema.
- search params parser.
- route builders.
- mock listing data for UI development.

Acceptance:

- `apps/web` can import marketplace types.
- `apps/app` can import the same types for saved/dealer screens.
- no duplicated category/filter arrays in app routes.

## Phase 2: Public Mobile Marketplace Shell

Goal: port and improve the legacy mobile browse experience inside `apps/web`.

Deliverables:

- public home/search route.
- vehicle category selector.
- global search input.
- quick filter chips.
- make/model sheet.
- full filter sheet.
- quick filter drawers.
- result count and list/grid toggle.
- vehicle cards.
- bottom nav if it improves mobile movement.

Acceptance:

- mobile layout matches the legacy `/lease` styling direction.
- vehicle category is not buried inside search.
- make/model is available as a clear chip/sheet.
- Browser verification passes on mobile and desktop.

## Phase 3: Listing Detail

Goal: make public listings useful, trustworthy, and SEO-ready.

Deliverables:

- listing detail route in `apps/web`.
- gallery.
- price and payment context.
- key specs.
- seller/dealer contact block.
- location block.
- similar listings.
- save action entry point.
- metadata and JSON-LD.

Acceptance:

- listing detail renders without auth.
- important data appears above the fold on mobile.
- contact actions are visible without overwhelming the page.
- SEO metadata uses listing-specific data.

## Phase 4: Authenticated Buyer Workspace

Goal: give buyers a reason to sign in.

Deliverables:

- account home in `apps/app`.
- saved listings.
- saved searches.
- recently viewed listings.
- lead/contact history.
- profile settings.

Acceptance:

- public save/search actions route cleanly to auth when needed.
- saved pages are not indexable.
- workspace uses dense operational layout, not public marketplace layout.

## Phase 5: Seller Listing Flow

Goal: allow private sellers to create and manage listings.

Deliverables:

- create listing flow.
- photo upload.
- vehicle specs form.
- price and location form.
- description form.
- draft and publish states.
- edit listing.
- pause, mark sold, and delete actions.

Acceptance:

- seller can create a complete listing from mobile.
- draft state is preserved.
- published listing appears in `apps/web`.
- seller can manage listing in `apps/app`.

## Phase 6A: Dealer Studio Data And Adapter Foundation

Goal: create the supply-side foundation without overbuilding the full Listing Factory.

Deliverables:

- `DealerOrg` and `DealerMember` schema.
- `Lead`, `ListingGeneration`, and `ListingPhotoJob` schema.
- explicit nullable `dealerOrgId` on marketplace listings.
- provider interfaces and local stubs for VIN decode, photo processing, and AI listing copy.
- typed dealer feed row contract.
- query helpers for current dealer org and dealer inventory rows.

Acceptance:

- no new provider secret is required for local checks.
- existing public marketplace queries continue to work.
- `sellerId` remains denormalized public seller identity, not a dealer relation.
- schema diff is reviewed before implementation.

## Phase 6B: Real Dealer Inventory

Goal: graduate the existing mock dealer inventory into org-scoped durable data.

Deliverables:

- `/dealer/inventory` reads active Clerk org -> `DealerOrg` -> listings.
- inventory rows show thumbnail, title, price, status, leads, days listed, and actions.
- server actions for pause, activate, mark sold, and edit entry.
- usable empty and seeded local states.

Acceptance:

- dealer staff only see their org inventory.
- public listing links still route to `apps/web`.
- no duplicate dealer route tree exists.

## Phase 6C: Listing Factory Draft Flow

Goal: make the dealer creation flow feel like the product wedge.

Deliverables:

- `/dealer/inventory/new`.
- compact guided steps: photos, VIN/specs, AI copy, photo processing review, price/review.
- stub VIN/spec extraction.
- AI copy fallback when `OPENAI_API_KEY` is missing.
- original and processed photo handling.
- draft save.

Acceptance:

- draft persists before publish.
- generated copy is editable.
- original photos remain accessible for trust.
- mobile UI is compact, neutral, and operational.

## Phase 6D: Publish, Feed, And Public Rendering

Goal: add once and distribute through AutoMarket plus dealer website feed.

Deliverables:

- publish dealer draft to active `MarketplaceListing`.
- public listing detail renders the created listing.
- `GET /feed/dealer/[slug].json` returns active public inventory.
- feed docs define stable fields and versioning expectations.

Acceptance:

- listing appears on public marketplace pages.
- feed does not expose private/internal fields.
- public listing pages remain anonymous and indexable.

## Phase 6E: QR/Short Link And Print Card

Goal: make live vehicle pages easy to distribute in physical and sales contexts.

Deliverables:

- QR code or short-link generation for public listing URLs with `src=qr`.
- printable windshield card.
- source attribution convention for later analytics.

Acceptance:

- QR resolves to the existing public listing page.
- print card works at mobile and desktop widths.
- QR is treated as a doorway into the listing, not the core product.

## Phase 7: Database And Search Hardening

Goal: complete durable search and listing behavior after the dealer supply slice has a real foundation.

Deliverables:

- seed data for public and dealer-owned listings.
- database-backed listing index and detail.
- typed search filters.
- stable public URL params.
- pagination or crawlable result pages.
- feed-safe public listing mapping.

Acceptance:

- public search works from real data.
- filters round-trip through URL params.
- listing pages remain public.
- typecheck and route tests pass.

## Phase 8: Trust, Admin, And Moderation

Goal: make the marketplace safe to operate.

Deliverables:

- admin listing moderation.
- report listing flow.
- dealer verification status.
- seller verification status.
- suspicious listing flags.
- audit log.
- original-photo and generated-output audit hooks for Dealer Studio.

Acceptance:

- admins can review reports.
- listing status changes are tracked.
- public UI shows trust indicators where useful.
- AI/photo-generated output can be traced to source records.

## Phase 9: Monetization

Goal: add revenue features without corrupting browse quality.

Deliverables:

- dealer subscription plans.
- featured listings.
- lead package model.
- promotion checkout.
- billing workspace.
- finance/lease partner placement.
- Dealer Studio tier gates for Listing Factory usage.

Acceptance:

- paid placements are labeled.
- promotions do not break search trust.
- billing state is visible in dealer workspace.
- core inventory workflows still work without surprising paywalls during pilots.

## Phase 10: Dealer Studio Upsells

Goal: add validated AI and distribution upsells after the supply wedge works.

Deliverables:

- Viber/WhatsApp AI responder.
- buyer Q&A on vehicle pages.
- social video generation.
- pricing intelligence and stale-stock alerts.
- vehicle history report integration.
- mobile.bg/cars.bg paste-ready copy or feed publishing only if validated.

Acceptance:

- each upsell has a pilot-validated buyer/dealer need.
- provider adapters have fallbacks or graceful disabled states.
- no portal publishing is promised without verified import/feed support.

## Phase 11: Scale And Polish

Goal: improve quality after core flows work.

Deliverables:

- performance tuning.
- image optimization.
- saved search alerts.
- email notifications.
- multi-language copy.
- advanced SEO pages.
- dealer bulk import.
- analytics dashboards.

Acceptance:

- Core Web Vitals are healthy.
- public pages are indexable.
- users receive useful alerts.
- dealer workflows support repeated daily use.
