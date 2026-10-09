# Discovery van perspective — 6 October 2026

The van retained a shallower side view after the car's frontal perspective correction. Home and Cars now use a more frontal right-facing passenger van, with a broad grille, windshield and both headlights visible, referencing the current car's camera/finish treatment. The complete row was reviewed together at its actual pill size. The van's visible size is about 42 × 23 px beside the car's 43 × 22 px, bike's 30 × 23 px and truck's 33 × 23 px; all share the same tyre baseline.

`packages/marketplace-ui/components/dealer-vehicle-type-pills.tsx` changes only the van URL from `discovery-pill-van-v2.webp` to `discovery-pill-van-v3.webp`. The 44 × 24 px image slots, 36 px pill height, labels, selected/glass treatment, focus styling, category controllers and other three thumbnails remain intact. CSS is unchanged in this pass.

The new van is a silver edit of the existing frontal category van, using the current generated SUV as its reference. Full passenger windows and physical proportions are retained. [Provenance](../provenance/assets/discovery-pill-van-pose-v3/README.md) preserves the original PNG, reference paths and prompt. The 132 × 72 px van WebP is 5,422 bytes; the active four assets total 19,956 bytes. Existing visible-bound cropping, proportional resize and baseline alignment are retained. [Asset manifest](assets/DISCOVERY-PILL-VAN-POSE-2026-10-06.json) records source/output hashes and unchanged companion assets.

| Before — shallower van perspective | After — frontal family treatment |
| --- | --- |
| ![Before](discovery-pill-van-pose-2026-10-06/before-cars-pills.jpg) | ![After](discovery-pill-van-pose-2026-10-06/after-cars-pills.jpg) |

Matched Home comparisons, uncropped desktop/mobile views and the selected white van pill are in [the evidence folder](discovery-pill-van-pose-2026-10-06/).

Verification passed:

- Eight BG/EN Home/Cars views at 1024/1440 px: all four images loaded at 44 × 24 px, with 36 px pills, 12 px between pills, 24 px below search and no overflow.
- Six matched BG Home/Cars pairs at 320/390/1023 px: identical recorded page dimensions/control geometry, hidden desktop images and no overflow. This is layout preservation evidence, not a pixel-identical JPEG claim. [Measurements](discovery-pill-van-pose-2026-10-06/measurements.json) and [verification](discovery-pill-van-pose-2026-10-06/verification.json).
- Home Vans selection remains a draft on `/bg`, with the correct white selected pill and legible artwork. [Behavior](discovery-pill-van-pose-2026-10-06/behavior.json).
- Scoped Biome passed. Refactor contracts passed 7/7; release-preflight contracts passed; release-preflight tests passed 87/87. Source/derivative hashes and scoped `git diff --check` passed.

One Turbopack CSS hot-reload error occurred during the first browser pass. Fresh reloads of Home and Cars subsequently loaded all four thumbnails at the correct size, retained Vans draft selection and had no fresh errors or overflow. [Reload verification](discovery-pill-van-pose-2026-10-06/reload-verification.json) and separately named reloaded captures retain that evidence. The capture helper receives its output folder and record list explicitly; preceding screenshot folders were preserved during this pass.

Task preimages remain under ignored `runtime/discovery-pill-van-pose-20261006/preimages/`. Prior shared source work and original artwork remain intact. No new production build, commit, template release or dealer deployment was performed.
