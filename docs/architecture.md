# AutoMarket Architecture

## Architecture Summary

AutoMarket uses next-forge as a production monorepo foundation, but the default next-forge app labels are adapted to this product.

The important decision:

- `apps/web` is the public marketplace.
- `apps/app` is the authenticated workspace.
- `apps/api` is the service/API boundary.

This split is better for a mobile.de or cars.bg style product than using `web` as only marketing and `app` as the full marketplace, because the marketplace itself needs public SEO pages, fast anonymous browsing, listing URLs, category pages, and dealer profiles.

## Why This Split Wins

### Public Marketplace In `apps/web`

Most marketplace traffic will be anonymous, organic, and browse-first. Those pages need:

- indexable URLs.
- listing detail metadata.
- category and make/model pages.
- fast cacheable rendering.
- public dealer profiles.
- no auth wall.

Putting this in `apps/app` would make the main product feel like an authenticated SaaS shell and would increase the chance of mixing SEO pages with account state.

### Account And Dealer Workspace In `apps/app`

Authenticated workflows have different constraints:

- auth gating.
- user-specific saved data.
- dealer operations.
- Dealer Studio and Listing Factory.
- dashboards.
- lead management.
- billing.
- admin permissions.

These screens should be dense and operational. They should not share route groups with public SEO pages.

### Service Boundary In `apps/api`

Webhook and worker-style code needs stable service routes and separate runtime thinking:

- Stripe webhooks.
- Clerk/auth webhooks.
- scheduled jobs.
- dealer import jobs.
- dealer website feeds.
- VIN/photo/trust provider adapters.
- notification jobs.
- third-party partner callbacks.

## App Responsibilities

| App | Role | Examples |
| --- | --- | --- |
| `apps/web` | Public marketplace | `/`, `/cars`, `/cars/[slug]`, `/lease`, `/dealers/[slug]`, `/guides`, `/legal` |
| `apps/app` | Authenticated workspace | `/account`, `/saved`, `/sell/new`, `/dealer/inventory`, `/dealer/leads`, `/admin` |
| `apps/api` | Webhooks and server jobs | `/webhooks/payments`, `/webhooks/auth`, `/cron/keep-alive`, inventory imports, dealer feeds, provider adapters |
| `apps/docs` | Product/API docs if exposed later | internal or partner-facing docs |
| `apps/storybook` | Component development | design-system and marketplace-ui stories |
| `apps/studio` | Database management | Prisma Studio |

## Route Ownership

### Public Routes In `apps/web`

- `/`
- `/cars`
- `/cars/[make]`
- `/cars/[make]/[model]`
- `/listing/[slug]`
- `/lease`
- `/trucks`
- `/motorbikes`
- `/vans`
- `/dealers/[dealerSlug]`
- `/guides`
- `/guides/[slug]`
- `/contact`
- `/legal/[slug]`

### Authenticated Routes In `apps/app`

- `/account`
- `/saved`
- `/saved-searches`
- `/messages`
- `/sell/new`
- `/sell/[listingId]/edit`
- `/dealer`
- `/dealer/inventory`
- `/dealer/inventory/new`
- `/dealer/leads`
- `/dealer/analytics`
- `/dealer/billing`
- `/dealer/promotions`
- `/dealer/settings`
- `/billing`
- `/admin`
- `/admin/listings`
- `/admin/reports`
- `/admin/users`
- `/admin/dealers`

### Service Routes In `apps/api`

- `/health`
- `/webhooks/auth`
- `/webhooks/payments`
- `/webhooks/storage`
- `/cron/expire-listings`
- `/cron/saved-search-alerts`
- `/imports/dealer-inventory`
- `/feed/dealer/[slug]`
- `/jobs/decode-vin`
- `/jobs/process-photo`

## Domain Mapping

Production target:

- `automarket.bg` points to `apps/web`.
- `app.automarket.bg` points to `apps/app`.
- `api.automarket.bg` points to `apps/api`.

Local target:

- `localhost:3001` for `apps/web`.
- `localhost:3000` for `apps/app`.
- `localhost:3100` for `apps/app` when the legacy prototype already occupies port `3000`.
- `localhost:3002` for `apps/api`.

## Package Architecture

### Existing next-forge Packages

Use these for infrastructure:

- `@repo/auth`: Clerk auth.
- `@repo/database`: Prisma and database client.
- `@repo/design-system`: generic shadcn components, theme, fonts.
- `@repo/payments`: Stripe.
- `@repo/storage`: uploaded assets.
- `@repo/analytics`: analytics providers.
- `@repo/seo`: metadata helpers and JSON-LD.
- `@repo/observability`: logs and error reporting.
- `@repo/security`: security middleware.
- `@repo/email`: transactional email.
- `@repo/notifications`: notification provider.

### AutoMarket Packages

Use these for product-specific marketplace work:

- `@repo/marketplace`: vehicle categories, listing types, filters, enums, route builders, search param schemas, seeded mock data.
- `@repo/marketplace-ui`: vehicle cards, listing gallery, marketplace search header, filter chips, make/model sheet, quick filter drawer, listing contact panel.

Keep `@repo/marketplace` mostly UI-free. Keep `@repo/marketplace-ui` product-specific but app-agnostic.

