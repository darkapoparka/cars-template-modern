# Campaign asset brief — approval gate

**Status:** Approval-ready brief; no raster has been generated.

## Job

Create one premium, brand-neutral image system for a compact AutoMarket discovery module about Chinese EVs and hybrids available through verified Bulgarian import paths. The image supports the campaign; it must not imply that AutoMarket represents, is endorsed by, or has partnered with any manufacturer or distributor.

## Creative direction

An editorial automotive-mobility scene at blue hour: a clean contemporary European streetscape or charging forecourt, viewed with restrained cinematic depth. Use abstract reflections, road geometry, charging-light cues, and partial anonymous vehicle forms rather than a recognizable complete vehicle. The mood is confident, technically advanced, calm, and attainable—not futuristic fantasy or luxury-showroom theatre.

The raster contains no words. All headline, disclosure, and CTA copy will remain live HTML in the later integration task.

## Hard exclusions

- No logos, badges, trademarks, model names, flags, maps, national symbols, number plates, dealership signs, or branded charger hardware.
- No recognizable production model, copied light signature, grille, wheel design, body surfacing, press-photo composition, or fake model likeness.
- No people, celebrity likeness, readable screens, tiny generated lettering, or pseudo-writing.
- No claim graphics for price, range, warranty, charging speed, finance, availability, or environmental impact.
- No handshake, ribbon cutting, co-branding, press wall, or other partnership/endorsement cue.
- No visual framing of Chinese vehicles as “cheap,” exotic, or politically nationalized.

## Composition and crop contract

Generate a high-resolution landscape master with a 3:2 working composition and at least 2400 px on the long edge when the generation tool permits. Keep essential visual information inside the central 45% of width and central 60% of height.

Derivatives after approval:

| Asset | Target ratio | Intended use | Crop rule |
| --- | --- | --- | --- |
| Master PNG | 3:2 | Archival source | No upscaling; preserve generation output |
| Desktop WebP | 16:5 | Compact in-results campaign module | Preserve central mobility cue; leave one side calm for live copy |
| Mobile WebP | 4:3 | Compact mobile card | Center crop; no essential element at the outer 20% |

The copy-safe side may be mirrored during integration only if the image still reads naturally and no directional road or charging cue becomes misleading.

## Colour and finish

- Neutral graphite, soft silver, cool off-white, and restrained blue-white illumination.
- Realistic materials and lighting with controlled contrast behind future live text.
- No one-note purple/blue wash, neon cyberpunk treatment, decorative gradient field, oversaturated teal/orange grade, or heavy bloom.
- Avoid pure white clipping and crushed blacks so the asset survives responsive crops and WebP conversion.

## Proposed generation prompt

> Premium editorial automotive mobility scene at blue hour in a clean contemporary European urban charging forecourt, restrained cinematic realism, abstract road geometry and subtle charging-light cues, partial anonymous vehicle forms only with no complete recognizable production car, calm graphite and silver materials, cool off-white architecture, restrained blue-white illumination, sophisticated but attainable, generous negative space on one side for live interface copy, central subject and key lighting protected for both ultra-wide desktop and 4:3 mobile crops, realistic optics and surface detail. No text, pseudo-text, logos, badges, trademarks, model-specific grille or lights, copied vehicle design, flags, maps, number plates, people, dealership signs, branded chargers, partnership imagery, price or range graphics, cyberpunk neon, purple wash, showroom stage, or environmental claim symbols.

## Review checklist

1. Inspect the master at original resolution for pseudo-text, malformed geometry, duplicated objects, artifacts, and accidental trademarks.
2. Compare the image against known visual signatures of the in-scope brands; reject any recognizable model resemblance.
3. Preview the exact 16:5 and 4:3 crops before exporting derivatives.
4. Confirm there is no baked-in text and that future live copy has sufficient contrast with an interface-owned overlay if needed.
5. Confirm the asset communicates modern mobility without asserting origin, official status, stock, warranty, service, finance, or partnership.
6. Record generation date, prompt, tool, dimensions, crop coordinates, output hashes, review status, and usage restrictions in `asset.json`.

## Rights and usage note

Use only the newly generated raster. Do not composite manufacturer media, dealer photos, logos, or third-party stock imagery. Approval of this brief authorizes generation and crop review only; public placement remains owned by the later product-integration task.
