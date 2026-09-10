# AutoMarket Product PRD

## Summary

AutoMarket is a mobile-first vehicle marketplace for people who want to find, compare, save, lease, finance, sell, and manage vehicles with less friction than traditional classifieds sites.

The product should borrow the practical density of mobile.de and cars.bg while feeling more modern, more trustworthy, and easier to use on a phone.

The supply-side wedge is AutoMarket Dealer Studio: an AI-assisted inventory and Listing Factory workflow that helps dealers create better listings faster, publish to AutoMarket, feed their own website, and capture better leads.

## Product Thesis

Most vehicle marketplaces become either too search-heavy and intimidating or too glossy and shallow. AutoMarket should make the hard parts of buying and selling vehicles feel structured:

- buyers can narrow thousands of listings quickly without losing context.
- private sellers can create high-quality listings without dealership knowledge.
- dealers can turn vehicle inventory into better listings, public pages, website feeds, leads, analytics, and promotions in one place.
- admins can protect trust, moderate content, and keep marketplace quality high.

## Primary Market Assumption

Build Bulgaria-first with Europe-friendly structure:

- default location examples can use Bulgarian cities such as Sofia, Plovdiv, Varna, Burgas, Ruse, and Stara Zagora.
- currency support should allow BGN and EUR.
- copy can start in English during development, but routing and content structure should support Bulgarian and English.
- vehicle data must support European makes, trims, fuel types, body types, import status, VAT, registration, and inspection details.

## Personas

### Buyer

Wants to search quickly, compare listings, save interesting vehicles, contact sellers, and avoid scams. The buyer often starts on mobile and may browse repeatedly over days or weeks.

### Private Seller

Wants to list a vehicle quickly, upload photos, price it reasonably, answer leads, and understand whether the listing is performing.

### Dealer

Wants inventory management, fast listing creation, better vehicle photos/copy, website sync, lead inbox, listing promotions, analytics, team access, billing, and bulk import options. The dealer cares less about a generic dashboard and more about getting cars online quickly with less manual work.

### Admin

Wants moderation queues, suspicious listing detection, seller/dealer verification, content controls, and marketplace health metrics.

### Finance Or Lease Partner

Wants qualified lead capture, offer placement, vehicle eligibility rules, and reporting.

## Product Principles

- Mobile first, not mobile afterthought.
- Search and filters should feel explicit, not hidden inside one overloaded input.
- The public marketplace must be SEO-friendly and fast.
- Vehicle cards should prioritize image, price, title, location, mileage, and trust signals.
- Every saved search and listing interaction should make repeated browsing easier.
- Dealer tools should feel operational and dense, not like a marketing dashboard.
- Trust features are product features, not admin-only afterthoughts.

## Non-Goals For The First Production Build

- Native mobile apps.
- In-app payment escrow.
- Full lender marketplace.
- Real-time bidding or auctions.
- Complex AI negotiation.
- A separate marketing-only website as the main public surface.

These may become future products, but the first architecture should support the core marketplace before expanding.

## MVP Scope

### Public Marketplace

- Home/search page with vehicle category selector, search input, quick filter chips, listing count, list/grid toggle, and vehicle cards.
- Category pages for cars, trucks, motorbikes, vans, and lease deals.
- Listing detail page with gallery, price, key specs, seller/dealer block, contact actions, similar listings, and trust indicators.
- Public dealer profile page with inventory, location, contact methods, verification status, and an initial reviews summary.
- SEO metadata and indexable listing URLs.

### Search And Filters

- Vehicle category.
- Make, model, trim.
- Location and radius.
- Price range.
- Year range.
- Mileage.
- Fuel type.
- Transmission.
- Body type.
- Condition.
- Seller type.
- Sort order.

### Buyer Account

- Saved listings.
- Saved searches.
- Recently viewed listings.
- Lead/contact history.
- Basic profile settings.

### Seller Flow

- Create listing.
- Upload and reorder photos.
- Add make, model, year, mileage, fuel, transmission, price, location, description, and contact details.
- Save draft.
- Publish listing.
- Edit listing.
- Mark sold or pause listing.

### Dealer Workspace

- Dealer Studio inventory list.
- Listing Factory for dealer-owned listings.
- Create/edit listings.
- Public vehicle page publishing.
- Dealer website JSON feed.
- QR/short-link print card for vehicle pages.
- Leads inbox.
- Basic listing performance metrics.
- Dealer profile settings.

Phase 1 of Dealer Studio should use provider stubs for VIN decode, AI copy, and photo processing. Real providers are plugged in only after the workflow is useful with local stubs.

### Admin

- Listing moderation queue.
- Reported listings.
- Seller/dealer verification status.
- Basic user and dealer lookup.

## Full Product Scope

### Marketplace Growth

- Advanced search pages with canonical SEO URLs.
- Comparison view for saved listings.
- Price history and market estimate.
- Vehicle history integration.
- Inspection and warranty badges.
- Lead scoring for dealers.
- Bulk dealer imports.
- Featured listings and promoted placements.
- Dealer subscription tiers.
- Lease and finance partner offers.
- Notification preferences.
- Multi-language content.

