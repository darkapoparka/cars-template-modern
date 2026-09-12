# Mobile-first finalization plan

**Status: planned, not implemented.** Audit date: 12 September 2026. Work on the existing Next.js/React template. Mobile must pass its acceptance gate before desktop redesign begins. Preserve the local dirty `astra` work; do not reset it, replace it from remote main, or perform an unrequested Svelte migration.

## Outcome
A consistent mobile dealership experience whose main routes, forms, drawers, error states, and navigation work across narrow portrait and landscape layouts. Business identity/content are data-driven; shared geometry has one owner; behavior is covered by meaningful tests. “Perfect” is an acceptance checklist with evidence, not a visual rating.

## Packet 0 — Safe and repeatable baseline
**Dependencies:** none. **Owners:** workspace dependency manifests/lockfile, runtime setup, existing test runner. **Findings:** C01/C02.

Keep the public dev server on loopback until critical dependency findings are patched. Use the required Node 22 runtime without changing global Node for other projects. Provision adequate free disk headroom: the existing 2GiB preflight threshold did not prevent an out-of-space failure during this audit. Prefer sequential heavy build/test runs; only remove clearly identified disposable audit/build artifacts.

Upgrade Next.js and the affected image dependency resolution to a compatible patched release; verify the latest advisory ranges at implementation time. Triage remaining high advisories by dependency path and deployment applicability. Do not blindly upgrade every package or introduce forced transitive overrides. Repair the undeclared Vitest dependency and unsupported UI package import. Resolve missing CI guard contracts deliberately, and inspect the failing type-generation contract on Windows.

**Acceptance:** repeatable start command; enough free capacity for a complete gate; production public build and repository typecheck pass; critical dependency findings resolved or a documented non-applicability established with evidence; supported package imports. Record the exact versions and command results. No design changes in this packet.

## Packet 1 — Repair the Sell data round trip
**Dependencies:** baseline evidence available. **Owners:** sell policy, mobile experience/drawer, Sell page, Contact handoff. **Finding:** M02/C03.

Introduce one typed draft with category, VIN, make, model, year, mileage, and supported notes. Parse it once from supported query inputs, normalize it with existing policy, and pass initial values into mobile as well as desktop. Include VIN in the contact summary and edit serialization. Preserve drafts on closing/reopening the drawer; define explicit reset behavior rather than accidental loss.

Keep the current call-first demo handoff unless a separate product decision authorizes a real lead workflow. Replace misleading “sent” or “we will contact you” wording where the visitor has only prepared details and must call. Do not submit to production or fake success states during testing.

**Acceptance tests:** VIN-only → continue → summary → edit → refreshed draft; manual vehicle → continue → edit with all fields preserved; invalid/partial VIN; missing required manual fields; close/reopen; browser back; clear/reset. Assert actual input values, not placeholders. Use synthetic data and no real submissions.

## Packet 2 — Fix constrained mobile geometry and accessibility
**Dependencies:** none beyond a stable running build. **Owners:** ListingLocation, content-hub drawer, Sell steps, semantic foreground tokens. **Findings:** M01/M03/M04.

Remove the listing map's parent-dependent negative margin behavior. Give the map its intended contained rounded surface/gutters while preserving internal related-card scrolling. Give the content-filter drawer one bounded scroll body and a reachable close action. Prevent step numbers from shrinking/wrapping and replace failing low-contrast colors through semantic tokens, not route patches.

**Acceptance:** no document-level horizontal overflow at 320/360/390/430px or 844×390; map iframe loaded; tabs switched; last filter option reachable; focus and body scrolling restored on dismissal; all reproduced contrast nodes pass; step numbers stay on one line. Add regressions before removing old CSS. Do not hide failures with global clipping.

## Packet 3 — Consolidate data and CSS ownership
**Owners:** lead-site config, content records, existing mobile primitives, route composition. **Findings:** C04/C05/C06/C07/M06.

Replace hub/article slug switchboards with metadata on the actual content records. Reuse existing Sell how-step copy and shared category assets/labels. Use the current localized path helpers. Keep dealer name, phone, address/district, social channels, colors, and business assets in the existing typed configuration rather than scattered presentation strings.

Construct card summaries server-side and leave only search/filter/drawer state in the client hub. Measure the client payload change. Use existing MobileDealerChrome/brand/overlay primitives instead of another header or a universal layout framework. Move each shared CSS rule into its real owner, remove its obsolete override, and verify mobile evidence immediately. Retain proven keyboard compatibility code until physical-device tests justify simplification.

