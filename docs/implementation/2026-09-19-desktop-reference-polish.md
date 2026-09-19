# Variant 1 desktop refinement

Parent: ecc0afcad32e2afc2d6e9b7fc022bbf514ddb700. Target remains the first generated reference, generation 62a8fade-89ee-443f-8022-6b7ec1e740a5; no alternative design was generated.

## Changes

- Refined the existing desktop hero, header and search owners. Search labels are 14px, fields are 48px high and the centered search panel scales from 736px to 880px. Global tokens and mobile breakpoints were not changed.
- Restored a higher-detail native-size 1536 x 459 version of the existing scene through the validated artwork configuration; the served WebP is 39,794 bytes. The previous asset remains for URL compatibility. Encoding and source provenance are in provenance/assets/showroom-scene-v2.json. The artwork is decorative, not actual dealer premises or advertised inventory.
- Fixed carousel arrow alignment by resetting Tailwind v4 translate, rather than overriding the unrelated transform property.
- Removed repeated inventory introduction copy. Model/year titles, actual variant/body details and prices now have separate hierarchy. The existing showroom presentation of VehicleCard remains the single card owner.
- Vehicle titles are 16px; facts and supporting text are 12px. Mileage, fuel and transmission wrap without ellipsis instead of becoming hover-only information. The original mobile card title, price and fact policies remain unchanged.
- The category field now uses the selected category label instead of a hardcoded car label. Added four focused tests for the pure showroom title projection; unusual original listing text remains preserved.

## Verification

Evidence and command ledger: .codex-artifacts/desktop-reference-polish-2026-09-19/.

- Production web build and web/e2e type checks passed. Lint, workspace boundaries and six refactor contract tests passed.
- Marketplace UI: 81 tests passed. Public site configuration: 18 tests passed, including custom dealer artwork overrides.
- Responsive browser suite: 23 tests passed. Original mobile screenshots at 320/360/390/430px matched without updating any mobile golden files; 768px landscape and 1023px boundary checks also passed.
- Desktop captures inspected at 1024/1280/1440/1536/1920px and with search suggestions open. New assertions verify input/title/fact readability, complete fact text and aligned carousel controls. Desktop golden updates followed visual review; they are not owner visual acceptance.
- The local production preview returned HTTP 200 and no page errors during the inspected scenarios.

No dependency upgrades, mobile redesign, database/provider writes, customer contact, dealer deployment or release promotion. Existing unpublished commits are preserved; this change is committed locally only.
