# Modern mobile polish — 6 October 2026

The approved mobile layout is prepared as a scoped Cars main commit: quieter 18px page headings, one aligned silver header icon family, matching bottom navigation artwork, simpler Guides metadata, Details/Photos on listing pages, grouped facts and extras, the photo Leasing banner and compact showroom banner, and separate grey similar-car cards.

The existing approved MODERN logo and four Services illustrations are included as shared dependencies. Desktop layout drafts, other template and dealer work, release selections and provider settings are preserved outside this source change. The new Services route keeps the desktop styling saved before the mobile edits. Shared listing, import and leasing files include their mobile hunks while retaining the committed desktop composition.

Before integration, the empty index lock dated 5 October was verified without an active handle or index writer and preserved with a receipt under ignored runtime. Cars main was fast-forwarded to `4eebd32950cc4ff0da2d2e4b60ae5f1d2d089fb9`; SHA-256 comparisons confirmed that none of the 61 incoming paths changed in the working tree. The pre-existing index had no staged changes.

Local verification before source packaging included production builds, Chromium and WebKit mobile checks, and Bulgarian/English layout inspection at 320px and 390px. The final similar-card pass also checked 360px, keyboard navigation, horizontal scrolling, the linked listing and the desktop recommendations. The final card changes passed Marketplace UI TypeScript and 16 existing vehicle-card policy tests.

Matched final evidence:

- [Header icon alignment](header-icon-system-2026-10-06/all-nine-in-header-controls.png)
- [Smaller mobile headings and navigation](mobile-header-icons-2026-10-06/before-after.png)
- [Listing financing banner](mobile-pdp-finance-marketing-2026-10-06/before-after-390.png)
- [Similar-car cards](mobile-pdp-related-polish-2026-10-06/before-after-390.png)

The separate `cars-template-modern` publishing mirror supplies the standalone phone preview. Updating that preview does not select a dealer template release or update any dealership.
