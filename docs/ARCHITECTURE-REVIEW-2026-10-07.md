# Modern architecture review — 7 October 2026

## Scope and source

Architecture-only changes to `cars/main`, `templates/modern`, based on fetched main `4a94d6f47d682b2dafd49870b528c92a8688c644`. The standalone Modern repository remains a publishing mirror. The current polished mobile and desktop UI is the contract; no CSS, visual tokens, copy, assets or component composition were redesigned.

The interrupted work had left browser-preference, shortlist and public-request extractions unfinished. This pass reviewed and completed those boundaries, added regressions, and made two small allocation/computation improvements rather than introducing a new state framework or restructuring the monorepo.

## Implemented

**Optional persistence.** `browser-preferences.ts` owns safe browser reads/writes for the existing view and recent-search preferences. Denied storage, a throwing storage getter and quota failures no longer escape into these UI paths. Existing keys and serialized values remain compatible.

**Shortlist lifecycle.** `desktop-saved-cars-store.ts` separates persistence/subscriptions from rendering. It refreshes changes missed while unsubscribed, reconciles the latest stored list before a local toggle, preserves visit-only state on failed reads/writes, and retains snapshot identity without notifying consumers when content is unchanged. The existing dealer/base-path isolation, validated record parser, stable server snapshot, legacy-preview rules and 100-record limit remain. This is not a transactional cross-tab database.

Five new regression cases failed before the store fix and passed afterward: missed updates while unsubscribed; stale local toggles; unchanged storage events; quota-limited visit-only saves; and a later failed storage read. The store has 12 focused tests in total.

**Bounded presentation work.** Demo inventory and the Chinese collection slice the requested page before adapting dealer identity/destination fields. Complete counts, facets and ordering are retained. A 72-record fixture proves only the requested 24 records are adapted; an empty page keeps its count without adapting off-page records. Live database query behaviour is unchanged.

**Less work during draft edits.** The shell memoizes the existing active-filter chips and canonical applied-search label against their actual inputs, avoiding repeated taxonomy work during unrelated draft keystrokes. Applied filters still belong in the URL; dialog drafts, navigation and cancellation semantics are unchanged. Existing request-scoped listing reads remain in place; no cross-dealer global cache was introduced.

**Public request boundary.** `public-support-request.ts` owns pure normalization/validation and a schema-derived field allowlist. Source links accept HTTP(S), not script/data/file schemes. Submission orchestration retains readiness, admission, rate limiting, persistence and notification. Tests cover rejecting invalid requests before side effects and sharing one idempotency context between persistence and notification. No real enquiry was sent.

**QA/source cleanup.** Retired 77 loose E2E-root screenshots totalling 41,449,117 bytes (39.53 MiB) from the current tracked source. Git history retains them. This reduces current source/export clutter, not page JavaScript or historical Git objects. Intentional test baselines, live assets, source artwork, licences and provenance remain. Ignore rules and an executable contract prevent loose captures being recommitted. Core template/architecture/QA guidance now describes the current code rather than accumulating obsolete polish instructions.

## Verification

| Check | Result |
| --- | --- |
| Marketplace UI unit tests | 117 passed across 23 files. |
| Public web unit tests, after final source/test corrections | 200 passed across 38 files. |
| UI and E2E TypeScript checks | Passed. |
| Production Next.js build, including TypeScript | Passed; isolated local static-demo output. |
| Refactor contracts | 8 passed. |
| Release preflight structural contracts | Passed. |
| Release preflight harness tests | 87 passed. |
| Scoped formatter/linter | Passed for all 17 changed code files. |
| Production Chromium persistence/dialog checks | 13 passed: URL reload/listing/Back at 320/390/1440 px; cross-tab saves; view reload and invalid values; denied/full storage; BG/EN category history, focused Model/Price, and search draft cancellation. |
| Chromium and WebKit mobile completion | 4 passed: make/model selection and Sell draft dismissal/focus in both browsers. |
| Supplied-inventory search on Chromium and WebKit | 4 passed: 390 px mobile suggestions and the current 1440 px model dialog both find and open M4 from an X5-filtered starting point. |

The first development-server category run timed out in BG/EN. Both unchanged category tests subsequently passed against the production build; no navigation workaround or assertion relaxation was added. A stale desktop test still targeted the retired header combobox. Its selector/flow was updated to the current model dialog, retaining the test's ability to find an M4 while X5 results are applied and to navigate to the correct listing. Application markup was not changed to satisfy the old test.

A new pagination test initially failed TypeScript by reading a demo-only facet on the public result union. Its assertion was corrected without widening production types; the subsequent production build passed.

## Visual evidence

Nine matched before/after Chromium captures cover BG Home, Cars and a supplied BMW X5 listing, plus EN Cars, at 320, 390, 1023 and 1440 px as appropriate. Every captured route returned HTTP 200, with no page errors or horizontal document overflow. Fonts and visible images were awaited; hidden lazy images were not treated as loading blockers.

Decoded-image comparison: five captures were pixel-identical. The other four differed by 10, 17, 42 and 68 pixels respectively, with no visible layout change. The changed shell and shortlist components also retained identical JSX tags, text and non-event attributes against fetched main. No screenshot baseline was updated to accept a redesign.

Raw before/after images, hashes, measurements, test output and the comparison script are in ignored `cars/runtime/modern-architecture-tools/`, not committed as another screenshot archive.

## Delivery and limits

No runtime dependency, framework, schema migration, dealer configuration, provider credential, public deployment or client rollout was added by this refactor. Existing unrelated dependency edits and other templates' working changes were left out of the scoped commit. Local verification used the installed workspace and Node 22.22.0; this was not a clean-room dependency-install certification.

The shared checkout has unrelated overlapping work against upstream. The delivery is constructed from fetched GitHub main with a separate staging index and only the reviewed Modern paths, preserving the shared working tree and its real index rather than resetting or stashing other tasks. Publication uses a normal non-force main update and requires the parent still to match upstream.

This review proves the listed local source/build/interaction checks, not universal performance or dealer-production readiness. No measured page-load percentage is claimed. Mounted-path release acceptance, real inventory/provider integration, actual email delivery, public-hosted behaviour and each dealer's identity/contact/content sweep remain separate release checks. The master retains its existing sample identity intentionally.
