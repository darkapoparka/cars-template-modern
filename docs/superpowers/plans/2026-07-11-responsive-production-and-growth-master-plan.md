# AutoMarket responsive production and growth master plan

**Date:** 2026-07-11  
**Status:** Execution-ready; implementation tasks are created in Codex as local tasks and begin behind a readiness gate  
**Source of truth:** [`../audits/2026-07-11-marketplace-product-audit/README.md`](../audits/2026-07-11-marketplace-product-audit/README.md)  
**Extends:** `2026-06-14-frontend-excellence-plan.md` and `2026-06-14-automarket-prototype-to-mvp.md`

## Goal

Turn the existing AutoMarket prototype into a secure, honest, crawlable, Bulgaria-first automotive marketplace with excellent mobile behavior, a genuinely useful desktop comparison experience, a durable buyer/seller/dealer loop, and a credible supply-acquisition program for Chinese EV and hybrid brands.

Success is not “looks modern.” Success is:

- A buyer can find, compare, trust, save, and contact around a real vehicle.
- A private seller or dealer can create, publish, manage, and improve a real listing.
- A dealer/importer sees only its organization’s inventory and leads.
- Trust and price claims are evidence-backed.
- Public inventory is indexable and never silently replaced by fake cars.
- Mobile stays fast and familiar; desktop becomes a dense professional tool.
- The system is deployable, observable, tested, localized for Bulgaria, and ready to onboard supply partners.

## Architecture invariants

The next-forge split remains fixed:

- `apps/web`: public marketplace, public dealer/importer pages, guides, SEO, and anonymous lead entry.
- `apps/app`: authenticated buyer account, seller flows, Dealer Studio, importer/manufacturer workspace, and admin.
- `apps/api`: webhooks, cron/jobs, feeds, and service endpoints.
- `packages/marketplace`: domain language, validation, filters, routes, and provider-neutral contracts.
- `packages/marketplace-ui`: automotive product compositions shared by apps.
- `packages/design-system`: generic tokens and shadcn primitives only.
- `packages/database`: Prisma schema, migrations, queries, and transactions.

Packages remain self-contained. Apps compose packages. Server-only database/auth/storage logic never enters client components. External VIN, history, photo, AI, feed, and finance services stay behind typed adapters.

## Product and visual north star

The experience should combine:

- Cars.bg’s immediate inventory and information density.
- mobile.de’s search/filter completeness and saved-search discipline.
- Carwow’s surface hierarchy, imagery, dealer framing, and filled-control styling.
- AutoMarket’s own advantage: clearer evidence, better price intelligence, faster listing creation, and a role-specific operations app.

### Styling contract

- Off-white canvas; white primary panels; visibly grey inputs, chips, and secondary buttons.
- Graphite primary buttons and selected states.
- One restrained blue accent for focus/links; semantic green/amber/red only when meaning is real.
- Borders separate nearby facts; they do not define every card.
- Dense desktop typography and spacing without looking cramped.
- No giant marketplace hero before inventory.
- No decorative animation that delays buying, selling, comparing, or contacting.
- Light-first public marketplace; dark mode is not a launch requirement.

### Responsive contract

- Mobile keeps the current category → search → quick filters → results → sticky navigation pattern.
- Tablet receives an explicit compact-navigation state; no 768–1023px dead zone.
- Desktop keeps a sticky header, a non-duplicated facet rail, a dense row list by default, and optional grid view.
- Extended desktop facets use a right Sheet; mobile facets use a full-screen staged form.
- Sticky UI never covers the last card, form action, or contact control.

## Execution rules

