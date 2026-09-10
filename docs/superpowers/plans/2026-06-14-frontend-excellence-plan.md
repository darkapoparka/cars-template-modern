# Frontend Excellence (public marketplace) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `apps/web` public marketplace flawless, crawlable, and real-data-backed, matched to the legacy `/lease` direction — without rebuilding the already-good shell/cards.

**Architecture:** Progressive-enhancement crawlable filtering (server-rendered results + real `<a href>` filter/pagination links; client drawers as islands). One shared `marketplace-data` helper for the DB-gate + mock fallback. DB-derived make/model taxonomy with slug helpers. Server-rendered listing/category/dealer pages with JSON-LD; client islands only for interactivity.

**Tech Stack:** Next 16 App Router (RSC, async params/searchParams) · Prisma+Postgres · `@repo/marketplace` (domain) · `@repo/marketplace-ui` (UI) · `@repo/seo` (`createMetadata`,`JsonLd`) · `next-international`+Languine (i18n, `rewriteDefault`) · Tailwind+shadcn.

**Spec:** `docs/superpowers/specs/2026-06-14-frontend-excellence-design.md` (verified 2026-06-14). Read it first.

**Granularity note:** F0 and F1 are decomposed to executable steps with real code. F2–F5 are task+files+acceptance level and get expanded to bite-sized steps at the start of each milestone (they build on F0/F1 artifacts — the `marketplace-data` helper, slug builders, exported `mapMarketplaceListing`, `LISTING_PAGE_SIZE` — so detailing their exact code now would be guesswork). **Branch:** `track-frontend-excellence`.

---

# F0 — Foundation

## Task F0.1: Auth gate (invisible safety prerequisite)
**Files:** as in master plan M0.1.
- [ ] Execute **M0.1** from `docs/superpowers/plans/2026-06-14-automarket-prototype-to-mvp.md` (complete code there: `AuthProvider` to root layout, async `(authenticated)` gate, admin `layout.tsx`, middleware `auth.protect()`).
- [ ] Verify: `pnpm --filter app build` clean; signed-out → sign-in on `(authenticated)` routes.
- [ ] Commit: `fix(app): enforce auth gate (frontend track prerequisite)`.

**Acceptance:** auth enforced; no pixels changed in `apps/web`.

## Task F0.2: Seed ~300 real Bulgarian-market listings
**Files:** Modify `packages/database/prisma/seed.ts`; Create `packages/database/prisma/seed-data.ts`.

- [ ] **Step 1: Add a deterministic generator** that produces valid `VehicleListing`-shaped rows using canonical enum arrays from `@repo/marketplace` (so values are always valid). `packages/database/prisma/seed-data.ts`:
```ts
import {
  bodyTypes, fuelTypes, transmissionTypes, vehicleMakes,
  vehicleModelsByMake, type VehicleListing,
} from "@repo/marketplace";

const CITIES = [
  ["Sofia", "Sofia-grad"], ["Plovdiv", "Plovdiv"], ["Varna", "Varna"],
  ["Burgas", "Burgas"], ["Ruse", "Ruse"], ["Stara Zagora", "Stara Zagora"],
  ["Pleven", "Pleven"], ["Sliven", "Sliven"],
] as const;
const PHOTOS = [ // Unsplash hosts are already whitelisted in next.config
  "https://images.unsplash.com/photo-1502877338535-766e1452684a",
  "https://images.unsplash.com/photo-1542362567-b07e54358753",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8",
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
];
const pick = <T,>(arr: readonly T[], i: number): T => arr[i % arr.length];

export const generateSeedListings = (count: number): VehicleListing[] =>
  Array.from({ length: count }, (_, i) => {
    const make = pick(vehicleMakes, i);
    const models = vehicleModelsByMake[make as keyof typeof vehicleModelsByMake] ?? ["Base"];
    const model = pick(models, i);
    const [city, region] = pick(CITIES, i);
    const year = 2008 + (i % 17);
    const price = 5_000 + ((i * 1373) % 80_000);
    const isDealer = i % 3 !== 0;
    return {
      id: `seed-${i + 1}`,
      slug: `${make}-${model}-${year}-${i + 1}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      category: "car",
      status: "active",
      title: `${make} ${model} ${year}`,
      description: `${year} ${make} ${model} in ${city}. Well maintained, full service history.`,
      price: { amount: price, currency: i % 4 === 0 ? "EUR" : "BGN" },
      priceType: "fixed",
      badges: i % 5 === 0 ? ["certified"] : [],
      spec: {
        make, model, year,
        bodyType: pick(bodyTypes, i), fuelType: pick(fuelTypes, i),
        transmission: pick(transmissionTypes, i),
        mileageValue: 20_000 + ((i * 7919) % 230_000), mileageUnit: "km",
      },
      location: { city, region, country: "Bulgaria" },
      images: [{ url: pick(PHOTOS, i), alt: `${make} ${model} ${year}` }],
      seller: {
        id: isDealer ? `dealer-${(i % 5) + 1}` : `private-${i}`,
        type: isDealer ? "dealer" : "private",
        displayName: isDealer ? "AutoMarket Dealer" : "Private seller",
        verificationStatus: isDealer ? "verified" : "pending",
        city,
      },
      promoted: i % 11 === 0,
      publishedAt: new Date(2026, 0, 1 + (i % 150)).toISOString(),
    } satisfies VehicleListing;
  });
