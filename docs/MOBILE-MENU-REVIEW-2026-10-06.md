# Modern mobile menu review — 6 October 2026

The menu's centered MODERN logo is correctly aligned within the sheet and follows the other mobile headers. Keep the two call/map buttons as the strongest action group. Optional visual polish would make the four navigation entries simpler rows, reduce the social tiles to compact links, and use consistent formal Bulgarian address for the call/map labels. The current composition is readable; these are recommendations rather than applied changes.

## Verified behavior

Manual browser checks used the local preview at `http://127.0.0.1:6482`:

| Locale / viewport | Sheet height | Content scroll height / visible height | Horizontal overflow |
| --- | ---: | ---: | --- |
| BG 390×844 | 613px | 518 / 518px | None |
| BG 320×700 | 633px | 538 / 538px | None |
| BG 320×568 | 556px | 538 / 461px | None |
| BG 844×390 | 378px | 518 / 283px | None |
| EN 320×568 | Inspected | Scrollable | None |

All measured interactive targets were at least 44px high and wide. Call/map actions are 48px high, navigation rows 56px, social tiles 78px, and logo/close/language controls 44px. The logo remains centered at each measured width.

All four secondary links navigated to their expected routes and closed the menu: Services, Cars, Guides and Contact. The country/language link closed the menu and opened its picker; preferences were not saved. Close and Escape returned focus to the menu trigger. Phone, map and social destinations were inspected without activating external actions. No console errors were recorded in the review tab.

## Functional findings before final acceptance

1. Opening the menu by pointer or Enter leaves focus on the menu trigger inside the aria-hidden background. The first Tab enters the sheet. Move focus into the menu when it opens. The menu's `Drawer` currently uses Vaul's default `autoFocus=false`.
2. At 844×390, focus the Facebook link and press End. The content reaches its bottom, but the outer sheet also scrolls by 98px even though its overflow is hidden. The close control moves from y=47px to y=-51px and becomes inaccessible on screen. This reproduced after closing and freshly reopening the menu at the same viewport. Keep scrolling confined to the content body so the header and close control stay visible.

Escape still dismisses the sheet in the second case. The verified short-screen content fit does not imply the keyboard scrolling behavior is ready.

## Evidence and scope

[Reviewed menu](mobile-menu-review-2026-10-06/menu-reviewed-390.jpg), [short-screen view](mobile-menu-review-2026-10-06/menu-bg-320-568.jpg), and [keyboard scroll reproduction](mobile-menu-review-2026-10-06/menu-keyboard-scroll-844-390.jpg). Other original BG/EN captures are in the same folder; measurements and behavior records are in `runtime/mobile-menu-review-20261006/audit.json`.

Relevant source is `packages/marketplace-ui/components/dealer-bottom-nav.tsx`, with the existing shared brand bar and drawer. This was an inspection: no UI source, tests, assets or generated session fixtures were edited. Existing dirty work was preserved. No build, commit, push or publication was performed. The checkout remains `L:/CODEX/cars` on `main`, HEAD `08c89d63f9e11939acd5b135ece4278252b80f43`, and its Modern preview listener was left running on port 6482.
