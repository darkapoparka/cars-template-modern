# Mobile PDP leasing photo banner — 6 October 2026

The leasing banner uses a full photographic background, a large centered “Лизинг” title (“Leasing” in English), a short two-line message, and a white “Виж условията” action (“Explore options” in English). The Bulgarian copy reads “Твоят следващ автомобил. На месечни вноски.” It reuses the reviewed silver SUV studio photograph with a dark overlay for contrast. The card is 208px tall and the action is 44px tall. The whole banner remains one accessible link to the selected car's leasing page.

[Matched before/after at 390px](mobile-pdp-finance-marketing-2026-10-06/before-after-390.png) shows the marketing follow-up using actual page captures at the same document coordinates without scaling. Full captures, an in-context screenshot and measurements are stored beside it. The preceding photo-only captures remain in `mobile-pdp-finance-photo-2026-10-06/`.

This follow-up changes only `packages/marketplace-ui/components/listing-finance-card.tsx`. The photograph and selected-vehicle URL retain the preceding callsite and configuration in `packages/marketplace-ui/components/listing-detail-content.tsx` and `packages/marketplace/lead-site.ts`. Other existing changes and prior artwork/provenance are preserved. This revision supersedes the earlier finance card report; the approved showroom layout remains unchanged.

Validation: the focused Biome check and `@repo/marketplace-ui` typecheck passed. Bulgarian was inspected at 320px and 390px, English at 320px, with two-line copy, a 44px action and no horizontal overflow. The card stays hidden at 1440px. Tapping “Виж условията” opened `/bg/lease?vehicle=am-1010` with GLS 400d 4MATIC AMG selected. Keyboard navigation focused the banner. No console errors were recorded after the final page load used for this revision.

The dev server remains available at port 6482. This is local source and browser verification, with no new production build, publication, commit or push. The existing shared `L:/CODEX/cars/.git/index.lock` remains present and untouched.
