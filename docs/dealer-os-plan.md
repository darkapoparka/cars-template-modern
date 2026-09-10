# AutoMarket Dealer Studio and Listing Factory Plan

> Status: canonical planning draft.
> Next implementation target: Phase 1A only.
> Audience: Codex and engineers working in `M:\automarket-forge`.

Read `AGENTS.md` and `docs/decisions/0003-dealer-studio-supply-wedge.md` before implementing. This plan deliberately stays inside the fixed next-forge split: public marketplace in `apps/web`, authenticated workspace in `apps/app`, service/provider routes in `apps/api`, shared domain/UI in packages.

## 1. Product Thesis

AutoMarket should not sell dealers a generic dashboard or a QR-code gadget. The stronger product is:

**AutoMarket Dealer Studio: an AI-assisted inventory and merchandising workspace for car dealers.**

The first demo should feel simple and valuable:

1. Dealer takes phone photos of a car.
2. Dealer enters VIN/specs or manually fills missing details.
3. Listing Factory drafts Bulgarian and English copy, short marketplace copy, and social copy.
4. Photo processing improves presentation while preserving original photos for trust.
5. The car becomes live on AutoMarket, gets a public vehicle page, can be printed as a QR/short-link windshield card, and appears in the dealer website feed.

QR is only one doorway into the live vehicle page. The product is the inventory workflow, public distribution, lead capture, and the data that compounds from every listing.

## 2. Why This Wedge

Dealer Studio solves the marketplace cold-start problem from the supply side. A dealer gets immediate value before AutoMarket has huge buyer traffic:

- faster listing creation.
- better vehicle presentation.
- one source of truth for the dealer website and AutoMarket inventory.
- public vehicle pages that sales staff can send by link, print, or share.
- structured lead capture and future AI lead assistance.

The long-term moat is not the first UI. It is the accumulated local dataset: inventory, price changes, days listed, sold state, lead intent, photo quality, and dealer behavior. That dataset can later power pricing advice, stock alerts, trust signals, and lead scoring.

## 3. Current Repo Reality

The repo already has:

- public marketplace shell and listing detail in `apps/web`.
- mock authenticated buyer/seller/dealer/admin screens in `apps/app`.
- `packages/marketplace` for types, filters, routes, and mock data.
- `packages/marketplace-ui` for shared vehicle cards, search shell, and listing detail UI.
- a thin `packages/ai` scaffold with Vercel AI SDK/OpenAI model helpers.
- a thin `packages/storage` scaffold with Vercel Blob client exports.
- `apps/api` health, cron, and webhook routes.
- Prisma models for `MarketplaceListing`, `MarketplaceListingImage`, `SavedListing`, and `SavedSearch`.

So Phase 1 is not "create a whole dealer app from scratch." It is: graduate the existing mock dealer workspace into a durable Dealer Studio slice, one milestone at a time.

## 4. next-forge Boundary Map

| Concern | Home | Rule |
| --- | --- | --- |
| Dealer Studio UI, Listing Factory wizard, inventory, leads, billing | `apps/app` | Authenticated, org-scoped, operational UI. |
| Public listing pages, dealer profiles, QR/short-link destinations, SEO | `apps/web` | Public and indexable where appropriate. |
| VIN/photo/trust adapters, website feeds, webhooks, cron jobs | `apps/api` | Service boundary. Do not call external providers directly from UI components. |
| Dealer/listing/lead/feed types, filters, route builders | `packages/marketplace` | UI-free domain logic. |
| Vehicle cards, galleries, inventory rows, Listing Factory UI | `packages/marketplace-ui` | Product UI shared by `apps/web` and `apps/app`. |
| AI listing copy and structured generation helpers | `packages/ai` | Typed functions with safe local fallback behavior. |
| Upload and media helpers | `packages/storage` | Provider-neutral storage helpers. |
| Prisma schema and query helpers | `packages/database` | Durable data and query mapping. |

