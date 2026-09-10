# QA contract — Modern

Passing a build is necessary but not sufficient. A lead variant must also be inspected as a dealership experience.

## Install/run
- Install: `corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/database build`
- Preview: `pnpm --filter web exec next dev -H 127.0.0.1 -p 6462`

## Modern local preview environment
For this repository only, a local static-demo review can use these PowerShell values before starting the web app:
```powershell
$env:SKIP_ENV_VALIDATION='true'
$env:AUTOMARKET_PUBLIC_DATA_MODE='demo'
$env:NEXT_PUBLIC_WEB_URL='http://127.0.0.1:6462'
$env:NEXT_PUBLIC_API_URL='http://127.0.0.1:6466'
$env:NEXT_PUBLIC_APP_URL='http://127.0.0.1:6467'
pnpm --filter web exec next dev -H 127.0.0.1 -p 6462
```
These values are for local review, not hosted production configuration. Do not invent provider credentials.

For Vercel static-demo deployments, the web app derives the deployment HTTPS origin from Vercel-provided metadata and intentionally collapses web/app/api public origins to that one host. This exception is enabled only when `leadSite.staticDemoMode` is true; full production mode still requires distinct real service origins.

## Framework checks
- `pnpm --filter web typecheck`
- `pnpm --filter web build  # with the documented preview environment`

## Browser matrix
Test at **390px** and **1440px**. Minimum route set:
- `/cars`
- `/bg/cars`
- `/bg/listing/bmw-x5-m50d-sofia-2020`
- `/bg/contact`
- `/bg/imports`
- `/bg/sell`
- `/bg/lease`

On the tested routes, exercise navigation, mobile menu/open-close behavior, one search/filter path, one vehicle-detail transition and return path, phone/contact CTA, map/contact link, and the main sell/finance/import/enquiry path that the lead actually offers.

## Visual/content checks
- Correct dealer logo and favicon; no stretched or low-quality placeholder identity.
- No inherited dealer name, phone, address, domain, map, social account, testimonial, watermark or metadata.
- Inventory photos/titles/specs/prices/statuses agree with the sourced fact pack.
- No missing images, broken links, horizontal overflow, clipped controls or unreadable contrast.
- Mobile and desktop preserve the template's intended composition rather than collapsing into a generic rewrite.
- Currency, units, language and finance wording match the dealer's market.

## Runtime truthfulness
Check console/page errors. Forms, chat widgets and calculators may be demo interactions; record that clearly unless real delivery/integration is configured and tested. A localhost 200 response is not a deploy verification.

## Final identity search
Search the full lead copy for: `Day & Night|Day Night|day-night|0877 733 110|Атанас Манчев|kristiankirilov` plus the old domain/social/logo filenames. Provenance/history files can retain source names if clearly historical; active UI/data/metadata cannot.

## Done gate
Do not mark ready until checks pass or each failure is explicitly documented with impact. Report exactly which commands, routes and widths were tested.
