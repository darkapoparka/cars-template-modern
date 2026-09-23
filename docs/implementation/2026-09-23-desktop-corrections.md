# Desktop corrections after owner review

The owner rejected the placement of result controls inside the buy box, the detached oversized input actions, and the tall financing layout in d025d89. This correction supersedes those design choices in the earlier shared-panels report.

## Resulting behavior

- Home and inventory still render the same DealerHeroSearch and DesktopActionPanel. The compact submit action is inset into the search input surface.
- Inventory count, Filters, sorting and separate grid/list buttons are restored above the listings in DealerInventorySummary. MarketplaceViewModeToggle and the marketplace shell's existing full-filter overlay are reused. Sorting acts on applied result filters.
- The import submit action is inset into its URL entry surface using the same 48px field / 36px action dimensions.
- Financing has one row of three selectors and a compact vehicle/price/estimate/action row. It keeps the selected vehicle thumbnail and detail link, URL preference persistence and honest estimate wording. The panel measures about 294px high at 1440px, versus about 444px before correction. Desktop hero height follows its content.
- Mobile-specific forms and layouts are preserved.

## Banner provenance

Asset: apps/web/public/images/desktop/showroom-calm-v3.png. Generated with the built-in imagegen tool on 23 September 2026; the tool did not expose a model selector. Source: C:/Users/radev/.codex/generated_images/01a0cee3-8940-7c51-8adf-43f10a4311cd/exec-b2ff93eb-b461-466c-82f7-5419ff02b4f5.png. Copied into the repository without overwriting the earlier artwork. The same asset is referenced by all desktop heroes through desktop-banner-artwork.ts. It is decorative generated imagery, not an inventory photograph.

Final prompt:

> Use case: ads-marketing. Asset type: one panoramic photographic background for a premium used-car dealership desktop website hero, to be reused across home, inventory, sell, financing and import. Create a refined, photorealistic charcoal automotive studio, very wide horizontal 3:1 composition. Two restrained glimpses of modern metallic silver and graphite vehicles at the extreme left and extreme right, realistic proportions, photographed from a modest distance, only occupying the outer 15% on each side. Keep the central 70% almost empty: deep charcoal wall and matte floor with subtle architectural lighting. The website will overlay a heading near the top center and a large white form centrally; no text or interface should be in this image. Quiet soft side light, natural reflections, crisp automotive photography, minimal architecture, mostly near-black and graphite, smooth transition to near-black along top edge. No neon, red streaks, dramatic smoke, glossy wet floor, logos, badges, lettering, people, oversized close-up cars or busy background. Make the cars clearly legible at the edges without competing with the central form. Render as a single finished background image.

## Verification and scope

Work uses the existing saved main checkout and demo listener on port 6462, Node 22.23.2 and pnpm 11.4.0.

- Web typecheck and production build with the documented static-demo environment passed.
- Web unit tests: 185 passed. Marketplace UI unit tests: 82 passed.
- Scoped Biome and staged whitespace checks passed.
- Existing desktop category-navigation and desktop-panel-flows specs: 3 passed. Added assertions that inventory result controls are outside and below the buy box and the submit action is inside the input surface. Financing Back/reload persistence remains covered.
- Existing mobile financing selection and import draft/country-picker specs: 2 passed.
- English and Bulgarian home, inventory, sell, lease and import rendered at 390, 1024, 1440 and 1920px: all 40 checks passed, without horizontal overflow or page errors. Home/inventory geometry matches. Financing height is 293.6875px at all three desktop widths. Search panel height is 284px at 1440/1920, 342px at 1024 where filters use three rows.
- Additional browser actions passed: grid/list switching, sorting by price, opening the full filter dialog, and import URL handoff into its editable request form. No enquiry or external phone action was sent.
- Inspected English desktop inventory/financing/import and Bulgarian financing screenshots, including 1024px. Local evidence: C:/Users/radev/AppData/Local/Temp/modern-desktop-polish/correction-qa.json and corrected-*.png. Representative screenshots also saved under C:/Users/radev/.codex/visualizations/2026/09/23/01a0cee3-8940-7c51-8adf-43f10a4311cd/modern-desktop/.

Playwright used installed Chrome through the same temporary configuration as the preceding pass. An initial additional QA script stopped because its import button locator also matched a hidden mobile button; narrowed it to the submit button and reran the matrix successfully.

The previously dirty mobile-content-hub, contact page, older ledger and unused artifacts remain outside this change. The preceding report's unrelated default contact-route limitation was not re-audited or fixed. No dealer deployment was performed. These checks cover the local combined checkout; they do not establish an exact-commit release or mounted/public verification. Rendered owner acceptance remains separate from implementation and browser checks.
