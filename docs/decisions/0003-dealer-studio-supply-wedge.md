# Decision 0003: Dealer Studio Supply Wedge

## Status

Accepted.

## Context

AutoMarket needs buyer demand and dealer supply. The public marketplace already has the correct next-forge split: anonymous browsing and SEO pages in `apps/web`, authenticated workflows in `apps/app`, and service integrations in `apps/api`.

The next major product risk is supply. A generic dealer dashboard is not enough to win dealer adoption, and a QR-code tool alone is too small to sell. Dealers need faster merchandising: add a car once, improve its presentation, publish it everywhere useful, and capture better leads.

## Decision

Build **AutoMarket Dealer Studio** as the supply-side wedge inside the existing next-forge architecture.

Dealer Studio is an authenticated workspace in `apps/app`. Its first wedge is the Listing Factory: a dealer uploads phone photos, enters VIN/specs or manual details, gets AI-assisted Bulgarian/English listing copy, keeps original and processed photos, publishes to AutoMarket, receives a public vehicle page, and exposes active inventory through an API feed for the dealer's own website.

The public vehicle page remains in `apps/web`. QR codes and short links point to that public listing page with source attribution; they are entry points into the vehicle page and lead capture, not a standalone product.

Provider-heavy work lives behind adapters in `apps/api` and packages. VIN decoding, photo background replacement, vehicle history, messaging, and social publishing are rented capabilities until volume and data justify deeper ownership.

## Architecture Mapping

| Concern | Home |
| --- | --- |
| Dealer Studio UI, Listing Factory, inventory, leads, billing | `apps/app` |
| Public listing pages, dealer profiles, QR destinations, SEO metadata | `apps/web` |
| VIN/photo/trust adapters, website feeds, webhooks, scheduled jobs | `apps/api` |
| Listing, dealer, lead, filter, route, and feed types | `packages/marketplace` |
| Vehicle cards, galleries, dealer inventory rows, Listing Factory UI | `packages/marketplace-ui` |
| LLM copy and structured generation helpers | `packages/ai` |
| Upload and media helpers | `packages/storage` |
| Prisma schema and query helpers | `packages/database` |

## Data Guardrails

- Dealers map to Clerk Organizations, but product state is stored in `DealerOrg` keyed by `clerkOrgId`.
- `MarketplaceListing` keeps denormalized public seller fields for fast public rendering.
- Do not make `MarketplaceListing.sellerId` directly mean `DealerOrg.id`. Add explicit nullable relations such as `dealerOrgId` and, later, `sellerProfileId`.
- Capture photo processing and AI generation as durable records so the system can audit generated output and improve the proprietary dataset over time.
- Price and sold-state snapshots are a later data-moat feature, not required for the first Listing Factory slice.

## Implementation Sequencing

Phase 1 must be split into small milestones:

1. **1A: Data and adapter foundation** — schema, types, org mapping, provider interfaces, local stubs, and feed contract.
2. **1B: Dealer inventory persistence** — graduate the existing mock inventory page to real dealer org data.
3. **1C: Listing Factory draft flow** — upload/manual input/VIN stub/AI copy stub creates a draft listing.
4. **1D: Publish and public rendering** — active dealer listing appears in `apps/web`; feed returns it.
5. **1E: QR/printable vehicle card and visual polish** — public URL attribution, printable card, mobile QA.

Viber/WhatsApp AI, social video, pricing intelligence, vehicle history reports, and mobile.bg/cars.bg publishing are later phases.

## Consequences

This keeps the marketplace architecture clean while giving dealers a demoable reason to adopt AutoMarket before buyer demand is large. It also avoids overbuilding infrastructure too early: the first version can use safe stubs and provider adapters, then swap in real vendors when pilots validate demand.

The tradeoff is that Dealer Studio becomes a product wedge, not merely a back-office feature. Roadmap and docs must reflect this so future work does not treat dealer pages as generic admin tables.
