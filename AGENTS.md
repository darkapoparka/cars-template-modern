# Modern — AI operating instructions

This repository is the canonical reusable master for the **`modern`** automotive template. Treat these instructions as the governing contract for AI work in this repo.

## Read order
1. `AGENTS.md` (this file)
2. `TEMPLATE.md`
3. `docs/LEAD-BUILD.md`
4. `docs/QA.md`
5. Existing architecture/design docs only as needed for the requested change

Any source-era task ledger, migration note, runbook, audit or design document is reference material only unless this file or the user explicitly delegates to it. Never resume an old backlog merely because it exists in the repository.

## Pick the task mode before editing
**Shared template improvement:** edit this repo directly, keep the result reusable, and commit/push to this repo. **Lead build:** do not personalize this master; create a clean copy in the dealer's project/repository and edit that copy. **Audit/review:** inspect without mutation unless the user explicitly asks for fixes.

## Lead-build objective
Reuse the existing composition and make it convincingly belong to one real dealer. The normal portfolio contains `auto-best`, `carwow`, and `modern`; `import` is optional for import-heavy businesses. A lead skin is not a redesign contest.

## Non-negotiable personalization rules
- Preserve layout, spacing, typography, card systems, navigation structure, breakpoints, interactions, and route shape unless the task explicitly asks for a shared redesign.
- Replace **all** inherited business identity: name, logo, favicon, colors, phone, email, address, map links/embeds, domains, socials, metadata, structured data, chat labels, legal/footer identity, contact destinations, image alt text, and embedded source-business copy.
- Inspect the dealer's published branding before claiming a logo is missing. Prefer real source artwork. If weak/missing artwork needs a professional refresh and the user authorizes it, generate a lead-specific asset and actually integrate it; never leave a generic text placeholder.
- Use source-backed business facts and services. Never invent awards, reviews, guarantees, finance promises, opening hours, team members, completed transactions, or capabilities.
- Inventory must be sourced and dated. Recheck sold/reserved/current status where available. Never present historical stock counts as current availability. Use the correct market currency, units, language, and vehicle terminology.
- Never inherit another dealer's phone, map pin, social account, YouTube channel, testimonial, watermark, or inventory as if it belonged to the new lead.
- Preview forms are not proven delivery integrations. Do not claim a message/email/lead was sent unless a real provider path was configured and verified.

## Template-specific ownership
- `packages/marketplace/lead-site.ts`
- `packages/marketplace/`
- `apps/web/public/`
- `apps/web/app/`

Keep the whole monorepo. Static demo mode provides preview inventory; provider services are not automatically configured. Do not split packages or simplify the runtime during a lead skin.

## Stale-identity sweep
Before declaring a lead ready, search the entire copy (including metadata and assets) for old identity markers. Start with: `Day & Night|Day Night|day-night|0877 733 110|Атанас Манчев|kristiankirilov`. Treat matches as review items, not blind replacements.

## Git and repo discipline
- `main` in this repository is the reusable master. Never commit a dealer skin here.
- Never force-push, rewrite unrelated history, or discard owner changes.
- Do not copy `.git`, `.env*` secrets, `.vercel`, dependencies, build caches, or local runtime state into a lead copy.
- Preserve license/provenance files. Public source history is evidence, not a blanket rights determination.
- When this template is inserted into a multi-variant dealer repo, it belongs in a variant folder such as `modern/` with no nested `.git` directory.

## Definition of done
A lead variant is done only when identity/content/assets are integrated, the stale-identity sweep is clean or explained, framework checks pass, representative routes are browser-checked at mobile and desktop widths, and the handoff states exactly what was changed, verified, and still unproven. Outreach is never authorized merely by finishing a build.
