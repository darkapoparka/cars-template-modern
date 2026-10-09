# Desktop CTA finish — 5 October 2026

The owner requested a final desktop pass on Modern at `http://127.0.0.1:6482/bg`, including grey secondary actions and clear exits from the stock and article previews.

The header's Saved control now has a light grey surface, dark text, 48 px height and the existing desktop control radius. Its hover stays neutral. `DesktopSavedCars` accepts an optional class name so the header owns this presentation while the footer keeps its existing style. Native shortlist behavior remains in its original component.

View all cars remains centered below the four-car preview and now has the same grey secondary treatment. The journal gains a matching View all articles link below its three cards. The journal link uses the existing locale-aware `/blog` entry, which resolves to the unified `/guides` library in BG and EN; the library contains six materials. It is shown only when editorial content is enabled. Both section actions share one CSS rule and preserve native link semantics. Unused styles for the former journal heading link and card action are removed.

Blue continues to identify primary actions. The approved artwork, hero, cards, service composition and mobile styles remain in use. This request supersedes the plain stock-link presentation recorded by the preceding banner pass.

## Source

- `packages/marketplace-ui/components/dealer-desktop-header.tsx`
- `packages/marketplace-ui/components/dealer-desktop-header.module.css`
- `packages/marketplace-ui/components/desktop-saved-cars.tsx`
- `packages/marketplace-ui/components/dealer-desktop-discovery-content.tsx`
- `packages/marketplace-ui/components/dealer-desktop-discovery.module.css`

## Evidence

- Full Home: [before](desktop-cta-final-2026-10-05/home-1440-before.jpg), [after](desktop-cta-final-2026-10-05/home-1440-after.jpg).
- Header: [before](desktop-cta-final-2026-10-05/header-before.jpg), [after](desktop-cta-final-2026-10-05/header-after.jpg).
- Journal: [before](desktop-cta-final-2026-10-05/journal-before.jpg), [after](desktop-cta-final-2026-10-05/journal-after.jpg).
- Stock and journal action geometry: [before](desktop-cta-final-2026-10-05/actions-before.json), [after](desktop-cta-final-2026-10-05/actions-after.json).
- BG/EN header checks at 1024, 1280, 1440 and 1920 px: [receipt](desktop-cta-final-2026-10-05/desktop-layout.json). There is no navigation/button overlap or horizontal overflow.
- Matched Home captures and layout receipts at 320, 390 and 1023 px are in [the evidence folder](desktop-cta-final-2026-10-05/). Page heights remain 2136, 2384 and 1624 px respectively, with identical visible heading geometry and no overflow. These are layout-preservation checks, not a claim of pixel-identical raster output.

Keyboard focus on the journal link has a visible 2 px outline with a 4 px offset. Enter opens the Bulgarian article library; the English link opens its English counterpart. Enter on View all cars opens `/bg/cars`. Browser console checks on the final canonical preview report no warnings or errors.

## Checks and runtime

Node 22.23.2 and pnpm 11.4.0 were used with the complete workspace and the documented provider-free demo environment.

- Scoped Biome: five source files pass.
- Production build and Web typecheck: pass on the final source.
- Marketplace UI unit tests: 101 pass; Web unit tests: 188 pass.
- Refactor contracts: seven pass. The initial check rejected a global header selector; the final implementation uses an explicit component class and passes the unchanged contract.
- Release preflight contracts pass; all 87 preflight/architecture tests pass.
- Ten existing focused browser cases pass across Chromium and WebKit: shortlist persistence, cross-tab updates, locale handling, dismissal/focus restoration, mobile breakpoint closure, header frames, stock keyboard navigation and reduced motion. The test configuration uses the OS scrollbar.

Canonical 6482 now serves production build `ZJknnYgd8lcfUNY_5woRq` from `.next-public-e2e-desktop-cta-final-20261005-demo`, under PID 48320. HTTP 200 and the expected article action were verified. The temporary candidate server on 6499 is stopped, and the preceding production output is preserved. `apps/web/next-env.d.ts` is restored byte for byte to its preimage.

Logs, the task-only patch against the initial working tree, source hashes and preimages are preserved in `runtime/desktop-cta-final-20261005/`. Existing dirty Modern work, other templates and the empty shared index are preserved. Source commit/push is blocked by the pre-existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time. It was not deleted or bypassed. The handoff remains in the canonical `main` checkout at `08c89d63f9e11939acd5b135ece4278252b80f43`.

This is a local desktop finish. It does not promote a template release or deploy dealer sites.
