# Modern desktop refresh — 1 October 2026

## Rolled back at the owner's request

Both desktop passes (`3aa204ccb` and `fbe8900c7`) have been reversed in source.
All 18 affected source paths match `3aa204ccb^`. The later mobile commit and
the three mobile files already modified at rollback start were preserved;
their SHA-256 hashes were unchanged after applying the reverse patch.
The notes and screenshots below are retained historical evidence only.

Rollback checks: web typecheck and all 271 web/UI tests passed. The preview
at `http://127.0.0.1:6462/bg` returned HTTP 200 with the original heading.
The former server process was gone; a replacement process was already running
when inspected. Its exit cause was not established. Browser automation timed
out, so restored visuals were not independently verified in this rollback.

## Revision after owner feedback

The owner rejected the split introduction below. It is historical evidence, not
an accepted visual direction. The current revision restores the original studio
artwork in a compact, centered masthead and removes the arbitrary featured listing.
The desktop header is 72px tall, navigation and vehicle categories use underlines,
and the search panel has a smaller radius and no elevated shadow. Vehicle photos
begin about 300px earlier at 1440px. The loading skeleton follows this composition.

Current evidence: `home-revision-1440.jpg`. The earlier screenshots show the
rejected iteration and are retained for comparison.

Revision verification: typecheck, production build, scoped Biome and diff checks
passed; the existing web/UI suites passed all 271 tests. Browser checks covered
BG home at 1024, 1440 and 1920px, preserved mobile home at 320px, expanded and
collapsed search, and a BMW search reaching `/bg/cars?q=BMW` with five results.
The final reload logged no new browser errors. No search or provider behavior
was changed. Owner visual acceptance is still pending; no dealer deployment.

## Audit and implementation

Reviewed the live preview in Codex Browser at http://127.0.0.1:6462/bg.
The original desktop homepage and inventory repeated a twelve-control search panel;
list rows used small photos with excessive empty space, and grid titles truncated.

- Replaced the homepage masthead with a split introduction and a vehicle from the existing inventory search data. No separate featured dataset or provider dependency.
- Kept make, model, price and year immediately visible. Other filters use an accessible disclosure with a stable control ID; collapsing it preserves the draft. The existing dialogs and URL search state remain authoritative.
- Standardized the desktop content width through the existing layout token, including header, results, service pages, vehicle detail and footer.
- Used three larger desktop card columns, wrapped titles, a separated price/facts hierarchy and image sizes matching the rendered cards. Retained grid/list preference and carousel behavior.
- Simplified service mastheads and vehicle-detail heading/back navigation. Updated the discovery loading skeleton to match the new introduction and three-column inventory.
- Kept styling below 1024px in its existing owners. Preserved the mobile edits present at task start; those were committed independently during this work.

## Verification

- Node 22.23.2; existing listener on 6462 preserved.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web --filter @repo/marketplace-ui test`: 55 files, 271 tests passed on the final source.
- `pnpm --filter web build`: passed after the loading-state update, with the documented static-demo environment. The build includes TypeScript and route generation.
- Scoped Biome check and `git diff --check`: passed.
- Browser visual review: BG home at 1024, 1440 and 1920; BG inventory and detail at desktop; detail at 1024; English inventory at 1280; BG import, sell, financing and contact at 1440; contact at 1024.
- Mobile regression: BG inventory at 320 and 390, detail at 320. No horizontal overflow in the measured views. These are browser viewport checks, not native device or complete accessibility certification.
- Diesel filter: expand controls, choose diesel, apply, collapse controls, submit; URL becomes `/bg/cars?fuel=diesel` with seven results.
- Grid/list controls, listing navigation, full-screen gallery and Escape dismissal worked. Back to search retained the diesel query.
- Financing picker selected BMW M4 Competition; the resulting CTA was a `tel:` link. No enquiry or phone call was sent.
- Transient Turbopack stylesheet HMR messages occurred during edits. A final reload rendered correctly with no newly logged browser errors.

## Review evidence

- `home-1440.jpg`: complete homepage, including inventory, service links and footer.
- `home-1440-viewport.jpg`: first viewport.
- `inventory-1440.jpg`: inventory grid.

This is local template implementation and verification. Owner visual acceptance,
immutable release selection, dealer propagation and hosted verification are separate.
No dealer was deployed and no live provider delivery was enabled.
