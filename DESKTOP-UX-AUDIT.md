# Desktop UX Audit — cars-template-modern

Date: 2026-09-11
Target: `http://localhost:3001/`
Scope: desktop only; mobile is already strong and should not be regressed.

## Core decision

**Do NOT turn `/bg` into a marketing-only homepage.**

`/bg` should remain inventory-first and show real cars immediately. The problem is not that the homepage contains the marketplace. The problem is that the desktop composition currently looks like a generic classifieds/search product instead of a premium dealer showroom.

The desired desktop experience is:

- cars visible above the fold;
- search is the primary interaction;
- premium showroom/brand atmosphere around the inventory;
- strong conversion paths for viewing, calling, financing, trade-in and import;
- desktop-native information density and controls;
- no unnecessary marketing sections before inventory.

The goal is to make the existing inventory-first homepage feel like a premium automotive showroom with a powerful search experience inside it.
## Current desktop score

| Area | Score | Main issue |
| --- | ---: | --- |
| `/bg` inventory/search | 5/10 | Functional but generic; weak showroom hierarchy |
| Desktop search/filter UX | 6/10 | Mobile-like overlays and breakpoint issues |
| Vehicle detail | 7/10 | Good structure; weak dealership persuasion |
| Sell | 6.5/10 | Generic form-on-image composition |
| Import | 5/10 | Flat and under-designed for a high-value service |
| Leasing | 6.5/10 | Clean but still form-template-like |
| Contact | 8.5/10 | Best visual direction; use as brand reference |
| Guides/blog | 4.5/10 | Placeholder/CMS-card feel |

## P0: desktop inventory layout

At 1280px the filter toolbar wraps badly: `Препоръчани` and `Филтри` fall onto a second row and create a large dead band before inventory. This must be fixed before polish.

At 1920px the layout shows five cars across. That makes the page feel like a classifieds wall. Premium desktop should cap the primary inventory grid at **4 columns**.

Recommended grid behavior:
- 1024–1199: 3 columns;
- 1200–1791: 4 columns when comfortable;
- 1792+: still 4 columns, with larger cards/content width rather than a fifth column.
## `/bg` homepage: keep cars first, redesign the composition

Do not add a long hero before inventory. Instead, redesign the first viewport as a **showroom discovery surface**:

1. Compact premium dealer header.
2. Search/discovery band with a strong visual identity.
3. One-line quick filters that never wrap.
4. Inventory grid immediately below, with the first row visible without excessive scrolling.

The desktop top area should feel more like a premium showroom entrance than a dashboard. Use restrained photography/texture/lighting in the discovery band if useful, but the cars must remain the focus.

A good desktop first viewport should communicate all of this immediately:
- who the dealer is;
- what inventory is available;
- how to search it;
- how to filter it;
- how to contact the showroom;
- the first 3–4 real vehicles.

No giant marketing hero. No hiding inventory below service cards. No homepage split that sends users to `/cars` just to see cars.
## Header, search and filters

The current dark header/search block is too large and does too many jobs at once. Keep the dark dealer identity, but reduce the visual weight and separate navigation from search.

Desktop search should be unmistakably primary, but not a 60px-tall full-width slab inside another giant slab. Use stronger spacing, better typography and clearer hierarchy instead of raw size.

The filter rail must be desktop-native:
- never wrap;
- keep `Марка`, `Модел`, `Цена`, `Година` visible;
- keep the highest-value fifth control visible when width allows;
- move mileage, fuel, transmission and body type into `Филтри` at narrower desktop widths;
- keep sort visually separate from filtering;
- make `Филтри` a clear utility action rather than an orphaned black pill.

Do not force every control to 44px. Use hierarchy: primary search/CTA around 48–52px, normal desktop filters around 38–42px, tertiary controls smaller when appropriate.

After scrolling, a compact search/filter rail can become sticky. Do not sticky the entire oversized discovery/header region.
## Make/model picker

The current centered make modal is acceptable on mobile but weak on desktop. It feels like a phone drawer enlarged onto a 1440px screen.

