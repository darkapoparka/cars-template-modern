# Modern mobile headings and overlays - 9 October 2026

Mobile discovery uses `Открий автомобил` and Sell uses `Продай автомобил`. The existing Inter font remains; hero titles use 18px medium weight, a 28px line box, quieter opacity and restrained tracking. Secondary mobile headings use medium weight. The discovery field shows `Марка или модел` / `Make or model` until a make or model is selected. The extra unfiltered inventory count was removed.

Visible mobile overlay headings use concise labels with 18px medium type: `Данни`, `Линк`, `Избери`, `Стъпки`, `Лизинг`, `Настройки` and localized one-word filter titles. Existing instructions and accessible descriptions retain their context. Desktop copy stays descriptive; menu and photo-viewer titles remain screen-reader-only.

Local verification covered 38 reachable overlay states per language at 320px in Chromium, including nested filters and Sell/Import/Lease pickers. All visible inspected headings fit one line without horizontal overflow. Search, five quick drawers, Import link, Menu and the photo viewer also passed in BG/EN WebKit at 320px, with 44px close controls and focus returning after dismissal. Matched captures cover the primary changes at 320/390px; desktop checks cover 1440px. Initial development chunk-load and harness failures are retained alongside the successful retries.

The overlay pass passed 442 unit tests, focused Chromium/WebKit journeys, package TypeScript checks, scoped Biome checks and an isolated production build. The integration pass repeats the relevant unit and source checks before publication. Detailed measurements, screenshots and logs are retained in `runtime/mobile-overlay-copy-20261009`; preceding hero checks are in `runtime/mobile-typography-20261009` and `runtime/mobile-title-quiet-20261009`.

This master also retains the previously checked leasing, selected-vehicle, language-choice and inventory-return refinements documented in `FINAL-CODEBASE-AUDIT-2026-10-09.md`. Git publication and hosted verification are recorded separately from local checks. Dealer manifests and immutable release selections are unchanged by this master publication.