1. **Use one local Codex task at a time.** The user explicitly requested local tasks, not worktrees. They share one dirty checkout.
2. **Do not discard current work.** The uncommitted desktop controls, shell, card, route, SEO, workspace, plan, and spec changes may be valuable. Inspect and adopt; never reset or overwrite them wholesale.
3. **Begin every task with a readiness gate.** The created tasks initially inspect, restate ownership/dependencies, and wait for the user to say `EXECUTE`.
4. **No broad rewrites.** Deliver launchable slices and preserve the working mobile interaction model.
5. **No schema or destructive data change without explicit approval.** Prepare a schema proposal and migration plan first; use an isolated Neon branch after approval.
6. **No external outreach without explicit approval.** Research and drafts are allowed; sending, CRM writes, and account creation are not.
7. **No fabricated trust.** A badge or claim needs stored evidence, a policy, and a review timestamp.
8. **No production mock fallback.** Mocks are confined to explicit local demo, tests, and Storybook.
9. **Respect file ownership.** Do not edit another task’s owned files. Reserve `packages/marketplace-ui/index.ts` for the final integration task unless the plan explicitly hands it over.
10. **Use relevant skills before acting.** At minimum: next-forge for monorepo decisions, Next.js for App Router work, shadcn for UI composition, React best-practices after TSX edits, agent-browser and browser verification for live UI, Turborepo for repo/CI, Neon for database work, imagegen for the campaign raster asset, and Sales company research for partner acquisition.

## Preflight gate

Before any implementation task:

- Free several GiB of safe generated cache space on `M:`; do not delete source or user files.
- Pin Node 22 LTS and pnpm 10.31.0.
- Capture `git status` and identify which current changes belong to the active slice.
- Do not run installs, full builds, or test workers in parallel.
- Use filtered/affected checks during iteration and full gates only at milestone boundaries.

## Program sequence

### Task 00 — Repository release foundation

**Outcome:** A safe private application monorepo with deterministic toolchain and enforceable gates.

**Owns:** root `package.json`, `turbo.json`, workspace/package dependency declarations, Node/pnpm version files, CI, environment/deployment documentation, and non-product starter/CLI cleanup.

**Must not touch:** marketplace UI, app routes, Prisma schema/migrations.

Deliverables:

- Mark the repository private and remove next-forge CLI publishing/release machinery.
- Pin Node 22 and pnpm.
- Correct package dependency declarations and add a root typecheck gate.
- Make check, boundaries, unit tests, typecheck, and build deterministic.
- Add affected, frozen-lockfile CI with environment-aware Turbo caching.
- Document local/preview/production app mapping and required environment categories without secrets.

Gate:

- Clean Node 22 install succeeds.
- Check, boundaries, typecheck, unit tests, and build run with documented commands.
- CI configuration is reviewable and does not require production secrets for basic validation.

### Task 01 — Authentication, tenancy, and request security

**Outcome:** The authenticated app and service mutations are actually protected.

**Owns:** `packages/auth`, `packages/security`, `packages/rate-limit`, `apps/app/proxy.ts`, app root/authenticated/admin layouts, and API cron/webhook security/idempotency support.

**Must not touch:** public marketplace UI, design tokens, dealer page visuals, schema without approval.

Deliverables:

- Mount the auth provider at the correct root and protect authenticated routes at middleware and server layout.
- Add role-aware admin gating and dealer organization membership checks.
- Merge security headers correctly; introduce CSP safely.
- Protect cron, validate canonical service URLs server-side, redact PII, and fail loudly on missing webhook configuration.
- Add durable idempotency design; if schema is required, stop for approval before migration.
- Add anonymous, role, cross-org, cron-secret, and webhook replay tests.

Gate:

- Anonymous dealer/admin access redirects or denies.
- Non-admin and cross-org access deny.
- Cron rejects missing/invalid secret.
- Webhook replay produces one mutation and logs no raw PII.

### Task 02 — Design-system and responsive foundation

**Outcome:** The off-white/white/grey hierarchy and responsive density rules are available without rewriting product screens.

**Owns:** `packages/design-system/styles/globals.css`, theme provider, generic primitive variants, product visual stories/fixtures that do not own marketplace composition.

**Must not touch:** marketplace shell/cards/detail, app route pages, database.