```
> Map the `seller.id` (`dealer-1`..`dealer-5`) to the 5 demo `DealerOrg` ids using the existing `dealerOrgIdBySellerId` map pattern (`seed.ts:81-83`) — extend that map so dealer-1..5 → the seeded org ids.

- [ ] **Step 2: Feed generated rows through the existing upsert loop.** In `seed.ts`, replace the `mockListings` iteration source (`seed.ts:137-138`) with `const listingsToSeed = [...mockListings, ...generateSeedListings(300)];` and iterate that; reuse the existing create + image-create blocks (`seed.ts:141-232`) unchanged.

- [ ] **Step 3: Run the seed** (requires `DATABASE_URL`).
Run: `pnpm --filter @repo/database exec prisma db seed`
Expected: ~308 `MarketplaceListing` rows, status `active`, linked dealer subset.

- [ ] **Step 4: Verify count.** Run: `pnpm --filter @repo/database exec prisma studio` (or a count query) → ≥300 active listings across cities/makes.
- [ ] Commit: `feat(database): seed ~300 active Bulgarian-market listings`.

**Acceptance:** A non-trivial, browsable dataset exists; listings have valid enum values, BGN/EUR mix, dealer + private sellers, real image URLs, non-null `publishedAt`.

## Task F0.3: Rebrand (remove next-forge / Vercel)
**Files:** Modify `packages/seo/metadata.ts:10-16,59`; `apps/web/app/[locale]/components/header/index.tsx:120-126`; `apps/web/app/[locale]/components/footer.tsx:49-54`.
- [ ] In `metadata.ts` set `applicationName = "AutoMarket"`, `author = { name: "AutoMarket", url: env.NEXT_PUBLIC_WEB_URL }`, `publisher = "AutoMarket"`, `twitterHandle = "@automarket"`, and `openGraph.locale` default driven by page (keep `"en_US"` fallback). This fixes every page `<title>`/OG at once.
- [ ] Replace the Vercel triangle SVG + `next-forge` text in `header/index.tsx:120-126` with an AutoMarket wordmark; replace `footer.tsx:49-54` `next-forge` heading + tagline.
- [ ] Verify: `pnpm dlx serve`-free check — `pnpm --filter web build` then grep built output / view source shows `| AutoMarket` titles and no "next-forge"/"Vercel" in `apps/web` public pages.
- [ ] Commit: `feat(web): rebrand public marketplace to AutoMarket`.

**Acceptance:** No "next-forge"/"Vercel" strings in public marketplace output; titles end `| AutoMarket`.

## Task F0.4: Slug helpers + make/model route builders
**Files:** Modify `packages/marketplace/routes.ts`; Create `packages/marketplace/routes.test.ts`.
- [ ] **Step 1 (TDD): failing test** `packages/marketplace/routes.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { deslugMakeModel, getMakePath, getModelPath, slugifyMakeModel } from "./routes";

