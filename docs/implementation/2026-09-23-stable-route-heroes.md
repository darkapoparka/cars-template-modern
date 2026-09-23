# Stable desktop hero geometry across primary routes

The owner reported different hero heights and shifting banners during navigation. Prior to this change, at 1440px home/inventory were 418px high, import 404px, sell 451px and financing about 453px. The separate loading hero used a 448px rule and different title/panel markup. Sharing only the background and surface component had not made their geometry consistent.

## Shared implementation

DealerDesktopHero now owns one responsive minimum panel height, title row, gap, vertical padding and resulting hero height. DesktopActionPanel consumes that inherited minimum; search keeps its content aligned to the start instead of stretching its grid rows. The background uses the shared baseline height rather than stretching to each route's content.

The dealership loading state now renders DealerDesktopHero and DesktopActionPanel, including the same image. Removed the duplicate loadingHero/loadingTitle/loadingSearch layout from public-desktop-layout.module.css. Inventory category loading already uses the real toolbar and inherits the same geometry.

At 1024px, all five primary routes have a 536px hero and a 400px panel. At 1440px and 1920px, all have a 464px hero and a 328px panel. Header bottom is y=72, heading starts at y=104, and panels start at y=176. Measurements are the same in English and Bulgarian. Optional expanded content can grow naturally; it is not clipped into a fixed-height box. The baseline artwork stays anchored during expansion.

## Verification

- New persistent Playwright coverage compared hero, heading, panel and banner rectangles on home, inventory, sell, financing and import in both locales at 1024/1440/1920px: 30 matching comparisons.
- Animation-frame sampling across client navigation Home → Inventory → Sell → Financing → Import → Home recorded only one hero/panel/banner geometry. Existing category navigation, shared search submission/reset, and financing detail/Back/reload specs also pass: five desktop tests total. Initial navigation-test failures were corrected test selectors (exact sell title and the desktop heading instead of also matching the hidden mobile heading).
- Rendered and inspected English 1440px and Bulgarian 1024px primary routes; checked all five English routes at 390px for overflow. Local screenshots: C:/Users/radev/AppData/Local/Temp/modern-desktop-polish/stable-*.png.
- Existing mobile financing and import draft/country picker tests passed.
- Production build including TypeScript passed using docs/QA.md's static-demo environment. Web unit tests: 185 passed. Marketplace UI unit tests: 82 passed. Scoped Biome and whitespace checks passed.

Work is based on 0780fa6 in the saved main checkout, using its existing port 6462 listener, Node 22.23.2 and pnpm 11.4.0. Preserved unrelated mobile-content-hub/contact changes, earlier ledger edits and unused artifacts. No artwork replacement, dealer deployment or live enquiry is included. The separate default contact-route issue remains outside this change. These are local combined-checkout checks, not exact-commit release evidence or owner visual acceptance.
