# Cars integration

## Authoritative source

The reusable Modern master is **darkapoparka/cars, main, templates/modern**. The saved checkout is L:/CODEX/cars/templates/modern. The standalone cars-template-modern repository is a publishing mirror/history, not a second editable master. Former J:/template-repos copies are recovery-only.

Shared code and design improvements belong in this source boundary. Dealer work belongs in Cars clients/<slug>. Do not personalize the master, overwrite independent dealer work, or infer permission to deploy from a shared refactor.

## Releases and dealer copies

Cars owns approved immutable source selection and publishing. Follow its [template release contract](https://github.com/darkapoparka/cars/blob/main/docs/TEMPLATE-PROMOTION.md) and [current ownership instructions](https://github.com/darkapoparka/cars/blob/main/AGENTS.md). Main is a development head, not automatic release or visual approval. Existing dealers remain independent of master changes until an explicitly accepted refresh.

The current five-design direction and hosting qualification belong to Cars, not a duplicated template-specific trio list. Preserve each dealer manifest and the approved lock until the relevant migration is accepted. Do not silently substitute, omit or bulk-publish designs.

## Runtime and adaptation

Use Node >=22.22.0 <23, pnpm 11.4.0 and the complete workspace. Preserve the lockfile, licenses and provenance. [QA](QA.md) owns preview environment and verification commands; [architecture](architecture.md) owns code boundaries.

The adaptation inputs include packages/marketplace/lead-site.ts, packages/marketplace/, apps/web/app/ and apps/web/public/. site-config.ts preserves supported older artwork configuration. A fact-pack is not runtime configuration unless code consumes it. Every dealer requires its own complete identity and truthful inventory/form configuration.

Public Home is /[locale]; inventory is /[locale]/cars. Legacy /cars negotiates to the configured locale. Native mounted builds use NEXT_PUBLIC_BASE_PATH=/variant-2; standalone builds leave it empty. This is a build-time decision, not a visitor preference. Native Link/router destinations remain base-relative; raw anchors, images, API requests and metadata use the existing raw-URL helpers.

Mounted release acceptance also checks locale routing, preference requests, image paths and cross-design/Admin destinations. A standalone localhost build or this architectural refactor does not qualify a dealer publisher. Retain the recorded localization/mounted limits until that separate acceptance is completed.

## Working safely on main

Use the existing main checkout, inspect relevant changes and preserve independent work. Do not create another source copy, branch or worktree without authorization. Scope commits to reviewed task-owned paths; avoid blanket staging, reset, clean or force-push. Serialize shared Git/index and build-output writes.

When the shared checkout contains unrelated work, do not synchronize it destructively merely to make a template commit. Verify the source being edited against the selected GitHub parent, test locally, and publish only the reviewed paths. Record the exact commit and what was actually checked.

## Evidence

Historical task ledgers are not an active queue and must not be reported as current verification. Keep concise accepted findings and unresolved reproductions; put new raw QA output in ignored runtime/. Preserve intentional test baselines and asset provenance. Local success, owner visual approval, source release and public deployment are separate facts.
