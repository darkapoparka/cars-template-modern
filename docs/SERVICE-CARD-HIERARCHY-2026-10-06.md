# Service card hierarchy — 6 October 2026

The Services catalogue stacked 16 px of artwork margin below a 168 px image area with another 24 px of copy padding before the title. Home also reserved a tall artwork area and a 24 px title gap. This separated the illustrations from their copy, particularly in the paired-car assets with transparent canvas padding.

Both desktop layouts now use a 144 px artwork area, bottom-positioned contained imagery and a 12 px artwork-area-to-title gap. Titles and descriptions are separated by 8 px; descriptions have at least 16 px before the action. Shorter descriptions can leave extra space to keep the buttons aligned within each grid row. The original artwork, text, typography and destinations are preserved. Catalogue actions remain 40 px high; Home actions remain 48 px high.

| Layout | Previous card height at 1440 px | Current card height | Artwork area to title |
| --- | --- | --- | --- |
| Services catalogue | 394 px | 350 px | 40 → 12 px |
| Home service row | 396 px | 364 px | 24 → 12 px |

The gap figures measure the artwork element, rather than claiming identical spacing from every irregular vehicle silhouette. No source artwork was cropped, regenerated or changed.

| Services before | Services after |
| --- | --- |
| ![Before](service-card-hierarchy-2026-10-06/before-services-cards.jpg) | ![After](service-card-hierarchy-2026-10-06/after-services-cards.jpg) |

| Home before | Home after |
| --- | --- |
| ![Before](service-card-hierarchy-2026-10-06/before-home-cards.jpg) | ![After](service-card-hierarchy-2026-10-06/after-home-cards.jpg) |

Product changes are limited to the existing desktop media rules in:

- `apps/web/app/[locale]/services/services.module.css`: artwork height/margins and alignment, copy padding/gap, paragraph bottom margin.
- `packages/marketplace-ui/components/dealer-desktop-discovery.module.css`: artwork height/title gap/alignment and description margins.

Verification:

- Eight BG/EN Home/Services desktop views at 1024/1440 px passed. All four images load; labels, destinations, typography and action sizes match the baseline. Card height falls by 44 px in the catalogue and 32 px on Home, including the two-column layout. Buttons align within each row; text/actions remain within cards; no horizontal overflow.
- Six matched BG Home/Services pairs at 320/390/1023 px have identical measured page and card geometry/styles. All three Services JPEG pairs are pixel-identical. Home differences are confined to its first inventory photo; the matched views were inspected visually, and mobile service cards remain hidden. No blanket claim of pixel-identical mobile Home captures is made.
- Imports filtering shows the one correct `/bg/imports` card; All restores four. Tab gives the card a visible 2 px focus outline, and Enter opens the correct Imports route. Cards retain one navigation link and no nested interactive controls.
- Scoped Biome passed for both CSS files. Existing refactor contracts passed 7/7. Scoped `git diff --check` passed.

[Measurements](service-card-hierarchy-2026-10-06/measurements.json), [verification](service-card-hierarchy-2026-10-06/verification.json) and [interaction checks](service-card-hierarchy-2026-10-06/behavior.json) retain the local evidence. Native screenshot dimensions are preserved; matched crops use the same rectangle scaled from the logical viewport.

The preview logged Turbopack missing-CSS-link errors while applying hot updates, including one recurrence during navigation. Final fresh reloads of Home and Services loaded all four images, retained the correct card geometry and had no fresh errors or overflow. [Reload verification](service-card-hierarchy-2026-10-06/reload-verification.json) records the exact check window. The first after-capture with the development issue indicator remains preserved alongside the reloaded captures.

Task preimages remain under ignored `runtime/service-card-hierarchy-20261006/preimages/`. Existing dirty work was preserved. No new production build, commit, release or dealer deployment was performed.
