# Target architecture: clarify ownership, do not rebuild the stack

## Keep the current deployable boundaries

```text
apps/web       public dealership routes, metadata, server composition, public actions
apps/app       authenticated dealer workspace and deliberately retained platform tools
apps/api       external webhooks, ingestion, feeds, health/readiness and scheduled endpoints
apps/e2e       provider-free, authenticated and release browser gates
apps/storybook product/component stories and theme/state review
apps/email     email preview tooling
apps/docs      retained documentation app; verify its tooling before changing scope
apps/studio    developer database tooling, not customer administration

packages/marketplace-domain  browser-safe types, validation, taxonomy and pure rules
packages/marketplace         current public facade, configuration and compatible entry points
packages/marketplace-ui      reusable automotive presentation and interactive UI
packages/design-system      reusable primitives, semantic tokens and component variants
packages/database           server-only persistence and transactional workflows
packages/auth               provider integration and authorization primitives
other existing packages     explicitly owned infrastructure capabilities
```

The 30-workspace count is not itself a defect. Keep the complete monorepo during this program until a package has passed the removal gate and the root/Cars compatibility contract has been explicitly updated. Do not move a dealer-specific client into this master.

## Dependency direction

```text
web/app server composition -> database/auth/infrastructure
web/app presentation       -> marketplace-ui -> design-system
marketplace-ui             -> marketplace facade -> marketplace-domain
database                   -> marketplace-domain
```

`marketplace-domain` must not import UI, browser APIs, Next request state, database or authentication SDKs. `marketplace-ui` must not import server persistence/secrets. `design-system` must not import dealership identity or inventory rules. Apps may compose these packages, but shared packages must not reach into an app. Preserve explicit manifest edges and the passing Turbo boundary checks.

The existing marketplace facade is useful compatibility, not automatically duplication. Gradually make exports explicit and distinguish browser-safe entry points from fixtures/server code. Do not introduce wildcard barrels that mix them. Move a function only after tracing its consumers and checking public subpath compatibility.

## Proposed internal organization, not a mandatory file-move phase

Use responsibility folders as affected modules change; these paths are **proposed**, not present-day source claims:

```text
packages/marketplace-ui/
  components/discovery/    hero, search controls, taxonomy tiles, collection section
  components/vehicles/     vehicle media, facts, pricing and explicit card variants
  components/listing/      detail summary, gallery, contact and related inventory
  components/dealer/       public chrome and reusable dealership surfaces
  lib/                     pure presentation policies
  hooks/                   browser behavior shared by actual consumers

packages/design-system/styles/
  tokens.css               shared semantic defaults and Tailwind aliases
  globals.css              entry, imports and minimal base rules

packages/marketplace/
  lead-site.ts             retained compatibility entry and adaptation markers
  site-config/             typed public identity, content, services and theme schema

apps/web/lib/
  public-site/             composition/read models and readiness projection
  ...existing route/data adapters, migrated only as justified
```

Do not create a package for every folder, a global `utils` dump or parallel `shared/common/core` layers. Server functions that serve one app remain in that app unless a second real consumer justifies sharing. Pure domain rules reused by web, app and ingestion belong in the domain package. Provider code stays server-only in its existing package.

## Configuration without a page-builder

Separate five concerns, using small validated objects rather than one giant runtime container:

| Concern | Owner | Browser-visible? |
| --- | --- | --- |
| Dealer identity, public contact, market, approved artwork | Public site configuration | Yes, deliberately public fields only |
| Website kind and enabled public services | Product configuration | Yes; not an authorization policy |
| Theme roles / approved preset selection | Design tokens plus validated brand configuration | Yes |
| Demo/live/unavailable inventory selection | Server data adapter | Only the resulting data and availability state |
| Credentials, delivery readiness, tenant authorization | Server configuration and DAL | Never expose credentials; return a minimal capability/result |

A conceptual shape may be `site.kind = "dealership"`, `services = { buy, sell, import, finance }`, and `dataMode = "demo" | "live" | "unavailable"`. Do not add speculative site kinds without consumers. If retaining the legacy marketplace variant, name it explicitly rather than making it the accidental opposite of demo.

Keep `leadSite` and its `LEAD_SITE_CONFIG_START/END` markers while Cars adapters depend on them. Introduce a compatibility projection, migrate call sites in bounded batches, then retire only obsolete members. Validate missing logos, malformed contact links, unsupported locale/currency, asset paths and service configurations at the boundary. Optional service absence is normal; malformed required configuration is a build/startup error with a useful message.

## Component contracts

`PageContainer` owns width and gutters but adds no card background by default. `SectionHeader` owns heading/action alignment. A surface/card variant adds semantic background, border and elevation only when the content needs enclosure. `SearchPanel` owns input/filter layout. `VehicleCard` variants share a read model and pricing/fact/media rules, not necessarily identical mobile/desktop DOM. `EmptyState` and `ErrorState` keep truthful availability and actions.

Each component owns its CSS. Use Tailwind for ordinary layout and token-backed state variants; use a CSS module for coherent complex hero/media geometry. Avoid an app-global stylesheet overriding shared card internals. A CSS module containing repeated `:global(...)` overrides is still cross-owner coupling.

Give components semantic variants such as `tone="inverse"` or `presentation="discovery"`; avoid boolean combinations whose meaning only exists on one route. Do not wrap every section in the same grey or white box. Avoid abstracting two visually similar components until their content and behavior contracts genuinely align.

## Server/client composition and state

The current `MarketplaceShell` imports desktop discovery into a client graph. Removing the child's `use client` directive will not reverse that graph. Move static hero copy, collection selection and inventory read-model construction to server composition, then pass rendered slots and minimal serializable data to client controls. Keep URL navigation, filter drafts, overlays, image error behavior and return context where their browser behavior belongs.

Server-rendered children may be passed through a client provider without becoming client modules. Do not remove useful providers on a mistaken assumption. Place providers as narrowly as practical and measure actual payloads.

Use the URL for committed searchable state; local state for an unfinished filter/form draft and overlay state; persistent browser storage only for agreed preferences/return context. Derive counts/labels rather than synchronizing copies with effects. Preserve back/forward navigation and draft recovery before deleting any state path. Do not add a global state library for this refactor.

## Migration and rollback

For each moved responsibility: add characterization tests, introduce the new owner, migrate one consumer, verify mobile and desktop, remove the replaced owner, then update exports/docs. Do not leave two implementations indefinitely. Use temporary compatibility exports only with a task/retirement note. Split data/schema/provider changes from visual changes so a UI rollback does not need a database rollback. The release remains an exact reviewed template commit, not a floating dependency on this master.

Framework rationale: [Next component boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Next data security](https://nextjs.org/docs/app/guides/data-security), [next-forge architecture](https://github.com/vercel/next-forge/blob/main/README.md).
