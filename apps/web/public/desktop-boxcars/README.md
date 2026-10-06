# Desktop reference assets

These files are used by Modern's desktop presentation. Mobile keeps its existing artwork and Inter typography.

- `hero.jpg` is copied unchanged from the owner's local Boxcars reference at `templates/boxcar-updated/public/media/banner/bg-7.jpg`. Its original reference provenance and rights remain applicable. SHA-256: `6D4108685B5DAFA77AD33EFF7A196835086692F49D5EF31A5E50558012FDA489`.
- `dm-sans.woff2` is copied unchanged from `templates/boxcar-updated/public/reference/fonts/rP2Hp2ywxg089UriCZOIHQ.woff2`. DM Sans is distributed under the SIL Open Font License 1.1, retained in `OFL.txt`. The authoritative license source is [Google Fonts](https://github.com/google/fonts/blob/main/ofl/dmsans/OFL.txt). SHA-256: `CA72D2BCEA8F4DAA783DBDFA2D9B46068C3CE38168E05918FB867AA453B4F890`.

The desktop font is loaded with `next/font/local` and `preload: false`; the desktop media query selects it. The image is a separate optional `desktopHeroScene` artwork role. Dealer copies with personalized artwork fall back to their own hero unless they explicitly supply this role. This source change does not promote a template release or deploy a dealer.

The finance photograph and four service illustrations are also copied unchanged from the local reference:

- `finance.jpg`: `templates/boxcar-updated/public/media/resource/loan-img.jpg`; SHA-256 `e732f00ca990f10fa72fbb553dadb66056324c21ba43be98bd2b56070ce67b8f`.
- `service-browse.webp`: `templates/boxcar-updated/public/media/services/boxcar-browse-v1.webp`; SHA-256 `86eb4da0d3a26bc5a6b2cbaa486c1771f1792dae63e6dd31cadd02667fdcccae`.
- `service-sell.webp`: `templates/boxcar-updated/public/media/services/boxcar-sell-v1.webp`; SHA-256 `15fdd070272fe07c63e1235fc52b1091bb1cc106003d9954c414cf30076c55c5`.
- `service-finance.webp`: `templates/boxcar-updated/public/media/services/boxcar-budget-v1.webp`; SHA-256 `45265b95baed9abfa0082387c4828989c33149c88bc0777428fb55b93e60bb27`.
- `service-imports.webp`: `templates/boxcar-updated/public/media/services/boxcar-compare-v1.webp`; SHA-256 `09f4d8c44d25ac564f2595c50fa706f5d02eb0a4590940124a4f2baacbc87388`.

The service images are decorative generated illustrations. Their original prompts and source references are retained in [service-art-provenance.md](service-art-provenance.md). The compare illustration is used decoratively for the real import service; Modern does not advertise a comparison feature. Desktop finance falls back to personalized dealer finance artwork. The service image roles can be overridden together in `lead-site.ts`. Mobile image roles are unchanged.

The 3 October desktop port also copies the viewing photograph, three journal photographs, five illustrative About photographs, four About icons and the two page-banner cutouts from this same local reference. [The asset receipt](desktop-port-20261003.provenance.json) records all 15 source paths, byte sizes and SHA-256 hashes; each copy is byte-identical. The generated banner cutouts retain [their original provenance](page-banner-art-provenance.md). These assets are used only in the desktop presentation at 1024 px and above. Illustrative showroom photographs do not establish the dealer's actual premises or staff. Existing reference ownership and licenses continue to apply.
