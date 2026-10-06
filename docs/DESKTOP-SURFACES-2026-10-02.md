# Desktop surfaces, inventory and articles

The owner accepted the blue Boxcars direction and requested another desktop-only polish pass: consistent backgrounds, more white containers, stronger tab rails, clearer inventory and better article cards. This receipt follows [the desktop rematch and service-page polish](DESKTOP-BOXCARS-2026-10-02.md).

## Latest pass: white cards across desktop

The owner requested that the agreed white-card pattern be applied across the template. This pass keeps white heroes and title areas, soft grey behind inventory and service forms, and white card surfaces with a quiet grey border and a shared light shadow. Inputs and specification insets retain their pale grey fill; actions and selected states retain blue.

- Service-page mastheads are now white. Their form/content area starts on the grey canvas with 32px of breathing space, rather than carrying the grey fill through the title area.
- Leasing's empty vehicle picker, selected vehicle card and price summary are white. Selected controls and the change-vehicle action remain blue; preference and enquiry behavior are unchanged.
- Inventory cards, filters, summary bars, home service and article cards, contact panels, FAQ containers and vehicle-detail panels share the subtle desktop shadow. Hoverable cards retain a blue edge and slightly stronger shadow. The homepage stock section remains unboxed, and the photo/search hero keeps its existing geometry.
- Article and legal pages use continuous white reading panels on the grey canvas, with space below their white title bands. Existing content, article routes and Back links remain.

The twelve CSS files passed scoped Biome. All 271 existing web/UI unit tests passed (web 186, marketplace UI 85), the web typecheck passed, and the final optimized web build passed with isolated run ID `desktop-white-cards-20261002-build` after the last frontend edit. The geometry and interaction assertions were not changed.

The final serial browser run passed all 8 existing checks in Chromium and WebKit: Boxcars geometry across EN/BG at 1024/1440/1920px, listing gallery/information/phone handoff, financing selection/preferences/clearing, and import focus/source-link handoff. Original timeouts and assertions remain. Results are in `browser-final-results.json` and `browser-final-artifacts/`; the separate raw WebKit captures from the earlier resource-constrained attempt remain recorded as failed.

Chromium captured 19 desktop states across the main pages, including EN at 1024/1920px and BG at 1440px. All final audited cards are white, title bands are white, and service content surrounds are grey. All captures returned 200 without page exceptions, horizontal overflow or completed broken images. The selected leasing state was recaptured after the temporary audit selector incorrectly classified its blue change-vehicle button as a card; the original report is retained.

All 21 mobile stable-geometry snapshots match the baseline: ten representative routes at 320/390px, plus Home at 1023px. Eighteen screenshots are pixel-identical; the other three differ by 336 channel bytes total, with maximum delta 13. Only image-loading skeleton markers are excluded from the stable geometry comparison. Strict all-pixel equality is not claimed. The inherited mobile article-header image request remains pending in the same two guide states before and after.

The initial article capture hit a cold route-compilation timeout, and an inherited pending header-image request prevented global network idle. The completed baseline records pending requests and waits for the route, fonts and visible image candidates. Later concurrent browser/build checks encountered navigation and chunk-load failures while the host had roughly 1 GiB of free RAM and less than 1 GiB free on C:. Only this task's test process tree was stopped. The build completed, and the final browser run was restarted serially with separate evidence paths; the original traces and failed captures are retained.

Evidence is in ignored `runtime/desktop-white-cards-20261002/`, including the original/complete baseline, final captures, selected-state recapture, surface audit, mobile comparison and browser traces. This pass changes twelve CSS files and this receipt, with no mobile source or behavior edits. The initial clean Modern source was recorded at `5e70f0295`; unrelated work on main is preserved. No template release, dealer refresh, deployment or outreach is included.

Changed style paths, relative to this template:

- `apps/web/app/[locale]/desktop.css`
- `apps/web/app/[locale]/components/public-desktop-layout.module.css`
- `apps/web/app/[locale]/lease/lease-desktop-controls.module.css`
- `apps/web/app/[locale]/lease/lease-desktop-vehicle-picker.module.css`
- `apps/web/app/[locale]/lease/lease-page.module.css`
- `packages/design-system/styles/desktop-tokens.css`
- `packages/marketplace-ui/components/dealer-desktop-discovery.module.css`
- `packages/marketplace-ui/components/dealer-desktop-hero.module.css`
- `packages/marketplace-ui/components/dealer-inventory.module.css`
- `packages/marketplace-ui/components/desktop-action-panel.module.css`
- `packages/marketplace-ui/components/listing-detail-desktop.module.css`
- `packages/marketplace-ui/components/vehicle-card-desktop.module.css`