describe("make/model slugs", () => {
  it("slugifies display strings", () => {
    expect(slugifyMakeModel("BMW")).toBe("bmw");
    expect(slugifyMakeModel("1 Series")).toBe("1-series");
    expect(slugifyMakeModel("e-tron")).toBe("e-tron");
  });
  it("builds paths", () => {
    expect(getMakePath("BMW")).toBe("/cars/bmw");
    expect(getModelPath("BMW", "1 Series")).toBe("/cars/bmw/1-series");
  });
  it("deslug resolves against known values (case-insensitive, space/hyphen-insensitive)", () => {
    expect(deslugMakeModel("1-series", ["1 Series", "3 Series"])).toBe("1 Series");
    expect(deslugMakeModel("unknown", ["A4"])).toBeUndefined();
  });
});
```
- [ ] **Step 2:** Run `pnpm --filter @repo/marketplace exec vitest run routes.test.ts` → FAIL (functions undefined).
- [ ] **Step 3: implement** in `routes.ts`:
```ts
export const slugifyMakeModel = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const getMakePath = (make: string): string => `/cars/${slugifyMakeModel(make)}`;
export const getModelPath = (make: string, model: string): string =>
  `/cars/${slugifyMakeModel(make)}/${slugifyMakeModel(model)}`;

// Resolve a URL slug back to the canonical DB display string from a known set.
export const deslugMakeModel = (
  slug: string,
  candidates: readonly string[]
): string | undefined =>
  candidates.find((value) => slugifyMakeModel(value) === slug);
```
- [ ] **Step 4:** Run the test → PASS.
- [ ] Commit: `feat(marketplace): add make/model slug helpers and route builders`.

**Acceptance:** slug helpers + builders exist and are tested; `/cars/[make]/[model]` routes (F2) can map slug↔DB string.

## Task F0.5: Shared `marketplace-data` helper (+ fix mock totalListings)
**Files:** Create `apps/web/lib/marketplace-data.ts`; export `mapMarketplaceListing` + `LISTING_PAGE_SIZE` from `packages/database/marketplace.ts`; Modify `apps/web/app/[locale]/(home)/page.tsx` and `listing/[slug]/page.tsx` to use the helper; Modify `packages/marketplace/mock-data.ts` `getMockListings` to paginate + return filtered total.
- [ ] **Step 1:** In `packages/database/marketplace.ts` add `export` to `mapMarketplaceListing` (line 146) and `export const LISTING_PAGE_SIZE = 24;` (already line 17 — just export it).
- [ ] **Step 2:** Fix the mock path to mirror DB semantics. In `packages/marketplace/mock-data.ts`, make `getMockListings(filters)` apply the filters, then return `{ listings: filtered.slice(skip, skip + 24), totalListings: filtered.length }` where `skip=(filters.page-1)*24` (match `LISTING_PAGE_SIZE`). (Change its return type to `{listings; totalListings}` to match the DB shape.)
- [ ] **Step 3:** Create `apps/web/lib/marketplace-data.ts`:
```ts
import "server-only";
import {
  getMarketplaceListingBySlug, getRelatedMarketplaceListings,
  searchMarketplaceListings,
} from "@repo/database/marketplace";
import {
  getMockListingBySlug, getMockListings, getMockRelatedListings,
  type MarketplaceSearchParams, type VehicleListing,
} from "@repo/marketplace";

const canUseDatabase = (): boolean =>
  Boolean(process.env.DATABASE_URL) && process.env.SKIP_ENV_VALIDATION !== "true";