For desktop, use an anchored or wide popover/mega-panel connected to the control:
- search at the top;
- makes with inventory counts;
- selected make highlighted;
- models shown alongside or in a second column;
- clear selected state;
- result count / apply action visible without scrolling;
- keyboard navigation and focus management preserved.

This should make changing BMW → Mercedes → specific model feel fast and native to desktop instead of modal-heavy.

## Vehicle cards

The photography should carry more of the card. Current cards are too utility-heavy at wide desktop sizes.

Recommended hierarchy:
- larger image ratio and cleaner crop;
- model/name first;
- price second;
- monthly finance as supporting information;
- one concise metadata line such as `2021 · 96 000 km · Бензин · Автоматик`;
- reduce the four small grey metadata pills;
- retain recommendation/status badges only when meaningful;
- full card remains clickable with strong hover/focus feedback.
## Vehicle detail

The current gallery + right rail structure is good and should be kept. Improve the persuasion/conversion layer rather than rebuilding the page from scratch.

Above the fold, the right rail should prioritize:
- purchase price;
- monthly finance estimate;
- primary viewing/enquiry CTA;
- secondary call action;
- finance and trade-in shortcuts;
- concise dealer/trust information.

The embedded showroom map currently consumes too much prime space. Move the full map lower on the page. Use that high-value rail space for conversion and trust.

Below the gallery, improve the section system:
- cleaner horizontal section navigation;
- strong specification highlights;
- inspection/history/service information when available;
- equipment presented with useful grouping;
- description with better reading width;
- similar vehicles inside a deliberate soft-grey rounded section with larger cards.

The page should feel like a premium sales presentation, not a neutral marketplace detail template.
## Sell, Import and Leasing

These routes should share a coherent premium desktop system without all becoming the same white form on top of a photo.

### Sell
Use a two-column appraisal composition: persuasive copy/process/trust on one side and the progressive vehicle form on the other. Keep the first step short. Show what happens next, why the appraisal is useful, and how quickly the dealer responds.

### Import
The current page is too flat. Keep the paste-a-listing action prominent, but pair it with a stronger import visual and a clear 3–4 step process. Country/source selection should feel like browsing import channels, not just a row of pills.

### Leasing
Show the selected car as an actual product context: thumbnail, model, price and estimated payment next to the finance controls. Make the estimated monthly figure visually important. Avoid making the whole experience feel like a generic calculator form.

All three routes should keep real inventory cross-links visible so users can continue browsing cars without returning to the homepage.

## Contact and editorial

The Contact page is currently the strongest desktop visual direction. Its dark photographic treatment, larger typography and stronger composition should inform the rest of the desktop brand system.

Guides/blog currently look unfinished. Use real editorial imagery, one featured article, category/read-time metadata, and a clean image-led grid. This is useful for the template demo, but should remain below the main inventory/conversion priorities.
## Implementation order

### Phase 1 — P0 desktop inventory
1. Fix the 1280px filter wrap/dead space.
2. Cap the inventory grid at four columns on ultra-wide screens.
3. Redesign vehicle-card density and metadata.
4. Tighten the dark header/search composition while keeping inventory immediately visible.
5. Build a desktop-specific make/model picker instead of reusing a mobile-feeling centered modal.

### Phase 2 — vehicle conversion
1. Upgrade the listing right rail.
2. Move the full map lower.
3. Improve specs/trust/history presentation.
4. Rebuild similar-vehicles presentation as a dedicated section.

### Phase 3 — showroom service routes
1. Sell desktop composition.
2. Import desktop composition.
3. Leasing desktop composition.
4. Guides/blog editorial treatment.

Primary implementation targets include `packages/marketplace-ui/components/dealer-desktop-header.tsx`, `dealer-desktop-toolbar.tsx`, `desktop-discovery-bar.tsx`, `marketplace-results.tsx`, `vehicle-card.tsx`, `lib/marketplace-results-policy.ts`, `apps/web/app/[locale]/desktop-header.css`, and the listing/sell/import/lease route components.

**Guardrail:** preserve the existing mobile UX. Desktop improvements should be implemented through desktop-specific composition and responsive behavior, not by flattening the strong mobile experience into the desktop design.