# Mobile polish — 29 September 2026

## Scope and implementation

Reusable Modern master changes only. No dealer publication or release promotion.

- Inventory and lease cards share title/price typography. Titles use medium weight; prices use bold, tabular numerals. Existing card geometry stays intact.
- Spec columns reserve intrinsic width for mileage. Year and mileage do not wrap; longer translated fuel/transmission text remains readable. Bulgarian Featured labels fit the image.
- Card and detail prices use the domain currency formatter. Monthly estimates retain their supplied currency rather than applying a hardcoded BGN/EUR conversion.
- When delivery is unavailable, financing opens a compact call sheet with vehicle, term and initial payment. Configured delivery retains the enquiry form.
- Import preparation explains the phone handoff and places the call action after the fields. Draft preservation remains intact.
- Vehicle location always shows the configured address and directions. The embedded map is a native, initially closed disclosure.
- Above-fold lease images load eagerly; the remaining inventory images remain lazy.

## Verification

Using Node 22.23.2 and pnpm 11.4.0:

- `pnpm --filter web test`: 36 files, 186 tests passed.
- `pnpm --filter @repo/marketplace-ui test`: 19 files, 83 tests passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter web build`: passed with the documented local demo environment.
- Scoped Biome checks and `git diff --check`: passed.

The final import dialog description adjustment was checked by Biome after the production build; it changes only the existing readiness-dependent copy expression.

Browser checks used the existing local listener at http://127.0.0.1:6462.
Inventory: 320, 360, 390, 430px, 844px landscape and 1440px desktop.
Bulgarian badge: 320px. Lease, financing, import preparation, detail and location: 390px; financing and detail also checked at 320px.
Homepage, sell, contact and mobile menu were checked at 320px.

Search for BMW X5 produced two vehicles. Opening the detail and returning preserved the make/model URL filters. Closing the menu returned focus to its trigger. Closing financing returned focus to its request action. Import link input survived dismissal/reopening and optional-detail expansion. No call or enquiry was submitted.

## Evidence

[Before/after gallery](../runtime/mobile-polish-2026-09-29/comparison.html) contains paired screenshots for English inventory at 320/360px, Bulgarian inventory at 320px, leasing, financing, vehicle detail, showroom, import form and desktop inventory.
The import after-image shows the footer after scrolling; the gallery explicitly identifies the differing scroll positions.
Screenshots are local ignored runtime artifacts, not release assets.

## Limits and repository handoff

This is a local mobile polish check, not full device/WebKit/200% zoom certification or desktop redesign acceptance.
The development preview still reported the existing React script-tag warning on client navigation; production compilation passed. No warning suppression or JSON-LD rewrite was introduced.

Repository: L:/CODEX/cars, branch main.
Starting HEAD: a1d4802811eac42fc9124f5285b9d92b0af951e4.
Fetched origin/main: 3d10957b48821dd3f0e18cdc65ff511a04ecde23 (66 commits ahead of starting HEAD).
Workspace doctor was run with --fetch. A fast-forward integration was blocked by unrelated staged/unstaged dealer brandbars, manifests and publishing scripts. Those changes were preserved. The stale zero-byte Git index lock was moved to the evidence directory; no active Git process owned it.

Next integration step: reconcile that unrelated working/index state with its owner, integrate origin/main, rerun affected checks and push main without force. This task does not authorize discarding or committing the unrelated work.

