# Typography and UI consistency execution plan

**Status:** Phase 2 complete; Phase 3 queued
**Owner:** Modern template
**Source audit:** `darkapoparka/cars`, `audits/2026-09-14/navara-modern-typography/FULL-AUDIT.md`

## Objective

Replace the overlapping font, size, weight, tracking, and route-CSS systems with one reusable contract without redesigning the accepted Modern experience.

The implementation must remain reusable across dealer copies. Dealer-specific imagery, colors, inventory, and copy stay outside the typography contract.

## Working decisions

- Inter Variable is the single sans-serif family for public web, authenticated app, API error UI, and Storybook.
- Geist Mono remains the monospace family for code and technical identifiers.
- Each Next.js deployable owns `next/font` loading in its root application boundary.
- The design system owns font-family variables, semantic type roles, weights, tracking, and line heights.
- Type roles are mobile-first. Desktop sizes use explicit `lg:` role variants; route CSS must not redefine token values.
- Allowed public weights are 400, 500, 600, and 700.
- 10–11px is not allowed for public product text. Twelve pixels is reserved for incidental badges, counters, and timestamps.

## Phase 0 — trustworthy baseline

- [ ] Repair the three stale organization-directory tests.
- [ ] Add repository LF policy with `.gitattributes` and `.editorconfig`.
- [ ] Normalize line endings in an isolated commit.
- [ ] Restore green `pnpm check`, `pnpm unit`, `pnpm typecheck`, and `pnpm boundaries` gates.

Phase 0 remains a required release gate. It is tracked separately so typography work does not silently rewrite unrelated files.

## Phase 1 — lock the font and role contract

- [x] Select Inter Variable as the universal sans family.
- [x] Move font loading to app-owned modules and remove the obsolete design-system font loaders.
- [x] Align normal layouts, global errors, and Storybook with the same family and smoothing policy.
- [x] Replace the public mobile token override with one mobile-first shared role table.
- [x] Add canonical heading and uppercase-label tracking tokens.
- [x] Add a typed typography variant helper for page, editorial, card, control, metadata, and micro roles.
- [x] Preserve desktop card-title intent with explicit large role variants.
- [x] Verify public web, authenticated app, API error UI, and Storybook typecheck after the contract change.
- [x] Render the representative 390px and 1440px route set and record intentional visual changes.

### Phase 1 acceptance

- Every application shell resolves to Inter for sans-serif text.
- Public normal and global-error states use the same font and antialiasing policy.
- Semantic role values are defined once in `packages/design-system/styles/globals.css`.
- `apps/web/app/[locale]/styles.css` contains no typography-token redefinitions.


### Phase 1 validation — 2026-09-15

- `pnpm typecheck`: pass, 28/28 tasks.
- `pnpm --filter web build`: pass, 50 generated routes/pages.
- `pnpm boundaries`: pass, 1,019 files across 30 packages.
- Public web tests: pass, 33 files / 155 tests.
- Marketplace UI tests: pass, 19 files / 77 tests.
- Authenticated app tests: pass, 49 files / 200 tests.
- `git diff --check`: pass.
- Full `pnpm check`: Phase 1 files are clean; the repository still has six pre-existing Phase 0 diagnostics in `public-contact-fields.tsx`, `financing-contact-payload.test.ts`, and `public-support-submission.ts`.
- Browser review: Cars, listing detail, and contact rendered at 390×844 and 1440×900 with Inter and no positive document overflow.
- Axe: zero violations on mobile Cars and Contact. Cars retains one manual-review contrast result from existing controls/badges.

The contract change deliberately does not remove component-local 10–13px values, desktop 650 weights, or route heading inconsistencies. Those remain assigned to Phases 2–4.

## Phase 2 — shared product primitives

- [x] Migrate vehicle-card titles, prices, facts, badges, and image counters to semantic roles.
- [x] Migrate inventory masthead, search, filter, sort, and result-summary typography.
- [x] Migrate guide/content cards and editorial summaries.
- [x] Migrate bottom navigation, social actions, and shared service controls.
- [x] Migrate listing facts, related cards, and seller information.
- [x] Remove duplicated numeric typography from shared view-policy modules.

### Phase 2 acceptance

- Shared vehicle cards use one contract across Home, Cars, Lease, related listings, mobile, and desktop.
- Normal body, descriptions, form labels, and vehicle facts render at 14px or above.
- No public product text renders at 10–11px.
- Twelve-pixel text is incidental rather than instructional or descriptive.

### Phase 2 validation — 2026-09-15

