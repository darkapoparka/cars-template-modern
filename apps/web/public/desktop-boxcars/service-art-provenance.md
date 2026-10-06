# Boxcar service artwork

Generated on 2 October 2026 with the built-in imagegen tool. These are decorative service-card illustrations, not inventory photographs. The model version is managed by the tool; no CLI or separate API model was selected.

Auto Best on port 6461 provided the reviewed photographic style and transparent-cutout references. Its source and assets were left intact. All four new outputs belong to Boxcar Updated on port 6455 and are rendered by `src/reference/CuratedServices.svelte`.

## Saved assets

All four runtime WebP files are 720 x 405, quality 90 with alpha quality 100. Transparent exterior padding was cropped to the alpha bounds plus 12 source pixels, then the complete foreground was fitted inside a transparent 720 x 405 canvas. No car body, wheel, key, calculator or coin is intentionally cropped. Originals remain in the generated-images directory.

### browse

Runtime asset: `public/media/services/boxcar-browse-v1.webp`.

Original: `C:/Users/radev/.codex/generated_images/01a0f987-7986-7983-bb45-6c1286ac06ad/exec-cb882285-e58f-481b-b087-532ee5b05e03.png`.

Reference: `templates/auto-best/static/assets/images/lead/day-night-collection-banner-v2.webp` (reviewed locally before generation).

Final prompt:

Create a premium photorealistic automotive marketing cutout for the Browse Cars service card on a car showroom website. Use the attached Auto Best image as a reference for crisp realistic automotive photography, grounded proportions and the compact two-car grouping; do not reproduce its car badges. Recreate two contemporary European vehicles: a pearl-white sporty estate on the left and a deep slate-blue compact SUV on the right, both seen from a gentle front three-quarter view, facing slightly inward, with the same eye-level camera and their wheels on one baseline. The complete vehicles, rooflines, bumpers, mirrors and wheels must fit with 7 percent transparent margin around the coherent grouping. The left car is slightly forward, but neither car obscures the other excessively. Restrained studio softbox highlights, neutral realistic materials, strong clean silhouettes legible at a 240px card width. LANDSCAPE 3:2 canvas. Output true transparent alpha everywhere around the cars, including between them; no opaque background, floor, rectangle, environmental reflection, shadow slab or white halo. A very subtle natural contact shadow directly beneath tyres is acceptable. No people, hands, text, logos, brand badges, lettering, plates with writing, UI, border or frame. This is a marketing illustration, not an inventory listing photo.

### sell

Runtime asset: `public/media/services/boxcar-sell-v1.webp`.

Original: `C:/Users/radev/.codex/generated_images/01a0f987-7986-7983-bb45-6c1286ac06ad/exec-a295d29a-16f5-4f50-b921-93ee6c26e602.png`.

Reference: `templates/auto-best/static/assets/images/template/service-sell-front-v3.webp` (reviewed locally before generation).

Final prompt:

Create a premium photorealistic automotive marketing cutout for a Sell Your Car service card. The attached Auto Best image is a reference for realistic car finish, crisp cutout edges and car-with-key composition; recreate the scene as one pearl-silver contemporary European hatchback in a mild front three-quarter view facing right, with a clearly recognizable black automotive remote key resting in the foreground near the front wheel. The car is the dominant subject; the key is a small meaningful accent with natural proportions. Complete roofline, mirrors, bumpers and wheels, no cropped parts. Same eye-level camera, restrained softbox lighting and commercial photographic realism as a luxury showroom campaign. Compact grouped foreground, 7 percent transparent outer margin, LANDSCAPE 3:2 canvas, fully transparent alpha all around and between objects. No money or coins in this sell illustration; no people, hands, environment, showroom, ground plane, opaque background, photographic rectangle, large reflection, artificial glow, white outline, logo, brand badge, text, writing on the plate, UI, borders or frames. A subtle natural tyre contact shadow only. The complete car silhouette and key must read clearly at a 240px card width. This is decorative service artwork.

### compare

Runtime asset: `public/media/services/boxcar-compare-v1.webp`.

Original: `C:/Users/radev/.codex/generated_images/01a0f987-7986-7983-bb45-6c1286ac06ad/exec-cb57a68b-6db8-4f71-abab-cc7e83531a8e.png`.

Reference: `templates/auto-best/static/assets/images/lead/day-night-collection-banner-v2.webp` (reviewed locally before generation).

Final prompt:

Create a premium photorealistic automotive marketing cutout for a Compare Cars service card. Use the attached Auto Best two-car grouping only as reference for realistic materials and crisp isolated silhouettes. Recreate TWO contemporary European cars standing evenly side by side, separated enough that each entire car can be compared visually: a pearl-white sleek fastback sedan on the left and a graphite-grey compact SUV on the right. Gentle front three-quarter views, same eye-level camera, size and wheel baseline, both facing slightly inward. Restrained natural softbox highlights, realistic windows and tyres, no logos or text. The purpose is two clear different vehicle shapes, not two identical cars. Neither car hides the other, full bodies, mirrors, roofs, bumpers and wheels with 7 percent outer transparent margin. LANDSCAPE 3:2 canvas, true transparent alpha everywhere around and between vehicles, very subtle natural tyre contact shadows only. No backdrop, floor, room, rectangular photo, long reflection, halo, people, paperwork, scales, arrows, UI, floating icons, lettering, readable number plates, borders or frames. Clear silhouette at a 240px card width, restrained premium automotive marketing photography.

### budget

Runtime asset: `public/media/services/boxcar-budget-v1.webp`.

Original: `C:/Users/radev/.codex/generated_images/01a0f987-7986-7983-bb45-6c1286ac06ad/exec-7fffd1ff-fbcf-40a7-9441-4f562c8c5a7f.png`.

Reference: `templates/auto-best/static/assets/images/template/home-action-finance-v3.webp` (reviewed locally before generation).

Final prompt:

Recreate the attached Auto Best financing cutout as premium photorealistic service artwork for Plan Your Budget on a blue-accented car showroom website. Keep its useful arrangement: one white contemporary European sedan in a front three-quarter view facing right, small tidy stacks of neutral gold-and-silver coins in the foreground near the front wheel, and a restrained black calculator partly behind the car on the right. The car remains dominant, the calculator must not tower over the roof or become larger than the car, coins compact and realistic. Use a consistent eye-level automotive camera and restrained natural softbox lighting, sharp realistic materials and complete vehicle body, mirrors, bumpers and wheels. Compact coherent grouping, 7 percent transparent outer margin, LANDSCAPE 3:2 canvas. True transparent alpha everywhere around and between objects, with only very subtle tyre/prop contact shadows; no opaque floor or photo rectangle. Remove brand badges and readable text; calculator buttons may have subtle plain dots but no legible lettering or numeric result. No people, documents, books, paper, finance approval marks, background, environment, fantasy reflections, glow, border, frame or UI. Must remain legible at 240px card width. This is decorative budget-calculator artwork, not actual inventory.

## Card composition

Home 5 card structure, typography and source arrow remain. Four cards sit in one desktop row, two tablet columns and one phone column. Each has a matching large transparent image, live HTML title, short balanced description and its existing working destination. Colours use pale blue and neutral grey; actions use the configured blue accent. The ten original Boxcar reference homes retain their source illustrations and layouts.
