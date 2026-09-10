# Codex Kickoff Prompt: Dealer Studio Phase 1A

Use this prompt from the `M:\automarket-forge` root when we are ready to begin implementation.

This prompt intentionally implements **Phase 1A only** from `docs/dealer-os-plan.md`. It should not build the full Listing Factory UI, QR print card, Viber AI, pricing intelligence, vehicle history, or portal publishing.

```text
You are working in M:\automarket-forge, a next-forge monorepo using pnpm, Next.js App Router, Prisma/Postgres, Clerk, shadcn via @repo/design-system, and Turborepo.

First read:
- AGENTS.md
- docs/README.md
- docs/architecture.md
- docs/data-model.md
- docs/dealer-os-plan.md
- docs/decisions/0003-dealer-studio-supply-wedge.md

Goal: implement Dealer Studio Phase 1A only: data and adapter foundation.

Hard constraints:
- Respect the fixed app split:
  - apps/web = public marketplace and public listing pages.
  - apps/app = authenticated Dealer Studio workspace.
  - apps/api = service routes, provider adapters, feeds, webhooks, cron.
  - packages hold shared domain, UI, AI, storage, and database logic.
- Do not build product code in apps/studio.
- Do not create a parallel dealer route tree. Future work should graduate the existing apps/app dealer pages.
- Do not reinterpret MarketplaceListing.sellerId as DealerOrg.id. Keep sellerId as denormalized public seller identity and add an explicit nullable dealerOrgId relation.
- Do not build the full Listing Factory wizard yet.
- Do not build Viber/WhatsApp AI, social video, pricing intelligence, carVertical, or mobile.bg/cars.bg publishing.
- External providers must sit behind typed adapters with local stubs. Local checks must pass without provider secrets.
- Use pnpm only. Do not revert user changes. No destructive git commands.

Phase 1A deliverables:
1. Propose the exact Prisma schema diff for:
   - DealerOrg
   - DealerMember
   - Lead
   - ListingGeneration
   - ListingPhotoJob
   - MarketplaceListing.dealerOrgId
   - image/photo-processing fields or relations as needed
2. Propose the exact file list before editing.
3. After approval, implement the schema and generated client updates.
4. Add TypeScript domain types in packages/marketplace for dealer orgs, members, leads, listing generations, photo jobs, provider statuses, and feed rows.
5. Add provider interfaces and stub implementations:
   - VIN decode stub
   - photo processing stub
   - AI listing copy stub/fallback
6. Add database/query helpers needed by later phases:
   - resolve DealerOrg by clerkOrgId
   - list dealer inventory rows
   - map active dealer listings into feed rows
7. Add or document the apps/api feed route contract for GET /feed/dealer/[slug].json. It can return seeded/stub rows in Phase 1A if full persistence is not yet wired.
8. Update docs if implementation choices differ from the plan.

Verification before completion:
- Run the narrowest meaningful typecheck/build commands for touched packages.
- Run git diff --check.
- Confirm no new provider secret is required for local checks.
- Summarize the schema diff, new files, adapter env names, and what remains for Phase 1B.

Start by replying with the proposed file list and schema diff for approval before writing code.
```
