# AutoMarket Frontend UX

## UX North Star

AutoMarket should feel like a serious marketplace on mobile: compact, fast, structured, and image-first. It should keep the practical density of mobile.de and cars.bg while using a calmer modern visual system.

The old prototype has the right direction. The `/lease` route is the strongest mobile styling reference.

## Visual Style

Use:

- off-white or near-white app canvas.
- white primary content surfaces.
- grey filled controls and option rows.
- neutral foreground.
- subtle borders.
- compact rounded controls.
- `bg-secondary` style filled controls.
- real vehicle photos.
- small text for metadata.
- clear icon buttons.
- sticky search/filter header.
- bottom sheets for mobile drill-downs.

Avoid:

- generic SaaS hero sections.
- huge marketing typography on marketplace screens.
- decorative gradients.
- large floating cards around page sections.
- relying on white surfaces plus borders for every layer of hierarchy.
- purple/blue gradient visual identity.
- beige/brown one-note palettes.
- fake dashboard cards for public browsing.
- burying every filter inside the search input.

## Mobile Surface Hierarchy

The mobile UI should use surface contrast before relying on borders:

- App/page canvas: off-white or very light neutral.
- Primary content surfaces: white.
- Controls, chips, option rows, and inactive nav items: grey filled neutral.
- Selected controls and primary CTAs: dark neutral foreground fill.
- Borders: subtle support, not the only hierarchy.
- Status/trust: restrained semantic color only where it communicates state.

This matters most in drawers, filters, bottom nav, dealer inventory rows, and admin/dealer workspace screens. Avoid "white button soup" where every action has the same visual weight.

## Mobile Public Marketplace Layout

The default mobile marketplace structure:

1. Sticky header.
2. Primary control row.
3. Quick chips row.
4. Results count and view controls.
5. Vehicle cards.
6. Bottom nav where it helps mobile navigation.

### Primary Control Row

Use a 44px-ish row similar to the legacy `/lease` route:

- left: vehicle category selector.
- center: global search input.
- right: full filter button.

The left selector should open category choices:

- Cars.
- Trucks.
- Motorbikes.
- Vans.

Lease is a global marketplace mode or navigation destination, not a vehicle class inside the category selector.

The search input should be for free text only:

- make/model text.
- trim text.
- seller/dealer name.
- keyword text.

The right filter button opens the full filter sheet.

### Quick Chips Row

Below the search row, show horizontal quick chips:

- Make and model.
- Location.
- Price.
- Year.
- Fuel.
- Transmission.
- Sort.

Each chip opens a focused drawer or sheet. Chips should show selected state using filled foreground or primary styling. Empty chips use subtle secondary fill and border.

The "Make and model" chip is important. Vehicle category belongs in the top-left selector, while make/model belongs in the chip/sheet system.

## Mobile Sheets

### Make/Model Sheet

Use the legacy `ScopeSheet` pattern:

- step 1: make grid.
- step 2: model list.
- step 3: trim list.
- search inside make/model steps.
- back button for nested levels.
- sticky footer with Clear and Show Results.

### Full Filter Sheet

Use the legacy `FilterSheet` pattern:

- main list of filter groups.
- subviews for range sliders and options.
- back navigation inside the sheet.
- sticky footer with Show Results.

### Quick Filter Drawers

Use the legacy `QuickFilterDrawer` pattern:

- one topic per drawer.
- clear title.
- tight controls.
- Apply action.
- keep height natural unless the drawer needs full-screen focus.

## Vehicle Cards

Cards should be simple and scannable:

- image first.
- price first in content.
- monthly or lease estimate secondary.
- title line.
- mileage and location line.
- save button when implemented.
- badges only when they add meaning.

Do not put heavy decoration around cards. Card borders and image quality do the work.

### List Card

Use for most mobile results:

- full-width card.
- image aspect around 4:3 or 16:10 depending density.
- content padding 12px to 16px.
- title truncates cleanly.

### Grid Card

Use when the user chooses grid:

- two columns on mobile.
- square or near-square image.
- tighter padding.
- no layout shift when titles are long.

## Listing Detail UX

Mobile listing detail should prioritize:

1. Image gallery.
2. Price.
3. Title and key metadata.
4. Seller/dealer contact actions.
5. Key specs grid.
6. Description.
7. Location.
8. Similar listings.

Sticky bottom contact actions are acceptable on mobile if they do not cover content.

## Seller And Dealer UX

Authenticated workspace screens should be more operational:

- tables for inventory.
- filters for status.
- clear empty states.
- dense metric rows.
- direct actions.
- no oversized marketing panels.

Dealer pages should look like tools people use daily, not a landing page.

### Dealer Studio UX

Dealer Studio should graduate the existing authenticated dealer screens into a compact operating surface:

- inventory rows over decorative cards.
- direct row actions for view, edit, pause, publish, and mark sold.
- compact status chips for draft, active, paused, sold, and processing.
- off-white page canvas with white content sections and grey controls.
- mobile-first Listing Factory steps that feel guided but fast.
- visible original and processed photo states where photo AI is involved.
- clear provider status when VIN, AI copy, or photo processing uses a stub or external provider.

Listing Factory is the hero workflow, but it should not look like a marketing hero. It should feel like a fast dealer task.

## Desktop Adaptation

Desktop public marketplace can expand the same system:

- top header/search remains.
- filters can become a left sidebar or horizontal filter bar.
- results grid can use 3 to 4 columns depending viewport.
- listing detail can use gallery left, sticky seller panel right.
- dealer pages can use tabbed inventory sections.

Desktop should still feel like the same product as mobile.

## Component Names To Build

Recommended product components:

- `MarketplaceShell`.
- `MarketplaceHeader`.
- `VehicleCategorySelector`.
- `MarketplaceSearchInput`.
- `QuickFilterChips`.
- `MakeModelSheet`.
- `FullFilterSheet`.
- `QuickFilterDrawer`.
- `VehicleCard`.
- `VehicleCardList`.
- `ResultsToolbar`.
- `ListingGallery`.
- `ListingSpecs`.
- `SellerContactPanel`.
- `BottomMarketplaceNav`.

Place these in `packages/marketplace-ui` when they are shared by both public and authenticated contexts. Keep page-specific composition inside the app route.

## Accessibility Rules

- All icon-only buttons need accessible labels.
- Inputs need labels, even if visually hidden.
- Drawer focus must be trapped and returned.
- Tap targets should be at least 40px high.
- Text must not overflow controls.
- Color alone cannot communicate selected state.
- Listing images need meaningful alt text.

## Responsive QA Checklist

Before shipping a public marketplace UI change:

- Check mobile width around 390px.
- Check narrow width around 360px.
- Check tablet width around 768px.
- Check desktop width around 1440px.
- Verify header controls do not wrap badly.
- Verify chips scroll horizontally.
- Verify card title truncation.
- Verify sheets are reachable and footers are visible.
- Verify no console errors.
- Compare visual density against the legacy `/lease` route.
