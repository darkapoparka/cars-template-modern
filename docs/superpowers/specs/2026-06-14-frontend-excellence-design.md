# AutoMarket — Frontend Excellence (public marketplace) Design Spec

**Status:** Approved design, verified against the codebase (5-agent adversarial verification, 2026-06-14).
**Scope:** The public marketplace surface in `apps/web` only. Authenticated app (`apps/app`), real save/lead *persistence*, Dealer Studio, monetization, and a dedicated search engine are explicitly out of scope (later tracks).

## Goal

Make the public marketplace look and behave like a real, flawless, fast mobile.de / cars.bg competitor: matched to the legacy `/lease` visual direction (`docs/frontend-ux.md`), running on real seeded data, fully crawlable/indexable, with the missing discovery surfaces built and the stock next-forge branding removed.

## Verified baseline — what already exists (do NOT rebuild)

The verification corrected several assumptions. The current state is **further along than assumed**:

- **Public read path is real.** `apps/web/app/[locale]/(home)/page.tsx` is an async Server Component that parses `searchParams` (Next 16 async, already awaited) and calls a DB query with a mock fallback, passing `{listings, totalListings, filters}` to the client `MarketplaceShell`.
- **Pagination is fully implemented.** `MarketplaceSearchParams.page` exists (`packages/marketplace/filters.ts:120`), is serialized (`search-params.ts:80-82`), reset to 1 on filter change (`withSearchParamUpdates`), and consumed by the DB layer: `searchMarketplaceListings` does `skip=(page-1)*24, take=24` (`packages/database/marketplace.ts:17,207,214`) and returns a **filtered** `totalListings` count. There is **no** `pageSize` param (page size is the const `LISTING_PAGE_SIZE=24`, not exported).
- **DB query layer is solid:** `searchMarketplaceListings(filters): Promise<{listings, totalListings}>` (status `active` only), `getMarketplaceListingBySlug(slug)`, `getRelatedMarketplaceListings(listing, limit=3)`. Mapper `mapMarketplaceListing` is module-private (`marketplace.ts:146`).
- **The mobile shell is built and on-spec:** `MarketplaceShell` (category selector, search, quick chips, make/model drill-down, full-filter + quick-filter drawers, list/grid, bottom nav, empty state) and `VehicleCard` (image-first, price-first, save button, badges) match `frontend-ux.md`. `MarketplaceShell` already accepts a `basePath` prop (`marketplace-shell.tsx:56,230`).
- **SEO primitives exist:** `createMetadata` (`packages/seo/metadata.ts:32`) and `<JsonLd code>` + re-exported `schema-dts` types (`packages/seo/json-ld.tsx:15,25`). `getRelatedMarketplaceListings` already wired into listing detail.
- **i18n exists:** `next-international` + Languine. `locales` derive from `languine.json` (`en,es,de,zh,fr,pt`). `urlMappingStrategy:"rewriteDefault"` → `en` unprefixed, others `/{locale}`.
- **Route builders exist:** `getListingPath`→`/listing/{slug}` and `buildMarketplaceSearchHref(filters, basePath)` are correct and in active use; `getCategoryPath`→`/cars` etc. and `getDealerPath`→`/dealers/{slug}` exist but target routes that don't exist yet.

## The work is therefore: polish + crawlability + missing surfaces + branding/SEO + real data — NOT a rebuild.

---

## Architecture decisions (verified)

### D1 — Crawlable filtering via progressive enhancement (the core decision)
`MarketplaceShell` is `'use client'` and mutates filters via `router.replace` (`marketplace-shell.tsx:232-243`); chips are `<button>`, so filter *state* is not in crawlable links (the result grid already is — `VehicleCard` uses real `<Link href={/listing/{slug}}>`). 

**Decision:** keep the slick client drawers as islands, but make the **discrete-facet** chips, category selector, and pagination render as real `<Link href={buildMarketplaceSearchHref(withSearchParamUpdates(filters, patch), basePath)}>`; change `commitFilters` from `router.replace` → `router.push` so the RSC re-runs `searchMarketplaceListings`. Range sliders / make-model drawer stay client, but their "Show results" navigates (push) rather than replaces. Result: Google and a JS-off user see real, paginated, filterable pages. *Rejected:* a parallel SSR results list (duplicates filter logic) and full-client SPA (kills SEO).

### D2 — One shared server data helper
The DB-vs-mock gate (`canUseDatabaseListings = Boolean(process.env.DATABASE_URL) && SKIP_ENV_VALIDATION!=='true'`) + try/catch + mock fallback is **duplicated** in `(home)/page.tsx:26-28` and `listing/[slug]/page.tsx:30-32`. Before adding ~8 routes, extract **`apps/web/lib/marketplace-data.ts`** exporting `getMarketplaceListings(filters)`, `getListing(slug)`, `getRelatedListings(listing)`, `getDealerProfile(slug)` — each encapsulating the gate + fallback. **Fix the mock path** so `totalListings` is the *filtered* count and the mock list is paginated (today it returns `mockListings.length`=8 and never paginates).