Never build product code in `apps/studio`; that app is Prisma Studio.

## 5. Data Model Direction

Keep the public listing read model fast and explicit.

### Models To Add

- `DealerOrg`: durable dealer business record keyed by `clerkOrgId`.
- `DealerMember`: Clerk user membership mirror for product roles and local query convenience.
- `Lead`: buyer interest tied to listing and optional dealer org.
- `ListingGeneration`: AI generation audit trail for title, descriptions, captions, model, prompt version, and source inputs.
- `ListingPhotoJob`: processing job/audit record for original image, processed image, provider, backdrop preset, and status.
- Later: `VehicleHistoryReport`, `PriceSnapshot`, and `SoldRecord`.

### Listing Relation Guardrail

Do **not** reinterpret `MarketplaceListing.sellerId` as `DealerOrg.id`.

Use:

- existing `sellerId`, `sellerType`, `sellerDisplayName`, `sellerVerificationStatus`, `sellerCity` as denormalized public seller identity.
- new nullable `dealerOrgId` for dealer-owned listings.
- later nullable `sellerProfileId` for private-seller-owned listings.

This avoids ambiguity and preserves public rendering performance.

### Clerk Organization Sync

Dealers map to Clerk Organizations, but Clerk is not the product database.

- `DealerOrg.clerkOrgId` must be unique.
- Authenticated dealer pages resolve the active Clerk `orgId` to `DealerOrg`.
- Local development must support a seeded or stub dealer org when Clerk webhooks are not configured.
- Clerk organization webhooks should eventually upsert `DealerOrg` and `DealerMember`, but Phase 1A can provide manual/server-action creation for the local slice.

## 6. Provider Adapter Rules

Rent hard capabilities until pilot usage proves the need to own them.

Adapters must have a `stub` implementation that works without secrets:

- VIN decode: stub returns deterministic mock specs from the input VIN or sample data.
- Photo processing: stub returns the original image as the processed image and records status.
- AI copy: if `OPENAI_API_KEY` is missing, stub returns editable deterministic Bulgarian/English copy.
- Vehicle history: not in Phase 1.
- Messaging/social publishing: not in Phase 1.

Provider selection should be controlled by explicit env names in the owning app/package. Do not add required env vars for optional providers unless the code can still build without them.

## 6.1 Phase 1A Dealer Feed Contract

`apps/api` owns the dealer website feed boundary at:

```text
GET /feed/dealer/[slug].json
```

Phase 1A returns active listings for a `DealerOrg` when `websiteFeedEnabled` is true. The route is public, cacheable, and does not require provider secrets. Missing dealers or disabled feeds return `404` with `dealer_feed_not_found`.

The JSON response shape is `DealerFeedResponse` from `@repo/marketplace`:

- `feedVersion`: currently `dealer-feed.phase1a.v1`.
- `generatedAt`: ISO timestamp for the feed response.
- `dealer`: id, slug, display name, city, country, verification status, phone, and website URL.
- `listings`: active public inventory rows with id, slug, title, description, price, price type, optional monthly estimate, specs, location, images, public URL, published time, and updated time.

Local development may pass `webBaseUrl` as a query parameter to shape `publicUrl`; otherwise the route uses `NEXT_PUBLIC_WEB_URL` or `http://localhost:3001`.

## 7. Phase 1 Milestones

### Phase 1A: Data And Adapter Foundation

Goal: create the durable foundation without building the full wizard.

Deliverables:

- Prisma schema additions for `DealerOrg`, `DealerMember`, `Lead`, `ListingGeneration`, `ListingPhotoJob`, and `dealerOrgId` on `MarketplaceListing`.
- Marketplace TypeScript types for the same concepts.
- Database query helpers for resolving current dealer org and listing feed rows.
- Stub provider interfaces for VIN decode, photo processing, and AI copy.
- API route contract for dealer feed shape, even if initially backed by seed/mock data.
- Updated docs and seed notes.

