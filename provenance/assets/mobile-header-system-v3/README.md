# Modern mobile header system v3

All nine icons were generated together in one image-generation call on 6 October 2026, replacing the preceding mixed source family. The common style is frontal satin silver with graphite side faces and upper-left lighting. All four vehicles face directly forward; book, filters, help and pin are upright, while the call handset has one deliberate 45-degree angle.

`source.png` preserves the complete generated contact sheet. `prompt.txt` is the exact generation prompt. Each delivered WebP comes from its specified cell in that one sheet; no earlier artwork is used in this family.

`prepare-assets.mjs` finds the visible cutouts, excluding tiny isolated specks when calculating the framing bounds. It preserves the separate help dot and all three sliders. Each cutout is trimmed and fitted to a common transparent **112×112 px** canvas, displayed in a **28×28 px** slot. Symbols are centered by their visible alpha bounds. Vehicles share a **24 px wheel baseline** and **22 px height limit**. The category slot has one shared 2 px lift to leave room for the existing chevron. There are no individual CSS size or position overrides.

`manifest.json` records source/output hashes, grid cells, crop rectangles, significant component counts, visible bounds, centers, wheel baselines, transparent corners and byte counts. The preparation checks reject opaque corners and centering/baseline drift greater than 0.25 CSS px. All nine delivery files total **36,778 bytes** and retain four-times display resolution.

Regenerate from the Modern directory with the pinned Node runtime:

    node provenance/assets/mobile-header-system-v3/prepare-assets.mjs

The old PNGs, v2 delivery files and prior generation provenance remain preserved.