- `pnpm typecheck`: pass, 28/28 tasks.
- `pnpm --filter web build`: pass, 50 generated routes/pages.
- `pnpm boundaries`: pass, 1,015 files across 30 packages.
- Public web tests: pass, 33 files / 155 tests.
- Marketplace UI tests: pass, 19 files / 77 tests.
- `git diff --check`: pass.
- Source policy scan: no `text-xs`, no public 10–11px utilities, no 550/650 weights, and no raw 12–13px product typography. The remaining 13px declaration is the technical Shiki code viewer.
- Browser review: Cars, listing, leasing, selling, imports, guides, guide article, and contact rendered at 390×844 and 1440×900 with Inter and no positive document overflow.
- Interactive mobile review: the full filter sheet, Sell vehicle-details form, Import source-link sheet, listing tabs, quick-filter row, service cards, and bottom navigation retained usable hierarchy and control sizing.
- Computed-style evidence: no visible text below 12px; vehicle facts render at 14px; mobile vehicle titles at 16/600; mobile prices at 20/600; desktop vehicle titles at 18/600; desktop prices at 22/600.
- Full `pnpm check`: Phase 2 files are clean. The repository remains blocked by the previously tracked Phase 0 formatting/lint debt in `public-contact-fields.tsx`, `financing-contact-payload.test.ts`, and `public-support-submission.ts`, plus a local `.impeccable/live/server.json` runtime artifact.

Residual 12px text is now limited to badges, image counts, keyboard hints, timestamps, article category/read-time labels, step numbers, copyright, and similar incidental content. Route-level heading hierarchy and the remaining route-specific arbitrary title values stay assigned to Phase 4.

## Phase 3 — remove patch layers

- [ ] Port `desktop-header.css` typography and component geometry into owned component variants.
- [ ] Remove nonstandard 550 and 650 font weights.
- [ ] Remove typography-related `!important` patches from `mobile-final-polish.css`.
- [ ] Replace class-substring and positional selectors with named slots or component variants.
- [ ] Move dealer artwork and color decisions into lead-site configuration.

## Phase 4 — route and editorial hierarchy

- [ ] Enforce one intentional visible `h1` per route.
- [ ] Align Sell, Imports, Contact, Guides, legal, and listing title roles.
- [ ] Separate route labels from document headings where both are needed.
- [ ] Review Bulgarian and Cyrillic wrapping at 320, 360, 390, and 430px.
- [ ] Review desktop hierarchy at 1024, 1280, 1440, and wide screens.

## Phase 5 — regression prevention

- [ ] Add a scanner for raw `font-size`, arbitrary numeric text utilities, and nonstandard weights.
- [ ] Add an allowlist limited to technical code, counters, and documented exceptions.
- [ ] Add computed-style assertions for representative public routes.
- [ ] Add visual snapshots for inventory, listing, service, contact, and editorial surfaces.
- [ ] Require formatting, unit, typecheck, boundary, build, and browser gates before release.

## Canonical type roles

| Role | Mobile | Desktop | Weight | Intended use |
| --- | --- | --- | --- | --- |
| `display` | 32/36 | 48/52 | 600 | rare hero or campaign heading |
| `page-title` | 28/34 | 36/42 | 600 | one route title |
| `section-title` | 22/28 | 24/32 | 600 | major section heading |
| `card-title` | 16/21 | 18/24 | 600 | vehicle and content cards |
| `price` | 20/24 | 22/28 | 600 | primary price |
| `body` | 16/24 | 16/24 | 400 | normal explanatory copy |
| `compact-control` | 15/20 | 15/20 | 500 | buttons, filters, tabs, inputs |
| `meta` | 14/20 | 14/20 | 400–500 | facts, labels, and summaries |
| `micro` | 12/16 | 12/16 | 500 | badges, counters, and timestamps |

## Validation matrix

Required commands for each completed phase:

```powershell
pnpm check
pnpm boundaries
pnpm unit
pnpm typecheck
pnpm --filter web test
pnpm --filter @repo/marketplace-ui test
```

Required browser widths for final acceptance: 320, 360, 390, 430, 768, 1024, 1280, and 1440px, plus mobile landscape.

## Change discipline

- Keep contract changes and component migrations in separate commits.
- Do not normalize the repository while implementing visual changes.
- Do not repair dealer-specific content inside this reusable template task.
- Preserve URL state, overlay behavior, static-demo truthfulness, and existing interaction contracts.
- Update this ledger after each completed batch with exact checks and remaining failures.
