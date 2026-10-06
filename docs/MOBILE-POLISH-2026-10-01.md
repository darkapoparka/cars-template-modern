# Modern mobile polish — 1 October 2026

Scope: refinement of the existing mobile cards and sheets in the reusable Modern master. No dealer refresh or deployment is included.

## Final card treatment

- Inventory, leasing selections and related vehicle cards use a landscape 4:3 photo. A shared 46% media track replaces the tall image stretched to match all of the adjacent content.
- Brand, model and price sit beside the photo. All four vehicle facts sit together in one row beneath the photo and copy, using the card's full width.
- Badges have intrinsic widths, consistent type, 24px height and 6px horizontal padding. The year and mileage no longer stretch into uneven columns. Full year and mileage values remain visible at 320px in Bulgarian and English; abbreviated transmission labels retain their full accessible text.
- The shared card constants and direct fact list keep inventory and leasing consistent. Desktop fact markup is retained.
- Mobile sheet headers, search fields/results, taxonomy options and leasing preferences use a consistent 16px side inset. Headers gain 4px of bottom space and balanced multiline titles.

The earlier two-row badge correction was rejected during review. This report and the paired inventory screenshots describe the revised single-row treatment.

## Before and after

Paired browser captures at identical viewport widths, without retouching. Before captures show the original mobile baseline; after captures show the final single-row cards. Overlay captures wait for the opening animation to finish.

- [Inventory at 320px](mobile-final-2026-10-01/cars-320-comparison.png)
- [Inventory at 390px](mobile-final-2026-10-01/cars-390-comparison.png)
- [Import sheet at 320px](mobile-final-2026-10-01/import-link-320-comparison.png)
- [Leasing preferences at 390px](mobile-final-2026-10-01/lease-term-390-comparison.png)

## Validation

- Runtime: Node 22.23.2, pnpm 11.4.0, canonical source `L:/CODEX/cars/templates/modern`, static-demo preview `http://127.0.0.1:6462/bg/cars`.
- Current source: 271 passing unit tests (85 marketplace UI, 186 web).
- Current card geometry: all eight Chromium/WebKit cases pass at 320/375/390/430px, each in BG and EN. They check landscape photos, one complete badge row, padding, visible text, accessible titles/transmission and horizontal overflow.
- The existing 320px semantic/fact case passed in Chromium. WebKit initially encountered an execution-context error during the unlocalized route redirect; using the explicit `/bg/cars` route resolved the test and its final run passed.
- A desktop browser constrained to 320px (305px content with its scrollbar) and 390px retained all visible fact labels in both BG and EN.
- Final `pnpm --filter web typecheck` and `pnpm --filter web build` pass. The owned preview was paused for the build and restored on port 6462 using the Cars preview script.
- Final route checks cover inventory, vehicle detail, leasing, imports, sell and contact at 320px, 390px and 1440px. All 18 return HTTP 200 with no horizontal overflow, page errors or broken loaded images.
- Biome passes for the three final changed source/test files; `git diff --check` passes.
- Earlier interaction coverage: 33 of 34 selected Chromium/WebKit cases passed initially. One WebKit make/model test missed its first filter tap; both isolated repeats passed unchanged. This earlier run covered search/filter selection, desktop search continuation, draft preservation, custom vehicle makes, focus return, import clear/focus, financing handoff and semantic type/contrast.

## Preservation and delivery

The original mobile baseline was `3aa204ccb`. Initial mobile changes were saved in commit `d3088de99`; the final single-row correction supersedes that card treatment. An existing Git index lock temporarily blocked the follow-up commit and was preserved until it cleared. The final delivery commit is recorded in the task handoff. Do not release the earlier commit alone as the final mobile treatment.

Another chat rolled back its desktop redesign locally. Those separate dirty files, all unrelated Cars/dealer/template changes, and the independent admin repository's state are preserved. Current desktop identity is not a result of this mobile task. Workspace doctor fetched refs successfully earlier in the pass. No message was sent to another chat.

The shared ChatGPT reference could not be read because it presented a verification screen, so the live Modern template was used as the visual reference. Evidence is from the local standalone static demo, not mounted dealers, a hosted deployment, physical devices or real enquiry delivery. Visual acceptance remains with the owner.
