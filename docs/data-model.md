# AutoMarket Data Model

## Modeling Goals

The data model must support public browsing, reliable seller workflows, dealer operations, moderation, search, leasing/finance offers, and SEO-friendly listing pages.

Use explicit domain names. Avoid generic "item" or "post" naming for core vehicle marketplace data.

## Core Entities

### User

Represents an authenticated person.

Important fields:

- id.
- auth provider id.
- email.
- name.
- phone.
- locale.
- created at.
- updated at.

Relationships:

- one profile.
- many saved listings.
- many saved searches.
- many leads.
- optional dealer membership.

### SellerProfile

Represents a private seller identity.

Important fields:

- id.
- user id.
- display name.
- phone.
- location.
- verification status.
- seller rating summary.

### Dealer

Represents a business seller.

Important fields:

- id.
- slug.
- clerk organization id.
- legal name.
- display name.
- logo image id.
- brand color.
- backdrop preset.
- address.
- city.
- country.
- phone.
- website.
- website feed enabled.
- verification status.
- subscription status.
- created at.
- updated at.

Relationships:

- many dealer members.
- many listings.
- many leads.
- many promotions.
- many listing generations.
- many photo jobs.

Notes:

- A dealer maps to a Clerk Organization, but the product record is durable in AutoMarket as `DealerOrg`.
- `clerkOrgId` must be unique.
- Local development may seed a dealer org when Clerk webhooks are not configured.

### DealerMember

Connects users to dealers.

Important fields:

- id.
- dealer id.
- user id.
- clerk user id.
- role.
- status.
- created at.
- updated at.

Roles:

- owner.
- manager.
- sales.
- viewer.

### Listing

Represents a public vehicle listing.

Important fields:

- id.
- slug.
- seller type.
- seller profile id.
- dealer id.
- denormalized seller id.
- denormalized seller display name.
- denormalized seller verification status.
- denormalized seller city.
- category.
- status.
- title.
- description.
- price amount.
- price currency.
- price type.
- location city.
- location region.
- location country.
- latitude.
- longitude.
- published at.
- expires at.
- sold at.
- created at.
- updated at.

Relationships:

- one vehicle spec.
- many media assets.
- many leads.
- many saved listing records.
- optional dealer org.
- optional seller profile.
- many listing generations.
- many listing photo jobs.
- optional lease offer.
- optional finance offer.
- many moderation reports.

Notes:

- Public listing pages should not need joins for basic seller display.
- Keep denormalized seller fields on the listing.
- Use explicit nullable relations such as `dealerOrgId` and `sellerProfileId`.
- Do not make a generic `sellerId` field double as a dealer relation.

### VehicleSpec

Stores normalized vehicle details.

Important fields:

- listing id.
- make.
- model.
- trim.
- year.
- body type.
- fuel type.
- transmission.
- drivetrain.
- mileage value.
- mileage unit.
- engine displacement.
- engine power.
- color exterior.
- color interior.
- doors.
- seats.
- VIN when available.
- registration country.
- first registration date.
- inspection valid until.
- emissions standard.

### MediaAsset

Represents uploaded listing media.

Important fields:

- id.
- listing id.
- storage key.
- url.
- type.
- sort order.
- alt text.
- width.
- height.
- original url.
- processed url.
- processing status.
- processing provider.
- processing metadata.
- created at.

For the first implementation, these fields may live on `MarketplaceListingImage` or on a related `ListingPhotoJob`. Prefer a separate job record when provider status, retries, and audit history matter.

### ListingGeneration

Represents AI-assisted listing generation output and its audit trail.

Important fields:

- id.
- dealer id.
- listing id.
- VIN.
- input photo urls.
- input notes.
- generated title.
- generated Bulgarian description.
- generated English description.
- generated marketplace short copy.
- generated social caption.
- model/provider.
- prompt version.
- status.
- created by user id.
- created at.

Relationships:

- one dealer.
- optional listing.

Rules:

- Generated copy is always editable before publish.
- Keep enough metadata to audit and improve generation quality later.
- If no AI provider key is configured, the stub generator returns deterministic editable copy.

### ListingPhotoJob

Represents a photo processing request and result.

Important fields:

- id.
- dealer id.
- listing id.
- image id.
- original url.
- processed url.
- backdrop preset.
- provider.
- status.
- error message.
- created at.
- completed at.

Statuses:

- queued.
- processing.
- done.
- failed.
- skipped.

Rules:

- Original photos remain available for trust.
- The local stub returns the original image as the processed image.
- Do not implement computer vision or background replacement in product code; use provider adapters.

### SavedListing

Connects a user to a listing.

Important fields:

- user id.
- listing id.
- created at.

### SavedSearch

Stores repeatable buyer search criteria.

Important fields:

- id.
- user id.
- name.
- category.
- query.
- filters JSON.
- alert frequency.
- last sent at.
- created at.
- updated at.

### Lead

Represents buyer interest sent to a private seller or dealer.

Important fields:

- id.
- listing id.
- buyer user id.
- seller profile id.
- dealer id.
- contact method.
- message.
- phone.
- email.
- status.
- source.
- channel.
- buyer intent.
- qualification summary.
- score.
- created at.
- updated at.

