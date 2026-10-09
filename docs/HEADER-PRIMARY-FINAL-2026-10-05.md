# Primary header action — 5 October 2026

The latest owner request restores a clear primary Contact action while retaining a grey Saved action. This supersedes the all-grey header correction. Contact now uses a softer black `#30343b`, white text and a flat `#262a31` hover. Compared with the earlier rejected dark treatment, both controls are more compact: 136 × 44 px, 15 px regular-weight type and 8 px corners. Their geometry remains equal, and the shared two-column grid still lets both grow together when the Saved label needs more room.

The primary modifier owns only colour. The common action rule owns dimensions, typography, spacing, corners and focus. Contact colours live in the desktop design tokens. Neither action has a box shadow, text shadow or filter. Saved keeps the preceding neutral grey hover. All consumers of this change remain in the existing desktop breakpoint; navigation typography and the preceding stock/journal CTA work remain intact.

Changed source: `packages/marketplace-ui/components/dealer-desktop-header.module.css`, `dealer-desktop-header.tsx`, and `packages/design-system/styles/desktop-tokens.css`. Existing unrelated edits in these files are preserved.

## Rendered evidence and checks

- [Before](header-primary-final-2026-10-05/before.jpg) and [after](header-primary-final-2026-10-05/after.jpg) show the same action crop at 1440 px. Before reuses the immediately preceding verified grey finish; fresh baseline measurements confirm the same styling and dimensions. After derives from the [final full header capture](header-primary-final-2026-10-05/header-after.jpg).
- [Before styles](header-primary-final-2026-10-05/before.json), [after styles](header-primary-final-2026-10-05/after.json) and [actual primary hover](header-primary-final-2026-10-05/hover.json) confirm equal dimensions, regular type and absent effects.
- [Desktop layout](header-primary-final-2026-10-05/desktop-layout.json): both controls measure 136 × 44 px at 1024 and 1440 px, without horizontal overflow or navigation overlap. The minimum observed navigation clearance is 24 px.
- Mobile Home at 320 and 390 px retains identical page height, heading geometry and overflow state, comparing `mobile-before.json` and `mobile-after.json`. The baseline reuses the preceding verified build at the same route and widths. No pixel-identical screenshot claim is made.
- Saved opens and closes with Escape. Contact has a visible 2 px keyboard outline with a 3 px offset, and Enter opens `/bg/contact`. Its actual pointer hover remains dark with white text. The browser reports no warnings or errors.
- Scoped Biome passes for the three changed files; all seven existing refactor contracts pass. The final production build and Web typecheck pass using Node 22.23.2 and pnpm 11.4.0.

Canonical `http://127.0.0.1:6482/bg` serves build `Ar2UY-TMaCqr74ejTk738`, from `.next-public-e2e-header-primary-final-20261005-demo`, under PID 50952. HTTP 200 and final computed styles are verified. `next-env.d.ts` is restored byte for byte. Runtime logs, source hashes, preimages and the task-only patch are in `runtime/header-primary-final-20261005/`. Prior production outputs remain preserved.

The checkout remains on `main` at `08c89d63f9e11939acd5b135ece4278252b80f43`. Commit/push remains blocked by the pre-existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time. The lock is preserved and the shared index remains empty. No release promotion or dealer deployment was performed.
