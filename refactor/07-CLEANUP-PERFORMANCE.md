# Cleanup and performance: evidence before deletion

## Removal gate

A file is not dead because the public website does not import it. It may be an authenticated route, webhook, cron entry, migration, dynamic import, Storybook story, package subpath, codegen input or Cars adaptation contract. An unreferenced literal filename is a candidate, not a deletion verdict.

For each candidate record: path, exported/runtime contract, static consumers, dynamic/route/config consumers, package scripts/codegen/Cars consumers, reason to retain/remove, proving tests and rollback commit. Check the exact current source and lockfile. Remove a coherent obsolete owner together with its callers/exports/tests/docs; do not leave compatibility shims without a retirement task.

Do not delete migrations, licenses/provenance, generated declarations, audit logs or retention/security code as a line-count exercise. Do not add a permanent dependency just to produce a one-off dead-code report. A tool such as Knip may be evaluated in a controlled tooling task with explicit Next/workspace/dynamic entry configuration; its report still needs review.

## Concrete candidates and hotspots

| Target | Why inspect | Safe next action |
| --- | --- | --- |
| Desktop global overrides | Header CSS styles cards; hero module overrides global toolbar internals | Move each rule to its owner, then delete the replaced selector |
| `mobile-final-polish.css` | 11 `!important` occurrences and patch-style ownership | Preserve mobile first; fold rules into primitives only with parity evidence |
| `staticDemoMode` call sites | 97 references mix unrelated concerns | Replace using typed site/data/capability projections in bounded batches |
| Marketplace facade exports | Compatibility wrappers may be deliberate | Build consumer map; explicit public entry points before removal |
| Optional integrations/apps | Large inherited product surface | Keep until product decision, usage graph and deployment/Cars contract all permit pruning |
| `inventory-ingestion.ts`, `inventory-imports.ts` | 3,490 and 3,021 lines; several transactional stages | Characterize state transitions, split stage ownership without weakening transactions |
| `scripts/release-preflight.mjs` | 2,339 lines of release rules | Group coherent checks internally; preserve existing contract tests and error messages |
| `basehub-types.d.ts` and fixtures | Large, but generated/data-heavy | Do not treat line count as maintainability proof |
| `header-phone-v2.png`, `header-phone-v3.png`, `leasing-keys-red-v1.webp` | No literal public URL reference in the scan | Check dynamic paths, content and Cars consumption; remove only after proof |

Use targeted dependency checks for `radix-ui: latest`, type/runtime alignment and duplicated direct declarations. Keep meaningful independent app dependencies even if pnpm deduplicates installation. A clean boundary check does not prove minimal JavaScript, and a dependency's presence does not prove it ships to public users.

## Asset pipeline

The scan found 108 public image/font files totaling 54,750,275 bytes, with no byte-identical duplicates. This is repository footprint, not page transfer. `day-night-contact-hero-v1.png` alone is 2,047,605 bytes and is referenced from desktop CSS; CSS background loading does not use Next Image transformation automatically. Other large PNGs may be transformed through Next Image, so measure their actual requests before asserting transfer cost.

Create an asset manifest for semantic roles: primary logo, inverse logo if necessary, favicon, hero cutouts, body-type art, brand artwork, service illustrations and fallback images. Record dimensions, alpha/crop intent, source/provenance and allowed derivative filenames. Keep production derivatives separate from source artwork; retain sources outside public only where provenance/workflow needs them. Prefer suitable WebP/AVIF derivatives for raster assets, retain SVG for appropriate vectors, and preserve quality/transparency. Do not convert everything merely to change an extension.

Measure image variants, `sizes`, decoded dimensions, crop and loading behavior at actual card widths. Decorative desktop hero images must not impose unnecessary mobile requests or priority. CSS hiding and `sizes="... 0px"` are not proof of zero downloads; verify the network. Use one predictable image fallback and reserve aspect-ratio space to avoid shifts. Do not preload every first-row image. Optimize the measured LCP candidate only after identifying it.

## Browser JavaScript and data

Start with a production build/analyzer in an isolated output environment, not the slow/heavy dev graph. Capture route payload, client chunk sizes, hydration work, HTML/RSC payload and interactive readiness. The 135 explicit client directives are a scan metric, not a bundle-size result.

Move static collection selection, copy and non-interactive presentation out of the large client composition where practical. Keep search/URL/drawer/image-error behavior intact. Split data into public view models and bounded search/facet data instead of shipping large unused records. Keep proper filter pagination and counts; do not optimize by silently dropping user-visible results.

Avoid speculative caching and lazy-loading everything. Deferred modules must not break keyboard/focus, loading feedback or first-interaction responsiveness. Use existing return-context and URL policies rather than competing client stores. Profile before adding memoization or a React optimization layer.

## Performance gate

RF-17 must establish production baselines for `/cars`, a filtered inventory page, a listing, a service form and a content page at mobile and desktop widths. Record cold/warm conditions, viewport, device/network assumptions, fixture size, image requests, first-party JS, route payload, LCP/CLS/interaction measurements and raw trace location. Separate lab evidence from real-user measurements.

Initial gate: no unexplained regression against the controlled baseline and an explicit budget for every measured category. Numeric route budgets are **not yet measured or approved** in this audit. Agree them after measurement, then enforce them. Do not invent a Lighthouse score or promise that token cleanup will improve Web Vitals by a specific amount.

Official sources: [Next Image](https://nextjs.org/docs/app/api-reference/components/image), [component boundaries](https://nextjs.org/docs/app/getting-started/server-and-client-components), [Tailwind source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).
