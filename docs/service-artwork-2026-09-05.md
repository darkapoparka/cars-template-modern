# Mobile leasing and import artwork

Current placement note: subsequent feedback replaced the leasing banner and import header decoration with a consistent top-right help control on Leasing, Import and Sell. The generated assets remain saved here as design assets; they are no longer displayed in those headers. The current leasing selector opens an overlay, and Sell uses a solid pale blue header.

Generated with the built-in imagegen tool on 2026-09-05. These are decorative service illustrations, not photographs of inventory, premises or a financing provider. All headings and actions remain live HTML. Next Image serves responsive optimized versions.

## Saved assets

- `apps/web/public/images/services/leasing-keys-red-v1.png` — 1536 × 1024, used by the leasing information banner. The mobile header uses solid crimson `#bd001b`.
- `apps/web/public/images/services/import-shipping-yellow-v1.png` — 1536 × 1024, used above the import link field. The mobile header uses warm yellow `#f5c542`.

The original brand mark has no added backing. Following visual feedback, the import headline and subtitle were removed and its illustration moved beside the brand bar; the link field follows directly below. Leasing keeps a compact 64px information banner with its action label and artwork, without a subtitle. The banner opens the existing information drawer. Neither illustration makes availability claims.

## Final generation prompts

### Leasing

Use case: stylized-concept. Create a finished raster illustration for a Bulgarian automotive dealer's mobile leasing banner. Wide landscape 3:2 composition. Solid uniform rich crimson red (#bd001b) background, no gradients or showroom photographs. On the RIGHT THIRD: a beautifully art-directed small sculptural graphite car key fob with a brushed silver key ring, beside a modest ivory calendar tile embossed with a simple percent symbol. Tactile matte 3D editorial illustration, realistic material lighting but clearly illustrative, soft compact contact shadows. Keep the LEFT TWO THIRDS entirely plain crimson for live HTML heading and button copy. Objects stay fully within right third with generous breathing room, no car, no coins, no banknotes, no words, no logo, no watermark, no UI mockup. Sophisticated restrained automotive visual, crisp silhouette readable at 120px wide. This will be cropped to a short wide banner.

### Import

Use case: stylized-concept. Create a finished raster illustration for a mobile automotive import service banner, companion to a refined crimson leasing key illustration. Wide landscape 3:2. Solid warm golden yellow (#f5c542) background. On the RIGHT THIRD a compact art-directed miniature silver car sitting in front of one graphite shipping container, with a subtle curved metallic route arrow behind them. Tactile matte 3D editorial illustration, soft short contact shadows, clean crisp silhouette at small sizes, premium restrained material quality. Keep LEFT TWO THIRDS plain yellow negative space for live HTML text. No scenery, no terminal photograph, no globe, no flags, no ships, no people, no words, no logos, no watermark, no UI. Objects entirely visible with generous margin. This will be used as a short wide mobile banner.

## Verification

Nine rendered states: leasing/import at 320px, 390px and 1440px; leasing full filters, make/model results and information drawer. No axe WCAG A/AA findings, horizontal overflow or page errors in these samples. Exercised mileage, transmission, BMW/X5 selection, combined filters, reset and focus return. Two permanent keyboard regressions and three lease policy tests pass. Physical phone keyboards remain outside this browser-emulation evidence.

Evidence: `artifacts/mobile-final-20260905/service-banners-check.json` and adjacent `*-service-*.png` screenshots. Desktop service imagery is preserved.
