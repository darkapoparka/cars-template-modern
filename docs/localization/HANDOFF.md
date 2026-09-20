# Modern native EN/BG localization — handoff

Status: combined Modern publication is now explicitly authorized. The checkpoint below is historical; see the combined publication section and PUBLICATION-2026-09-20.json for the current release record.

## Exact source and scope

Authoritative checkout: J:/template-repos/cars-template-modern. Repository: darkapoparka/cars-template-modern. Branch: main.
Implementation began on 1cf8edfe26a36e25b0d95dcc963b60de51cdeb50, with fetched origin/main at 703feaeb060f28f6cd43308c0aa4ff1b0a670fe8. Ten inherited refactor/design commits were unpublished. Publication is deliberately withheld; a scoped child commit still publishes those parents when main is pushed.

Final working-source aggregate SHA-256: 26dc715ea387ee515822760f29e4129ad4b9407d3eb37042bc649713913c4e96 (769 files; SOURCE-MANIFEST.json). This is the tested working checkout plus its preserved desktop drafts, not an assertion that those drafts are approved or included in the scoped commit. The final production compilation precedes only the formatter-configuration exclusion for the byte-pinned policy; application runtime source did not change afterward.

Portable candidate body SHA-256: e0adcfd9ca1efaf30c1410540cdbef25d2144bf9dc447971f0ce3b38cc5928c0. It is the exact body from J:/cars/docs/localization/rollout-kit/src/policy.ts, including its terminal newline. The local file adds documented lint annotations; a formatter override prevents byte drift. A negative hash fixture rejects drift.

| Source | SHA-256 |
| --- | --- |
| packages/internationalization/policy.ts | 8a272dc252ae736d685ea53097f669829346841a3279f2124b14988aa5f109a9 |
| packages/internationalization/paths.ts | 8d60b56ab0334475c702ab79c0a9fba46b8a66a49e1bde4d292030354d7bfbfd |
| packages/internationalization/request.ts | 2b6b104166d2065c924c539abc43c012747a9a0b069f03479dbf345b2cf90635 |
| packages/internationalization/request-origin.ts | fb692d65a6f68c458f2256aac9c5dc6affee7368dbca4e6ecbd1c79b0044d6ab |
| packages/internationalization/preferences-messages.ts | 83e50e1b3b26f99f2e0a4f8be506c320f6e5e16e8395813e6aa1b2dc9c06bf2e |
| packages/internationalization/public-messages.ts | 805b551ba00fbbddea82745fcaa72e462a93416b45e3926345528708462a041f |
| packages/marketplace/content/inventory-copy.ts | 264518d0b1caf2abfcd39a101cc85aecbab1dc1a603ee1ff1a1bd61f467694dc |
| packages/marketplace/lead-site.ts | 482e137ef0d0aade7978f6ab350db73b79aa13e21b6ed563168bc02c023ff119 |
| packages/marketplace/lead-copy.ts | 3b75927d44cea0ebd020f48917e33f451681d76cb3253f9c43fd860dc17cbb33 |
| packages/marketplace/listing-copy.ts | bcff77a751c13dc2de5c48d77d30cda120e51c62d853a6692effd99c6acba584 |
| packages/marketplace-ui/components/locale-preferences.tsx | 48a3e09a3384de152ca48a8f9acc764f1659027ba9b2347e0effbe2f9349f9b3 |

## Implemented behavior

The existing internationalization package and app/[locale] structure own the integration. Both languages have explicit native paths. Supported path language wins over query, saved language, Accept-Language and trusted country hints. Navigation/prefetch never saves a preference. The Next request adapter overwrites and validates its actual-path header; no-JavaScript settings links retain the current deep route/query. Country does not change dealer identity, phone, address or stock currency.

The async Server Component layout renders request-local state, selected messages and country names, passing server-rendered children through the narrowly interactive provider. Loading uses the installed Next root-locale API. No global client conversion, HTML rewriting, DOM text replacement or live translation service was added. Typed native EN/BG copy covers preference/validation/detail captions, dealer display copy and guarded descriptions/image labels for all 14 existing sample vehicles. Existing native bilingual editorial/legal/service policies remain their owners.

The preference-only endpoint uses exact-origin validation, actual body-size limits, strict actions/locales/countries, safe return destinations and unexpected-field rejection. Cookies are host-only Path=/ HttpOnly SameSite=Lax, 180 days, Secure on HTTPS. Save writes language/country/prompt; dismissal writes only prompt completion. The loopback adapter restores only Next's exact localhost/127.0.0.1 authority normalization and leaves strict origin enforcement intact.

Desktop and existing mobile-menu controls reopen a native dialog. Abort/version handling, timeout, rapid reopen reset, focus containment/return, localized errors and optional prompt-only storage are implemented. The native settings form has a no-JavaScript route. New client tests use intercepted preference POSTs; they do not establish actual deployed cookie persistence.

