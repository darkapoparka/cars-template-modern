# Modern mobile header hierarchy — 6 October 2026

Home now follows the same mobile page hierarchy as Cars, Services, Guides, Sell, Import and Leasing: the brand row, a short page title, the primary entry field, then quick filters or supporting content. About and Contact use the same title slot above their contact actions.

The shared title is 22px with a 28px line height, at y=68px. Primary entry fields start at y=108px and retain their 48px outer height. The content panel starts at y=168px on pages with an entry field. These coordinates are for a viewport without a top safe-area inset; the existing safe-area handling remains in place.

Sell uses the short Bulgarian title “Продайте автомобил” above “Въведете VIN номер” / “Enter VIN number”. Following the owner's copy and button refinement, its alternative is a compact black “Нямате VIN?” / “No VIN?” pill: 15px text, 36px visible height and a 44px tap area. Its accessible name includes “Въведете данните” / “Enter the details”, and it opens the existing vehicle-details dialog. The full-width VIN entry remains 48px high. The first instruction is “Подгответе данните”. The heading, pill label and first instruction each fit one line at 320px. “Нямате” follows the same formal address as “Продайте” and “Въведете”.

Services uses a white header search field. Guides moves its page title above search and keeps its result count in the content area. Loading headers use the same charcoal surface, title and spacing as the settled pages. The screen-reader results heading is a section heading in dealer mode, leaving one exposed page-level heading.

Changed paths in this continuation:

- `packages/marketplace-ui/components/mobile-dealer-chrome.tsx` — shared title slot and spacing.
- `packages/marketplace-ui/lib/mobile-dealer-title.ts` — Bulgarian and English inventory titles.
- `packages/marketplace-ui/components/mobile-dealer-discovery-header.tsx` — Home, Cars and category headers use the shared title.
- `packages/marketplace-ui/components/desktop-marketplace-controls.tsx` — dealer results use an h2; marketplace mode retains its h1.
- `apps/web/app/[locale]/components/mobile-dealer-service-hero.tsx` — service titles use the shared chrome.
- `apps/web/app/[locale]/components/mobile-sell-vehicle-hero.tsx` — VIN label and secondary manual-entry action.
- `apps/web/app/[locale]/components/mobile-about-contact.tsx` — shared contact title.
- `apps/web/app/[locale]/components/mobile-content-hub.tsx` — title above search and result-count alignment.
- `apps/web/app/[locale]/components/public-route-loading.tsx` — matching title, tone and geometry during loading.
- `apps/web/app/[locale]/services/service-catalogue.tsx` and `services.module.css` — visible mobile title, white input and page-height adjustment.
- `apps/e2e/specs/mobile-chrome.spec.ts` — shared title, heading hierarchy and loading/navigation checks.
- `apps/e2e/specs/modern-mobile.spec.ts` — article navigation waits for DOM readiness rather than every page asset.

Verification:

- Direct TypeScript check passed with Node 22.23.2 and pnpm 11.4.0.
- Isolated demo production build passed, including its TypeScript check and all route generation. Log: `runtime/mobile-hierarchy-standard-20261006/build.log`.
- Biome checked all 13 changed source/test files; `git diff --check` passed for tracked task paths.
- All 18 focused browser checks passed in 6.8 minutes across Chromium and WebKit. The five mobile widths were 320, 360, 390, 430 and 844px; the last used a 390px landscape height. The suite covered navigation/loading geometry, all primary page titles, one exposed h1, logo alignment, overflow, VIN preservation, searched-article return state, Leasing selection and the nested Import country picker. Log: `runtime/mobile-hierarchy-standard-20261006/e2e-passed.log`.
- Rendered Bulgarian checks at 320px covered Home, Cars, Services, Guides, Sell, Import, Leasing, About and Contact. English checks covered Home, Sell, Services, Guides, Import, Leasing and About. Each had one exposed h1, a one-line centered title and no horizontal overflow. The motorcycle title also fit at 320px.
- Matched desktop screenshots at 1440×1000px covered Home, Sell, Guides and About. About was pixel-identical after its images settled. The other comparisons had no channel differences above 20/255; mean differences were below 0.011/255, consistent with JPEG export variation. Desktop layouts remained unchanged.
- Settled browser navigation produced no new console errors. An earlier development hot-reload CSS error was recorded before the clean navigation window.

