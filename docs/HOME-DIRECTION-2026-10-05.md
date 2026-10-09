# Home and Cars design proposal — 5 October 2026

This is a reviewable desktop design proposal. The template application source and its running preview at port 6482 have not been changed by this proposal.

The owner rejected the generated showroom photograph. The active preview now reuses the existing transparent G-Class and Urus profiles from Import. The generated scene and its original captures remain preserved as rejected exploration.

## Recommended direction

- Keep the homepage white. Remove the pale grey rounded stock wrapper and its horizontal inset, so the preview cards align with the banner.
- Retain charcoal primary actions and selected tabs, grey secondary controls, white vehicle cards and the existing card hierarchy.
- Home uses its headline plus one concise supporting line: “Разгледайте наличните автомобили и уговорете оглед.” The search remains its main action. A breadcrumb on the root page adds no context.
- Cars keeps its breadcrumb, title, supporting copy and existing search arrangement.
- Use the existing transparent car profiles on Home and Cars with a light neutral banner and dark copy. Keep the full vehicles at the sides, above the search, with an empty centre for the title. Their natural proportions and original file bytes are retained. The narrow desktop layout omits the decorative cars to protect the copy and controls.

## Assets and preview

The active assets are byte-identical copies of Import's `hero-car-left-profile-v1.webp` and `hero-car-right-profile-v1.webp`. [Cutout provenance](home-direction-2026-10-05/cutout-provenance.json) records their source paths and hashes. Placement and the left vehicle's existing mirror direction are handled by CSS. Nothing was regenerated or repainted.

The rejected generated PNG, its WebP, exact generation prompt and provenance remain preserved in [the evidence directory](home-direction-2026-10-05/).

- [Homepage design preview](http://127.0.0.1:6490/home-proposal.html)
- [Cars banner design preview](http://127.0.0.1:6490/cars-proposal.html)
- [Matched current/cutout captures](home-direction-2026-10-05/current-cutouts.jpg)

The previews reuse the actual rendered header, search controls, vehicle cards, typefaces and CSS from the existing charcoal production build. They are presentation previews; application search and dialog interactions are not connected. The Cars preview covers its header and banner only.

## Verification

Home inspected at 1024, 1280 and 1440 px; Cars at 1024 and 1440 px. Both retain the 320 px banner height. No horizontal overflow was observed, and all visible Home images loaded. Matched captures use 1440 px desktop viewports. Browser overrides were reset after inspection.

Those width checks refer to the initial generated-photo proposal. The cutout revision was inspected and captured at 1440 px on Home and Cars; both reused artwork files load, the 320 px frame remains, and no horizontal overflow was observed. The initial generated-photo images remain historical evidence, not owner acceptance.

No application build, mobile change, dealer deployment, template promotion, commit or push is part of this design proposal.