**Acceptance:** a new article requires one content-record change, not several JSX maps; changing dealer configuration propagates through visible copy and links; no contradictory mobile geometry selectors; no new `!important` patch layer; package exports remain explicit. Valid translation data, fixture values, enums, and semantic tokens are not prohibited “hardcoding.”

## Packet 4 — Finish every public mobile route family
**Owners:** route-specific composition on shared primitives. **Findings:** M05/M06/M07.

Inventory: test category, make/model, all quick filters, reset, zero results, browser history, long titles, unavailable fields, and actual listing destinations. Listing: verify gallery, tabs, related cards, map, fixed call action, disabled/sold states, and financing handoff. Imports and Lease: verify nested selections, chosen vehicle/source continuity, validation, overflow, submission failure/retry or the intended call-first fallback. Sell: use the repaired state contract from Packet 1.

Guides: keep `/blog` as the existing alias to `/guides`; finish category/search/clear behavior, reading layout, and return-to-filtered-results behavior. Contact/legal/loading/not-found: use intentional mobile chrome, truthful localized content, and clear recovery actions. Review the listing finance promotion against the approved asset/design rather than generating a new visual direction. Validate fixture images and content; do not fabricate business claims.

**Acceptance:** each public route family has a recorded default, empty/error, narrow-width, and interaction-state review. No legacy white header unexpectedly appears. Shared fact typography, radii, gutters, and surfaces match while route-specific color and action hierarchy remain intact. No desktop redesign in this packet.

## Packet 5 — Reliable regression suite and production measurement
Update stale tests to distinguish static dealership demo behavior from generic marketplace/provider-enabled behavior. The static demo intentionally excludes analytics; tests should assert that no analytics runs, rather than require a consent banner that is not rendered. Scope desktop-only assertions to desktop projects. Add regressions for the four confirmed mobile defects before replacing old structural assertions with semantic behavior checks.

Run lint, boundaries, typecheck, all relevant unit suites, release contracts, and the complete public mobile gate in demo and unavailable modes with enough disk space. The audit's interrupted gate is not a substitute. Recheck critical/high dependency findings. Run production-mode page measurements under a repeatable mobile profile; dev compilation timing is not an LCP or responsiveness score.

**Acceptance:** no unexplained failing/skipped gate; no accidental test weakening; stable before/after screenshots; correct metadata/canonical/robots/redirect behavior for supported routes; budgeted images and client payload; documented slow-network/loading/error behavior. Backend/authenticated integration gates require their own authorized environment rather than invented success.

## Packet 6 — Physical-device sign-off, then freeze mobile
Check an actual iPhone in Safari and an Android device in Chrome, including software keyboards, safe-area insets, rotation with a drawer open, back navigation, enlarged text, reduced motion, and a screen-reader journey. Ensure focused fields and final submit actions stay visible without double scrolling. Preserve usable target spacing and primary/secondary hierarchy; do not make every component 44px just to satisfy an outdated blanket rule.

**Acceptance:** all P0/P1 findings closed with evidence; remaining P2 decisions explicitly accepted or scheduled; user-approved mobile route matrix; no production form delivery claimed without an observed authorized test; no secret/real customer data in screenshots. Record the final commit and configuration, then start desktop work from that stable mobile baseline.

## Required mobile state matrix
| Area | Minimum regression states |
| --- | --- |
| Viewports | 320×700, 360×800, 390×844, 430×932, 844×390; actual safe-area phones |
| Navigation | Direct URL, client link, refresh, back/forward, alias redirect, unknown route |
| Drawers | Open, nested picker, long list, last option, cancel, Escape, backdrop, focus restore, rotation, keyboard |
| Search/filter | Apply, pending, zero matches, clear one, reset all, invalid values, URL/state persistence |
| Sell | VIN-only, manual-only, invalid, close/reopen, handoff, edit, reload, explicit reset |
| Listing | Missing/long content, gallery, tab keyboard, map, related rail, fixed action, availability state |
| Forms | Required inputs, invalid values, error message association, retry, preserved data, truthful success/fallback |
| Content | Search/category, no results, long titles, article back, all categories in landscape |

## Change discipline
One bounded change packet at a time. Include its failing reproduction, source owner, implementation, focused regression, and before/after screenshots. Keep unrelated desktop styling, dependency changes, and broad formatting out of functional fix commits. Do not delete legacy code until references and supported modes are accounted for. Do not create a new abstraction when an existing helper or primitive already owns the behavior.

## Finish line
The next implementation should begin with dependency/environment safety and the Sell/map/drawer/contrast defects—not a new hero generation. Mobile is ready only when the repaired flows, complete gates, and physical-device checks agree. Desktop work follows that acceptance, not an arbitrary “10/10” statement.
