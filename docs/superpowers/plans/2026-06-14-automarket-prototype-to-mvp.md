# AutoMarket — Prototype → MVP Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take AutoMarket from a well-documented, mock-data UI prototype to a launchable, secure, SEO-indexable regional (Bulgaria-first) vehicle marketplace with a working end-to-end product loop and a real Dealer Studio supply wedge.

**Architecture:** Keep the fixed next-forge app split (`apps/web` = public marketplace + SEO, `apps/app` = authenticated seller/dealer/admin workspace, `apps/api` = webhooks/cron/feeds). Persist all product state in Postgres via `@repo/database` (Prisma). Share domain language through `@repo/marketplace` and product UI through `@repo/marketplace-ui`. External capabilities (VIN/photo/AI) stay behind typed adapters with safe stubs. No marketplace logic is duplicated across apps.

**Tech Stack:** next-forge v6.0.2 · Next.js 16 (App Router, RSC) · TypeScript (strict) · Prisma + Postgres (Neon) · Clerk (auth + orgs) · Tailwind + shadcn (`@repo/design-system`) · Turborepo + pnpm · Biome/Ultracite · Vitest.

---

## How to read this plan

This is a **program plan** across four sequenced tracks. The skill that governs it (`writing-plans`) requires one detailed, working-software plan per independent subsystem, so:

- **Track 0 (Stabilize & Secure)** is decomposed to executable, command-verified tasks below — it's first and self-contained.
- **Tracks 1–3** are specified at **milestone + exact-file-list + acceptance-criteria + technical-approach** level. Each will be expanded into its own bite-sized, TDD-step plan (`docs/superpowers/plans/…`) at the start of that track, because the earlier tracks reshape the files the later ones build on. Decomposing them all now would be premature and create placeholders.

**Sequencing rationale:** Track 0 makes the repo safe and "best-practices" (your explicit bar). Track 1 proves the architecture by making ONE real loop persist. Track 2 builds the organic-discovery moat (a marketplace lives or dies on SEO). Track 3 hardens data + completes the supply/trust/monetization surfaces.

**What "MVP / launchable" means here:** a buyer can browse + filter + open a listing (indexable) → save it / contact the seller (persisted) → a seller or dealer can create, publish, and manage a real listing → an admin can moderate → all behind correct auth, on indexed pages, in one beachhead market (Bulgaria). "Global mobile.de/carwow competitor" is the multi-year outcome this architecture is designed to grow into — not v1. Win one market first.

---

## Audit → Plan coverage map (every confirmed Critical/High finding has a home)

