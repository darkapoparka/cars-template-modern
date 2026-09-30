# Desktop polish — 20 September 2026

## Design contract

Buyer goal: find a suitable vehicle and open its details. This requested desktop redesign builds on the existing uncommitted home/catalog separation, preserving inventory, original imagery, shared dialogs, route state and mobile presentation.

- Shared charcoal header: equal outer grid columns center navigation; phone stays quiet and showroom is outlined. At smaller desktop widths the phone retains its accessible name as an icon action.
- Home: preserve showroom scene and centered buy panel. Search submits from a named magnifying-glass button inside the keyword input; a compact adjacent filter icon opens the existing dialog. Draft choices stay local until search. This supersedes the earlier text-link/big-search-button presentation.
- Catalog: editorial introduction and search above a left filter column and responsive 2/3/4-column inventory. Existing cards, sort, list view, empty state and filter URL behavior remain shared. Heading levels distinguish page introduction from result summary.
- Use existing typography, charcoal/white tokens, icons, borders and modest radii. All new layout rules start at 1024px. Existing mobile screenshots are unchanged.

## Changed source in this pass

`packages/marketplace-ui/components/`: dealer-desktop-header.module.css; dealer-hero-search.tsx and .module.css; dealer-desktop-toolbar.tsx and .module.css; dealer-inventory-filters.tsx (new); dealer-inventory-summary.tsx; dealer-inventory.module.css; marketplace-results.tsx; marketplace-shell.tsx.

Tests: modern-refactor.spec.ts assertions follow the new heading/filter placement; desktop snapshots refreshed as review evidence, not owner approval. modern-visual-health.ts waits for inventory hydration and only inspects viewport images instead of mutating loading attributes before hydration. The former helper caused a React warning and dev Issue badge in screenshots. desktop-polish-review.mjs captures the two affected routes and checks overflow and console errors.

## Evidence

- Node 22.22.0, pnpm 11.4.0. Reused verified development listener PID 26892 on port 3002 in the authoritative checkout.
- Web typecheck passed. Web unit tests 169/169; marketplace-ui unit tests 81/81.
- Production web build passed with documented demo settings and the existing public-E2E distDir mechanism (`desktop-polish-build`) to avoid the running development output. This is local compilation, not public deployment evidence.
- 12 of the initial 17 browser cases passed. After fixing screenshot hydration timing and updating the changed h1 selector, all 10 selected follow-up cases passed, including all four unchanged mobile snapshots, empty-query search, hero filter focus return, catalog sort/list/grid/reset, selected filter clear and make-route normalization. Earlier passes cover query/body/price drafts, model draft/reset, empty results, list hierarchy and responsive service pages.
- Eight desktop home/catalog cases passed at 1024/1280/1440/1920 with refreshed desktop snapshots.
- Separate browser capture checked `/` and `/cars` at 390/1024/1280/1440/1920: no horizontal overflow, page errors or console errors.
- Source Biome checks passed for the changed components/tests. No full repository/release gate or owner visual acceptance claimed.

Review screenshots: `apps/e2e/desktop-polish-home-final.png` and `apps/e2e/desktop-polish-cars-final.png` (local ignored image artifacts). Reproduce with `node desktop-polish-review.mjs` from apps/e2e against localhost:3002.

## Image concept

Built-in image generation produced a preview-only two-screen concept at `C:/Users/radev/.codex/generated_images/01a0bed1-9313-7e00-9072-468757d92cba/exec-b5223057-5f38-4f03-a974-b770e7fe3d5f.png`. No model-version selector was exposed. Concept is inspiration only; generated copy, stock, prices and claims were not imported into the site.

Prompt: polished high-fidelity desktop Day & Night dealership homepage and catalog side by side; charcoal header, centered navigation, quiet phone and outlined showroom; preserve cinematic BMW showroom hero; compact buy/lease/sell/import tabs with four selectors, keyword input with internal magnifying-glass submit and adjacent small filter action; catalog with left make/model/price/year/fuel filters, photo-first cards, sort and search; existing restrained white/charcoal visual language; no invented testimonials or trust statistics.

## Preservation / handoff

Main HEAD at start: `1cf8edfe26a36e25b0d95dcc963b60de51cdeb50`. Fetch confirmed main was already ten commits ahead of origin/main. Many affected desktop files already had uncommitted changes, plus unrelated files and snapshots; those were preserved and this pass builds on them. No commit or push: publishing the existing combined state requires reviewing the inherited commits/work as well. No branch/worktree, provider change, lead contact, dealer deployment or template release.

- Final manual browser interaction: first inventory vehicle opens its detail page; browser Back restores the catalog. Passed.


## Owner revision: centered catalog controls

The owner rejected the sidebar after visual review. The current implementation supersedes that layout: centered heading, direct category navigation, a centered keyword field and one row of modal filter buttons. Results span the full content width (three columns on smaller desktops, four from 1440px). The catalog no longer passes desktop filter content through MarketplaceResults; DealerDesktopToolbar owns the filter region. Header, homepage and mobile remain as previously reviewed.

Verification for this revision: web typecheck passed; scoped Biome check passed. Nine existing mobile/interaction cases passed (including all four unchanged mobile snapshots), plus four desktop catalog layout cases at 1024/1280/1440/1920 with updated review screenshots. Browser checks additionally passed category navigation to vans and back, make-dialog focus return, keyword submission and no console/page errors. Production build and unit suites were not repeated for this presentation-only revision; earlier results above describe the prior pass. Current visual: `apps/e2e/desktop-centered-cars-1440.png`. Owner acceptance remains pending; local work is preserved without publication.

## Owner revision: contained search on the header surface

