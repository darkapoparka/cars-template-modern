# Desktop CTA hierarchy — 5 October 2026

The owner-approved hierarchy uses soft black for Contact, Search, View all cars, showroom Details and the four service-card actions. Saved and View all articles remain grey. Text links and selected controls retain their blue accent. The viewing action over the photograph retains its white inverse treatment for contrast.

Primary controls share `--desktop-primary-background`, `--desktop-primary-foreground` and `--desktop-primary-hover`: `#30343b`, white and `#262a31`. This replaces the header-specific token names without changing Contact's appearance. Colours and hover states change inside existing desktop media queries; layout, typography, corners, focus and native action semantics remain intact. Primary buttons have no box shadow.

Changed source: `packages/design-system/styles/desktop-tokens.css`, `packages/marketplace-ui/components/dealer-desktop-header.module.css`, `dealer-hero-search.module.css`, `dealer-desktop-discovery.module.css` and `vehicle-card-desktop.module.css`. `docs/QA.md` records the final hierarchy and supersedes the preceding grey inventory CTA.

## Evidence and verification

- [Matched before/after comparison](desktop-cta-hierarchy-2026-10-05/comparison.jpg) includes the header, hero search, stock and service cards. Fresh [before](desktop-cta-hierarchy-2026-10-05/home-before.jpg) and [after](desktop-cta-hierarchy-2026-10-05/home-after.jpg) full-page captures use the same 1440 × 1000 viewport and scrollbar. Page height remains 3485 px; every sampled action retains its position, dimensions, font size and weight.
- [Computed styles](desktop-cta-hierarchy-2026-10-05/desktop-after.json) confirm the shared primary palette, grey secondary controls and absent primary shadows. At 1024, 1440 and 1920 px, both header controls remain 136 × 44 px; section CTAs remain 44 px high, without horizontal overflow. Actual Contact hover is `#262a31` with white text and no shadow.
- [Keyboard focus](desktop-cta-hierarchy-2026-10-05/keyboard-focus.json) retains the visible 2 px blue outline and 3 px offset. Saved opens and closes with Escape. Enter opens the complete inventory and the articles library.
- [Route checks](desktop-cta-hierarchy-2026-10-05/route-checks.json) verify `/bg/contact`, `/bg/cars`, `/bg/listing/bmw-x5-m50d-sofia-2020`, `/bg/guides`, `/bg/cars?sort=newest`, `/bg/sell`, `/bg/imports` and `/bg/lease`. The articles link follows the existing `/bg/blog` redirect to `/bg/guides`. No browser warnings or errors were observed.
- [Mobile comparison](desktop-cta-hierarchy-2026-10-05/mobile-comparison.jpg) pairs 320 px before/after and 390 px before/after. Page height, all sampled heading geometry and overflow state match the fresh pre-change baseline exactly. JPEG captures are visually equivalent but not pixel-identical; `mobile-pixel-comparison.json` records the differences. Mobile styles remain unchanged.
- Scoped Biome passes for all five CSS files. All seven existing refactor contracts pass. Production build and Web typecheck pass using Node 22.23.2 and pnpm 11.4.0.
- Eight existing Chromium/WebKit cases pass: Home search/sidebar draft application, desktop header frame, legacy shortlist and Home stock keyboard browsing. Search/sidebar covers 1024, 1440 and 1920 px; the header case also covers 1280 px; stock browsing covers BG/EN. Logs and the focused configuration are in `runtime/desktop-cta-hierarchy-20261005/`.

Canonical `http://127.0.0.1:6482/bg` serves build `LDrhXQru2VWu-vwZwlQlO` from `.next-public-e2e-desktop-cta-hierarchy-20261005-demo`, under PID 30880. HTTP 200 and final computed styles are verified. `next-env.d.ts` is preserved byte for byte. Earlier production outputs, unrelated edits and the shared index are preserved; task preimages, hashes and the task-only patch are in the runtime evidence directory.

The checkout remains on `main` at `08c89d63f9e11939acd5b135ece4278252b80f43`. Commit/push remains blocked by the pre-existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time. The lock is preserved. This is local template implementation and verification; release promotion and dealer deployment remain separate.