Dealer Studio extends the same package system:

- `@repo/marketplace` owns dealer org, lead, listing generation, photo job, provider status, and feed row types.
- `@repo/marketplace-ui` owns reusable inventory rows, compact dealer surfaces, and Listing Factory UI pieces when they are shared or likely to be reused.
- `@repo/ai` owns typed listing-copy helpers and local fallback behavior.
- `@repo/storage` owns upload and media helper functions, not provider-specific product workflows.
- `@repo/database` owns Prisma schema and mapping helpers. Apps should consume query helpers where it avoids duplicating mapping logic.

## Data Flow

Public browsing flow:

1. `apps/web` reads URL search params.
2. Search params are parsed by `@repo/marketplace` schemas.
3. Data is fetched from database/search service.
4. Results render as public listing cards.
5. Save/contact actions either work for authenticated users or redirect to `apps/app` auth flow.

Authenticated workspace flow:

1. `apps/app` checks auth.
2. User or organization role determines access.
3. Workspace pages read/write listing, lead, saved search, and billing data.
4. Shared domain types come from `@repo/marketplace`.
5. UI primitives come from `@repo/design-system` and product components from `@repo/marketplace-ui`.

Dealer Studio flow:

1. `apps/app` resolves the active Clerk organization to `DealerOrg`.
2. Inventory and Listing Factory writes are scoped to that `DealerOrg`.
3. Provider-heavy steps call typed server actions or `apps/api` routes, never external providers from UI components.
4. Provider adapters return deterministic stub output when secrets are absent.
5. Publishing writes an active `MarketplaceListing` with denormalized seller fields and explicit `dealerOrgId`.
6. `apps/web` renders the public listing from database-backed marketplace queries.
7. `apps/api` exposes active listings through the dealer website feed.

Webhook flow:

1. Provider calls `apps/api`.
2. Route validates signature.
3. Handler updates database.
4. Observability records status.
5. Notifications/email jobs are triggered when needed.

## Rendering Strategy

Use public SEO rendering where it matters:

- category pages.
- make/model pages.
- listing details.
- dealer profiles.
- guides.

Use dynamic rendering where user-specific state dominates:

- saved listings.
- dealer dashboard.
- messages.
- admin queues.

## Search Strategy

Start with database-backed filtering and typed URL params. Add a dedicated search service only when scale or relevance needs demand it.

Search must support:

- free-text query.
- structured filters.
- stable URL params.
- canonical SEO paths for major category/make/model pages.
- sort options.
- pagination or infinite loading with crawlable fallbacks.

## Auth Strategy

Public pages must not require auth. Auth is required for:

- saving listings.
- saving searches.
- contacting through protected forms if abuse controls require it.
- creating/editing listings.
- dealer workspace.
- Dealer Studio Listing Factory.
- admin workspace.
- billing.

Dealers map to Clerk Organizations. A Clerk organization is the auth boundary; `DealerOrg` is the durable product record. Clerk webhooks should eventually upsert dealer org/member records, but local development can seed or create a dealer org manually while webhooks are unavailable.

## Database Strategy

Use Prisma models for durable marketplace state:

- users and profiles.
- sellers and dealers.
- listings.
- vehicle specs.
- media assets.
- listing generations and photo jobs.
- saved listings.
- saved searches.
- leads.
- subscriptions and promotions.
- moderation reports.

Keep external service identifiers on dedicated fields so provider changes do not leak across the app.

For public listings, keep denormalized seller fields on `MarketplaceListing` for fast rendering. Add explicit nullable relations such as `dealerOrgId` and, later, `sellerProfileId`; do not overload `sellerId` with multiple relational meanings.

## Styling Strategy

The visual system should remain close to the legacy prototype:

- neutral background.
- off-white app canvas with white primary content surfaces.
- grey filled controls and option rows.
- compact controls.
- shadcn-style borders.
- rounded but not bubbly.
- image-first vehicle cards.
- dense, practical marketplace pages.
- bottom sheets on mobile.

The public marketplace should never feel like a SaaS landing page on first load.

## Risks And Guardrails

### Risk: Duplicating Marketplace Logic

Guardrail: put filters, types, route builders, and display helpers in packages.

### Risk: `apps/app` Becomes The Marketplace

Guardrail: public browse and listing routes belong in `apps/web`.

### Risk: Generic UI Drift

Guardrail: compare against the legacy `/lease` route before shipping marketplace UI.

### Risk: Overbuilding Infrastructure Before Product

Guardrail: build database-backed marketplace flows first, then add search service, AI, partner APIs, and advanced monetization when they have a clear product use.

### Risk: SEO Gets Blocked By Auth/App Shell

Guardrail: listing and category pages live in `apps/web` and remain publicly indexable.

### Risk: Dealer Studio Becomes A Parallel Product

Guardrail: Dealer Studio lives in `apps/app`, publishes to the existing public marketplace, and uses the same marketplace packages. Do not fork listing logic or create a separate dealer CMS.

### Risk: Provider Lock-In Or Secret-Required Local Development

Guardrail: VIN, photo, AI, trust, messaging, and publishing providers sit behind adapters with local stubs. Missing optional provider secrets must not break ordinary local checks.
