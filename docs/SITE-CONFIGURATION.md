# Reusable dealership configuration

## Ownership

Edit the typed authoring configuration in `packages/marketplace/lead-site.ts`. Its START/END markers remain the Cars adaptation boundary. `packages/marketplace/site-config.ts` validates and projects it into the browser-safe `publicSite` contract; `packages/marketplace-domain/site-config.ts` owns the schemas. Do not spread customer-specific values into JSX or component CSS.

The public website remains `apps/web`. The authenticated dealership workspace is `apps/app`, including `/dealer/leads` and `/dealer/leads/[leadId]`. Cars continues to own the agency's prospects, client copies, exact template releases and mounted packaging. These are different kinds of “lead”.

## Identity is not data mode

Set `websiteKind: "dealership"` explicitly in new dealer configurations. The legacy `staticDemoMode` fallback is retained only for older snapshots and the provider-free demo default. It must not choose a different public product when live inventory is enabled.

Public configuration includes identity/contact details, enabled locales and default locale, currency/country, inventory categories, enabled services, validated brand color and artwork references. Available service keys are `sell`, `imports`, `lease` and `editorial`. Capabilities control navigation and direct public routes. They never replace private-operation authorization.

Enabled locales are currently the implemented `bg` and `en` dictionaries. A new locale needs real copy, routing and regression coverage. Money formatting is configuration, not verification of the sample listing prices or current legal/tax claims.

## Tokens and artwork

`packages/design-system/styles/tokens.css` owns semantic values and `globals.css` exposes Tailwind v4 utilities. Desktop header, toolbar, discovery and vehicle-card CSS modules consume those tokens; do not reintroduce global desktop overrides. Layout gutters and decorative surfaces are separate decisions.

`createBrandTheme` accepts a six-digit hexadecimal accent and derives readable foreground pairs. Root CSS variables also reach portalled controls. Public pages deliberately use a light theme; the authenticated workspace's theme preference is separate. Keep the existing mobile geometry unless a specific mobile change is approved and checked.

Artwork paths must be validated local absolute paths. Configure a real inverse logo when needed rather than recoloring a customer's bitmap through CSS. `site-artwork.ts` contains reusable fallback artwork, not verified customer identity. All generated originals and the six optimized derivative records are preserved under `provenance/assets/`.

The optional `artwork.heroScene` is a pre-optimized decorative desktop asset shared by landing and service heroes. Supply a suitably sized WebP (the master uses 2172 × 724 pixels, about 149 KB); it is served directly to preserve its prepared quality. Keep uncompressed originals in provenance, not the served tree. Custom left/right cutouts still disable the default scene through the existing configuration projection. Compact editorial/legal heroes deliberately omit decorative photography.

## Live dealership binding

The following server variables are documented in `apps/web/.env.example`:

| Variable | Meaning |
| --- | --- |
| `AUTOMARKET_PUBLIC_DATA_MODE` | `demo`, `database` or `unavailable`. Invalid/unavailable modes must not silently expose fixtures as live stock. |
| `DATABASE_URL` | Existing authorized Postgres connection; never browser-visible. |
| `AUTOMARKET_DEALER_ORG_ID` | Existing internal DealerOrg id for this deployment. Required for scoped live dealership inventory and inbox intake. Never use a browser, query, host or form field to select it. |
| `RESEND_FROM`, `RESEND_TOKEN` | Optional notification channel. Configure and verify the existing delivery provider deliberately. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Required hosted request-protection group where the readiness contract requires it. |

The binding is explicitly listed in every strict-mode web Turbo task so it is forwarded and included in cache keys. The isolated public test runner clears the binding and database URL. Demo mode requires no live provider setup. Do not use `SKIP_ENV_VALIDATION=true` as production configuration.

No migration, seed, provider connection or existing customer data was changed by this refactor. Set the binding only after verifying the existing organization and permissions in an authorized deployment workflow.

## Enquiry flow and truthful states

Listing enquiries use the existing listing persistence path. General/contact/import requests, and tagged finance/trade-in requests, can persist to the same existing Lead table through the server-owned dealer binding. An optional listing must belong to that dealership. Duplicate same-day retries use a scoped idempotency key and mismatched replay payloads are rejected.

`received` means the enquiry was durably recorded in the dealer inbox. `sent` refers to the existing email provider path. Notification failure after successful persistence does not erase the enquiry or report that persistence failed. This implementation does not claim a newly deployed background notification/outbox service. Demo/unavailable mode retains an honest phone handoff, not a simulated delivery success.

Every inbox operation rechecks active membership. Owners/managers can assign active same-organization members. Sales users work with their own or unassigned enquiries and cannot reopen a terminal enquiry. Viewer DTOs omit customer name, phone, email and free-text message. Updates use the expected version and write their audit in the same transaction; a stale edit must be reloaded. Existing closure timestamps survive reassignment and are cleared on an authorized reopen.

## Development and release

Use Node >=22.22.0 <23 and pnpm 11.4.0 from the repository contract. On this machine 3001 belongs to another project: check listener ownership, use the existing Modern dev server on 3002 or an explicit available port, and use the exact bound IPv4 origin for production browser qualification. Do not start a second writer against the same Next output directory.

Run `pnpm refactor:contracts`, `pnpm check`, `pnpm boundaries`, `pnpm typecheck` and the focused tests. The responsive gate is `pnpm --filter e2e e2e:refactor` against an explicitly configured production preview. The full build also runs unit prerequisites. The operational verification record is [refactor/IMPLEMENTATION_STATUS.md](../refactor/IMPLEMENTATION_STATUS.md).

The two fictional configuration tests do not prove a deployed/mounted customer copy. Before Cars release, verify both the standalone and mounted variants, new asset redirects, locale/form URLs and disabled-service paths. Before enabling the dealer inbox for customers, qualify the real authorization and persistence paths against an authorized disposable database and identity-provider fixture. Owner visual acceptance and deployment authorization remain separate gates.