Native Next basePath is configured by NEXT_PUBLIC_BASE_PATH (empty or /variant-2). Link/router destinations differ deliberately from raw anchors, image URLs, fetches, metadata and window destinations. The old forced-default-locale packager transformation is not used. Cars packaging/FAB integration remains a separately owned unperformed adoption. This standalone master has no existing cross-design FAB source to update; Admin sources remain separate and unchanged.

The original deterministic description-search parser remains usable. Demo business mutations remain blocked; no enquiry, provider, CRM, database, notification or payment delivery was enabled. Arabic and all other registry-only languages remain hidden. No human translation approval is claimed.

The legacy contact?topic=trade-in entry now opens the correct native sell/appraisal flow. An empty entry asks for vehicle details instead of claiming a completed draft. Completed draft behavior is preserved. English finance image alternatives now use the guarded localized view model rather than Bulgarian source labels.

## Verification actually completed

Node 22.22.0; pnpm 11.4.0; Next 16.3.3; installed Vitest 4.1.8; workspace Playwright 1.61.1.

| Check | Actual result |
| --- | --- |
| Affected unit suites, verified-unit-suites | 470 passed: internationalization 71, marketplace 127, SEO 7, marketplace UI 82, web 183 |
| Localization and refactor contracts, release-contracts-final | 14 passed, including byte drift and missing/blank/mismatched catalog negative tests |
| Existing release-preflight contracts | 86 passed |
| Web typecheck | Passed; final production build also completed its TypeScript phase |
| Internationalization/SEO/marketplace/UI typechecks | Passed |
| E2E TypeScript | Passed after updating obsolete automatic-cookie expectations |
| Owned code lint | 117 files passed; the final exact policy formatter override is also checked independently |
| Workspace boundaries | Passed, 1155 files in 30 packages in that run |
| Final standalone production build | Passed, standalone-build-final, isolated .next-public-e2e-localization-final-standalone-demo |
| Client preference/browser matrix | 22/22 passed at EN/BG 320/390/1440, including races, hostile destinations, manual reopen, no-JS form navigation and blocked storage; endpoint responses/cookie storage are mocked |
| Actual GET-only HTTP/HTML/RSC isolation | 28 passed, zero failures, 15 POST cases explicitly skipped; both locales on inventory, legal and guide URLs, with alternating/concurrent country/prompt states |
| Initial route crawl | 155 passed, 7 failed out of 162 EN/BG route-width cases; it ran during corrections, not on a frozen release |
| Image diagnostic | 4 diagnostic collections captured; these are not four additional quality assertions |

ACCEPTANCE.json records exact commands, timings, exit codes, source and log hashes. Raw logs, screenshots and per-case results are in .codex-artifacts/localization-resume-20260920/. The earlier pass remains in .codex-artifacts/localization-20260920/. No failed receipt was rewritten as passing.

### Failures, fixes and remaining test limitations

Initial unit failures expected unprefixed/default-language URLs. Those assertions were updated to the requested explicit-locale contract; final suites passed. The policy integrity guard caught Biome removing its terminal newline; original bytes were restored and a file-specific formatter exclusion prevents recurrence. A mobile focus fallback used a nonexistent slot; it now targets the actual visible menu control. The corrected client matrix passed all 22 cases.

One initial route failure was real untranslated finance image alternatives; source was fixed and subsequent English 390/1440 cases passed. The six other failures were the image-wait harness counting offscreen horizontal carousel/flag-rail images as visible. The diagnostic records their empty lazy sources outside the horizontal viewport, while the actually visible images were ready. The attempted harness/negative-fixture correction tool call was denied before execution. The original failing harness remains, and a new fully green route crawl has NOT been produced. Do not call 162/162 passed.

A combined tool call to launch a new standalone production preview and native mounted build was denied before execution. Neither 6494 nor 6495 was started, and no different connector was used to launch the denied operation. Standalone compilation was independently permitted and completed; mounted compilation/browser verification remains unperformed.

The manual live preference POST probe was also denied. Earlier development positive POSTs returned 403; exact loopback normalization was repaired afterward and passed nine focused unit cases, but a fresh live positive POST has not been run. The later HTTP suite is explicitly GET-only. The browser preference suite intercepts POSTs in the test process; it must not be presented as actual endpoint persistence or Vercel CDN acceptance. Its fallback blocks unmatched preference POSTs.

The existing public analytics/locale spec was updated and typechecked but its full analytics browser suite was not rerun. Full service/filter/modal state coverage and native /variant-2 images/Link/router/API/plain-anchor journeys remain release gates. Local country isolation is not public cross-visitor CDN isolation.

## Preserved work and scoped commit boundary

PRESERVATION.json lists all ten inherited commit identities and exact current hashes of inherited working files. Later read-only coordination found the desktop owner had also finished shared dark controls at 2026-09-20T14:25:31.415Z. Those refinements are preserved. The old ownership-baseline.json/inherited-final.patch predates that later desktop work; never restore it over current files.

Only localization hunks are candidates in the three mixed files: home page metadata, desktop-header preference/image support, and vehicle-card localized display/image support. Existing home/catalog navigation changes, header Home/Inventory redesign and data-view-mode additions remain unstaged, together with inherited CSS, snapshots, tests and desktop documentation. New dark filter CSS files also remain unstaged. No reset, stash, clean, branch, worktree, cloned app, forced publication or replacement project was used.

