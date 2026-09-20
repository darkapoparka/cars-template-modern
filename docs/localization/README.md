# Native Modern localization

## Owners and rendering

The portable policy lives in packages/internationalization/policy.ts; scripts/localization-contract.test.mjs verifies its exact reviewed body hash against the stored shared rollout candidate. Framework-specific request handling, path generation, request-origin normalization and typed messages remain separate modules. Do not edit the policy mirror independently or let a formatter silently change its pinned bytes.

apps/web/lib/locale-configuration.ts derives immutable policy configuration from publicSite. Public visitor state is recomputed from the explicit route and incoming request on every render. The async app/[locale]/layout.tsx remains a Server Component. It provides the selected message catalog, localized region names and rendered children to the bounded interactive preference provider. No visitor state belongs in a mutable module variable or shared cache.

Canonical URLs always contain the offered language, including the dealer default: /en/cars and /bg/cars. In native mounted builds these become /variant-2/en/cars and /variant-2/bg/cars. A supported path wins over conflicting lang query, saved language, Accept-Language and trusted hosting-country suggestions. Legacy unprefixed URLs negotiate once, retaining query parameters. User selection preserves the current query and fragment.

The proxy overwrites its internal x-modern-public-path request header from the actual request URL; the server validates it again before rendering no-JavaScript return links. It is never a client-supplied locale authority. Next's loopback URL normalization is handled only for the exact incoming 127.0.0.1 authority with the same port. Arbitrary Host, forwarded origins, cross-origin requests and production domains are not rewritten to defeat validation.

## Copy and dealer data

Existing native EN/BG presentation policies remain their owners. Shared preference/validation messages and public detail captions are typed bilingual catalogs. Dealer-owned city/address/country/tagline translations belong in leadSite.localizedCopy. Source-guarded sample inventory translations live in marketplace/content/inventory-copy.ts; changed dealer records are never overwritten merely because their slug matches a sample. Additional catalog metadata does not enable a language.

Only English and Bulgarian are offered. Country is an approximate preference/suggestion, not identity, consent, authorization or stock conversion. Preserve original prices, currency, inventory facts, media URLs, approved logos and hero artwork. Admin remains a separate application; no translated Admin or cross-design FAB implementation is claimed by this standalone master.

## Request and UI boundaries

POST /api/preferences (or the native base-prefixed equivalent) is preference-only. It validates method, exact Origin, fetch-site, content type, bounded actual body bytes, action/locale/country/return URL and unexpected fields. Save sets locale/country/prompt; dismissal only marks the prompt. Cookies are host-only, Path=/, HttpOnly, SameSite=Lax, 180 days, Secure on HTTPS.

The dialog cancels obsolete work, invalidates late responses and resets its unsaved draft/busy state on reopening. Escape closes immediately, keyboard focus stays contained, and focus returns to the actual visible trigger or menu control. Optional storage only remembers explicit prompt completion. The native locale-settings HTML form works without JavaScript. Browsing and language URLs remain usable with blocked storage.

The existing deterministic description-search parser is not a live AI provider or a business write. It remains available. Demo business mutations are blocked independently of UI controls. No provider, database, CRM, email, payment or notification delivery was commissioned.

## Commands and evidence

Use Node 22.22.0 and pnpm 11.4.0. Keep the complete workspace and installed Next 16.3.3. Do not update dependencies or global Node configuration for localization.

- pnpm localization:contracts validates mirrored policy bytes, bilingual keys/interpolation, sample-stock coverage and server/native composition.
- pnpm localization:manifest writes an exact working-source manifest; its hash is not release approval.
- pnpm localization:routes runs the serial route/geometry/image matrix against LOCALE_QA_ORIGIN, LOCALE_QA_MOUNT and LOCALE_QA_RUN.
- pnpm localization:http runs request/security/isolation checks. LOCALE_QA_READ_ONLY=1 explicitly skips POST cases. LOCALE_QA_DEVELOPMENT=1 labels development cache semantics; production still requires no-store.
- pnpm localization:client exercises dialog/no-JS form/races/storage with preference POST responses intercepted inside Playwright. Its mocked cookie persistence is not proof of the real endpoint or deployed cache behavior.

Run the affected unit tests, package/web/e2e typechecks, applicable lint/boundary/refactor/release guards and a final isolated production build. Verify both standalone and native /variant-2 builds before claiming mounted readiness. Do not overwrite a running preview's build output. The exact executed results, failures and unperformed gates are in HANDOFF.md; failed historical receipts remain in the named artifact directories.
