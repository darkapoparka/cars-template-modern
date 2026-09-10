# Decision 0001: next-forge App Split

## Status

Accepted.

## Decision

AutoMarket will use:

- `apps/web` for the public marketplace.
- `apps/app` for authenticated account, seller, dealer, and admin workflows.
- `apps/api` for webhooks, cron jobs, and service-only API routes.

## Context

next-forge commonly labels `apps/web` as marketing and `apps/app` as the main SaaS application. AutoMarket is not a typical SaaS landing-page-plus-dashboard product. It is a marketplace where the public browsing experience is the core product.

Public marketplace pages need SEO, anonymous access, category pages, listing details, dealer profiles, and fast public rendering. Authenticated workspaces need account state, role permissions, billing, seller/dealer operations, and admin controls.

## Options Considered

### Option A: `apps/web` Marketing, `apps/app` Full Marketplace

This follows the starter convention but puts SEO marketplace pages inside the authenticated app shell. It increases the chance of mixing public browse behavior with account/dashboard code.

### Option B: `apps/web` Public Marketplace, `apps/app` Authenticated Workspace

This treats the marketplace as the public product surface and keeps private tools separate. It matches how vehicle marketplaces grow.

### Option C: Single App For Everything

This is faster initially but loses the architectural benefit of next-forge and makes future SEO/account/dealer/admin boundaries harder.

## Chosen Option

Option B.

## Consequences

Positive:

- public marketplace remains SEO-friendly.
- account/dealer/admin work stays operational and auth-gated.
- apps have clearer responsibilities.
- shared packages become the source of truth for product logic.

Tradeoffs:

- shared UI and domain logic must be handled carefully.
- navigation between public and authenticated domains needs clear route helpers.
- early implementation needs discipline to avoid duplication.

## Rules Created By This Decision

- Do not build public listing index or listing detail routes in `apps/app`.
- Do not put seller/dealer dashboards in `apps/web`.
- Put shared filters, vehicle categories, route builders, and listing types in packages.
- Public save/contact entry points may link into auth, but public pages must render without auth.
