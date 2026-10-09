# Modern mobile final pass — 6 October 2026

The main mobile pages now share a quieter masthead and clearer content hierarchy. This is a local update to the reusable Modern master in `L:/CODEX/cars/templates/modern`, on `main` at base HEAD `08c89d63f9e11939acd5b135ece4278252b80f43`.

## Size and hierarchy

- Masthead actions retain a 44 × 44px tap area. Their visible circle is 40px, with 28px artwork for cars, filters, information, location, phone and guides. Bike, van and truck artwork uses 34px to accommodate its transparent margins. The smaller visible circle is independent of the tap area.
- Search/entry fields remain 48px high. Quick pills retain 44px touch areas; text, photos, labels and cards use their existing semantic sizes and content dimensions.
- Leasing's brighter 20% action fill was removed. Home, Cars, Services, Import, Sell, Leasing, About, Contact and Guides now use the configured charcoal for their mobile header.
- Sell exposes its existing localized page title above the manual entry action. VIN and manual entry retain the existing draft, validation, dismissal and contact behavior.
- Leasing shows the supplied monthly estimate prominently, with the full purchase price below it. The original estimate is passed through as `Money`; no payment calculation or offer guarantee was added. A vehicle without an estimate continues to lead with its purchase price. English payment text wraps without clipping at 320px.
- Guides gives the title more horizontal space and displays its complete mobile title. Desktop cards retain their existing style overrides.
- The approved compact Services tiles, short labels, transparent bottom-navigation artwork and exact approved MODERN raster logo remain in place.

44px is a comfortable default for standalone mobile controls, rather than a dimension for all visible content. WCAG's [enhanced target-size criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) uses 44 × 44 CSS pixels; the [AA minimum criterion](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) uses 24 × 24px with specified exceptions and spacing conditions.

## Changed source

- `packages/marketplace-ui/lib/mobile-header-icon-action.ts`
- `packages/marketplace-ui/components/dealer-mobile-header-icon.tsx`
- `apps/web/app/[locale]/components/mobile-dealer-service-hero.tsx`
- `apps/web/app/[locale]/components/mobile-sell-vehicle-hero.tsx`
- `apps/web/app/[locale]/components/mobile-content-hub.tsx`
- `apps/web/app/[locale]/lease/lease-finance-policy.ts`
- `apps/web/app/[locale]/lease/lease-selected-vehicle.tsx`
- `apps/web/app/[locale]/lease/page.tsx`
- `apps/e2e/specs/mobile-chrome.spec.ts`

The masthead regression now finds the semantic brand image instead of a raster element with the old Day & Night name. This checks both the approved MODERN raster mask and ordinary dealer images. The original check timed out on that stale selector; the corrected final run passed.

## Validation

- Biome: all nine changed source/test files passed.
- Web TypeScript: `tsc --noEmit --emitDeclarationOnly false --incremental false` passed.
- Existing Vitest checks: **12 passed** across mobile request readiness, Sell vehicle policy and lease finance policy.
- Existing Chromium/WebKit checks: **38 passed**, including masthead alignment/navigation at 320/360/390/430px and landscape, 320px card/spec readability, complete facts in both locales, Sell contrast/VIN persistence, Import clearing/focus, Guides return state, service help drawers, financing selection and the existing phone handoff.
- CUA: Bulgarian Home, Cars, Services, Import, Sell, Leasing, About, Contact and Guides at **320px and 390px**; English Cars, Services, Import, Sell, Leasing and Guides at 320px, plus Sell/Leasing/Guides at 390px. No horizontal overflow; final payment and article-title checks show no clipping. The English 320px payment clipping found during this pass was corrected and rechecked.
- Fresh mobile Cars reload: no console errors.
- Desktop at 1440px: Cars, Leasing and Sell captures are pixel-identical. Guides retains its desktop geometry and typography; its JPEG captures have small colour differences, with a maximum channel difference of 10. The final cards have matching 391.3 × 244.6px media and 21px headings.
- Production build: passed compilation, TypeScript and page generation with Node 22.23.2 / Next 16.3.8. Build used the existing isolated, provider-free demo mode at `.next-public-e2e-mobile-final-20261006-demo`.
- Scoped `git diff --check`: passed. The build-generated `next-env.d.ts` was retained as evidence and restored to its exact preimage; `tsconfig.json` and the pre-existing mobile test session were preserved.

The final browser selection was:

```text
mobile-chrome.spec.ts
modern-mobile.spec.ts
modern-mobile-completion.spec.ts
modern-mobile-service-help.spec.ts
modern-mobile-architecture.spec.ts

--grep 'mobile header stays aligned|VIN-only continuation|leasing selection survives|article back returns|320px guide cards|320px inventory keeps|mobile cards keep landscape|Sell overlay resolves|all service help drawers share.*(320|390)px|static financing remains dismissible|clearing import link keeps typing focus at 320px'
```

## Evidence and scope

Matched [before/after views](mobile-final-2026-10-06/before-after.jpg), route captures and measurements are in `docs/mobile-final-2026-10-06/`. Task preimages, the final browser log, build log and generated-file evidence are retained in ignored `runtime/mobile-final-20261006/`.

Unrelated shared-checkout changes were preserved. No branch, worktree, commit, push, template promotion or dealer deployment was performed. These results qualify the local mobile update; publication and owner acceptance remain separate actions.