Deliverables:

- Implement canvas, panel, control, selected, focus, and semantic token hierarchy.
- Fix Tailwind 4 Geist font declarations using literal family names.
- Define consistent radius, elevation, density, focus, and disabled states.
- Make Button/Input/Select/Sheet/Drawer/Table/Badge variants sufficient for public and workspace compositions.
- Document usage and create visual fixtures for default/hover/focus/disabled/error/success.

Gate:

- Contrast and focus-visible checks pass.
- Existing screens inherit an improvement without breaking dark or system behavior unexpectedly.
- No automotive-specific component leaks into the generic design package.

### Task 03 — Public discovery and desktop marketplace

**Outcome:** The existing mobile-first search becomes a polished, crawlable, dense desktop marketplace without losing mobile quality.

**Owns:** `marketplace-shell.tsx`, `desktop-marketplace-controls.tsx`, `vehicle-card.tsx`, new discovery-only components, and the public home route.

**Must not touch:** listing detail, public route graph beyond home, global tokens, schema, barrel export.

Deliverables:

- Adopt and finish the existing dirty desktop pass; do not rebuild it.
- Remove duplicated category controls and nested rail scrolling.
- Stage desktop range inputs and use a right Sheet for uncommon filters.
- Preserve real links for discrete facets and add crawlable pagination.
- Fix filtered totals, nested interactive semantics, placeholder media, loading/empty/error states, and the tablet navigation gap.
- Hide mobile quick-filter scrollbars with edge affordance.
- Add typed extension points for price/trust fields without inventing evidence.
- Verify 390×844, 768×1024, 1024×768, 1280×720, and 1440×1100.

Gate:

- JS-off HTML contains listing and pagination links.
- No horizontal overflow, nested rail scrollbar, hydration error, console error, or sticky overlap.
- Default desktop row view shows the agreed comparable facts.
- Mobile first vehicle remains visible without a marketing hero.

### Task 04 — Listing detail, trust, and price-intelligence presentation

**Outcome:** A responsive detail page that helps a buyer decide whether the car, seller, and price are credible.

**Owns:** `listing-detail.tsx`, detail-only gallery/spec/trust/price/contact components, and the listing route.

**Must not touch:** discovery shell/cards, global tokens, unrelated public routes, schema without approval, barrel export.

Deliverables:

- Split static server-rendered content from small client interaction islands.
- Build accessible gallery/full-screen behavior and the desktop/mobile content sequence.
- Deduplicate seller content and create one sticky desktop contact panel plus one safe mobile contact bar.
- Present price range/deal rating/history, VIN/history, service/damage/odometer/warranty/inspection states only when supported by typed data.
- Remove or label unsupported trust claims.
- Wire or honestly disable save/share/message/call/report actions based on available backend state.
- Complete canonical and Vehicle/Offer/Breadcrumb structured data.

Gate:

- Static listing facts exist in server HTML.
- Every public trust claim maps to data and policy.
- Gallery is keyboard/screen-reader usable.
- No mobile sticky overlap; detail works at all target viewports.

### Task 05 — Chinese-brand partner program and campaign asset

**Outcome:** A validated supply-acquisition playbook and production-ready, brand-neutral campaign asset—not outbound messages.

**Owns:** partner research/drafts under `docs/`, a narrowly agreed public asset directory, and asset metadata/usage brief.

**Must not touch:** product UI components/routes, database, external inboxes/CRM, manufacturer accounts.

Deliverables:

- Verify the local importer/distributor path for BYD, Leapmotor, OMODA/JAECOO, GWM/ORA, XPENG, Dongfeng/Voyah, and NIO/firefly from official sources.
- Create a ranked partner sheet, qualification notes, founding-partner offer, onboarding checklist, feed requirements, pilot metrics, and Bulgarian/English outreach drafts.
- Use the imagegen skill to produce a premium brand-neutral EV/hybrid campaign asset sized for desktop and mobile crops.
- Avoid logos, flags, fake models, or implied official endorsement.
- Do not send or create external drafts without explicit approval.

