# Section navigation CTAs — 5 October 2026

Keep both section-level “View all” actions as secondary grey buttons with a right arrow, centered below their card grids. They open a complete collection; Search and Contact retain the stronger primary treatments. The inventory action opens `/bg/cars`, and the articles action follows `/bg/blog` to the existing `/bg/guides` library.

Both now share 44 px height, 15 px regular type, 24 px line height, 20 px horizontal padding and 8 px corners. A thin neutral border makes the buttons recognizable against the pale section surfaces. They use the existing neutral desktop hover token instead of the preview's pale blue control hover. Width follows each label. The native links, arrows, focus outlines and capability gates are retained.

Only `packages/marketplace-ui/components/dealer-desktop-discovery.module.css` changes in this follow-up. All edits remain inside the desktop breakpoint. The header and its design tokens match their preceding source hashes exactly, preserving the soft black Contact action and grey Saved action. Existing unrelated discovery styles are preserved.

## Evidence and verification

- Stock CTA: [before](section-ctas-final-2026-10-05/stock-before.jpg), [after](section-ctas-final-2026-10-05/stock-after.jpg).
- Articles CTA: [before](section-ctas-final-2026-10-05/articles-before.jpg), [after](section-ctas-final-2026-10-05/articles-after.jpg).
- Fresh full-page captures and computed styles are in `docs/section-ctas-final-2026-10-05/`. The detail crops derive from these captures at the same 1440 px viewport.
- Both actions remain 44 px high at 1024 and 1440 px with no horizontal overflow. Enter reaches the complete inventory and the existing articles library. The browser reports no warnings or errors.
- Mobile Home at 320 and 390 px preserves page height, heading geometry and overflow state exactly against the preceding verified build; compare the before/after layout JSON in the evidence directory. This is not a pixel-identical claim.
- Scoped Biome passes; all seven existing refactor contracts pass. The production build and Web typecheck pass using Node 22.23.2 and pnpm 11.4.0.

Canonical `http://127.0.0.1:6482/bg` serves build `1qMXGPDDznbZdBLE7DGKf` from `.next-public-e2e-section-ctas-final-20261005-demo`, under PID 3508. HTTP 200 and final computed styles are verified. `next-env.d.ts` is preserved byte for byte. Logs, preimages, a source hash and task-only patch are in `runtime/section-ctas-final-20261005/`. Prior production outputs are preserved.

The checkout remains on `main` at `08c89d63f9e11939acd5b135ece4278252b80f43`. Commit/push remains blocked by the pre-existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time. The lock and unrelated work are preserved. No release promotion or dealer deployment was performed.
