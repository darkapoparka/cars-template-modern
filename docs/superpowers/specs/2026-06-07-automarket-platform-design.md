# AutoMarket Platform Design

## Goal

Build AutoMarket as a mobile-first vehicle marketplace on next-forge with a public SEO marketplace, authenticated buyer/seller/dealer/admin workspace, and shared marketplace packages.

## Approved Architecture

AutoMarket will use the next-forge monorepo with a product-specific app split:

- `apps/web` is the public marketplace.
- `apps/app` is the authenticated workspace.
- `apps/api` is the webhook, cron, and service route boundary.

Shared marketplace types, filters, search params, route builders, and mock data belong in `packages/marketplace`. Shared AutoMarket-specific components belong in `packages/marketplace-ui`. Generic shadcn primitives stay in `packages/design-system`.

## Product Scope

The product will support:

- anonymous public browsing.
- category and make/model search.
- listing detail pages.
- lease and finance offer surfaces.
- saved listings and saved searches.
- private seller listing creation.
- dealer inventory and leads.
- admin moderation.
- monetization through dealer plans, leads, and promotions.

## UX Direction

The mobile marketplace UI should follow the legacy prototype styling, especially `M:\automarket\app\(main)\lease\page.tsx`.

The accepted mobile search pattern:

- sticky top row with category selector, search input, and filter button.
- horizontal quick chips below for structured filters.
- drill-down make/model sheet.
- full filter sheet.
- focused quick filter drawers.
- simple image-first vehicle cards.

The marketplace should not look like a generic SaaS landing page.

## Route Design

Public routes in `apps/web`:

- `/`.
- `/cars`.
- `/cars/[make]`.
- `/cars/[make]/[model]`.
- `/listing/[slug]`.
- `/lease`.
- `/trucks`.
- `/motorbikes`.
- `/vans`.
- `/dealers/[dealerSlug]`.
- `/guides`.
- `/legal/[slug]`.

Authenticated routes in `apps/app`:

- `/account`.
- `/saved`.
- `/saved-searches`.
- `/messages`.
- `/sell/new`.
- `/sell/[listingId]/edit`.
- `/dealer/listings`.
- `/dealer/leads`.
- `/dealer/analytics`.
- `/billing`.
- `/admin`.

Service routes in `apps/api`:

- `/health`.
- `/webhooks/auth`.
- `/webhooks/payments`.
- `/cron/expire-listings`.
- `/cron/saved-search-alerts`.
- `/imports/dealer-inventory`.

## Data Design

Core entities:

- User.
- SellerProfile.
- Dealer.
- DealerMember.
- Listing.
- VehicleSpec.
- MediaAsset.
- SavedListing.
- SavedSearch.
- Lead.
- LeaseOffer.
- FinanceOffer.
- Promotion.
- ModerationReport.
- AuditLog.

Public search state will use typed URL params. Authenticated state will stay in `apps/app`.

## Quality Requirements

Every meaningful implementation must:

- respect app/package boundaries.
- use typed domain data.
- work on mobile.
- preserve the compact AutoMarket styling.
- verify frontend changes in Browser.
- include relevant loading, empty, and error states.
- keep public marketplace pages renderable without auth.

## Implementation Sequence

1. Add marketplace domain package.
2. Add marketplace UI package.
3. Port public mobile marketplace shell into `apps/web`.
4. Add listing detail.
5. Add buyer saved flows in `apps/app`.
6. Add seller listing flow.
7. Add dealer workspace.
8. Add database-backed data.
9. Add admin/trust workflows.
10. Add monetization and partner offers.

This design is decomposed further in `docs/roadmap.md`.
