# Equal header actions — 5 October 2026

The owner requested equal-size Saved and Contact controls and a calmer Contact treatment after the preceding CTA finish. Both header actions now share one `.action` rule: 48 px height, 144 px minimum width, 15 px type, 24 px line height, 20 px horizontal padding and 12 px corners. A two-column grid keeps their rendered widths equal. When the Saved count needs more room, both grow together; a one-car shortlist measures both at 155.96875 px at the narrow 1024 px desktop width.

Saved uses the existing neutral grey control tokens. Contact uses the existing charcoal selected tokens with a darker neutral hover. There is no blue fill on the header Contact action. Native button and link semantics remain intact. Contact retains `/contact`, and Saved retains its original native dialog and persistence behavior. The shared rule also owns hover, focus and typography. Unused showroom/language styles and separate phone/Saved geometry rules are removed. The Contact modifier is now named `primaryAction` rather than `phone`.

The navigation grid respects each side's content width so the equal action pair and a Saved count cannot overlap the central links at narrow desktop widths. Wide desktop navigation retains its centered position. All presentation remains inside the existing desktop breakpoint.

## Source and evidence

Changed source: `packages/marketplace-ui/components/dealer-desktop-header.tsx` and `dealer-desktop-header.module.css`. The preceding stock and journal finish remains in place.

- Fresh 1440 px full-header captures: [before](header-actions-final-2026-10-05/before.jpg), [after](header-actions-final-2026-10-05/after.jpg).
- Full Home: [before](header-actions-final-2026-10-05/home-before.jpg), [after](header-actions-final-2026-10-05/home-after.jpg).
- Action details: [before](header-actions-final-2026-10-05/actions-before.jpg), [after](header-actions-final-2026-10-05/actions-after.jpg). The cropped before detail reuses the preceding verified finish's after capture at the same viewport and crop; the fresh full-header baseline confirms the same initial geometry and styling.
- Computed dimensions and styling: [before](header-actions-final-2026-10-05/before.json), [after](header-actions-final-2026-10-05/after.json).
- [BG/EN desktop receipt](header-actions-final-2026-10-05/desktop-layout.json): both controls measure 144 × 48 px at 1024, 1280, 1440 and 1920 px without overlap or horizontal overflow. With Saved (1), both grow together and remain clear of the navigation at 1024 px.
- Home at 320 and 390 px preserves page height, visible heading geometry and overflow state exactly. Matched captures and before/after layout JSON are in the evidence folder; no pixel-identical screenshot claim is made.

Saved opens, dismisses with Escape and restores focus. Contact has a visible 2 px keyboard outline with a 3 px offset, and Enter opens `/bg/contact` on canonical 6482. The final browser console check reports no warnings or errors.

## Verification and handoff

Using Node 22.23.2 and pnpm 11.4.0:

- Scoped Biome: two source files pass.
- Production build and Web typecheck pass.
- All seven refactor contracts pass, release preflight contracts pass, and all 87 preflight/architecture cases pass.
- Six existing focused Chromium/WebKit cases pass: header frames, shortlist persistence/cross-tab updates/breakpoint closure, and locale sanitation/dismissal/focus restoration.

Canonical `http://127.0.0.1:6482/bg` serves build `iF6zMG85iY4nmNHZ3DFZO` from `.next-public-e2e-header-actions-final-20261005-demo`, under PID 35288. HTTP 200 and the actual new computed styles are verified. The task-owned temporary 6499 listener is stopped. Prior production outputs remain preserved, and `next-env.d.ts` is restored byte for byte.

Runtime evidence is in `runtime/header-actions-final-20261005/`, including a follow-up-only patch, preimages, source hashes and a cumulative patch for both CTA requests against their original working-tree baseline. Existing unrelated dirty Modern and Cars work is preserved. Commit/push remains blocked by the existing zero-byte `L:/CODEX/cars/.git/index.lock`, created at 05:43:04 Sofia time; the lock is preserved and the shared index is empty. The canonical checkout remains `main` at `08c89d63f9e11939acd5b135ece4278252b80f43`.

This finishes the local header correction; it does not promote a release or deploy dealer sites.
