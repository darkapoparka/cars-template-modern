# AutoMarket Engineering Standards

## Tooling

Use:

- pnpm.
- Next.js App Router.
- TypeScript.
- Turborepo.
- Prisma.
- shadcn/ui through `@repo/design-system`.
- lucide-react for common icons.
- Browser verification for rendered frontend work.
- provider adapters with local stubs for optional third-party services.

Do not assume Bun is available locally.

## Commands

Common commands from `M:\automarket-forge`:

```powershell
pnpm install
pnpm --filter web dev
pnpm --filter app dev
pnpm --filter api dev
pnpm --filter web build
pnpm --filter app build
pnpm --filter app typecheck
pnpm --filter @repo/database typecheck
pnpm --filter @repo/marketplace typecheck
pnpm --filter @repo/marketplace-ui typecheck
pnpm --filter @repo/database build
git diff --check
```

If port `3000` is occupied by the legacy prototype, start `apps/app` on `3100`:

```powershell
pnpm --filter app exec next dev -p 3100
```

## File Ownership

Public marketplace features belong in `apps/web`.

Authenticated account, seller, dealer, and admin features belong in `apps/app`.

Service routes belong in `apps/api`.

Shared domain logic belongs in `packages/marketplace`.

AutoMarket-specific shared UI belongs in `packages/marketplace-ui`.

Generic shadcn primitives belong in `packages/design-system`.

AI listing copy belongs in `packages/ai`; provider-heavy API calls belong behind adapters and app/server routes, not inside UI components.

## Code Style

- Prefer small, focused modules.
- Keep type names domain-specific.
- Avoid anonymous blobs of JSON moving through UI.
- Prefer typed search params and schemas.
- Prefer existing local patterns before adding abstractions.
- Add comments only when they reduce real complexity.
- Keep files ASCII unless the file already uses non-ASCII content for a clear reason.

## UI Rules

- Use existing shadcn primitives.
- Use lucide icons for icon buttons.
- Use compact controls for marketplace screens.
- Use real vehicle images in public UI.
- Do not create landing-page hero layouts for marketplace routes.
- Do not nest cards inside cards.
- Do not use decorative orbs, bokeh blobs, or generic gradients.
- Text must fit at mobile widths.
- Stable dimensions are required for fixed-format controls such as chips, icon buttons, and cards.

## Data And State

- Public search state must be encoded in URL params.
- Authenticated user state must not be required for public listing pages.
- Server data should be typed at boundaries.
- Keep external provider IDs in explicit fields.
- Avoid duplicating filter option lists in multiple apps.
- Dealer-owned listings should use explicit `dealerOrgId` relations while keeping denormalized public seller fields for rendering.
- Optional provider integrations must have deterministic local stubs.

## Testing

Use the narrowest meaningful verification first:

- domain helpers: unit tests.
- search params: parser tests.
- route builders: unit tests.
- UI components: Storybook and browser checks.
- public pages: build and Browser verification.
- API/webhooks: route tests and signature validation tests.
- provider adapters: unit tests or deterministic stub contract checks.

Before claiming a frontend task is done:

1. Start the relevant dev server.
2. Open the page in Browser.
3. Check mobile and desktop widths.
4. Check console errors.
5. Confirm the UI still matches the AutoMarket styling direction.

## Documentation

When a decision changes project direction, update:

- this docs folder.
- `AGENTS.md` if future agents need the rule.
- a decision record under `docs/decisions` if the decision affects architecture, product scope, or UX direction.

Implementation prompts for large product areas should be milestone-scoped. For Dealer Studio, start with Phase 1A data/adapters before building full Listing Factory UI, QR cards, messaging, pricing intelligence, or external portal publishing.

## Git

- Keep unrelated changes untouched.
- Do not revert user changes.
- Prefer clear commits around coherent work.
- Check `git status --short` before and after edits.
- Use non-interactive git commands.

## Environment

Apps own their `.env.local` files. Use examples for expected names, but do not expose secret values in docs or commits.

Minimum local env expectations may evolve, but public marketplace work should avoid unnecessary dependencies on optional services during early UI/product development.

Dealer Studio provider secrets for VIN decode, photo processing, AI copy, vehicle history, messaging, and publishing must be optional until a feature explicitly requires them. Missing optional secrets should disable the provider or use a stub; they should not break ordinary local checks.

## Definition Of Done

For docs:

- docs are internally consistent.
- no unfinished-marker wording remains.
- `git diff --check` passes.

For code:

- correct app/package boundary.
- typecheck or tests pass.
- Browser verification is done for UI.
- loading, empty, and error states are considered.
- docs are updated when behavior or architecture changes.