### Trust And Safety

- Seller verification.
- Dealer verification.
- Duplicate listing detection.
- Suspicious price warnings.
- Report listing flow.
- Admin moderation notes.
- Audit log for admin actions.

### Monetization

- Dealer subscriptions.
- Featured listing boosts.
- Lead packages.
- Finance/lease referral placements.
- Premium seller packages.

## Core User Flows

### Browse Listings

1. User opens `apps/web` public marketplace.
2. User chooses vehicle category from the top-left selector.
3. User enters free text search or taps a structured chip.
4. User refines make/model, price, location, fuel, and sort.
5. Results update with count and card list.
6. User opens a listing detail page.

### Save Search

1. User applies filters.
2. User taps save search.
3. If unauthenticated, user is sent to sign in.
4. Saved search appears in `apps/app`.
5. User can receive alerts when matching listings appear.

### Contact Seller

1. User opens listing detail.
2. User chooses call, message, or lead form.
3. System records lead event.
4. Seller or dealer sees lead in `apps/app`.

### Create Listing

1. User opens authenticated seller flow in `apps/app`.
2. User selects vehicle category.
3. User enters vehicle specs.
4. User uploads photos.
5. User reviews listing quality hints.
6. User publishes or saves draft.

### Dealer Manages Inventory

1. Dealer opens inventory workspace in `apps/app`.
2. Dealer filters listings by status.
3. Dealer creates or edits listings.
4. Dealer reviews leads and analytics.
5. Dealer upgrades promotion or subscription if needed.

### Dealer Uses Listing Factory

1. Dealer opens Dealer Studio in `apps/app` for the active Clerk Organization.
2. Dealer starts a new vehicle draft.
3. Dealer uploads phone photos and enters VIN/specs or manual vehicle details.
4. System generates editable listing copy and records generation metadata.
5. System processes photos through a stub or external provider while preserving originals.
6. Dealer reviews price, details, photos, and copy.
7. Dealer publishes the listing.
8. Listing appears on `apps/web`, in the dealer website feed, and can be shared by public URL or QR/short link.

## Functional Requirements

### Listing Cards

Cards must show:

- vehicle image.
- price.
- monthly estimate or lease payment where applicable.
- year, make, model, trim in title.
- mileage.
- location.
- badge for new, used, certified, verified, lease, or promoted status.
- save action.

### Listing Detail

Listing detail must show:

- gallery.
- title.
- price and finance/lease context.
- seller/dealer contact panel.
- key specs.
- description.
- location.
- report action.
- similar listings.
- SEO metadata.

Dealer-owned listing details may also show source-aware contact actions for QR, dealer website, AutoMarket, or other future channels.

### Search

Search must support both:

- free text such as "BMW X5 diesel Varna".
- structured filters encoded in URL search params.

Structured filters should always be visible and editable as chips or form fields.

### Authenticated Workspace

Authenticated pages must live in `apps/app`, even when linked from public pages. Public pages may show saved state optimistically but must redirect to auth when needed.

Dealer Studio pages must be scoped to the active Clerk Organization and durable `DealerOrg`. Do not duplicate public marketplace pages inside `apps/app`.

### Admin

Admin screens should be operational: tables, filters, moderation states, notes, and clear actions. Avoid marketing-style layouts.

## UX Requirements

- Mobile first.
- Sticky mobile search header.
- Explicit category selector.
- Quick chips below search.
- Bottom sheets for focused mobile filtering.
- Real vehicle imagery.
- Compact card spacing.
- Strong tap targets.
- Minimal decorative UI.
- No giant hero on the marketplace first screen.

## SEO Requirements

Public listing and search pages must be indexable from `apps/web`.

Required SEO surfaces:

- category landing pages.
- make pages.
- make/model pages.
- listing detail pages.
- dealer public profiles.
- guide/blog pages.

Authenticated app pages should not be indexed.

## Analytics Requirements

Track:

- search performed.
- filter changed.
- listing viewed.
- listing saved.
- seller contacted.
- lead submitted.
- listing created.
- listing published.
- listing generated.
- photo processing completed.
- dealer feed viewed.
- QR listing opened.
- dealer lead viewed.
- promotion purchased.

Events should include category, make, model, price bucket, location bucket, and seller type when available.

## Success Metrics

### Buyer

- search-to-detail click-through rate.
- detail-to-contact conversion.
- saved listing rate.
- saved search rate.
- repeat visits.

### Seller

- listing creation completion rate.
- publish time.
- lead volume.
- listing edit rate after quality hints.

### Dealer

- lead response rate.
- inventory active listings.
- Listing Factory draft-to-publish completion.
- average time to publish a dealer listing.
- dealer feed active listing count.
- promotion conversion.
- subscription conversion.

### Platform

- indexed pages.
- organic sessions.
- Core Web Vitals.
- moderation queue time.
- reported listing rate.

## Quality Bar

A feature is not done until:

- it respects the app split.
- it has typed domain data.
- it works on mobile.
- Browser verification has checked the rendered UI.
- loading, empty, and error states exist where the user can hit them.
- no core public marketplace route depends on authenticated app-only state.