The next visual correction keeps the centered catalog controls but places the whole desktop search area on the same charcoal gradient as the shared header. A bordered charcoal panel groups category navigation, keyword search and modal filter controls. Categories now share a rounded segmented rail with a white active pill. Only dealer-desktop-toolbar.tsx and its CSS module were changed in this revision.

Verified `/en/cars` after dismissing the existing locale welcome dialog: 1024/1280/1440/1920 layouts without overflow; make modal opening and focus return; keyword search; desktop controls hidden at 390px; no page errors. Typecheck and scoped Biome checks passed. Existing localization changes were preserved. The legacy screenshot run was stopped because new locale onboarding changed its startup state; mobile expected images were retained, not accepted as new baselines. Build/unit suites were not repeated for the wrapper/CSS change. Screenshot: `apps/e2e/desktop-cars-header-panel.png`.

## Follow-up: compact hierarchy and quieter controls

Reduced the charcoal search section height and removed its duplicate title. The results summary now owns the page h1. Equal-width category pills sit above the white search field; inactive modal filter buttons use the surrounding dark surface, with white reserved for selected filters. The first inventory row is about 95px higher than the preceding iteration.

Changed toolbar component/styles, inventory filter styles, summary heading/styles and its existing E2E selector. Scoped Biome and web typecheck passed. Browser checks passed at 1024/1280/1440/1920: no horizontal overflow, one visible h1, make modal and focus return, keyword submission, desktop toolbar hidden at 390px and no page errors. Visually inspected `apps/e2e/desktop-refined-1440.png`. Build/unit suites were not repeated for this presentation refinement. Preserved concurrent localization edits; repaired a masthead client directive placement and an address-copy lookup that referenced an unavailable locale variable. No publication or visual acceptance claimed.

## Shared control styling correction

Removed catalog descendant overrides for shared filter controls. DesktopQuickFilters now owns its wrapping toolbar layout and an explicit inverse appearance; the control module owns inactive, open, selected, clear and focus states using existing semantic colors and control-height/radius tokens. Default appearances stay unchanged. Removed the duplicate search icon and its reserved input padding; category icons no longer shrink against Bulgarian labels.

Verified BG and EN at 1024/1440/1920, mobile visibility/overflow at 390, modal focus return and keyword submission, without page errors. Also checked the selected make and clear button share a surface and clearing removes the URL filter. Scoped Biome passed after the final search adjustment. Web typecheck passed before the final padding/icon-only changes. Visually inspected Bulgarian desktop screenshots; final capture is apps/e2e/desktop-system-bg-final.png. No build, baseline refresh, commit or publication in this correction.

## Reuse the home buy box

Owner requested actual component reuse. DealerDesktopToolbar now only supplies inventory category tabs and the page wrapper to DealerHeroSearch. The shared buy box owns body/make/model/price fields, search, draft/reset, taxonomy and accessible overlays on both routes. Category tabs are a slot in the existing tab surface; inventory no longer renders the separate filter row or search panel. Route filter changes remount the draft from current URL state.

Inspected /bg and /bg/cars at 1024/1440. Browser checks passed shared make dialog/focus, query submission, URL-backed draft, reset then submission, vans navigation and hiding the desktop box at 390. No page errors. Web typecheck and scoped Biome passed. Screenshot: apps/e2e/shared-buy-box-inventory-1440.png. Build and legacy screenshot baselines were not rerun or refreshed. No publication.

## Category navigation behavior

Reproduced category links scrolling the document to zero; browser instrumentation showed client routing rather than a document reload. Category links now preserve scroll, prefetch destination data and prevent navigation to the already active category. Category route loading screens now reuse the shared inventory header/buy box, disabled during loading, with card-grid placeholders instead of the obsolete search skeleton/list rows. Mobile loading markup is unchanged.

Web typecheck and scoped Biome passed. Browser instrumentation verified Cars -> Trucks -> Vans -> Cars at scrollY 80, including active-category no-op, with only the initial document request. Added desktop-category-navigation.spec.ts as persistent coverage. Screenshot: apps/e2e/category-navigation-stable.png. No build or snapshot baseline updates.

## Header same-route link and shared field hierarchy

The earlier navigation fix covered inventory category tabs but missed the separate header destination. DealerNavigationLink now cancels same-path navigation in the desktop header, preserving scroll and current search parameters. Regression coverage now clicks both the header Cars destination and category links; passed against port 3002. Shared home/inventory fields now use one bordered segmented row with dividers and plain labels, removing redundant leading icons and the form gradient. Keyboard focus stays visible inside the row.

Web typecheck, scoped Biome and the navigation regression passed. Inspected the Bulgarian inventory screenshot; verified body/make/model dialogs and focus return. Capture: apps/e2e/shared-buy-box-segmented.png. No full build or baseline refresh.

## Coherent desktop controls and cards

Extended the overlay-inspired rounded surfaces across shared home/inventory category tabs, header selected navigation and showroom action, sort/view controls and home carousel actions. Cards now share rounded shells, readable secondary text, soft spec surfaces, a separated price area and dark open actions. Plain icon search and black filters remain. Changes are in five existing desktop CSS modules; no mobile rules changed.

Scoped Biome passed. Browser checks covered home plus BG/EN inventory at 1024/1440/1920/390 without horizontal overflow, card detail and Back, no page errors, list view and sorting. The header/category navigation regression also passed. Visually inspected home, BG inventory and list screenshots. An initial verification script left its viewport mobile between routes; corrected the harness and reran successfully. Screenshots: apps/e2e/desktop-coherent--bg.png, desktop-coherent--bg-cars.png, desktop-coherent-list.png. No build/typecheck rerun for CSS-only changes, no baseline refresh or publication.