## Earlier follow-up: restore space around the hero

The owner then questioned the heavy backgrounds and containers. This correction replaces the blanket grey homepage and outer white stock box described in the initial pass below.

- Home uses white space around its photo/search hero and discovery sections. The stock wrapper has no background, border or padding; its cards now align with the hero gutters. The blue accent, 4px category rails, individual white cards and article improvements remain.
- Standalone page-title bands use white. Inventory and service forms retain the soft grey `#f5f6f8` canvas behind their white panels, so the panels remain distinct. Inventory panels start 24px below the title band; the sidebar starts at y=324 at 1440px.
- The homepage photo/search hero itself was unchanged by the initial surface pass and this correction: at 1440px it remains x=24, y=90, width=1392 and height=680. Its title and search proportions remain.
- All four CSS edits are inside existing min-width 1024px rules or desktop-only components. No mobile source, behavior, artwork mappings or typography changed.

The final optimized web build passed after the last frontend edit with isolated run ID `desktop-background-balance-20261002-build`. Scoped Biome passed for the four CSS files and existing desktop test. The homepage search/sidebar draft-filter journey passed in Chromium and WebKit, and the final desktop geometry suite passed in both engines across EN/BG and 1024/1440/1920px. The existing inventory position assertion was updated from y=300 to y=324 for the intentional gap; other assertions remain.

Ten desktop captures covered Home in EN/BG at 1024/1440px and BG Cars, articles, Lease, Sell, Import and Contact at 1440px. Cars was captured again at 1024/1440px after the final spacing edit. All returned 200 without page exceptions, horizontal overflow or completed broken images. The homepage proof captures the hero and first stock row together at 1440px. Manual inspection confirmed the white homepage and title bands, unboxed stock section and separated inventory panels.

The four mobile baselines (EN Home at 320/390/1023px and BG Cars at 390px) all retain identical stable geometry after the final edit. One screenshot is pixel-identical; the other three differ by 305 channel bytes total, with maximum channel delta 8. Only transient image-loading skeleton markers are excluded from the stable geometry comparison. Strict all-pixel equality is not claimed; reports and original captures are retained. The inherited pending mobile image candidates remain recorded separately.

A development HMR warning about a missing CSS link cleared after one reload of the temporary inspection tab. The active preview and read-only reference servers were retained, and the temporary browser viewport override was reset.

This correction changes four CSS files, one existing geometry expectation and this receipt. The other 50 paths in the previous 56-path reviewed manifest remain byte-identical. Fetch-backed workspace inspection and scoped integration preserve unrelated work on main. Evidence, source hashes and integration details are retained under ignored `runtime/desktop-background-balance-20261002/`. The unit-test results below belong to the earlier pass and were not rerun for this CSS correction.

## Initial surface and component decisions (before the correction)

- The shared desktop canvas is soft grey `#f5f6f8`. Content surfaces are white, with a quiet `#e3e6eb` border. Form controls and specification panels use a pale grey fill. Blue remains the action and selected-state color; dark text and muted grey copy preserve the hierarchy.
- Home's "Разгледай нашите автомобили" section is a white container on that grey canvas. Its three categories share a continuous 4px grey rail, with a 4px blue selected segment. The article categories use the same rail treatment in their own white container.
- Home services use consistent white cards. The homepage article cards have inset images, a padded body, a blue category badge and a visible read action. The full article index shares the white card treatment and clearer search/category surfaces.
- Inventory has a shorter centered heading, a white summary/sort/view toolbar, readable sidebar controls and white vehicle cards with inset grey specification panels. List cards give the facts a complete row; below 1280px the price sits below the facts so their values stay readable. The existing filters, category routes, URL/history behavior, list/grid preference and listing links remain.
- The banner above the homepage articles uses new blue studio artwork generated with the built-in imagegen tool. Its live headline and action remain readable on the quiet left side. [The committed asset and generation prompt](../apps/web/public/desktop-boxcars/showroom-blue-v1.provenance.md) retain provenance and explain that it is illustrative artwork. Its optional `desktopVisitBanner` role preserves dealer overrides and mobile artwork mappings.
- Desktop soft-blue tokens now resolve against the desktop brand, preventing the inherited mobile red brand from producing pink desktop badges and actions.

Presentation changes are scoped to min-width 1024px or existing desktop-only components. Mobile's existing layout, Inter typography, red accent and artwork roles are preserved.

