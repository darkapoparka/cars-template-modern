# Modern desktop polish — 1 October 2026

Reviewed the running static demo in Codex Browser at `http://127.0.0.1:6462/bg/`.
The owner requested polish of the current desktop composition and explicitly
excluded mobile. The saved checkout already contained the owner's rollback of
the rejected desktop passes `3aa204ccb` and `fbe8900c7`. This work preserves that
restored composition and the later mobile work.

## Findings and changes

- Search, inventory and service panels used competing widths. Reused the existing
  `--layout-content-max` boundary so the principal desktop sections line up.
- Vehicle titles truncated or competed with oversized price text. Allowed full
  wrapping, reserved two title lines in the grid, tightened the price hierarchy
  and used tabular numerals. List photos now use a bounded responsive width.
- Heavy panel shadows, pill shapes and crowded controls distracted from the
  vehicles. Simplified desktop panel and control surfaces, increased consistent
  spacing and retained visible borders and keyboard focus outlines.
- Service mastheads reserved empty space beneath their content. Removed the
  forced minimum height while retaining the centered title and studio artwork.
- Contact and service cards became cramped near the desktop breakpoint. Improved
  phone/address typography and used two service columns from 1024–1199px.
- Query-only search drafts incorrectly announced zero selected filters. The
  desktop status now names the query when no structured filters are selected.

The twelve search controls, existing dialogs, URL state, grid/list preference,
four-column wide inventory and three-column narrow desktop inventory remain in
their existing components. No provider, inventory or form delivery changes.

## Verification

- Runtime: Node 22.23.2 and pnpm 11.4.0, existing listener 6462.
- Web typecheck passed.
- Existing web/marketplace UI suites: 55 files and 271 tests passed. The marketplace
  UI suite was repeated after the final search-copy change: 19 files/85 tests.
- Production web build passed with the documented static-demo environment in an
  isolated `.next-public-e2e-desktop-polish-20261001-demo` output directory. The
  running preview was not stopped. Subsequent CSS edits only sorted properties.
- Scoped Biome check of the nine edited files and `git diff --check` passed.
- Browser review covered BG home, inventory, BMW detail, contact, imports, sell
  and lease at 1440px; inventory/contact at 1024px and home at 1920px.
- No page overflow or clipped vehicle titles in measured desktop views. Final
  home reload had no new warning/error logs or broken visible images. Offscreen
  lazy carousel images are excluded from the visible-image check.
- BMW search reached `/bg/cars?q=BMW` with five results. Switching list/grid worked.
- Mobile DOM geometry matched the saved baseline exactly for inventory, BMW
  detail and lease at both 320px and 390px: six views, zero differences.
- An AST comparison of all eight edited CSS modules confirmed every rule outside
  desktop media queries is unchanged. Seven relevant mobile/shared source files
  and layout tokens retained their baseline SHA-256 hashes.

These checks establish local static-demo behavior. Owner visual acceptance,
template release selection, dealer propagation and hosted verification remain
separate. This work does not publish a dealer or enable live enquiries.

## Evidence

- [Home before, 1440px](home-before-1440.jpg)
- [Home after, 1440px](home-after-1440.jpg)
- [Home after, first viewport](home-after-1440-preview.jpg)
- [Home after, 1920px](home-after-1920.jpg)
- [Inventory after, 1024px](inventory-after-1024.jpg)
- [Contact after, 1440px](contact-after-1440.jpg)
- [Desktop measurements](desktop-geometry.json)
- [Mobile geometry comparison](mobile-parity.json)

The older `docs/desktop-refresh-2026-10-01` notes and screenshots are historical
evidence of the rejected work and its rollback.