Acceptance:

- Typecheck/build passes for touched packages.
- Existing public marketplace still renders active listings.
- No new provider secret is required to run local checks.
- Schema diff is reviewed before implementation.

### Phase 1B: Real Dealer Inventory

Goal: replace the mock dealer inventory page with org-scoped durable data.

Deliverables:

- Existing `/dealer/inventory` reads listings for the active `DealerOrg`.
- Inventory row shows thumbnail, title, price, status, leads, days listed, and actions.
- Actions support draft, pause, active, sold transitions through server actions.
- Empty, loading, and local seeded states are usable on mobile.

Acceptance:

- Dealer staff can see only their org inventory.
- No duplicate dealer route tree is introduced.
- Public listing links still point to `apps/web`.

### Phase 1C: Listing Factory Draft Flow

Goal: a dealer can create a high-quality draft from a compact guided flow.

Deliverables:

- `/dealer/inventory/new` uses Listing Factory UI.
- Steps: photos, VIN/specs, AI copy, photo processing review, price/review.
- Stub VIN, AI copy, and photo processing all work without provider secrets.
- Generated copy is always editable.
- Original photos remain visible or recoverable.

Acceptance:

- Draft persists.
- Validation prevents incomplete publish.
- Mobile UI is compact and operational, not marketing-styled.

### Phase 1D: Publish, Feed, And Public Rendering

Goal: publish once and distribute through AutoMarket plus dealer feed.

Deliverables:

- Publish writes an active dealer `MarketplaceListing`.
- `apps/web` listing detail loads the real listing.
- `GET /feed/dealer/[slug].json` returns active public inventory for external websites.
- Feed includes only stable public fields: id, slug, title, price, specs, image URLs, location, updated time, and public URL.

Acceptance:

- Created listing appears in public marketplace pages.
- Feed response is deterministic and documented.
- Public pages do not require auth.

### Phase 1E: QR/Short Link And Print Card

Goal: make the public listing easy to share from physical and sales contexts.

Deliverables:

- QR/short-link generation points to the existing public listing URL with `src=qr`.
- Printable windshield card shows car title, price, primary image, dealer name, contact hints, and QR.
- Source attribution is captured in URL/query conventions for later analytics.

Acceptance:

- QR resolves to the public listing.
- Printable page works on mobile and desktop.
- QR is presented as a distribution helper, not the core product.

## 8. Later Phases

Do not build these in Phase 1:

- Viber/WhatsApp AI responder.
- Buyer chat on vehicle pages.
- Social video generation.
- Pricing intelligence and stock alerts.
- carVertical or other vehicle history reports.
- mobile.bg/cars.bg auto-publishing.
- Multi-role permission complexity beyond owner/sales basics.
- Real queue infrastructure unless provider latency demands it.

## 9. Validation Before Promising

These are discovery items, not implementation assumptions:

- Whether mobile.bg/cars.bg support dealer XML/feed import for the target dealers.
- Exact dealer portal pricing and import workflow.
- Which photo provider gives acceptable results on real Bulgarian lot photos.
- Whether AI-enhanced photos help conversion without harming trust.
- Which product name resonates: AutoMarket Dealer Studio, AutoMarket Studio, or another localized name.

Never promise automatic mobile.bg/cars.bg publishing until verified from a real dealer panel or written provider documentation.

## 10. UX Direction

Dealer Studio should feel like a compact mobile CRM/inventory tool:

- off-white app canvas.
- white primary content surfaces.
- grey filled controls and option rows.
- dark selected/primary actions.
- compact status chips.
- no giant dashboards or fluffy hero sections.
- no nested cards.
- direct actions in rows.

Listing Factory should feel guided but not childish. It is a fast professional workflow, not a marketing wizard.

## 11. Recommended Next Prompt

Use `docs/codex-phase1-prompt.md` for Phase 1A only. Do not use a prompt that attempts the entire Phase 1A-1E sequence in one implementation session.
