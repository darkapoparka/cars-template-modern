# Mobile charcoal headers and Import link field

Home/Cars used hardcoded near-black (`zinc-950`) while Import, Sell and Services
used the configured Modern charcoal (`#30343b`). Home/Cars, including their
scrolled search header, now use the same existing `--brand` token. The reusable
frame's dark mobile header uses that token too. Its clean/light option is
preserved. Desktop presentation is unchanged.

Sell already renders a charcoal mobile banner on a fresh load; the white VIN
capsule is its entry field. This check did not find a white Sell banner and did
not introduce a separate red service color.

Import's mobile entry now has one link icon and its existing text. The search
icon and trailing chevron are removed. The link editor uses the same link icon;
its clear, validation, close/focus and GET request handoff are unchanged. White
focus outlines remain visible on charcoal mobile header controls. The owner's
approved first MODERN artwork remains the same v2 raster asset.

## Changed source

- `packages/marketplace-ui/components/mobile-dealer-discovery-header.tsx`
- `apps/web/app/[locale]/components/public-marketplace-frame.tsx`
- `apps/web/app/[locale]/components/mobile-dealer-service-hero.tsx`
- `apps/web/app/[locale]/imports/components/mobile-import-source-search.tsx`
- `apps/web/app/[locale]/services/services.module.css`

## Checks

- Biome passed on all five changed source files; scoped `git diff --check`
  passed.
- Web TypeScript passed with Node 22.23.2:
  `tsc --noEmit --emitDeclarationOnly false --incremental false`.
- The existing mobile request-readiness and Sell policy tests passed: 8 cases.
- The existing focused `modern-mobile-completion.spec.ts` checks passed in
  Chromium and WebKit: 6 cases covering Import clear/type/focus at 320px,
  inventory type/facts at 320px and Sell overlay type/action contrast.
- Local Chromium visual checks: Home, Import and Sell at 320/390px and 1440px;
  Services, Cars and Guides at 390px; Import/Sell English at 390px. Measured
  pages had no horizontal overflow. The compact scrolled inventory header also
  uses charcoal. Matched 390px header geometry is unchanged.
- Import retains the edited URL when dismissed, restores focus to its trigger,
  and carries the URL through to the local request. The call control's keyboard
  focus outline measures solid white at 2px.
- Matched Home screenshots at 1280px are pixel-identical before/after. The
  mobile-only changes do not alter its desktop composition.
- A fresh Import load at 390px logged no console errors. Tabs used during edits
  recorded the existing transient Turbopack CSS hot-refresh error, retained in
  the evidence rather than treated as a cold-load error.
- Actual viewport dimensions were asserted before final captures; initial
  incorrectly labelled desktop captures were removed from this task's evidence.
- The first test attempt ran out of space on C:'s temporary cache. Tests then
  passed using task-specific temporary/cache/output directories under L:.

Screenshots, measured colors/dimensions, actions, diagnostics and the matched
comparison are under `docs/mobile-header-consistency-2026-10-06/`.
`next-env.d.ts` and `tsconfig.json` retain their exact preimages. Existing dirty
work and earlier branding/card changes were preserved. No commit, push,
production build, template release or dealer deployment was performed for this
small mobile slice; these checks establish local behavior.
