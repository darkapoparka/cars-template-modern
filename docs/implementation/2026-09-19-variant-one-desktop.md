# Variant 1 desktop implementation

Target: the selected first generated reference, titled "Find Your Next Drive" (generation 62a8fade-89ee-443f-8022-6b7ec1e740a5). The other generated alternatives are not implementation targets.

## Scope

Desktop only (1024px and wider). Keep mobile components, breakpoint behavior, inventory, pricing, navigation and existing mobile screenshot baselines. Keep the configured dealership identity and Bulgarian content rather than copying the reference's fictional dealer, certification claims, stock or prices.

## Ownership

- Dealer desktop header: opt-in showroom composition; other route headers retain their existing layout.
- Dealer hero search: one desktop-only four-field/search composition using existing category, make/model, price, full-filter and search behaviors. No screenshot-based controls.
- Scene artwork: extracted photographic backdrop from the selected reference; generated text and interface removed. See provenance/assets/showroom-scene-v1.json. The public schema validates an optional scene path and preserves custom dealer cutouts.
- Inventory: server-provided stock order rendered through the existing carousel and vehicle card, with an explicit showroom presentation. The mobile vehicle card remains unchanged.
- Capability links: use enabled real services; no invented reviews or certification claims.

## Verification

Evidence and command logs: .codex-artifacts/variant-one-desktop-2026-09-19/.

Initial verification: production build, web typecheck, configuration tests (18), UI tests (77), mobile preservation and landscape/boundary checks (6) passed. Final composition screenshots and final browser qualification are recorded below when complete.

No live provider writes, customer enquiries, migrations, dealer deployments or release promotion. Pre-existing unpublished commits are preserved.

## Final qualification

Selected desktop composition inspected at 1024/1280/1440/1536/1920px. Desktop snapshots adopted after inspection; original 320/360/390/430 mobile snapshots unchanged and matching.

Final responsive gate: 23 passed (search, filters, carousel navigation, service routes, theme portals, details/recovery and payload budgets). Production web build passed with 50 static pages. Lint, web/e2e types, six refactor contracts and workspace boundaries passed. Configuration tests: 18 passed. Marketplace UI tests: 77 passed.

Image readiness excludes fully clipped carousel images, then verifies newly exposed slides after navigation; it does not wait for unrelated off-canvas lazy images.

The template retains its configured identity, localized content and real fixture inventory instead of copying fictional reference prices or certification claims.
