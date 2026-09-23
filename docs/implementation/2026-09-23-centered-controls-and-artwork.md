# Centered inventory controls and revised artwork

Owner correction after a5587ec: keep filter/sort centered. Reusing an older summary component had inadvertently restored its right alignment. This is a forward edit from a5587ec on the saved main checkout, not a repository reset or checkout of an older revision.

- Inventory uses three columns: heading/count on the left, filter/sort centered on the full content width, separate grid/list toggles on the right. Existing shared controls, filter overlay and handlers are retained.
- Financing keeps its compact form and URL-backed preferences. The selected vehicle, price/estimate and call action now share a contained summary row aligned with the selector columns.
- A new generated banner replaces the cropped showroom cars. On wide desktops vehicles sit beside the panel; on narrower desktops the same artwork occupies the heading band so the form does not hide them. Mobile CSS and form behavior are unchanged.

## Asset provenance

Saved asset: apps/web/public/images/desktop/studio-complete-vehicles-v4.png. Generated using the built-in imagegen tool, with no exposed model selector, on 23 September 2026. Original: C:/Users/radev/.codex/generated_images/01a0cee3-8940-7c51-8adf-43f10a4311cd/exec-d8ce069c-d525-4871-b385-75dc9c59e1bf.png. Copied without overwriting previous artwork. Decorative generated imagery is separate from actual inventory photos.

Prompt:

> Create a finished photographic website banner, panoramic 3:1 aspect ratio. Minimal premium automotive studio in near-black charcoal, matte floor and a smooth seamless very dark background. TWO SMALL COMPLETE VEHICLES, fully visible with all wheels and bumpers inside the image: a metallic silver premium sports coupe in the far left 12 percent of the image facing slightly right toward the center, and a graphite premium SUV in the far right 12 percent facing slightly left toward center. Each vehicle has generous empty space around it; neither is cropped. Both appear at a distance, medium-small, not close-ups. Keep the entire central 72 percent completely empty dark charcoal. Position both cars in the upper-middle vertical band, with tires around 55 percent down the image, so a wide white website form placed across the middle-lower center won't cover their bodies. Realistic car photography, subtle studio lighting, precise wheels, understated soft contact shadows. No architecture columns, no plants, no text, logos, UI, labels, frames, fog, neon, colored streaks, wet reflections or gradients into white. Calm, sharp, sophisticated. Absolutely do not crop cars at the edges or zoom in on them. The vehicles together must occupy less than one quarter of the full image width.

## Verification

- Existing desktop category navigation and desktop panel flow specs: 3 passed. Added a geometric assertion that filter/sort stays centered at 1024, 1440 and 1920px.
- 28 rendered route/viewport checks: English inventory, financing, home, sell, imports and Bulgarian inventory/financing at 390, 1024, 1440 and 1920px; no horizontal overflow or page errors.
- Grid/list switching, price sorting and full-filter dialog opening passed through the restored result controls.
- Final production build (including TypeScript), scoped Biome and staged whitespace checks passed. Rebuilt after the final responsive artwork edge treatment.
- Local visual evidence: C:/Users/radev/AppData/Local/Temp/modern-desktop-polish/centered-*.png. Reviewed English desktop and Bulgarian 1024px renders.

Unrelated mobile-content-hub, contact-page, earlier ledger edits and unused assets remain preserved outside this change. The previously reported default contact route error is outside this correction. No dealer deployment, exact-commit release claim or owner visual acceptance is implied.