Gate:

- Every contact route has an official source and provenance.
- Asset passes desktop/mobile crop review and contains no text baked into the raster.
- Copy emphasizes verified importer, local stock, warranty, service, parts, delivery, and finance transparency.

### Task 06 — Public route graph, SEO, Bulgarian locale, and collection integration

**Outcome:** A crawlable Bulgarian marketplace with real category/make/model/dealer/collection entry points.

**Owns:** public category/make/model/dealer/guide/collection routes, public chrome/layout, `packages/seo`, `packages/internationalization`, sitemap/robots, public data helpers, and integration of the approved campaign asset.

**Must not touch:** discovery/detail component internals, authenticated app, schema without approval, barrel export.

Deliverables:

- Build `/cars`, make, model, trucks, vans, motorbikes, lease, public dealer/importer, guide, and curated Chinese EV/hybrid routes using shared server data helpers.
- Add Bulgarian locale, correct `<html lang>`, canonical/hreflang, locale-aware formatting, and AutoMarket branding.
- Build a canonical-domain sitemap containing real listings/categories/makes/models/dealers and a working robots response.
- Remove stock next-forge marketing chrome from marketplace routes.
- Integrate the compact Chinese collection module after real results, not before them.
- Production database failures render an honest unavailable/error state, never mock inventory.

Gate:

- `/robots.txt` is 200.
- Sitemap has no `undefined`, no literal `[locale]`, and includes real canonical URLs.
- Bulgarian and English route/metadata tests pass.
- Collection module links to a real route and paid/partner status is transparent.

### Task 07 — Authenticated shell and buyer account

**Outcome:** A protected, role-aware workspace with real buyer saves, searches, alerts, messages, and account surfaces.

**Owns:** authenticated shell/sidebar/header, buyer overview, saved listings/searches, messages/account routes, buyer actions and buyer-specific components.

**Must not touch:** public discovery/detail, dealer routes, global tokens, schema without approval, barrel export.

Deliverables:

- Derive navigation from user/org role; never show all personas at once.
- Replace broken links and template remnants.
- Apply workspace hierarchy: off-white canvas, soft-grey utility/navigation, white working surfaces, dense responsive content.
- Persist saves and saved searches, expose alert settings, and complete honest empty/loading/error states.
- Implement messaging/lead views and account/profile basics within approved data capabilities.
- Add authorization and cross-user tests.

Gate:

- Buyer workflows persist and survive reload.
- Buyer cannot access dealer/admin surfaces.
- Mobile and desktop workspace navigation remain complete and non-overlapping.

### Task 08 — Durable marketplace core, Dealer Studio, and Listing Factory

**Outcome:** The supply-side loop persists end-to-end and remains organization-scoped.

**Owns:** seller/dealer routes and components, approved marketplace schema/query/action changes, storage/AI/VIN adapters, secure upload flow, inventory/leads operations.

**Must not touch:** public discovery/detail visuals, global tokens, partner outreach, schema before explicit approval, barrel export.

Deliverables:

- First produce a schema/data-integrity proposal covering FKs, enums, indexes, lifecycle, trust evidence, price snapshots, media metadata, moderation/audit, customer/subscription/promotion mapping, and manufacturer/importer org type. Stop for approval.
- On an approved isolated Neon branch, implement the minimum schema and migration required for the core loop.
- Persist seller/dealer create → draft → review → publish → pause/sold lifecycle.
- Build secure Blob uploads with ownership, MIME/size/count/quota, metadata, processing, cleanup, and rendering.
- Keep VIN/photo/AI behind deterministic adapters; local work requires no provider secret.
- Build dense desktop inventory rows and mobile cards with status, health, price, leads/views, days live, and processing states.
- Persist leads and enforce org scoping.

Gate:

