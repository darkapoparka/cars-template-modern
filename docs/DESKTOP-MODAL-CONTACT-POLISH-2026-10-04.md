# Desktop modal stability and Contact — 4 October 2026

Opening Cars filters on a browser with a visible scrollbar widened the page by 15 px. The desktop stylesheet disabled the stable root gutter while the locked-body rule also disabled the overlay library's compensation. The page now reserves scrollbar space throughout opening and dismissal, without adding a second body margin.

| Classic-scrollbar page width at 1440 px | Closed | Open | Closed again |
| --- | --- | --- | --- |
| Before | 1425 px | 1440 px | 1425 px |
| After | 1425 px | 1425 px | 1425 px |

The header, banner and inventory controls retain their positions during the opening transition. The browser's `documentElement.clientWidth` can change when the physical scrollbar disappears; the rendered root and body width remain steady. Tests therefore compare rendered geometry.

Contact now has a solid brand-color details pane with white copy, icons and visible link focus. Detail rows use the existing inverse divider token. A small `DealerDesktopLogo` sits above the left heading and moves the form down. The shared grid stretches both columns, with the form action and social buttons aligned at the bottom. The configured identity and brand tokens remain reusable for dealer copies. The form still previews locally and does not simulate sending a message.

## Before and after

Both screenshots use BG, a returning visitor and a 1440 × 1000 viewport with a visible scrollbar. They capture the Contact panel itself; its natural height changes with the new composition.

| Before | After |
| --- | --- |
| [Contact before](assets/modern-modal-contact-20261004/contact-before.png) | [Contact after](assets/modern-modal-contact-20261004/contact-after.png) |

[Verification record](assets/modern-modal-contact-20261004/verification.json).

## Verification

- Node 22.23.2, pnpm 11.4.0; scoped Biome, explicit web typecheck and Next 16.3.8 production webpack build passed.
- Marketplace UI: 95 tests in 20 files. Web: 186 tests in 36 files. Refactor contracts: 7 tests. Release preflight contracts passed; release harness: 87 tests.
- 56 unique Chromium/WebKit browser scenarios qualified against the same output. Both locales' overlay regression covers seven actions at 1024, 1440 and 1920 px, sampling the opening transition and checking dismissal/focus. The regression file prepares its own returning visitor and explicitly keeps Chromium's classic scrollbar visible. A final four-case run on 6482 passed with the custom project's launch options, storage state and global setup removed.
- The initial browser batch passed 50/56. Six Chromium frame checks assumed a hidden scrollbar and expected raw window width. They now assert the available body width and right inset. The affected frame/overlay recheck passed 15/16; its remaining 1440 px Home title assertion was updated to allow the existing responsive clamp's 0.15 px gutter difference, then passed in an isolated run. These runs and traces are retained. No automatic retries or skips; no product source changed between these browser runs.
- Contact columns have identical top positions and heights at 1024, 1280, 1440 and 1920 px, BG/EN in both engines. The compact logo is visible above the heading. Eight Axe WCAG A/AA scans across Contact and focused Make have zero violations. Native Saved preserves geometry and restores focus in both engines and locales. Existing enquiry-preview tests verify no submission request and preserved viewing intent.
- 26 capture states: BG/EN Cars, Contact and Home at 320, 390 and 1023 px, plus Contact at 1024, 1280, 1440 and 1920 px. No horizontal overflow, incomplete visible images or console/page errors.
- Mobile preservation: 17/18 initial comparisons were pixel-identical. BG Contact at 320 px had 22 changed pixels around the rounded logo edge. A settled paired recapture is pixel-identical, as are repeated captures of each build; logo geometry, computed styles and image bytes also match. The initial difference and recapture evidence are preserved, without replacing the original captures.
- Canonical 6482 serves the qualified build on BG/EN Cars and Contact with HTTP 200. Make and full Filters retain width through open/close, restore focus and release scroll lock; Contact keeps equal-height columns and no overflow/browser errors.

## Source and review boundary

Product changes are limited to `apps/web/app/[locale]/desktop.css`, `styles.css`, `contact/page.tsx` and `components/boxcar-desktop-pages.module.css`. The new overlay regression and existing desktop frame suite verify scrollbar behavior. `TEMPLATE.md` and `docs/QA.md` describe the resulting contract.

The production output is `apps/web/.next-public-e2e-modal-contact-polish-20261004-demo`, build ID `7mbKs3C0C-yVctJVienCF`. Four product source hashes were frozen before the final build and checked again before the local cutover. Detailed capture, browser, native-dialog and preservation evidence remains under ignored `runtime/modal-contact-polish-20261004/`.

Previous production outputs, the unrelated hero-correction draft and other Cars work are preserved. This is local reusable-master verification; template promotion, mounted dealer verification and publishing remain separate work.