| Finding (verified severity) | Fixed in |
| --- | --- |
| 🔴 authz-1 No auth gate in authenticated layout | Track 0 · M0.1 |
| 🔴 authz-2 Middleware has no `auth.protect()` | Track 0 · M0.1 |
| 🔴 authz-3 Admin pages have no role check | Track 0 · M0.1 |
| 🟠 build-1 `pnpm check` fails (14 lint errors) | Track 0 · M0.2 |
| 🟠 build-6 3 monorepo boundary violations | Track 0 · M0.2 |
| 🟠 build-5 No CI | Track 0 · M0.3 |
| 🟠 build-2/3/4/7 typecheck gate missing + stock drift | Track 0 · M0.3 |
| 🟠 arch-1 Root package.json is the CLI publish template | Track 0 · M0.4 |
| 🟠 arch-2 CLI source committed (`scripts/`, `tsup`) | Track 0 · M0.4 |
| 🟠 docs-1 / seo-3 Stock README + "next-forge/Vercel" branding | Track 0 · M0.4 + Track 2 · M2.5 |
| 🟠 arch-3 Node engines too low | Track 0 · M0.4 |
| 🟠 feat-4 Save listing/search don't persist | Track 1 · M1.2 |
| 🟠 feat-1/2/3 (was Critical) No persistence, inert forms, broken lead loop | Track 1 · M1.1–M1.4 |
| 🟠 actions-1 No mutation server actions | Track 1 · M1.1 |
| 🟠 authz-5 Listing edit has no ownership check | Track 1 · M1.3 |
| 🟠 seo-1/2 (was Critical) No JSON-LD, no listing sitemap | Track 2 · M2.3, M2.4 |
| 🟠 seo-4 No canonical/hreflang | Track 2 · M2.5 |
| 🟠 seo-5 Client-only search, no crawlable links/pagination | Track 2 · M2.2 |
| 🟠 feat-6 Missing category/make/model/dealer pages | Track 2 · M2.1 |
| 🟠 db-1 `relationMode = "prisma"` disables FKs | Track 3 · M3.1 |
| 🟠 db-2 Missing filter/sort indexes | Track 3 · M3.1 |
| 🟠 db-3 No full-text search | Track 3 · M3.2 |
| 🟠 feat-5 Dealer Studio 1B+ unwired | Track 3 · M3.3 |
| 🟠 feat-7 Report/checkout/moderation non-functional | Track 3 · M3.5 |
| 🟡 medium/low (docs drift, enums, geo, dead code, i18n, etc.) | folded into the track that owns the file (see each track's "cleanups") |

---

# TRACK 0 — Stabilize & Secure

**Outcome:** The repo is secure (auth enforced), all quality gates are green and enforced by CI, and it is unmistakably the AutoMarket product (no next-forge CLI/template machinery). This is the prerequisite for wiring any real data.

**Branch:** `track-0-stabilize`

---

## Milestone M0.1 — Enforce authentication & authorization

**Why:** Verified Critical. `apps/app/app/(authenticated)/layout.tsx` is a synchronous shell with no gate; `apps/app/proxy.ts` is bare `clerkMiddleware` with no `auth.protect()`; admin pages have no role check; and `AuthProvider` (ClerkProvider) is currently mounted ONLY in `(unauthenticated)/layout.tsx`, so the authenticated tree has no Clerk context at all.

**Files:**
- Modify: `packages/auth/proxy.ts`
- Modify: `apps/app/app/layout.tsx`
- Modify: `apps/app/app/(unauthenticated)/layout.tsx`
- Modify: `apps/app/app/(authenticated)/layout.tsx`
- Create: `apps/app/app/(authenticated)/admin/layout.tsx`
- Modify: `apps/app/proxy.ts`

- [ ] **Step 1: Re-export `createRouteMatcher` from the auth package** (apps consume Clerk only via `@repo/auth`, never directly).

`packages/auth/proxy.ts`:
```ts
export {
  clerkMiddleware as authMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
```

- [ ] **Step 2: Move `AuthProvider` (ClerkProvider) to the root app layout** so it wraps the entire `apps/app` tree, not just the unauthenticated routes.

`apps/app/app/layout.tsx` — wrap the existing providers:
```tsx
import { env } from "@/env";
import "./styles.css";
import { AuthProvider } from "@repo/auth/provider";
import { Toaster } from "@repo/design-system/components/ui/sonner";
import { TooltipProvider } from "@repo/design-system/components/ui/tooltip";
import { fonts } from "@repo/design-system/lib/fonts";
import { ThemeProvider } from "@repo/design-system/providers/theme";
import { Toolbar } from "@repo/feature-flags/components/toolbar";
import type { Metadata } from "next";
import type { ReactNode } from "react";

interface RootLayoutProperties {
  readonly children: ReactNode;
}

const getMetadataBase = (): URL | undefined => {
  try {
    return new URL(env.NEXT_PUBLIC_APP_URL);
  } catch {
    return undefined;
  }
};

const getUrl = (path: string, baseUrl?: string): string | undefined => {
  if (!baseUrl) {
    return undefined;
  }
  try {
    return new URL(path, baseUrl).toString();
  } catch {
    return undefined;
  }
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html className={fonts} lang="en" suppressHydrationWarning>
    <body>
      <AuthProvider
        helpUrl={env.NEXT_PUBLIC_DOCS_URL}
        privacyUrl={getUrl("/legal/privacy", env.NEXT_PUBLIC_WEB_URL)}
        termsUrl={getUrl("/legal/terms", env.NEXT_PUBLIC_WEB_URL)}
      >
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </AuthProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
```

- [ ] **Step 3: Remove the now-duplicate `AuthProvider` from the unauthenticated layout**, keeping only its visual shell. In `apps/app/app/(unauthenticated)/layout.tsx`, delete the `import { AuthProvider } from "@repo/auth/provider"` line and replace the `<AuthProvider …>{children}</AuthProvider>` wrapper with just `{children}`. (Also fixes the leftover "Acme Inc" / stock testimonial copy — replace with AutoMarket wording while here.)

- [ ] **Step 4: Add the server-side auth gate to the authenticated layout.**

`apps/app/app/(authenticated)/layout.tsx`:
```tsx
import { auth, currentUser } from "@repo/auth/server";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { GlobalSidebar } from "./components/sidebar";

interface AppLayoutProperties {
  readonly children: ReactNode;
}

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const user = await currentUser();

  if (!user) {
    const { redirectToSignIn } = await auth();
    return redirectToSignIn();
  }

  return (
    <SidebarProvider>
      <GlobalSidebar>{children}</GlobalSidebar>
    </SidebarProvider>
  );
};

export default AppLayout;
```

- [ ] **Step 5: Add an admin role gate** via a dedicated admin layout. (Decision: model admins as a Clerk `publicMetadata.role === "admin"` claim for MVP; revisit an `AdminUser` table in Track 3 if richer admin data is needed.)

`apps/app/app/(authenticated)/admin/layout.tsx`:
```tsx
import { auth } from "@repo/auth/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

interface AdminLayoutProperties {
  readonly children: ReactNode;
}

const AdminLayout = async ({ children }: AdminLayoutProperties) => {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  if (role !== "admin") {
    notFound();
  }

  return <>{children}</>;
};

export default AdminLayout;
```
> Note: configure Clerk to surface `publicMetadata` in `sessionClaims.metadata` (Clerk Dashboard → Sessions → customize session token: `{"metadata": "{{user.public_metadata}}"}`). Document this in `docs/environment.md` (M0.4).

- [ ] **Step 6: Add defense-in-depth route protection in middleware.**

`apps/app/proxy.ts` — change the middleware callback to protect all non-public routes:
```ts
import { authMiddleware, createRouteMatcher } from "@repo/auth/proxy";
import {
  noseconeOptions,
  noseconeOptionsWithToolbar,
  securityMiddleware,
} from "@repo/security/proxy";
import type { NextProxy } from "next/server";
import { env } from "./env";

const securityHeaders = env.FLAGS_SECRET
  ? securityMiddleware(noseconeOptionsWithToolbar)
  : securityMiddleware(noseconeOptions);

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default authMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  return securityHeaders();
}) as unknown as NextProxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- [ ] **Step 7: Verify the build compiles.**
Run: `pnpm --filter app build`
Expected: build succeeds (exit 0), no type errors from the layout/middleware changes.

- [ ] **Step 8: Verify the gate behaves (manual smoke test).**
Run: `pnpm --filter app exec next dev -p 3100`, then in a private browser window (signed out) open `http://localhost:3100/dealer/inventory` and `http://localhost:3100/admin/moderation`.
Expected: signed-out → redirected to sign-in; signed-in non-admin → `/admin/*` returns 404; signed-in user → dealer pages render. Check console for no errors.

- [ ] **Step 9: Commit.**
```bash
git add packages/auth/proxy.ts apps/app/app/layout.tsx "apps/app/app/(unauthenticated)/layout.tsx" "apps/app/app/(authenticated)/layout.tsx" "apps/app/app/(authenticated)/admin/layout.tsx" apps/app/proxy.ts
git commit -m "fix(app): enforce authentication and admin authorization"
```

**Acceptance criteria (M0.1):** Signed-out requests to any `(authenticated)` route redirect to sign-in (enforced at both middleware and layout). `/admin/*` requires an admin role claim. `AuthProvider` wraps the whole `apps/app` tree. `pnpm --filter app build` is clean.

---

## Milestone M0.2 — Make the lint & boundary gates green

**Why:** Verified High. `pnpm check` exits 1 with 14 errors (all in commit `b01c65f`); `pnpm turbo boundaries` reports 3 undeclared-dependency violations.

**Files (lint):** `packages/ai/index.ts:1`, `packages/marketplace/providers.ts:1,130,148`, `packages/database/dealer-studio.ts:1,259`, `packages/storage/index.ts:1`, `packages/storage/photo-processing.ts:2,3,5`, `packages/ai/listing-copy.ts:53`, `apps/api/app/feed/dealer/[...slug]/route.ts:3`
**Files (boundaries):** `apps/api/package.json`, `apps/app/package.json`, `apps/web/package.json`

- [ ] **Step 1: Auto-fix the mechanical lint errors.**
Run: `pnpm fix`
Expected: clears the `organizeImports` (4), `format` (2), `useConsistentTypeDefinitions` (1), and `useSimplifiedLogicExpression` (1) issues automatically.

- [ ] **Step 2: Fix the 3 `useAwait` errors** (async stub methods with no `await`) at `packages/marketplace/providers.ts:130`, `:148`, and `packages/ai/listing-copy.ts:53`. The provider interfaces return Promises, so keep them Promise-returning without `async`: replace `async methodName(input) { … return value; }` with `methodName(input) { … return Promise.resolve(value); }` (read each flagged line; apply the equivalent transform that satisfies the typed interface).

- [ ] **Step 3: Fix the 3 `noExportedImports` errors** at `packages/storage/photo-processing.ts:2,3,5`. Replace the `import { X } from "@repo/marketplace"` + later `export { X }` pattern with direct re-exports: `export { PhotoProcessingProvider, stubPhotoProcessingProvider } from "@repo/marketplace";` (preserve `import type` vs value semantics for each symbol).

- [ ] **Step 4: Verify lint is green.**
Run: `pnpm check`
Expected: `Found 0 errors`, exit 0.

- [ ] **Step 5: Declare the 3 missing workspace dependencies.** Add `"@repo/email": "workspace:*"` to `apps/api/package.json` and `apps/app/package.json` dependencies; add `"@repo/auth": "workspace:*"` to `apps/web/package.json` dependencies. Then run `pnpm install`.

- [ ] **Step 6: Verify boundaries are clean.**
Run: `pnpm boundaries`
Expected: `0 issues found`, exit 0.

- [ ] **Step 7: Commit.**
```bash
git add -A
git commit -m "fix: green lint + declare missing workspace deps"
```

**Acceptance criteria (M0.2):** `pnpm check` and `pnpm boundaries` both exit 0.

---

## Milestone M0.3 — Add a typecheck gate and enforce all gates in CI

**Why:** Verified High/Medium. No `typecheck` turbo task; config-only packages produce a false tsc cascade (build-7); stock shadcn + Knock + Stripe-toolkit drift (build-3/4); and there is no CI at all (build-5) — which is why the red commit landed.

**Files:**
- Modify: `turbo.json`, root `package.json`
- Remove `typecheck` script from: `packages/typescript-config/package.json`, `packages/rate-limit/package.json`, `apps/studio/package.json`, `apps/email/package.json` (config-only / source-less)
- Modify: `packages/design-system/components/ui/chart.tsx`, `packages/design-system/components/ui/resizable.tsx`, `packages/notifications/index.ts`, `packages/payments/ai.ts`
- Create: `.github/workflows/ci.yml`, `.nvmrc`

- [ ] **Step 1: Remove the misconfigured `typecheck` scripts** from the four source-less/config-only packages listed above so a repo-wide typecheck stops walking into sibling apps under the wrong config.

- [ ] **Step 2: Fix the stock dependency-drift type errors.** Re-generate the two shadcn primitives against installed majors: `pnpm dlx shadcn@latest add chart resizable --overwrite -c packages/design-system`. Update `packages/notifications/index.ts:6` `new Knock(key)` → `new Knock({ apiKey: key })` (per `@knocklabs/node` ^1.29 `ClientOptions`). Update `packages/payments/ai.ts:10` `configuration.actions` to the `@stripe/agent-toolkit` ^0.9 shape (verify against installed typings).

- [ ] **Step 3: Add a `typecheck` task to turbo.**
`turbo.json` — add inside `tasks`:
```json
    "typecheck": {
      "dependsOn": ["^topo"],
      "cache": true
    },
```
Root `package.json` scripts — add: `"typecheck": "turbo typecheck"`.

- [ ] **Step 4: Verify monorepo typecheck is green.**
Run: `pnpm typecheck`
Expected: all packages/apps pass (exit 0). Fix any remaining real errors before proceeding.

- [ ] **Step 5: Pin Node and add CI.**
`.nvmrc`:
```
22
```
`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - run: pnpm boundaries
      - run: pnpm typecheck
      - run: pnpm build
        env:
          SKIP_ENV_VALIDATION: "true"
```

- [ ] **Step 6: Verify the full gate locally.**
Run: `pnpm check && pnpm boundaries && pnpm typecheck`
Expected: all exit 0.

- [ ] **Step 7: Commit.**
```bash
git add -A
git commit -m "ci: add typecheck task and enforce check/boundaries/typecheck/build in CI"
```

**Acceptance criteria (M0.3):** `pnpm check`, `pnpm boundaries`, `pnpm typecheck`, `pnpm build` all pass locally; CI runs them on every PR to `main` and blocks merge on failure.

---

## Milestone M0.4 — De-template the repo (it must be AutoMarket, not the next-forge CLI)

**Why:** Verified High/Medium. Root `package.json` is the next-forge **CLI publishing manifest** (version 6.0.2, `repository → vercel/next-forge`, `bin`/`files`/`publishConfig`, `release: npm publish`, CLI deps) — `pnpm release` would publicly npm-publish the product. Stock README, committed CLI source, low Node engines, stray root `next-env.d.ts`.

**Files:**
- Modify: root `package.json`
- Delete: `tsup.config.ts`, `scripts/index.ts`, `scripts/initialize.ts`, `scripts/update.ts`, `scripts/utils.ts`, root `next-env.d.ts`
- Modify: `.autorc`
- Rewrite: `README.md`
- Create: `docs/environment.md`

- [ ] **Step 1: Strip CLI/publish machinery from root `package.json`.** Remove `bin`, `files`, `publishConfig`, the `release` script, and CLI deps `@clack/prompts`, `commander`, `nypm`, and `tsup` (devDep). Set `"private": true`. Reset `"version": "0.1.0"`. Point `repository.url` at the actual product remote. Raise `"engines": { "node": ">=20.9" }`.

- [ ] **Step 2: Delete the CLI source and stray artifacts.**
```bash
git rm tsup.config.ts scripts/index.ts scripts/initialize.ts scripts/update.ts scripts/utils.ts
rm -f next-env.d.ts
```

- [ ] **Step 3: Fix `.autorc`** (still declares `owner: vercel`, `repo: next-forge`) to the product repo, or remove it if `auto` releases aren't used.

- [ ] **Step 4: Rewrite `README.md`** as AutoMarket: one-paragraph product description; the `apps/web`=marketplace / `apps/app`=workspace / `apps/api`=service split; pnpm-only setup; the local port table (web 3001, app 3000/3100, api 3002); link to `docs/README.md` as source of truth; short attribution to next-forge.

- [ ] **Step 5: Create `docs/environment.md`** enumerating required vs optional env vars per app/package (cross-check each `keys.ts`): `DATABASE_URL` (required); Clerk keys + the `publicMetadata.role` session-claim config from M0.1; `OPENAI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, Stripe, Resend, etc. (all optional → graceful degradation). Resolves audit docs-8.

- [ ] **Step 6: Verify nothing referenced the deleted files.**
Run: `pnpm install && pnpm build`
Expected: install + build succeed; no script references `tsup`/`scripts/`.

- [ ] **Step 7: Commit.**
```bash
git add -A
git commit -m "chore: de-template repo root into AutoMarket product manifest + README + env docs"
```

**Acceptance criteria (M0.4):** Root manifest is `private`, product-versioned, with no publish path; no CLI source remains; README and `docs/environment.md` describe AutoMarket; `pnpm build` clean on Node ≥20.9.

> **Track 0 cleanups (fold in opportunistically):** remove the stray `.codex-*.log` files from the working dir; add a `# AutoMarket` banner or removal to `docs/codex-phase1-prompt.md` (docs-7); add ADR-0004 (i18n `[locale]` routing) and ADR-0005 (denormalized listing schema) (docs-9); reconcile the 6A–6E vs 1A–1E phase numbering (docs-10).

---

# TRACK 1 — First Real Vertical Slice (persist the core loop)

**Outcome:** The core marketplace loop **persists end-to-end** against Postgres, proving the architecture. After this track, mock data is gone from the critical path and real server actions exist with auth + Zod validation + ownership scoping.

**Branch:** `track-1-vertical-slice` · **Detailed bite-sized plan authored at track start.**

**Slice chosen:** Seller creates/edits/publishes a listing → it appears on the public `apps/web` listing detail → a signed-in buyer saves it and submits a lead → seller/dealer sees the lead. This exercises every layer (auth, server actions, Prisma writes, RSC reads, cross-app navigation).

### M1.1 — Server-action foundation + seller listing persistence
- **Files:** Create `apps/app/app/(authenticated)/sell/actions.ts` (`use server`); create `packages/database/listings.ts` (write/query helpers: `createListing`, `updateListing`, `setListingStatus`, `getSellerListings`, `getSellerListingById`); modify `apps/app/app/(authenticated)/sell/components/listing-form.tsx` (wire `action`, `useActionState`, validation errors, pending state); modify `sell/new/page.tsx`, `sell/listings/page.tsx`, `sell/listings/[id]/edit/page.tsx` (read real data); create `packages/marketplace/schemas.ts` (Zod `listingInputSchema`).
- **Approach:** Every action: `auth()` → resolve caller identity → Zod-parse `FormData` → ownership-scoped Prisma write → `revalidatePath`. Status transitions draft↔active↔paused↔sold. Slug generation on publish.
- **Acceptance:** A signed-in seller creates a draft, edits it, publishes it; the row exists in Postgres; the listing list reflects real status; invalid input returns field errors; another user cannot load/edit it (authz-5 closed).

### M1.2 — Buyer save-listing & save-search persistence
- **Files:** Create `apps/app/app/(authenticated)/saved/actions.ts`; modify `saved/page.tsx`, `saved/searches/page.tsx`; add a `SaveListingButton` client component in `@repo/marketplace-ui` that calls the action and, when unauthenticated on `apps/web`, redirects to `app.…/sign-in?redirect=…`.
- **Approach:** Writes to existing `SavedListing` / `SavedSearch` models; `SavedSearch.filters` validated by the Zod filter schema before persist. Optimistic UI with `useOptimistic`.
- **Acceptance:** Save persists across reload; saved searches store real filter JSON; unauthenticated save routes cleanly to auth then back (feat-4 closed).

### M1.3 — Lead capture / contact-seller loop
- **Files:** Create `apps/web/app/[locale]/listing/[slug]/actions.ts` (lead submit) or an `apps/api` route; create the missing `apps/app/app/(authenticated)/messages/` (leads inbox) OR repoint the contact link to `dealer/leads`/a buyer lead-history page; modify `@repo/marketplace-ui/components/listing-detail.tsx` (real contact form); create `packages/database/leads.ts`.
- **Approach:** Public lead form (rate-limited via `@repo/rate-limit`/Arcjet) → writes `Lead` with `listingId`, denormalized contact, `source`/`channel` → seller/dealer reads its leads (org-scoped). Fix the broken `/messages` target (feat-3).
- **Acceptance:** Submitting the contact form writes a `Lead`; the seller/dealer sees it; the dead `/messages` link is resolved.

### M1.4 — Kill mock from the slice + tests
- **Files:** Remove `getMock*` imports from the pages touched above; keep `mock-data.ts` only for Storybook/seed. Add Vitest unit tests for the Zod schemas, slug builder, and action authorization guards; add a Prisma seed path for local data.
- **Acceptance:** The slice has zero mock imports; `pnpm typecheck` + new unit tests pass in CI; `prisma db seed` produces a browsable local dataset.

---

# TRACK 2 — Public SEO Marketplace Surface (the growth moat)

**Outcome:** The public marketplace exists as documented and is fully crawlable/indexable — category, make, make/model, and dealer-profile pages; server-rendered search with crawlable filter links + pagination; structured data; a real sitemap; correct canonical/hreflang; AutoMarket branding; Bulgarian locale.

**Branch:** `track-2-public-seo` · **Detailed bite-sized plan authored at track start.**

### M2.1 — Canonical discovery routes in `apps/web`
- **Files:** Create `apps/web/app/[locale]/cars/page.tsx`, `cars/[make]/page.tsx`, `cars/[make]/[model]/page.tsx`, `dealers/[slug]/page.tsx`, and category routes for `trucks`/`motorbikes`/`vans`/`lease` (or a unified `[category]` segment); wire to the existing `@repo/marketplace/routes.ts` builders (currently dead — feat-6/seo-1).
- **Approach:** RSC + `generateStaticParams` from real make/model taxonomy and DealerOrg slugs; `generateMetadata` per page; ISR `revalidate`.
- **Acceptance:** Each documented route renders real DB-backed listings; route builders no longer point at 404s.

### M2.2 — Server-rendered, crawlable search + pagination
- **Files:** Modify `apps/web/app/[locale]/(home)/page.tsx` and the search results page; modify `@repo/marketplace-ui/components/marketplace-shell.tsx` so filter changes produce real `<a href>` links (not only client `router.replace`) and render numbered/next-prev pagination links.
- **Approach:** Filters round-trip through URL params parsed by `@repo/marketplace/search-params.ts`; results fetched server-side; client JS enhances but isn't required for crawl. Report `totalListings` from the DB count, not `mockListings.length` (code-quality-1).
- **Acceptance:** Filtered/paginated result pages are reachable and indexable without JS; Googlebot-style fetch shows listings + crawlable links (seo-5 closed).

### M2.3 — Structured data (JSON-LD)
- **Files:** Modify `apps/web/app/[locale]/listing/[slug]/page.tsx` and `@repo/seo`; add a `Vehicle`/`Product`+`Offer` JSON-LD builder and `BreadcrumbList`.
- **Acceptance:** Listing detail emits valid schema.org JSON-LD (validates in Google Rich Results test) — seo-2/feat-9 closed.

### M2.4 — Real sitemap & robots
- **Files:** Modify `apps/web/app/[locale]/sitemap.ts` to enumerate listing slugs, category/make/model pages, and dealer profiles from the DB; verify `robots.ts`.
- **Acceptance:** `sitemap.xml` includes listing/category/dealer URLs (seo-2 closed).

### M2.5 — Branding, canonical/hreflang, and locale
- **Files:** Modify `@repo/seo` config (remove "next-forge"/"Vercel" defaults — seo-3); add `alternates.canonical` + `languages` hreflang to metadata; fix root `<html lang>` to use the active locale (a11y-1); add `bg` to `@repo/internationalization` locales (i18n-1); remove leftover marketing components (`cases.tsx`, stock hero/pricing) from `apps/web/(home)` (build-8, code-quality-1); replace stock blog with vehicle guides surface (feat-8).
- **Acceptance:** Titles/OG cards say AutoMarket; every public page has a self-referential canonical + hreflang; `bg` locale resolves; no stock marketing scaffolding remains on the marketplace home.

---

# TRACK 3 — Data Hardening, Dealer Studio 1B/1C, Trust & Monetization

**Outcome:** The data layer is production-grade and the supply/trust/revenue surfaces become real, completing roadmap Phases 6B–9.

**Branch:** `track-3-hardening` · **Detailed bite-sized plan authored at track start.**

### M3.1 — Schema hardening (FKs, indexes, enums, lifecycle/geo)
- **Files:** `packages/database/prisma/schema.prisma` (+ migration).
- **Approach:** Switch `relationMode` to `"foreignKeys"` (Postgres DB-level integrity — db-1); add indexes on `priceAmount`, `year`, `mileageValue`, `fuelType`, `transmission`, `bodyType`, `promoted`, `publishedAt` and useful composites (db-2); convert stable domain Strings to Prisma `enum`s (status, category, sellerType, fuel, transmission, bodyType, verification, job statuses — db-4); add `expiresAt`/`soldAt` and `latitude`/`longitude` (db-6); document money as whole-currency `Int` minor-unit convention (db-7); remove the leftover `Page` model + the stock `apps/app/.../search/page.tsx` that uses it (db-8, split-2).
- **Acceptance:** Migration applies; FKs enforced; filter/sort queries hit indexes (verify `EXPLAIN`); enums constrain values; `Page` model gone.

### M3.2 — Real search
- **Approach:** Add Postgres full-text (`tsvector` + GIN) or `pg_trgm` for the free-text "BMW X5 diesel Varna" path (db-3); abstract behind a search helper so a dedicated engine (Typesense/Meilisearch) can replace it later without touching pages.
- **Acceptance:** Free-text search uses an index, not `ILIKE` scans; relevance is reasonable on the seed set.

### M3.3 — Dealer Studio Phase 1B (real inventory) + 1C (Listing Factory)
- **Files:** Wire `apps/app/.../dealer/inventory/page.tsx` (+ leads/analytics) to the EXISTING `resolveDealerOrgByClerkOrgId` / `listDealerInventoryRows` helpers (currently dead — feat-5, authz-4); build the org-scoped guided `dealer/inventory/new` flow invoking the AI-copy + photo-job + VIN stub adapters (factory-1).
- **Acceptance:** A dealer sees only their org's inventory; the Listing Factory persists `ListingGeneration`/`ListingPhotoJob` and publishes a real `MarketplaceListing` with `dealerOrgId`; works with no provider secrets (stubs).

### M3.4 — Distribution: feed + QR (roadmap 6D/6E)
- **Approach:** Confirm `apps/api` dealer feed (clean up the dead `[slug]` dir — docs-5); add QR/short-link + print card for public listing URLs.
- **Acceptance:** Feed returns active public inventory without private fields; QR resolves to the public listing.

### M3.5 — Trust, admin & monetization persistence (roadmap 8/9)
- **Files:** Add `ModerationReport`/`AuditLog` models + actions behind the M0.1 admin gate (feat-7); add report-listing flow; wire promotion checkout/billing to `@repo/payments` (Stripe) with labeled paid placements (billing-1).
- **Acceptance:** Reports persist and admins act on them with an audit trail; promotion checkout creates a real Stripe session; paid placements are labeled and don't corrupt search trust.

---

## MVP launch checklist (Definition of Done for the program)

- [ ] Auth enforced everywhere; admin gated (Track 0).
- [ ] All gates green + CI enforced (Track 0).
- [ ] Repo is AutoMarket, no publish footgun (Track 0).
- [ ] Core loop persists: list → discover → save → lead (Track 1).
- [ ] Public marketplace is crawlable/indexable with structured data + real sitemap (Track 2).
- [ ] Bulgarian locale + AutoMarket branding live (Track 2).
- [ ] DB has FKs, filter indexes, real search (Track 3).
- [ ] Dealer Studio inventory + Listing Factory persist, org-scoped (Track 3).
- [ ] Trust/moderation + at least one monetization path persist (Track 3).
- [ ] Loading/empty/error states + mobile Browser verification on every user-reachable route (PRD Quality Bar).

---

## Self-review notes

- **Spec coverage:** Every Critical/High audit finding maps to a milestone (see coverage table); the PRD MVP scope (public marketplace, search/filters, buyer account, seller flow, dealer workspace, admin) maps to Tracks 1–3; mediums/lows are folded into the track owning their file.
- **Placeholders:** Track 0 contains complete code/commands. Tracks 1–3 are intentionally milestone-level (file lists + acceptance + approach) and will be decomposed to bite-sized TDD steps at track start — this is the skill's "one detailed plan per subsystem" rule, not a placeholder gap.
- **Type/name consistency:** New shared types (`listingInputSchema`, DB helpers `createListing`/`updateListing`/`setListingStatus`/`getSellerListings`/`getSellerListingById`) are introduced in Track 1 M1.1 and reused by name thereafter; Dealer Studio reuses the existing `resolveDealerOrgByClerkOrgId`/`listDealerInventoryRows` helpers (no renames).