Statuses:

- new.
- viewed.
- replied.
- closed.
- spam.

Phase 1 only needs basic lead records tied to listings and dealer orgs. AI lead qualification and messaging automation are later phases.

### PriceSnapshot

Represents historical listing price state.

Important fields:

- id.
- listing id.
- dealer id.
- price amount.
- price currency.
- captured at.
- source.

This is a later data-moat feature. It should not block Phase 1A.

### SoldRecord

Represents sold state and optional sold price metadata.

Important fields:

- id.
- listing id.
- dealer id.
- listed at.
- sold at.
- last asking price.
- sold price.
- source.

This is a later pricing intelligence and days-to-sell feature. It should not block Phase 1A.

### LeaseOffer

Represents lease-specific terms.

Important fields:

- id.
- listing id.
- monthly amount.
- currency.
- term months.
- due at signing amount.
- annual mileage allowance.
- provider name.
- eligibility notes.

### FinanceOffer

Represents financing estimate or partner offer.

Important fields:

- id.
- listing id.
- monthly amount.
- currency.
- term months.
- apr.
- down payment amount.
- provider name.

### Promotion

Represents paid listing visibility.

Important fields:

- id.
- listing id.
- dealer id.
- type.
- status.
- starts at.
- ends at.
- payment reference.

### ModerationReport

Represents user or system reports.

Important fields:

- id.
- listing id.
- reporter user id.
- reason.
- details.
- status.
- reviewed by user id.
- reviewed at.
- created at.

### AuditLog

Tracks important admin and system actions.

Important fields:

- id.
- actor user id.
- actor type.
- action.
- entity type.
- entity id.
- metadata JSON.
- created at.

## Enums

### VehicleCategory

- car.
- truck.
- motorbike.
- van.
- lease.

### ListingStatus

- draft.
- pending_review.
- active.
- paused.
- sold.
- expired.
- rejected.

### SellerType

- private.
- dealer.

### PriceType

- fixed.
- negotiable.
- lease_monthly.
- finance_estimate.

### FuelType

- gasoline.
- diesel.
- hybrid.
- plug_in_hybrid.
- electric.
- lpg.
- cng.
- other.

### Transmission

- automatic.
- manual.
- semi_automatic.

### BodyType

- hatchback.
- sedan.
- wagon.
- suv.
- coupe.
- convertible.
- pickup.
- van.
- minibus.
- motorcycle.
- scooter.
- truck.
- other.

### VerificationStatus

- unverified.
- pending.
- verified.
- rejected.

### DealerRole

- owner.
- manager.
- sales.
- viewer.

Phase 1 can start with owner and sales if the UI does not yet need full role complexity.

### ProviderJobStatus

- queued.
- processing.
- done.
- failed.
- skipped.

Use this shape for VIN, photo, and AI-adjacent provider jobs where status must be shown or retried.

## Search Facets

Search must support these filterable fields:

- category.
- make.
- model.
- trim.
- year min and max.
- price min and max.
- currency.
- mileage max.
- location.
- radius.
- fuel type.
- transmission.
- body type.
- seller type.
- dealer id.
- condition.
- status active only for public pages.
- lease availability.
- finance availability.
- promoted flag.

## URL Search Params

Use stable, typed params for public search:

- `category`.
- `q`.
- `make`.
- `model`.
- `trim`.
- `location`.
- `radius`.
- `priceMin`.
- `priceMax`.
- `yearMin`.
- `yearMax`.
- `mileageMax`.
- `fuel`.
- `transmission`.
- `body`.
- `seller`.
- `sort`.
- `page`.

Keep URL params human-readable. Do not store opaque filter state in public URLs.

## Listing Lifecycle

1. Draft: seller starts listing.
2. Pending review: listing submitted if moderation is enabled.
3. Active: listing appears publicly.
4. Paused: seller hides listing.
5. Sold: seller marks listing sold.
6. Expired: system expires stale listing.
7. Rejected: admin rejects listing.

## Permission Model

Public users can:

- view active listings.
- view public dealer profiles.
- open public search pages.

Authenticated buyers can:

- save listings.
- save searches.
- create leads.
- manage their own profile.

Private sellers can:

- create listings.
- edit their own listings.
- view leads for their listings.

Dealer members can:

- manage listings for their dealer based on role.
- view dealer leads.
- manage dealer profile if role allows it.
- view analytics if role allows it.
- use Listing Factory for their active dealer organization.

Dealer Studio permissions are organization scoped. Resolve the current Clerk organization first, then map it to `DealerOrg` before reading or writing dealer inventory.

Admins can:

- moderate listings.
- manage users and dealers.
- view reports.
- change verification status.

## Data Quality Rules

- Listing slug should be stable after publish unless the title is materially corrected.
- Public pages should use active listings only.
- Vehicle make/model should use normalized canonical names.
- User-entered free text should not become canonical make/model data without validation.
- Image order matters.
- First image is the card and SEO preview image.
- Price currency must be explicit.
- Location fields should support both city display and distance search.