- Create → publish → public discover → save → contact → dealer lead persists.
- Cross-user and cross-org authorization tests pass.
- Upload validation and cleanup tests pass.
- Approved migration deploys on a Neon branch and has a rollback/restore plan.

### Task 09 — Launch quality, observability, and release audit

**Outcome:** Production-like previews are measurable, testable, accessible, and releasable.

**Owns:** E2E/browser suites, product stories/fixtures, observability/analytics placement, SLO/runbook/deployment documentation, readiness/privacy/security checks, and the final controlled barrel integration.

**Must not redesign product screens or introduce new product scope.**

Deliverables:

- Add buyer, seller, dealer, importer, and admin Playwright journeys.
- Add viewport matrix, keyboard/a11y, loading/empty/error, structured-data, sitemap/robots, authorization, and critical API tests.
- Mount analytics where product behavior occurs with consent; remove irrelevant API browser analytics.
- Add request correlation, redaction, readiness, alert definitions, and production-mock detection.
- Define performance budgets and run restore, webhook replay, upload abuse, and degraded-database drills.
- Run final React best-practices review and browser verification.
- Integrate shared exports only after all owning tasks are complete.

Gate:

- Full check, boundaries, typecheck, unit, build, and E2E suites pass on Node 22.
- No high-severity security/a11y finding, no unsupported trust claim, no production mock fallback.
- Desktop/laptop/tablet/mobile screenshots are approved.
- Preview deployment, alert drill, and Neon restore drill are documented and repeatable.

## Data and schema decision gate

The current schema cannot express the whole product promise. Before Task 08 migrates anything, the agent must present:

- Proposed models/fields/enums/indexes and why each is required now.
- Existing data/backfill impact.
- Authorization and privacy implications.
- Migration order and isolated Neon branch.
- Rollback or restore procedure.
- Which future features remain provider-neutral.

Explicit user approval is required before applying any schema change or migration.

## Chinese partner pilot definition

The smallest credible pilot is:

- One verified Bulgarian importer/distributor organization.
- 20–100 current vehicles via CSV or feed.
- One public verified partner profile and one brand/model collection.
- Test-drive/quote lead routing.
- Clear local stock, delivery, warranty, service, parts, and finance fields.
- Weekly funnel report: views → saves → qualified leads → appointments.
- No exclusivity and no paid-placement ambiguity.

Success criteria after 30 days should be agreed with the partner, not invented. Suggested measures are inventory freshness, feed error rate, lead response time, qualified lead rate, and scheduled test drives.

## Program definition of done

- Authenticated and privileged routes are protected at middleware and server boundaries.
- Organization isolation and admin authorization are tested.
- Production never silently serves mock inventory.
- Core list → discover → save → contact → manage loop persists.
- Public filters and pagination are crawlable; category/make/model/dealer/collection routes exist.
- Robots, sitemap, canonical, hreflang, Bulgarian locale, structured data, and locale formatting are correct.
- Mobile, tablet, laptop, and desktop layouts meet the responsive contract.
- Price/trust signals are evidence-backed and understandable.
- Dealer inventory and listing creation are operational, not presentation mocks.
- Secure media upload and processing lifecycle exist.
- Partner acquisition assets and drafts are ready, but no outreach has been sent without approval.
- Check, boundaries, typecheck, unit, build, E2E, security, accessibility, and production-readiness gates pass.

## Execution order

Run the local tasks sequentially:

1. Task 00 — repository foundation
2. Task 01 — auth/security
3. Task 02 — design foundation
4. Task 03 — public discovery
5. Task 04 — listing detail
6. Task 05 — Chinese partner/asset
7. Task 06 — public routes/SEO/localization/collection
8. Task 07 — authenticated shell/buyer
9. Task 08 — durable core/Dealer Studio/Listing Factory (after schema approval)
10. Task 09 — launch QA/release audit

Do not execute multiple local tasks concurrently. If speed later matters, explicitly switch selected non-overlapping work to worktrees—but that is outside the user’s current instruction.