### D3 — DB-derived taxonomy + slug helpers for make/model routes
The hardcoded `vehicleModelsByMake` is UI-demo-only: not category-aware (Yamaha/Vito missing), keyed by raw display strings with spaces/case, no slug, `trim` is free-text. **Decision:** `/cars/[make]` and `/cars/[make]/[model]` `generateStaticParams` derive from **DB distinct make/model per category**; add `slugifyMake/Model` + `deslug` reverse lookup and `getMakePath/getModelPath` builders in `@repo/marketplace/routes.ts` (none exist). Make/model DB match is case-insensitive `equals` on the human string, so the route resolves slug→human string before querying. **No trim route segments.**

### D4 — Server/client split for crawlable detail
`ListingDetail` is a `'use client'` monolith owning gallery/specs/contact/sticky bar. **Decision:** decompose into `ListingGallery`, `ListingSpecs`, `SellerContactPanel` (client islands for interactivity) and render the **static** content + JSON-LD from the Server page. Reorder the main column to the `frontend-ux.md` sequence (gallery → price → title+meta → contact → specs → description → location → similar). Replace the hardcoded `http://localhost:3100` app-URL fallback (`listing-detail.tsx:52-53`) with an env-driven `appBaseUrl` always passed by the route.

### D5 — New public dealer query (do not reuse studio/feed queries)
No slug-keyed public dealer resolver exists. `getDealerFeedBySlug` hard-gates on `websiteFeedEnabled` and returns a thin shape; `listDealerInventoryRows` returns drafts + private `leadCount`. **Decision:** add `getPublicDealerProfileBySlug(slug): Promise<{dealer: DealerOrgProfile; listings: VehicleListing[]; totalListings: number} | null>` using `dealerOrgSelect` (full profile incl. logo/brand) + active listings via the exported `mapMarketplaceListing` (export it). Uses existing index `[dealerOrgId, status, publishedAt]`.

