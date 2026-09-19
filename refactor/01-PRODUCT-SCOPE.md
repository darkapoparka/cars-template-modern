# Product boundaries and reusable-template contract

## Three meanings of “lead” must not share one architecture by accident

| Product | User | Owns | Does not own |
| --- | --- | --- | --- |
| Agency / Cars workspace | Your team | Prospective dealerships, fact packs, template choice, client provisioning, releases and outreach authorization | A dealer's public shopping UI or an implicit copy of every customer enquiry |
| Public dealership website (`apps/web`) | Vehicle shoppers | Inventory discovery, details, services, editorial content, contact and truthful conversion flows | Staff administration, provider secrets, platform moderation |
| Dealer workspace (`apps/app`) | Authorized dealer staff | Inventory operations, customer enquiries, profile/content settings and relevant reporting | Agency sales pipeline or unrestricted cross-dealer administration |

**Recommendation:** yes, `apps/app` should be refined into the authenticated operating space for dealerships that become clients. Their shoppers' enquiries can be managed there. That is different from putting your own prospective dealership leads into this template.

The separate web/app/API applications are consistent with the upstream [next-forge structure](https://github.com/vercel/next-forge#structure). They are deployment boundaries, not an instruction to run every optional service for every demo.

## Keep the current delivery model first

The current repository is a reusable master. Cars manages independent client copies and their personalization/release process; follow `docs/CARS-INTEGRATION.md`. Do not quietly replace that with a shared multi-tenant SaaS host during a styling refactor.

For a live standalone dealer deployment, a server-owned dealer/site binding must be explicit and verified. Browser-provided organization IDs, URL parameters, themes and capability flags do not establish tenancy. Retain existing organization infrastructure. A future centrally hosted multi-tenant product is a separate decision requiring host resolution, isolation, custom domains, caching boundaries, operations and billing design.

## Separate configuration by responsibility

Proposed concepts, not a new framework:

- **Public identity/content:** name, logos, contact locations, language, currency, market conventions, service copy, editorial content and artwork roles.
- **Presentation:** the Modern template, supported color mode and a small approved token override set. A dealer may change its identity without choosing a different interaction model.
- **Capabilities:** inventory categories and services actually offered. These drive navigation, routes and visible calls to action consistently.
- **Runtime data mode:** demo fixtures, live data, or intentionally unavailable. Live data failure must not silently substitute fictional inventory.
- **Integration readiness:** server-owned validation of delivery, authentication, storage, payments and providers. Send only the minimum safe availability information to client UI.

Start by extending/adapting the existing `lead-site.ts` contract; do not immediately create five configuration packages. Preserve `LEAD_SITE_CONFIG_START/END` or migrate the known Cars generator atomically. An adapter can translate the legacy flag during staged adoption, but new code must not add another meaning to it.

## Required behavior matrix

| Website identity | Data | Enquiry delivery | Expected product behavior |
| --- | --- | --- | --- |
| Dealership | Demo | Unavailable | Same branded website; sample inventory; honest phone/handoff path; no fake success |
| Dealership | Live | Available | Same layout; real inventory; validated durable delivery and clear success |
| Dealership | Live | Unavailable | Same layout; no false delivery; safe fallback and recorded readiness issue |
| Dealership | Unavailable | Either | Branded empty/unavailable state, not unrelated marketplace navigation |
| Legacy marketplace | Existing supported mode | Existing policy | Preserve intentionally retained consumers until separately retired |

Do not remove a hidden route purely because it is not in one client's navigation. Choose a clear per-capability policy: available, redirect to its canonical content, or deliberate not-found. Apply it to links, route handlers, metadata and sitemap generation.

## Dealer workspace MVP

Keep the first release small: authenticated organization context, useful inventory list/detail/edit, enquiry inbox/detail/status/history, dealer profile/contact/services, and delivery health. Reuse existing inventory/media/import capabilities only where the dealer actually needs them. Add assignment only when staff workflow requires it.

Billing/promotions, platform trust/moderation, buyer saved-search products, AI, realtime collaboration and generic webhooks are not automatic MVP requirements. Inventory feed ingestion or verification may still be operationally necessary even when not prominent in navigation. Classify each as **core, capability-gated, separate platform surface, or retirement candidate**; do not delete from a UI impression.

## Non-goals

No framework migration, new agency CRM, universal page builder, runtime arbitrary CSS editor, provider replacement, multi-tenant rewrite, automatic production rollout, or changing approved mobile patterns as collateral damage.

## Product decisions before admin implementation

Confirm the intended initial dealer staff roles and whether enquiries from general contact/import/sell/finance must share the same inbox. Confirm whether client copies remain separately deployed for the first live release. Public dark mode and five-card desktop density need deliberate visual approval, not an assumption based on available components. Proposed defaults are in [DECISIONS.md](DECISIONS.md).
