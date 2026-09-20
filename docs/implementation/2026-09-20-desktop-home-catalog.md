# Desktop home and catalog separation

## Scope
Desktop only. The homepage (`/`) remains the selected showroom composition. `/cars` is the complete inventory browser; category and make/model entry routes keep working. Mobile retains the existing inventory, navigation, filters and card rendering. No user-agent redirects or duplicated inventory sources were added.

## Interaction contract
- Home has one filled Search submit button. More filters is a secondary text action beneath the search row.
- Body type, make/model, budget and query are one local draft. Applying a picker updates that draft without navigating. Search serializes it with the existing marketplace functions into the category catalog URL. Reset is local to the draft.
- Home stock previews and View all lead into the catalog. Catalog filters apply to URL state immediately; sorting, refresh, reset, empty results and pagination remain shareable.
- Desktop filter changes from a make/model landing route resolve to its category catalog, so removing a make is not silently re-applied by the route. Mobile callbacks retain their original route handling.
- Home modal dismissals reuse the overlay coordinator to restore focus. Picker options and full filters reuse existing components.

## Component ownership
`DealerHeroSearch` owns home draft state, independent of the results toolbar. `DealerInventorySummary` owns the catalog heading, count, sort and view-mode controls. `MarketplaceResults` uses the shared showroom card presentation on desktop, retaining its mobile content. Desktop CSS remains in component-local modules and consumes existing semantic tokens.

## Verification
Evidence: `.codex-artifacts/desktop-browsing-2026-09-20/`. Desktop baseline changes are reviewed separately from unchanged mobile baselines.

No changes to inventory photos/data, providers, migrations or live customer delivery. No deployment or release promotion.

## Final qualification

- Production web build passed (Next.js 16.3.3, 50 static pages), including TypeScript compilation. Source lint, E2E type checks, workspace boundaries and six refactor contracts passed. Marketplace UI unit suite: 81 passed.
- Final production browser gate: 41 passed, without updating expected images during that run. It covers separate home/catalog snapshots at 1024/1280/1440/1920, draft query/body/price/make behavior, modal focus return, one primary CTA, catalog sorting/density/reset/empty states, canonical make-route clearing, configured locale normalization, service routes and payload limits.
- Mobile interaction suite: 63 passed in the final complete mobile run. An earlier run encountered seven local image-optimizer readiness timeouts, retained in the logs; all failed cases subsequently passed in a 14-case recheck and then the complete mobile rerun. No mobile source/style/expected-screenshot edits were used to bypass those failures.
- Original inventory mobile screenshots remain unchanged and passed at 320/360/390/430px in the final shipping browser gate.
- Desktop grid and list reuse one showroom card hierarchy. List mode no longer exposes the legacy stretched specification-pill/seller layout. Its geometry and complete image height are covered by a focused browser check.
- Home/category navigation and data providers remain native existing routes; no viewport server redirects, stock replacement, new dependencies or provider calls.
