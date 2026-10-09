# Modern architecture

Modern is a reusable dealership template built on the retained Next.js / React / pnpm monorepo. The authoritative source is **cars/main, templates/modern**. This document describes ownership and runtime boundaries, not a redesign or an old marketplace backlog.

## Source and release ownership

Shared improvements belong in this master. The standalone cars-template-modern repository is a publishing mirror. Dealer implementations belong in Cars clients/<slug>; approved immutable releases are selected through the Cars release workflow. Changing master main does not authorize a dealer deployment or update an existing client.

Read [Cars integration](CARS-INTEGRATION.md), [template contract](../TEMPLATE.md), and [QA](QA.md). Do not replace this with a partial monorepo or copy an old recovery checkout over it.

## Boundaries

| Boundary | Responsibility |
| --- | --- |
| apps/web/app | Public localized routes, server composition, metadata and route-specific interactive components. |
| apps/web/lib | Public data policy, request validation, service readiness, provider orchestration and trusted dealer binding. |
| packages/marketplace-domain | Shared domain types, schemas and pure policies. |
| packages/marketplace | Template content, lead-site configuration, public site adaptation and inventory presentation data. |
| packages/marketplace-ui | Reusable public components, interaction hooks and browser-only state policies. |
| packages/design-system | Shared primitives, typography and visual tokens. |
| packages/internationalization | Locale preferences and native/base-path routing rules. |
| packages/database and provider packages | Durable data and service adapters; never a direct client-component dependency. |
| apps/app and apps/api | Retained authenticated workspace and service routes; not replacements for the public dealership app. |

Keep the complete workspace and lockfile. A template-only cleanup is not permission to remove authenticated/provider packages or rewrite their architecture.

## Rendering and state

Public routes compose server-owned data and content. Interactive islands own event handlers, dialogs and local state; shared static sections should not become client components merely to reuse layout. Keep provider credentials and database access outside the client graph. The existing desktop discovery slot preserves this separation.

Applied inventory filters belong in the URL. Pending filter edits remain drafts until their existing Apply/Search action; dismissal must preserve the current cancellation and focus-return behavior. Browser preferences are optional enhancements, never a prerequisite for browsing.

The shortlist component renders the existing UI; lib/desktop-saved-cars-store.ts owns cached snapshots, subscriptions and persistence. Its empty server snapshot is stable. lib/desktop-saved-car.ts validates untrusted stored records and isolates dealer/base-path keys. lib/browser-preferences.ts handles denied or full browser storage without throwing into the UI.

## Public requests

public-support-request.ts owns normalization, schema validation and the schema-derived field allowlist. Listing source URLs accept HTTP(S), not script/data/file schemes. public-support-submission.ts owns admission checks, service capability checks, rate limiting, persistence and notification. Public type imports remain compatible through the submission module.

Keep request validation free of network or database calls. Check the same-origin/body boundary before handling input; fail closed when service readiness or rate limiting is unavailable. Persistence and notification share one idempotency context. A durable enquiry remains received even if its optional notification fails; an unavailable service must not simulate success.

Static-demo inventory and real public inventory remain separate data-layer decisions. Do not fill live results with fixtures. Do not wire providers, send enquiries, or contact leads during architectural/browser QA.

## Dealer adaptation and routing

lead-site.ts remains the adaptation input. site-config.ts translates and validates it once, preserving supported older artwork overrides. Changing the dealer slug disables the source-bound master preview identity. Every client still needs an identity, content, metadata and contact sweep; the master is not a sendable dealer proposal.

Native Next links stay base-relative. Raw image/API/anchor URLs use the existing base-path helpers. Locale and mounted /variant-2 behavior require their own release checks; a standalone build does not establish mounted acceptance.

## Verification and artifact lifecycle

Run focused unit tests, typechecks, existing refactor/release contracts and a production build for runtime changes. Compare mobile and desktop captures when touching public behavior, even when JSX structure and CSS stay unchanged. Preserve the approved frontend rather than updating visual baselines to hide drift.

Transient screenshots, logs, traces and build output belong in ignored runtime/ or the existing ignored Playwright output directories. Keep executable tests, intentional specs/*-snapshots baselines, licenses, source artwork and provenance. Loose screenshots in the E2E source root are not test fixtures and must not be recommitted. Historical reports are past evidence, not current task instructions or fresh verification.
