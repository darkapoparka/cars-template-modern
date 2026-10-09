# Discovery car perspective — 6 October 2026

The car shared the other pills' image-box coordinates and tyre baseline, but its long side projection made its viewpoint look inconsistent with the more frontal bike/truck artwork. Home and Cars now use a revised right-facing SUV with a broader visible grille, both headlights and a more foreshortened side. Its visible size is about 43 × 22 px instead of 43 × 19 px, within the same 44 × 24 px slot.

`packages/marketplace-ui/components/dealer-vehicle-type-pills.tsx` changes only the car URL from `discovery-pill-car-v3.webp` to `discovery-pill-car-v4.webp`. CSS, pill geometry, category labels, controllers and the other three thumbnails remain intact. The car retains the established visible-bound crop, proportional resize and common tyre baseline.

The revised source is a generated silver edit of the existing frontal SUV category asset, using the silver truck as the finish and perspective reference. Its original PNG and prompt are retained in [provenance](../provenance/assets/discovery-pill-car-pose-v4/README.md). The 132 × 72 px car WebP is 4,992 bytes; the active four thumbnails total 19,182 bytes. [Asset manifest](assets/DISCOVERY-PILL-CAR-POSE-2026-10-06.json) records hashes, dimensions and unchanged companion assets.

| Before — long side projection | After — broader front perspective |
| --- | --- |
| ![Before](discovery-pill-car-pose-2026-10-06/before-cars-pills.jpg) | ![After](discovery-pill-car-pose-2026-10-06/after-cars-pills.jpg) |

Matched Home comparisons, uncropped views and the inactive glass car pill are in [the evidence folder](discovery-pill-car-pose-2026-10-06/).

Verification passed:

- Eight BG/EN Home/Cars desktop views at 1024/1440 px: all thumbnails loaded at 44 × 24 px, with 36 px pill height, 12 px row gaps, 24 px below search and no overflow.
- Six matched BG Home/Cars pairs at 320/390/1023 px: identical recorded page dimensions and control geometry, hidden desktop thumbnails and no overflow. This is layout preservation evidence, not a pixel-identical JPEG claim. [Measurements](discovery-pill-car-pose-2026-10-06/measurements.json) and [verification](discovery-pill-car-pose-2026-10-06/verification.json).
- Home Motorbikes selection remains a draft on `/bg`; the revised car remains legible in its inactive glass pill. No fresh browser errors appeared. [Behavior](discovery-pill-car-pose-2026-10-06/behavior.json).
- Scoped Biome passed. Refactor contracts passed 7/7; release-preflight contracts passed; release-preflight tests passed 87/87. Source/derivative hashes and scoped `git diff --check` passed.

Capture limitation: a reused browser helper initially wrote these raw captures into the preceding scale-pass folder. Their actual before/after version records were recovered and copied into the correct folder before verification. The scale pass's cropped comparisons and measurements remain intact, but its original uncropped screenshots were overwritten; that older report and folder now contain explicit history notes.

Task source/doc preimages remain under ignored `runtime/discovery-pill-car-pose-20261006/preimages/`. Prior shared source work and source artwork remain intact. No new production build, commit, template release or dealer deployment was performed.
