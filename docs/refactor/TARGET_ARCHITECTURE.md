# Target Architecture

## Ownership model

```text
marketplace-domain
  pure contracts, validation, lifecycle/business rules

marketplace
  marketplace product policy, routing, formatting, provider-neutral adapters/config

marketplace-ui
  reusable marketplace presentation + interaction primitives

apps/web
  public server route composition + route-specific client islands

apps/app
  authenticated workspace composition

apps/api
  provider/webhook/worker adapters and service-only routes

design-system
  generic UI primitives only
```

## Marketplace UI target

```text
packages/marketplace-ui/
  components/
    marketplace-shell.tsx              # orchestration/composition only
    marketplace-results.tsx            # result layout + empty state
    marketplace-model-picker.tsx       # taxonomy picker
    marketplace-filter-overlays.tsx    # full/quick filter state machines
    mobile-marketplace-overlay.tsx     # shared mobile full-screen overlay
    dealer-bottom-nav.tsx              # mobile dealer navigation/menu

    desktop-discovery-bar.tsx          # desktop band coordinator
    desktop-discovery-search.tsx       # category + search surface
    desktop-quick-filters.tsx          # quick filter/range controls
    desktop-lead-services.tsx          # lead-only sell/import controls

  lib/
    marketplace-filter-config.ts       # one filter catalog/range source
    marketplace-filter-policy.ts       # labels/active state/path/summary policy
    ...existing focused policy modules

  hooks/
    use-desktop-marketplace-viewport.ts
```

The exact filenames may evolve, but the dependency direction must remain one-way: coordinators compose focused modules; focused modules consume policy/config; generic design-system primitives stay below product UI.

## State rules

- URL/search params are the durable applied state.
- Full/quick filters use draft state and commit once on Apply.
- Cancel/close never applies draft changes.
- category/make/model/derivative dependencies clear incompatible children only.
- overlay coordination ensures one blocking marketplace overlay at a time.
- focus returns to the opening trigger when a marketplace overlay closes.
- listing view preference remains local preference state, not URL business state.

## Styling rules

- Keep existing Tailwind/design-system tokens and Day & Night variables.
- Product-specific selectors should attach to explicit owners (`data-slot`, component class) instead of DOM position.
- Avoid `nth-child`, `article + a`, and broad `:has()` selectors for primary layout ownership in touched code.
- Mobile full-screen overlays own `100dvh`, one scroll container, safe-area footer padding, and 44px header actions.

## Public API rules

- Preserve established root exports while moving internals behind focused modules.
- Export a subpath only when another package/app has a real need for that owner.
- Do not turn internal refactor pieces into a broad public API by default.