Evidence: [Home and Sell before/after](mobile-hierarchy-standard-2026-10-06/home-sell-before-after.png), [desktop comparison data](mobile-hierarchy-standard-2026-10-06/desktop-comparison.json), plus the original mobile and desktop captures in that folder. Mobile layout measurements are in `runtime/mobile-hierarchy-standard-20261006/mobile-layout-checks.json`.

Preservation and scope:

The canonical checkout remains `L:/CODEX/cars` on `main`, HEAD `08c89d63f9e11939acd5b135ece4278252b80f43`. Existing dirty work and the approved logo, service artwork and navigation assets were preserved. Preimages are in `runtime/mobile-hierarchy-standard-20261006/`. No branch, worktree, commit, push, release selection or dealer deployment was performed. This report describes the local preview at port 6482, not hosted or native-device acceptance.

Initial Safari failures came from a roughly 60-second wait for all fonts, a loading-header measurement race and a guide navigation waiting for the full load event. The checks now await the relevant title font, actual page controls and DOM readiness, with the original layout assertions and deadlines retained. A subsequent test restart encountered ENOSPC on L:. Automatic approval review blocked recursive removal of the temporary build folder; the output was preserved and browser test caches were directed to a task-specific directory on C:.

The generated `apps/web/next-env.d.ts` and `runtime/modern-mobile-session.json` were restored byte-for-byte to their start-of-task preimages after verification. `apps/web/tsconfig.json` retained its original hash. The preview remains running on 127.0.0.1:6482 with listener PID 8048. Temporary agent browser tabs were closed; the user's tab was preserved.

The Sell follow-up changed only `mobile-sell-vehicle-policy.ts` and the manual-entry button in `mobile-sell-vehicle-hero.tsx`. TypeScript, Biome and `git diff --check` passed. All four existing VIN/manual-draft flow checks passed across Chromium and WebKit in 49.9 seconds, including draft retention, editing, cancellation and explicit reset. Rendered checks at 320 and 390px found a one-line first instruction and no horizontal overflow; the details dialog opened and returned focus to the new button when closed. English mobile and matched desktop captures were also inspected. The desktop comparison had no channel differences above 20/255, with a mean difference of 0.0081/255. [Matched Sell before/after](mobile-sell-secondary-2026-10-06/sell-before-after.png) and [desktop measurements](mobile-sell-secondary-2026-10-06/desktop-comparison.json) are saved beside the original captures. The test session fixture was restored after verification, and `next-env.d.ts` remained byte-identical to this follow-up's preimage. The preview had been externally restarted with listener PID 15272; it was left running. No commit or publication was performed.

The final wording refinement uses “Продайте автомобил” and “Нямате VIN?” from the shared mobile Sell copy, including the existing longer accessible action name. Existing navigation and manual-draft test selectors were updated to this wording. TypeScript, Biome on the four changed source/test files and `git diff --check` passed. All four focused 320px header-navigation and manual-draft cases passed across Chromium and WebKit in 2.7 minutes. Bulgarian 320/390px and English 320px captures showed one-line headings without horizontal overflow; the Bulgarian pill measured 125.6×36px. [Wording before/after](mobile-sell-secondary-2026-10-06/sell-copy-before-after.png) shows the final composition. Preimages, measurements and the browser log are in `runtime/mobile-sell-copy-20261006/`. The generated session was restored and `next-env.d.ts` stayed unchanged. Existing work was preserved; no commit or publication was performed.