export const getMarketplaceListings = async (
  filters: MarketplaceSearchParams
): Promise<{ listings: VehicleListing[]; totalListings: number }> => {
  if (!canUseDatabase()) return getMockListings(filters);
  try {
    return await searchMarketplaceListings(filters);
  } catch {
    return getMockListings(filters);
  }
};

export const getListing = async (slug: string): Promise<VehicleListing | null> => {
  if (!canUseDatabase()) return getMockListingBySlug(slug) ?? null;
  try {
    return await getMarketplaceListingBySlug(slug);
  } catch {
    return getMockListingBySlug(slug) ?? null;
  }
};

export const getRelatedListings = async (
  listing: VehicleListing
): Promise<VehicleListing[]> => {
  if (!canUseDatabase()) return getMockRelatedListings(listing);
  try {
    return await getRelatedMarketplaceListings(listing);
  } catch {
    return getMockRelatedListings(listing);
  }
};
```
- [ ] **Step 4:** Replace the duplicated gate/fallback in `(home)/page.tsx:26-54` and `listing/[slug]/page.tsx:30-50` with calls to the helper.
- [ ] **Step 5:** Verify: `pnpm --filter web typecheck` clean; home shows correct "X of Y" in BOTH mock (no `DATABASE_URL`) and DB modes.
- [ ] Commit: `refactor(web): shared marketplace data helper + correct mock pagination/total`.

**Acceptance:** Single gate; `totalListings` is the filtered count in both modes; new routes reuse the helper.

## Task F0.6: Allow the dealer photo host for next/image
**Files:** Modify `apps/web/next.config.ts:11-21`.
- [ ] Add to the app-level `images.remotePatterns` array: `{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }`.
- [ ] Verify: `pnpm --filter web build` clean.
- [ ] Commit: `chore(web): allow Vercel Blob image host`.

**Acceptance:** Dealer-uploaded photos (Vercel Blob) render via next/image without errors.

## Task F0.7: Remove dead next-forge marketing components
**Files:** Delete `apps/web/app/[locale]/(home)/components/{hero,cases,features,stats,testimonials,cta,faq}.tsx` (verified unreferenced).
- [ ] `git rm` the seven files; run `pnpm --filter web build` to confirm nothing imported them.
- [ ] Commit: `chore(web): remove unused next-forge marketing components`.

**Acceptance:** Build clean; no stock marketing scaffolding remains in `(home)`.

**F0 gate:** `pnpm check && pnpm boundaries && pnpm typecheck && pnpm --filter web build` all green; seeded DB browsable; branding gone.

---

# F1 — Crawlable home/search + pagination on real data

## Task F1.1: Server-rendered pagination component
**Files:** Create `packages/marketplace-ui/components/marketplace-pagination.tsx`; add barrel export in `packages/marketplace-ui/index.ts`.
- [ ] Build a Server-Component-safe (no `'use client'`) pagination that renders numbered + prev/next real `<a>`/`<Link>` using `buildMarketplaceSearchHref({ ...filters, page }, basePath)` and `LISTING_PAGE_SIZE` to compute `totalPages = Math.ceil(totalListings / LISTING_PAGE_SIZE)`. Props: `{ filters: MarketplaceSearchParams; totalListings: number; basePath?: string }`. Emit `rel="prev"`/`rel="next"` on the prev/next anchors. Render nothing when `totalPages <= 1`.
- [ ] Add `export * from "./components/marketplace-pagination";` to the barrel.
- [ ] Verify: `pnpm --filter @repo/marketplace-ui typecheck` clean.
- [ ] Commit: `feat(marketplace-ui): crawlable pagination component`.

**Acceptance:** Pagination renders real anchors honoring the existing `page` param; correct page count vs `LISTING_PAGE_SIZE`.

## Task F1.2: Make MarketplaceShell filters crawlable (progressive enhancement)
**Files:** Modify `packages/marketplace-ui/components/marketplace-shell.tsx`.
- [ ] **Step 1:** Change `commitFilters` (`:232-243`) from `router.replace` to `router.push(href, { scroll: false })` where `href = buildMarketplaceSearchHref(next, currentPath)` — so the RSC re-runs `searchMarketplaceListings` and pagination/SEO see real navigations.
- [ ] **Step 2:** Render the discrete quick-filter **chips** (`:313-341`) and the **category selector** as real `<Link href={buildMarketplaceSearchHref(withSearchParamUpdates(filters, patch), currentPath)}>` (keep the drawer-open buttons for range/make-model). Keep `event` handling so drawers still open for the complex facets; discrete toggles navigate.
- [ ] **Step 3:** Mount `<MarketplacePagination filters={filters} totalListings={totalListings} basePath={currentPath} />` after the results grid.
- [ ] **Step 4:** Verify: `pnpm --filter @repo/marketplace-ui typecheck`; manual — with JS disabled, clicking a category/fuel link still navigates and re-renders results server-side.
- [ ] Commit: `feat(marketplace-ui): crawlable filter links + pagination in shell`.

**Acceptance:** Filter state is reachable via real URLs/links; result grid + pagination are server-rendered; drawers remain as client islands for ranges/make-model.

## Task F1.3: Wire the home page + verify crawlability end-to-end
**Files:** Modify `apps/web/app/[locale]/(home)/page.tsx` (already on the shared helper from F0.5).
- [ ] Confirm the page passes `filters` + `totalListings` to `MarketplaceShell` and that `basePath="/"`.
- [ ] Verify (real DB): run `pnpm --filter web dev` (port 3001), then `curl -s 'http://localhost:3001/?fuel=diesel&page=2'` → response HTML contains listing `<a href="/listing/...">` links and pagination anchors (crawlable without JS); "X of Y" reflects the filtered total.
- [ ] Commit: `feat(web): crawlable server-rendered marketplace home`.

**Acceptance:** `curl` (no JS) of a filtered+paginated URL returns real listing + pagination links; totals correct.

**F1 gate:** filtered/paginated pages crawlable without JS; gates green.

---

# F2 — Category + make + make/model pages
**Expand to bite-sized at milestone start.** Build `apps/web/app/[locale]/{cars,trucks,motorbikes,vans,lease}/page.tsx` (+ `[make]`, `[make]/[model]` under `cars`). Each: async RSC, `await params`/`searchParams`, merge `{ ...searchParams, category }` (and `make`/`model` resolved via `deslugMakeModel` against DB-distinct values), call `getMarketplaceListings`, render `MarketplaceShell` with `basePath=getCategoryPath(category)` + the pagination. `generateStaticParams` for `[make]`/`[make]/[model]` from a new DB helper `getDistinctMakesModels(category)`. `generateMetadata` per page (title/desc/canonical). Add `loading.tsx`/`error.tsx`/`not-found.tsx`.
**Files:** new route folders; `@repo/database/marketplace.ts` `getDistinctMakesModels`; reuse `getMarketplaceListings`, `getCategoryPath`, slug helpers.
**Acceptance:** all documented routes render real DB listings + crawlable pagination; route builders no longer point at 404s; `/cars/bmw` and `/cars/bmw/3-series` resolve to the right DB filter.

# F3 — Listing detail polish + JSON-LD
**Expand at start.** Decompose `listing-detail.tsx` into `ListingGallery`, `ListingSpecs`, `SellerContactPanel` (client islands); reorder main column to spec sequence (gallery→price→title+meta→contact→specs→description→location→similar); replace the `localhost:3100` fallback with `appBaseUrl` passed from the route (`env.NEXT_PUBLIC_APP_URL`). Add `packages/seo/json-ld-builders.ts` (`buildVehicleJsonLd`, `buildBreadcrumbJsonLd`) and render `<JsonLd>` from the **server** `listing/[slug]/page.tsx` (copy `blog/[slug]/page.tsx:66-82`). Widen `generateStaticParams` to DB slugs (new `getAllActiveListingSlugs`) + add canonical.
**Files:** `packages/marketplace-ui/components/{listing-detail,listing-gallery,listing-specs,seller-contact-panel}.tsx` + barrel; `packages/seo/json-ld-builders.ts`; `apps/web/.../listing/[slug]/page.tsx`.
**Acceptance:** spec section order; valid Vehicle/Offer/BreadcrumbList JSON-LD (Google Rich Results); static detail content in initial HTML; app links resolve in prod.

# F4 — Dealer public profile
**Expand at start.** Add `getPublicDealerProfileBySlug(slug)` in `@repo/database` (use `dealerOrgSelect` full profile + active listings via exported `mapMarketplaceListing`; **not** gated on `websiteFeedEnabled`). Build `apps/web/app/[locale]/dealers/[slug]/page.tsx` (RSC): header (logo/name/location/verification), active inventory grid (reuse `VehicleCard`), pagination, `generateMetadata` + canonical + JSON-LD (`AutoDealer`/`Organization`). `generateStaticParams` from `getActiveDealerSlugs`.
**Files:** `@repo/database` new public dealer query; `apps/web/.../dealers/[slug]/page.tsx` + states.
**Acceptance:** dealer profile + active inventory render from DB; verified badge shown; `getDealerPath` links resolve.

# F5 — SEO completion + bg locale + flawless sweep
**Expand at start.**
- **Sitemap:** extend `apps/web/.../sitemap.ts` with `/listing/{slug}`, category paths, `/cars/{make}` + `/cars/{make}/{model}`, `/dealers/{slug}` (new DB helpers); honor `rewriteDefault` locale prefixing.
- **Canonical + hreflang:** thread `alternates:{canonical, languages:{en, bg}}` + per-page `openGraph.locale` through `createMetadata` (via a shared URL helper).
- **bg locale:** add `"bg"` to `languine.json` targets + `dictionaries/bg.json`; make `apps/web/app/[locale]/layout.tsx` async, `await params`, `<html lang={locale}>`. Decide bg number/currency localization in `format.ts` (parameterize locale) — at least for prices.
- **Chrome:** add `MarketplaceHeader`/`MarketplaceFooter` (AutoMarket-branded) wrapping all public routes; ensure consistent across home/category/make/model/dealer/listing.
- **Flawless sweep:** `loading.tsx`/`error.tsx`/`not-found.tsx` on every reachable route; a11y (icon labels, focus-trapped drawers, ≥40px targets, image alt, selected-state not color-only); responsive QA at 360/390/768/1440; density vs legacy `/lease`; zero console errors; Lighthouse/CWV pass on a seeded listing + category page.
**Acceptance:** `frontend-ux.md` Responsive QA Checklist + PRD Quality Bar pass; sitemap includes all surfaces; canonical/hreflang correct under `rewriteDefault`; bg routes resolve with correct `lang`.

---

## Self-review notes
- **Spec coverage:** D1→F1; D2→F0.5; D3→F0.4+F2; D4→F3; D5→F4; D6→F3/F5; D7→F0.6; D8→F5. Every spec decision has a task.
- **Placeholders:** F0/F1 carry real code/commands. F2–F5 are deliberately task-level (see granularity note) — they reference only symbols defined in F0/F1 (`getMarketplaceListings`, `LISTING_PAGE_SIZE`, `mapMarketplaceListing`, `slugifyMakeModel`/`deslugMakeModel`/`getMakePath`/`getModelPath`, `MarketplacePagination`) or existing verified exports.
- **Type/name consistency:** helper names (`getMarketplaceListings`/`getListing`/`getRelatedListings`/`getDealerProfile`), DB additions (`getDistinctMakesModels`/`getAllActiveListingSlugs`/`getActiveDealerSlugs`/`getPublicDealerProfileBySlug`), and route builders are used consistently across F2–F5 as defined in F0/F1.
