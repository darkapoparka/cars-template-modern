# Day & Night Modern — refactor implementation status

This document records the implementation state of the codebase-wide maintainability refactor authorized for `gpt-web`.

## Preservation contract

The refactor is architecture-only unless a behavior fix is explicitly noted. Preserve the approved Day & Night mobile UI, routes, localization, static-demo behavior, inventory contracts, provider attribution, brand assets, and conversion flows. Do not merge this work into `main` until verification and rendered review are complete.

The authoritative visual/behavior baseline is commit `7e70c0602ad64c7954ab4a070a210b7a12ba5d13`, the parent of the first refactor commit `cd13211c0ff03c800fd93931ebef7b55ab0ab5f8`. Parity review must compare refactored surfaces to this accepted post-polish baseline rather than to a later or otherwise divergent `main` snapshot.

## Implemented

### Marketplace orchestration

- Decomposed the former monolithic `marketplace-shell.tsx` into focused category, make/model, full-filter, quick-filter, results, navigation, overlay and state modules.
- Centralized marketplace filter ranges/options/labels and URL-facing presentation policy.
- Added a dedicated overlay coordinator and reusable mobile full-screen overlay primitive.
- Preserved URL-first filter state and fixed mobile model selection so the selected model is actually committed.
- Final baseline audit confirmed the extracted listing-view hook uses the same `automarket:listing-view-mode` localStorage key and read/write behavior, the compact-header hook uses the same IntersectionObserver visibility condition, and the overlay coordinator preserves the same trigger capture plus `requestAnimationFrame` focus return with `preventScroll`.
- Final baseline audit confirmed make/model open-state initialization, derivative progression, clear/apply payloads, full-filter draft reset, subview back-navigation and apply/close behavior remain equivalent to `7e70c060…`.

### Desktop discovery and filters

- Split desktop search, service-mode surfaces and quick-filter presentation out of the discovery bar.
- Extracted reusable desktop single-choice/range filter dialogs.
- Extracted desktop search suggestion policy and recent-search storage from the UI component.
- Extracted result-toolbar formatting and active-filter-chip policy.
- Baseline parity audit restored the desktop sidebar Year and Mileage controls after their extracted range component was initially left unwired.
- Baseline parity audit restored the accepted quick-filter range descriptions, wide-screen sort spacing, filter interaction classes and primary/clear control slots.
- Three inert legacy ownership hooks (`desktop-quick-filter-shell`, `desktop-quick-filter-scroll`, `desktop-quick-filter-layout`) are not currently consumed by CSS, tests, or runtime behavior. They are tracked as a low-risk DOM-contract follow-up rather than forcing a risky whole-file rewrite through the GitHub contents API.

### Mobile navigation and overlay ownership

- Added explicit `data-slot` ownership to the mobile dock/menu and service surfaces.
- Added optional Drawer handle control rather than hiding the generic Vaul handle through DOM-child selectors; the dealer mobile menu explicitly passes `showHandle={false}`.
- Replaced critical positional mobile CSS ownership with named component slots.
- Lease selected-vehicle and import-card mobile polish now has explicit named owners instead of depending on `nth-child`/`last-child` placement.
- Revalidated the named rules against `7e70c060…`: the accepted Lease CTA remains 48px / 15px, the Lease monthly line remains 13px, and Import card actions remain 40px / 14px.
- Kept one scroll owner for full-screen mobile overlays and safe-area-aware actions.

### Dealer service flows

- Import: separated request policy, origin selection, field groups, source-search overlay and external inventory action ownership. Baseline audit confirmed form fields, source-link overlay, origin selection, provider attribution and external-card actions preserve the accepted behavior/copy.
- Lease: separated financing policy, mobile selected-vehicle experience, desktop controls and vehicle picker; the public selector now coordinates state only.
- Sell: separated policy, hero/VIN entry, vehicle-details drawer and how-it-works drawer; baseline audit confirmed the accepted post-polish hero and drawer behavior.
- Financing: moved URL parsing/message construction/deposit policy out of the global mobile interceptor while retaining the progressive `/contact?...` fallback. Baseline audit confirmed the same mobile-only unmodified-primary interception rule, leasing URL contract, deposit choices, generated contact message and drawer/form behavior.
- Vehicle taxonomy: separated make/model policy and picker drawer from the field coordinator. Baseline audit restored the selected-vehicle arrow wrapper spacing so the icon retains its accepted size.

### Marketplace cards and detail pages

- Vehicle card: extracted public types, presentation policy and content composition from the media/state shell.
- Organization directory card: extracted public types, normalization policy, UI primitives and responsive layouts from the card shell.
- Listing detail: extracted page policy, summary surfaces and content sections from the top-level detail composition.
- Listing gallery: extracted navigation/key/copy policy, image fallback and lightbox.
- Seller contact: separated transaction and seller/dealership identity surfaces from the contact-panel composition.
- Baseline audit confirmed listing actions, listing detail composition and gallery/lightbox behavior preserve the accepted layout, copy, keyboard navigation, share fallback and image-failure behavior.

### Directory discovery

- Extracted organization-directory facet configuration from the desktop facet UI.
- Extracted reusable facet picker/status/more-filter controls.
- Reduced the desktop directory facet bar to URL-navigation coordination and composition.
- Baseline parity audit corrected the extracted facet trigger so selected labels are not duplicated and compact `From` / `To` / `Services` controls retain the accepted responsive label behavior.

### Tests added around extracted policy

Focused unit tests were added for marketplace filter policy, lease-financing href selection, financing request parsing, sell VIN policy, desktop search suggestion policy, vehicle-card presentation policy, organization-card policy, listing-gallery navigation policy, result-toolbar policy, mobile vehicle taxonomy policy, and organization-directory facet trigger presentation.

## Deliberately retained

Some large files remain because line count alone is not a refactor reason. `marketplace-masthead.tsx`, infrastructure packages, and several server route-composition files retain coherent single responsibilities. The repository's existing package-boundary architecture is intentionally preserved rather than replaced.

The one-line compatibility re-export modules in `packages/marketplace` are also deliberate public entry points and are not duplicated business implementations.

## Verification state

Code has been written to `gpt-web` only. The source-level parity audit against `7e70c0602ad64c7954ab4a070a210b7a12ba5d13` is complete for the high-risk marketplace shell, desktop filters, service flows, directory controls, cards, listing detail/gallery, mobile navigation and financing surfaces. The release gate is still not complete until the repository verification commands and rendered viewport checks pass.

The latest GitHub Actions validation attempt on audited head `e9616a92b22288dfb9d01fcc0edc69a55121ea2b` is run `33220396965` (run 125). Both `verify` and `public-browser` completed as failures with `steps: null` and no job logs; `authenticated-preview` was skipped. This repeats the earlier pre-step Actions failure pattern and remains an execution/infrastructure blocker rather than a usable code-test result. Do not interpret the red workflow as evidence that the source checks themselves failed, and do not interpret it as a pass either.

Required local/CI commands remain:

```powershell
pnpm check
pnpm boundaries
pnpm unit
pnpm typecheck
$env:SKIP_ENV_VALIDATION = "true"
pnpm build
```

or `pnpm verify` where configured.

Required rendered regression widths remain 320, 360, 390, 430, 768, 1024 and 1440px, including mobile landscape, nested overlays, keyboard/focus return, last-card clearance and the dealer Menu tap target.

Do not mark the refactor release-ready solely from code inspection.
