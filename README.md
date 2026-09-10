# Modern automotive template

Canonical standalone master: **`darkapoparka/cars-template-modern`**. This repository is a reusable dealership design, not a dealer-specific project and not evidence that any sample business data is current.

**AI/agent entry point:** read `AGENTS.md`, then `TEMPLATE.md`, `docs/LEAD-BUILD.md`, and `docs/QA.md` before editing.

## Portfolio role
- Template key: `modern`
- Role: **core**
- Design position: premium minimal / inventory-first showroom
- Standard dealer offer: `auto-best + carwow + modern`
- `import` is an optional fourth design only for dealers with a real import/sourcing proposition.

## Rule of ownership
Improve this repository only when the task is a **shared template improvement**. For a **lead build**, make a clean copy and personalize the copy; never turn `main` into one dealer's site.

## Quick start
`corepack enable && pnpm install --frozen-lockfile && pnpm --filter @repo/database build`

Preview command: `pnpm --filter web exec next dev -H 127.0.0.1 -p 6462`

Entry route: `/cars`

See `TEMPLATE.md` for template-specific boundaries and `docs/LEAD-BUILD.md` for the complete lead workflow. Historical pre-split root docs are preserved under `docs/legacy/from-cars-2026-09-10/` for provenance only; they do not override the current instructions.
