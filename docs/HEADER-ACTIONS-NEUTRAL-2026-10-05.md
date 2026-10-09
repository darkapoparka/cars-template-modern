# Neutral header actions — 5 October 2026

This correction supersedes the earlier charcoal Contact treatment. The owner found its visual weight too strong despite equal dimensions. Saved and Contact now use the same light grey fill, dark text, 500 weight, 15 px type, 20 px horizontal padding, 12 px corners and equal 144 × 48 px dimensions. The separate `primaryAction` modifier is removed. Neither action has a box shadow, text shadow or filter.

Both use one shared action rule and a subtle neutral hover. The prior shared `control-hover` resolved to pale blue in this preview; the header now consumes `--desktop-control-neutral-hover`, defined in the desktop design tokens. Keyboard focus keeps its visible outline, and native button/link semantics are preserved. The preceding stock and journal CTA changes remain in place.

Changed source: `packages/marketplace-ui/components/dealer-desktop-header.module.css`, `dealer-desktop-header.tsx`, and `packages/design-system/styles/desktop-tokens.css`. Existing unrelated changes in those files are preserved. The new token is consumed only by the desktop header.

## Evidence and checks

- [Before](header-actions-neutral-2026-10-05/before.jpg) and [after](header-actions-neutral-2026-10-05/after.jpg) show the same header action crop at 1440 px. Before reuses the immediately preceding verified finish; fresh baseline measurements confirm the same styling and dimensions. After is cropped without altering pixels from the [final full header capture](header-actions-neutral-2026-10-05/header-after.jpg).
- [Before styles](header-actions-neutral-2026-10-05/before.json), [after styles](header-actions-neutral-2026-10-05/after.json), and [actual hover](header-actions-neutral-2026-10-05/hover.json) confirm the neutral treatment and absent effects.
- Mobile Home at 320 and 390 px preserves page height, heading geometry and horizontal overflow state exactly; compare `mobile-before.json` and `mobile-after.json` in the evidence folder. This is a layout comparison, not a pixel-identical claim.
- Saved opens, Escape closes it and focus returns. Contact has a visible 2 px keyboard outline with 3 px offset; Enter opens `/bg/contact`. The final build retains the same actions. The browser reports no console warnings or errors.
- Scoped Biome passes for all three changed files. All seven existing refactor contracts pass after placing the hover colour in the design system. The final production build and Web typecheck pass using Node 22.23.2 and pnpm 11.4.0.

Canonical `http://127.0.0.1:6482/bg` serves build `sw4KDkwCmb4zC5PJFgFcK`, from `.next-public-e2e-header-actions-neutral-hover-20261005-demo`, under PID 27452. HTTP 200 and the actual final styles are verified. `next-env.d.ts` is preserved byte for byte. Runtime logs, source hashes and a task-only patch are in `runtime/header-actions-neutral-hover-20261005/`; preimages are in `runtime/header-actions-neutral-20261005/preimage/`. Prior production outputs remain preserved.

The canonical checkout remains `main` at `08c89d63f9e11939acd5b135ece4278252b80f43`. Commit/push remains blocked by the existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time; the lock is preserved and the shared index remains empty. No template release or dealer deployment was performed.