### D6 — SEO & i18n
- **Branding:** edit `packages/seo/metadata.ts:10-16,59` (applicationName→"AutoMarket", author, publisher, twitterHandle, openGraph.locale) — fixes every title/OG at once; plus `components/header/index.tsx:120-126` and `components/footer.tsx:49-54`. (No "acme" string exists.)
- **Canonical + hreflang:** `createMetadata` merges arbitrary `...properties` via lodash.merge, so pass `alternates:{canonical, languages:{en, bg}}` + per-page `openGraph.locale` through it — no signature change. Build URLs honoring `rewriteDefault` (en unprefixed, bg under `/bg`) via a small shared URL helper.
- **JSON-LD:** new `packages/seo/json-ld-builders.ts` → `buildVehicleJsonLd`, `buildBreadcrumbJsonLd` returning `WithContext<Vehicle|BreadcrumbList>`; render via existing `<JsonLd>` in the server listing/category pages (copy the `blog/[slug]/page.tsx:66-82` pattern).
- **Sitemap:** `sitemap.ts` excludes `(` route groups and only walks top-level app dirs + CMS. Folder routes `/cars` etc. auto-list; dynamic pages don't. Add new DB helpers (`getAllActiveListingSlugs`, `getDistinctMakesModels`, `getActiveDealerSlugs`) and enumerate `/listing/{slug}`, category paths, `/cars/{make}`, `/cars/{make}/{model}`, `/dealers/{slug}`.
- **bg locale:** add `"bg"` to `languine.json` targets + `dictionaries/bg.json` (mirror `en.json`'s `{web:{global,header,home,blog,contact}}` + new marketplace keys). **Blocker fix:** make `apps/web/app/[locale]/layout.tsx` async, `await params`, set `<html lang={locale}>`.

### D7 — Images
Add `{protocol:'https', hostname:'*.public.blob.vercel-storage.com'}` (wildcard subdomain) to `apps/web/next.config.ts` remotePatterns (Vercel Blob is the storage provider). Unsplash already whitelisted, so seed data using Unsplash renders today.

### D8 — Marketplace chrome
The home has **no header/footer**; the existing `components/header`/`footer` are next-forge marketing chrome (branded) used only on blog/legal/contact/pricing. **Decision:** give the public marketplace its own minimal header/footer (or extend `MarketplaceShell`'s sticky header) shared across home + all category/make/model/dealer pages, so chrome is consistent. Delete the unreferenced marketing components `(home)/components/{hero,cases,features,stats,testimonials,cta,faq}.tsx`.

---

## Files (created / modified)

**`@repo/marketplace`** — `routes.ts` (+`getMakePath`,`getModelPath`,`slugifyMake/Model`,`deslug`), reuse `filters.ts`/`format.ts`/`categories.ts` as-is.
**`@repo/database`** — `marketplace.ts` (export `mapMarketplaceListing`, export `LISTING_PAGE_SIZE` or accept `pageSize`; add `getAllActiveListingSlugs`, `getDistinctMakesModels(category?)`, `getActiveDealerSlugs`); new public dealer query `getPublicDealerProfileBySlug` (+ `getDealerListings`); extend `prisma/seed.ts` with a ~200–400 listing generator.
**`@repo/seo`** — `metadata.ts` (rebrand + alternates passthrough verified), new `json-ld-builders.ts`.
**`@repo/internationalization`** — `languine.json` (+bg), `dictionaries/bg.json`.
**`@repo/marketplace-ui`** — extract `listing-gallery.tsx`, `listing-specs.tsx`, `seller-contact-panel.tsx`; new `category-page.tsx`/`dealer-profile.tsx` pieces + `pagination.tsx`; make `MarketplaceShell` chips/pagination crawlable; fix `vehicle-card` save→sign-in; add barrel exports.
**`apps/web`** — new `lib/marketplace-data.ts`; new routes `[locale]/cars`, `cars/[make]`, `cars/[make]/[model]`, `trucks`, `motorbikes`, `vans`, `lease`, `dealers/[slug]`; `listing/[slug]/page.tsx` (JSON-LD + widen `generateStaticParams`); `(home)/page.tsx` (use shared helper); `[locale]/layout.tsx` (async + `lang`); `sitemap.ts`/`robots.ts`; `next.config.ts` (Blob host); delete dead marketing components; `loading.tsx`/`error.tsx`/`not-found.tsx` per route. Rebrand `components/header`,`footer`.

---

## Milestones

- **F0 — Foundation:** auth fix (invisible safety, master-plan M0.1); Prisma seed generator (~200–400 active BG listings); branding rebrand (3 spots); slug helpers + make/model route builders; shared `marketplace-data.ts`; Blob image host. **Accept:** seeded DB browsable; `pnpm check`/`typecheck`/`build` green; no "next-forge/Vercel" in public output.
- **F1 — Crawlable home/search + pagination on real data:** progressive-enhancement filter links; `router.push`; server-rendered numbered + prev/next `<a>` pagination; fix mock `totalListings`. **Accept:** filtered + paginated result pages reachable/indexable without JS; "X of Y" correct in both DB and mock modes.
- **F2 — Category + make + make/model pages:** `/cars`,`/trucks`,`/motorbikes`,`/vans`,`/lease`,`/cars/[make]`,`/cars/[make]/[model]` via shared helper + DB-derived params. **Accept:** documented routes render real DB listings; route builders no longer 404.
- **F3 — Listing detail polish + JSON-LD:** decompose + reorder to spec; Vehicle/Offer/BreadcrumbList JSON-LD from server; env app URL. **Accept:** spec section order; valid Rich-Results JSON-LD; no client-only detail content.
- **F4 — Dealer public profile:** `/dealers/[slug]` via `getPublicDealerProfileBySlug`. **Accept:** profile + active inventory grid render; not gated on `websiteFeedEnabled`.
- **F5 — SEO completion + bg + flawless sweep:** listing/category/dealer sitemap; canonical + hreflang; `bg` locale + `lang` fix; loading/empty/error on every route; a11y + responsive QA at 360/390/768/1440; density vs legacy `/lease`; zero console errors. **Accept:** the `frontend-ux.md` Responsive QA Checklist + PRD Quality Bar pass.

## Dependency
One `DATABASE_URL` (free Neon) for real data. Until set, every route gracefully falls back to mock (dev never breaks); crawlable-pagination QA should be done against the real DB (mock totalListings is fixed but mock is only 8/seed-mirror).

## Risks / gotchas (verified)
Next 16 async `params`/`searchParams` (await everywhere); `rewriteDefault` locale asymmetry for hreflang/links; mock `totalListings` bug; both `MarketplaceShell`/`ListingDetail`/`VehicleCard` are `'use client'` (extract islands, don't server-import wholesale); `relationMode="prisma"` (no DB FKs — seed/delete order matters); formatters hardcode `'en'` (decide bg number/currency localization); no tests exist in `@repo/marketplace` (add a few for slug helpers + the data helper).

## Out of scope (later tracks)
Real save/lead persistence + server actions (Track 1); authenticated-app polish; Dealer Studio 1B/1C; monetization; FTS/`pg_trgm` search engine + DB enums/FK-mode/index hardening (Track 3); full bg translation copy (structure now, copy later).
