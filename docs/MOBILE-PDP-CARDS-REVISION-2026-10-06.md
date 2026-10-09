# Mobile PDP card revision — 6 October 2026

The subsequent [mobile card layout refinement](MOBILE-PDP-CARD-LAYOUT-2026-10-06.md) replaces the finance text stack with a compact row and reduces finance/showroom heights to 160px/176px. The artwork and broader implementation recorded below remain in use; the height measurements below describe the preceding pass.

The preceding finance card made its illustration too small, and the plain showroom card removed the automotive character. This revision replaces those two treatments while retaining the accepted Details/Photos, grouped specs/extras and transparent Similar cars section.

[Matched previous-pass/revised comparison](mobile-pdp-cards-revision-2026-10-06/cards-before-after.png) shows the actual 390px viewport, with equal 375px body captures and no scaling. [Final measurements](mobile-pdp-cards-revision-2026-10-06/layouts.json) cover the GLS in Bulgarian and English at 320px and 390px. Earlier intermediate captures remain clearly named in the evidence folder.

## Implementation

- `packages/marketplace-ui/components/listing-cta-banner.tsx` now owns the shared image, title, action, spacing, inverse colours and keyboard focus. Its two explicit layouts place finance copy beside the car and showroom copy below the photograph. Content stays in normal flow, with no individual asset offsets or nested interactive controls.
- `listing-finance-card.tsx` supplies localized finance copy and the existing formatted approximate amount. The larger silver SUV sits in a graphite photographic setting; the redundant From/От prefix was removed to avoid an orphaned English line at 320px and match the approximate amount already displayed in the listing summary. The selected-vehicle URL and amount are unchanged.
- `listing-location.tsx` uses a brighter generated edit of the existing illustrative showroom composition, with left-aligned address and directions. The collapsible map remains inside the dark card, with its original URL and iframe. New-tab accessibility copy is preserved.
- `packages/marketplace/lead-site.ts` selects the revised finance asset and adds the optional `mobileShowroomArtworkPath` override. Existing dealer configurations retain their finance/contact artwork fallbacks. Desktop, Contact/About and hero artwork are unchanged.

Paths for the abbreviated component filenames above are under `packages/marketplace-ui/components/`. Both mobile actions use a 44px treatment and a visible white inset focus outline. Finance is 192px high at all four tested locale/width combinations; showroom imagery is 224px high, followed by its map disclosure.

## Artwork and provenance

- [Finance source and exact generation prompt](../provenance/assets/mobile-pdp-finance-v2/README.md): 1080 × 540 WebP, 51,350 bytes.
- [Showroom reference, edit source and exact prompt](../provenance/assets/mobile-pdp-showroom-v1/README.md): 1080 × 720 WebP, 180,456 bytes.

Generated source files, the showroom reference, preparation scripts and SHA-256 manifests are preserved. Delivery preparation only resizes and encodes. The showroom artwork remains illustrative; it is not evidence of the dealer's real premises. Existing inventory photos are unchanged.

## Verification

- Final production build completed compilation, TypeScript, static generation (8/8) and route output with one worker, on Node 22.23.2, pnpm 11.4.0 and Next 16.3.8 in isolated provider-free QA mode.
- The initial revised build passed with 11 workers. After the final copy adjustment, a Windows worker exited during page-data collection despite successful compilation and TypeScript. Available virtual memory was about 4.3 GiB. A process-local `CIRCLE_NODE_TOTAL=2` retry completed with one worker; no source/configuration or persistent environment change was used for this workaround.
- Existing focused Playwright checks: **4 passed**, covering PDP gallery/focus/map/related rail/overflow at 320px and 390px in Chromium and WebKit. Final copy/layout inspection additionally covered both locales at both widths.
- Biome and scoped whitespace checks passed on the four changed TypeScript files.
- [Keyboard and map check](mobile-pdp-cards-revision-2026-10-06/keyboard-map-check.json): white 2px focus outline, focus reaches the native map summary, Enter opens/closes it, 320px iframe height and no overflow.
- [Finance action](mobile-pdp-cards-revision-2026-10-06/finance-action-check.json): the shared card opens `/bg/lease?vehicle=am-1010`, with the GLS selected and its supplied 1870 BGN estimate intact. No enquiry was submitted and no external directions or call action was activated.
- [Desktop 1440px check](mobile-pdp-cards-revision-2026-10-06/desktop-check.json): both revised mobile cards are hidden and the page has no horizontal overflow.

Build and browser logs, scoped source preimages and guarded generated-file restoration are retained under ignored `runtime/mobile-pdp-cards-revision-20261006/`. The starting `next-env.d.ts`, `tsconfig.json` and browser-session fixture are preserved after verification. The existing 6482 listener is retained, and the user tab is returned to its GLS URL with the temporary viewport override reset.

## Delivery

Source is in the canonical Cars checkout on `main`. Unrelated dirty work and earlier artwork/evidence remain preserved. Commit and push are still blocked by the existing Cars `.git/index.lock`; it was not removed or bypassed. No dealer deployment or template promotion was performed. Build output is retained, without retrying the previously rejected cleanup.
