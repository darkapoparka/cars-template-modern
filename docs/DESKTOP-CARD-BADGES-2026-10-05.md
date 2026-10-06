# Desktop showroom card badges — 5 October 2026

The requested desktop change replaces the year/variant/body subtitle with compact badges and gives Details a filled blue action. Vehicle name and price stay prominent. Home, Cars in Grid/List and related stock share the presentation; mobile retains its existing markup and styling.

Badges show year, the complete original variant when present, body style, mileage, fuel and gearbox. Variant extraction reuses the existing title policy, retains custom titles and omits an empty variant. Long values wrap within the badge. The shared four-fact policy used by mobile is unchanged. Details remains part of the existing card link, with the configured brand fill, white text, hover and keyboard focus.

## Matched review

- [Before](desktop-card-badges-2026-10-05/before-row.png)
- [After](desktop-card-badges-2026-10-05/after-row.png)
- [Mobile Cars before at 390 px](desktop-card-badges-2026-10-05/mobile-cars-390-before.png)
- [Mobile Cars after at 390 px](desktop-card-badges-2026-10-05/mobile-cars-390-after.png)
- [Mobile comparison](desktop-card-badges-2026-10-05/mobile-preservation.json)
- [Check summary](desktop-card-badges-2026-10-05/verification.json)

Full local captures, initial results and logs are preserved in `runtime/desktop-card-badges-20261005/`. The compact 270 px Home/type-pills/four-car composition remains a separate visual proposal; this change implements the shared cards.

## Verification

- Scoped Biome and `git diff --check` pass.
- Marketplace UI: 101 unit tests pass. Web: 188 unit tests pass.
- Refactor contracts: 7 pass. Release preflight contracts pass; preflight/architecture tests: 87 pass.
- Production build and web typecheck pass with Node 22.23.2 and pnpm 11.4.0. The protected `next-env.d.ts` preimage is restored byte for byte.
- All six `modern-desktop-reuse.spec.ts` cases pass in Chromium and WebKit, covering related card bounds, Home selection/keyboard/rail behavior, shortlist and detail presentation. The existing List hierarchy case also passes in both engines after making its Bulgarian route explicit. Its initial failure was an English route paired with Bulgarian menu labels; both initial failure artifacts are retained.
- Thirty-two matched captures per phase cover BG Home/Cars/detail at 320, 390 and 1023 px; EN at 390 px; BG/EN Cars in Grid/List at 1024, 1280, 1440 and 1920 px; and BG/EN Home and related stock at 1440 px. No page errors, console errors, horizontal overflow, escaping badges or price/action overlap are recorded.
- Enter on the focused card opens its own listing and retains a visible focus outline.
- Twelve mobile comparisons retain the same dimensions and layout: nine are pixel-identical; the other three have at most 30 changed pixels with a maximum channel difference of 5. Fresh 1023 px captures use matching responsive-image sources, dimensions and natural widths; the initial viewport-transition image samples are retained.
- Canonical local port 6482 runs verified build `P2KgXOGNvJKvDWvKxcdG5`. The previous build is preserved. Temporary port 6499 is stopped after qualification.

The change does not select a template release or update a dealer deployment. Unrelated Cars work and the existing untracked Modern hero-correction document are preserved.