## Checks and evidence

Local static-demo preview: http://127.0.0.1:6482/bg. The read-only Boxcars reference remains on port 6455. Node 22.23.2 and pnpm 11.4.0 were used.

- All 419 existing unit tests passed: domain 21, marketplace 127, marketplace UI 85 and web 186. Web and E2E TypeScript checks passed. The final optimized web build passed after the last frontend edit, with isolated run ID `desktop-surfaces-final-20261002-build`; compilation and build TypeScript checks both completed successfully.
- Scoped Biome checks passed for the 12 changed frontend files and the desktop geometry test. Its single position expectation now checks sidebar y=300 rather than y=318, matching the intentionally shorter inventory heading. All other geometry and interaction assertions remain.
- The initial browser run passed 7/14 cases. Two geometry cases expected the previous heading spacing; four mobile article cases opened English routes because the temporary harness omitted the existing suite's Bulgarian locale. The Chromium category case timed out with its truck navigation request issued but incomplete. With the exact spacing expectation updated and the harness locale restored, the targeted run passed 8/8, including the unchanged category flow in both engines. Across the runs, all 14 distinct selected case/project combinations passed. These cover category draft/apply/Back, home search/sidebar filters, listing gallery/phone, mobile article reset/focus, 320px article cards and complete inventory facts.
- Final captures covered 23 states: Home, Cars and articles in EN/BG at 1440px, plus 17 mobile states across 320, 390, 767 and 1023px. All returned 200 without page exceptions, horizontal overflow or completed broken images. Another 22 desktop states covered 1024/1920px, list view, empty results, Finance, Contact, listing detail and legal content. All returned 200 without page exceptions, horizontal overflow or clipped prices/actions. Manual image inspection then found squeezed list specifications at 1024px; the facts-row fix described above addresses that gap in the automated check.
- After that fix, all 16 focused list states passed in Chromium and WebKit, EN/BG at 1024, 1280, 1440 and 1920px. Every rendered specification value, price and detail action fits its bounds; there is no page overflow or exception. The first partial attempt encountered an initial development document reload. A subsequent attempt selected the opposite of the current view and raced the remembered list preference. The final harness waits for initial readiness and explicitly selects the labelled List view button; all list/geometry assertions remain. The incomplete attempts are preserved separately from `final-list-complete/`.
- Mobile comparison: 16/17 strictly ordered geometry snapshots match. The remaining snapshot is pixel-identical and differs only in transient image-loading skeleton markers. All 17 stable geometry snapshots match when only those loading markers are excluded. Fourteen screenshots are pixel-identical; the other three differ by 121 channel bytes total, with maximum channel delta 8. Strict all-pixel and all-DOM equality do not pass, and their original reports are retained.
- The mobile article header's inherited lazy image can retain an empty selected source while the page is otherwise hydrated. Capture readiness therefore records pending image candidates separately; it does not claim every mobile image decoded. The same pending candidates were present before and after. Mobile artwork and loading behavior were not changed.

Evidence is retained under ignored `runtime/desktop-surfaces-20261002/`: the complete `baseline-final/` and `final/` captures, `adaptive/`, the original and targeted browser results/traces, strict `mobile-comparison.json`, separate `mobile-stable-geometry.json`, and the focused list checks. Earlier incomplete captures and failed checks remain available and are not counted as completed verification.

## Source preservation and integration

The canonical Cars checkout remains on `main`; no new branch or editable copy was created. Fetch-backed workspace-doctor inspection preserved the unrelated fleet/template work and independent Admin drift. The previous 53 reviewed Modern paths were hash-checked before this pass. This follow-up changes 12 frontend files, one existing desktop test and the previous receipt, and adds the banner, its provenance and this receipt: 56 reviewed paths cumulatively. Staged diff checking also found and removed one trailing space in the copied font licence and one final blank line in the copied service provenance; their text is retained. The other 37 earlier reviewed paths remain byte-identical to the before snapshot.

The exact allowlist and refreshed hashes are in `runtime/desktop-boxcars-rematch-20261002/task-owned-paths.json`. The earlier index lock and Import staging described in the previous receipt were preserved while present; later main commits released the index without committed Modern changes. Integration uses only the reviewed Modern allowlist. The resulting commit/push evidence is retained in the task handoff and Git history.

This is local reusable master work. Owner acceptance of the new render, immutable template promotion and dealer deployment remain separate. No dealer was refreshed, deployed or contacted, and no live enquiry provider was introduced.