Existing previews were not stopped. The verified development server on 3002 served the read-only/browser checks. The older localization preview on 6492 predates these fixes and must not be used as final-source evidence. All new browser runners close their owned browsers; no other preview ownership was changed.

## Deployment and remaining release decision

No new deployment was made. Last verified existing READY deployment: dpl_GFusCRBBz4jX4WbFVKdaUDEuEaee, source 703feaeb060f28f6cd43308c0aa4ff1b0a670fe8, project prj_A4DN3YbKHzofjvcbYOh3foMBCMpy, team team_RTNXBnClGWDdcYFFUW0BnqvJ, deployment URL https://cars-template-modern-8yqz6f8cc-tyj5.vercel.app. New public localization behavior has not been verified there.

Before publication, obtain a deliberate release decision for the ten inherited refactor/design parents and the separate desktop draft. Then complete the outstanding real endpoint, corrected route crawl, mounted production and exact committed-source checks. Push only the reviewed main release through the existing Git connection, verify its READY source and production alias, and repeat critical actual-cookie/cache/locale journeys. Do not update Cars pins or deploy dealers in this session.

## Local committed checkpoint

Application/source commit: 4a9f7d11f089fff6e2c0140ffb98dfd1ce4f245d. Committed tree: ef1dfc3911735e77820237e857bd8a0cbd9bcb46. It contains only the scoped localization source/tests/documentation. It is local on main and has NOT been pushed or deployed. All inherited working-file hashes in PRESERVATION.json were checked unchanged after committing. The three mixed files retain only their pre-existing desktop hunks in the unstaged diff. A documentation-only follow-up records this exact commit; it is not a new application release.

The committed tree intentionally differs from the combined tested working tree in preserved desktop drafts. Exact committed-tree runtime acceptance and native mounted production checks are still required before release. Do not infer deployed source from the local commit or the working-source aggregate.

## Combined publication authorized — 20 September 2026

The owner explicitly approved committing and pushing all current Modern work to main, including the ten inherited refactor/design commits, the two localization commits, and the current shared buy-box/frontend refinements. This supersedes the earlier decision to withhold publication; no separate release approval is pending. No work was discarded, rebased, reset or force-pushed. Other repositories, Cars pins and dealer deployments remain out of scope.

The combined checkout passed 470 affected unit tests, 14 localization/refactor contracts and the production web build with Node 22.22.0 / pnpm 11.4.0 / Next 16.3.3. Frontend lint is green after formatting the existing review script. The small narrow-desktop header integration fix targets phone text explicitly, preserving the visible language selector and current layout. Existing screenshots and older browser results remain historical evidence rather than a claim that every baseline was refreshed.

Current combined source aggregate: `502fc9379d02cc224cf7d96c7a9548690f5c97b94dc7e0a6c2431ba85f16f219` (769 files). The source manifest describes the exact combined source prepared for this release. Git and Vercel outcomes will be recorded after publication; previous mounted/runtime limitations are not silently promoted to passing results.

## Published combined release and public verification

The combined release was committed and non-force pushed as `f4d4280c855a02fc7345e8c3769682effc0f9d47`. Existing Vercel project `cars-template-modern` produced READY deployment `dpl_6vAtNguRiVfz8WvQtaeZZxszLti9`; the public production alias is https://cars-template-modern.vercel.app. All previously unpublished refactor/localization commits are now on GitHub main.

Public Chromium checks on this commit: 42/42 EN/BG route-width cases passed at 320/390/1440; language labels remained visible at 1024; actual JavaScript preference saving, Secure/HttpOnly/SameSite cookies, return-route preservation and reload passed. Four actual cross-visitor HTML/RSC cases passed using alternating country cookies with no-store responses and Vercel cache MISS. The real no-JavaScript form submission was the one failure (49/50 total), and is retained in PUBLIC-VERIFICATION-2026-09-20.json.

The settings document now supplies native Next `referrer: "same-origin"` metadata: the global no-referrer policy can make a native form POST carry a null Origin. The strict request Origin check was not relaxed and the shared policy bytes remain unchanged. A fresh live diagnostic and final local build/test launch were blocked; those operations were not retried through other tools. Therefore this follow-up does not claim a passing post-fix no-JavaScript submission.

The follow-up also captures the owner's search-icon/control polish and active-category navigation changes that arrived after the first push. Current source aggregate: `200aa171fc40fed4d654338e351adf6a90a21a746f0648b05e12ffa082050944`. Native mounted /variant-2 acceptance and remaining comprehensive interaction matrices remain separate from this successful publication.

The final publication snapshot also includes the owner's new category-loading header/skeleton updates and category-navigation screenshot. Updated source aggregate: `859549eb63c3ebfb60b2452e7ad50d9539dadb754f8bc36dd09ee8342d4b6960`. These later frontend edits were explicitly included in the owner-authorized all-work snapshot; the earlier 49/50 public result still refers only to f4d4280.
