# Dealer workspace, data contracts and security

## Product boundary

`apps/app` should be the authenticated workspace for a dealership using the template. It is not the agency's prospect database. Existing dealer routes already cover inventory/imports, enquiries, profile, settings, analytics, billing and promotions. Platform administration has separate moderation/trust/claim routes. Preserve that distinction and expose only the capabilities the dealer actually needs. `apps/studio` is developer tooling, not a customer admin panel.

The first useful dealer workspace is smaller than a generic CRM: manage inventory, view and respond to enquiries, update approved public identity/contact/content and understand delivery/readiness. Billing, promotions, collaboration and AI remain conditional. Do not make the public desktop refactor wait for every backend capability.

## What already exists and what is missing

`packages/database/prisma/schema.prisma` already contains `Lead`, `Conversation`, participants/messages and dealer membership relations. `Lead` supports assignment, status, source, channel, intent, timestamps, a unique inquiry dedupe key and organization indexes. Status values are `new`, `viewed`, `contacted`, `qualified`, `won`, `lost`, `closed` and `spam`. Reuse this model; do not introduce a second competing enquiries/CRM table merely to build a nicer interface.

`apps/app/app/(authenticated)/dealer/leads/page.tsx` currently renders a list of cards. The inspected page has no assignment/status editing, pagination controls, detail timeline or workflow interface. `listDealerLeads` already accepts a cursor and bounded page size (50 default, 100 maximum). Wire the capability already present before adding another paging abstraction. The page obtains a listing actor and calls `ensureDealerActor`, whereas the dealer layout has a durable organization actor guard. Consolidate those contracts deliberately; this observation is not proof of an authorization exploit.

## Public enquiry paths are not identical

The inspected `public-listing-lead-submission.ts` validates request context/body/schema, checks listing availability, rate-limits and calls `persistLead`. Its successful result includes the persisted ID and labels that state `delivered`. That establishes a persistence contract, not proof of email delivery or human response. Preserve compatibility while making UI/status terminology precise.

`public-support-submission.ts` validates general/import request data, suppresses honeypots, rate-limits and calls an injected email `deliver` function returning `EmailDeliveryReceipt`. That module does not itself persist a `Lead`. Therefore the admin cannot be assumed to contain every general/import/sell/finance request today. Trace the actual action and adapter for each flow before unifying the inbox.

Create a small flow register with: entry route, validated input, server-resolved dealership, intent, persistence destination, notification destination, idempotency rule, user-visible success meaning, unavailable fallback and owner. Map import/sell/finance payloads to existing models only after checking required data and intent semantics. Do not silently overload a finance request as an unrelated listing enquiry.

A honeypot may intentionally return a non-disclosing response; preserve its existing abuse contract while ensuring ordinary provider failure never fabricates success. Distinguish **accepted/persisted**, **notification queued**, **provider accepted**, **delivered where proven**, and **responded**. Use existing delivery primitives before proposing an outbox; introduce durable retry machinery only where an actual requirement and existing infrastructure justify it.

## Dealer MVP, in order

| Slice | Deliverable | Evidence required |
| --- | --- | --- |
| Organization shell | Dealer-aware navigation, role/capability visibility, current organization context | Owner/manager/sales/viewer scenarios and organization switching |
| Enquiry inbox | Paginated search/filter list, empty/error states, detail view and contact actions | Real bounded read query, loading and >50-item tests; no PII in public payload |
| Workflow | Authorized assignment and allowed status transitions; timeline/audit event | Direct-action tests, cross-tenant rejection, concurrency/idempotency behavior |
| Inventory | Reuse current manual/import flows, provenance, draft/published states | Owner-scoped edits; imported-source restrictions retained |
| Public settings | Validated identity/contact/theme/assets and enabled services, with preview | Draft vs published contract; two fixture dealerships; authorization and rollback |
| Delivery/readiness | Show actual configured capabilities and last known outcomes | Disposable test-provider receipt, retry/failure tests, no misleading success |

A full CMS/page-builder, arbitrary dealer CSS editor, custom CRM automation engine and multi-tenant deployment orchestration are not this MVP. Public content editing may begin with a small typed field set and approval/publish behavior.

## Authorization contract

Resolve the authenticated actor and durable active organization membership on the server. Authorize the operation against the target resource's organization on every read/mutation boundary. Never trust a posted `dealerOrgId`, a hidden form field, a disabled button or a client feature flag as authority. A layout guard is useful navigation protection but not a substitute for authorization in a callable action/route.

Extend the existing operation/role policy rather than adding scattered string comparisons. Decide explicitly whether viewers may see customer contact details, sales may reassign others' leads, and managers may export data. Test active/disabled/deleted membership, wrong organization, unknown role, missing session, organization switching and direct endpoint access. Platform-admin privileges stay separate and auditable.

Return minimal view models to clients. Keep credential resolution, Prisma and provider clients server-only. Avoid importing an entire inventory/domain object where a card needs six public fields. Keep identity and tenant scope in cache keys; never use a shared cache entry for sensitive dealer data. Do not add `use cache` broadly as a refactor shortcut. First document freshness/invalidation for public inventory and settings, and explicitly keep private operations isolated.

## Data and integration review

Retain transactional import/publication/idempotency, audit and retention rules. Large ingestion modules should be split around actual stages without changing atomicity. Use additive migrations only when a proven feature requires schema change. Review migration SQL, indexes, rollback/forward recovery and disposable integration tests separately from UI work. Production migrations, seeding and `db push` are outside this audit authorization.

Uploads need owner-bound paths, size/MIME validation, safe public/private access and deletion authorization. Webhooks need authentic provider verification, replay/idempotency and order/retry handling. Rate-limit failures must retain the current production safety policy. Logs should include correlation IDs and non-sensitive error categories, not names, phones, messages, tokens or whole request bodies. Retention/export/delete requirements need an explicit product and policy decision before live lead storage is declared ready.

This is a source/architecture review, not a penetration test or production compliance certification. No credentials, live tenant data or configured provider delivery were exercised.

Official references: [Next data security](https://nextjs.org/docs/app/guides/data-security), [Clerk roles](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions), [Prisma v7 migrations](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/development-and-production), [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys). Version notes are in [the source register](02-STACK-AND-OFFICIAL-DOCS.md).
