# Final listing conversion verification

Date: 2026-07-22
Scope: public dealer profiles, listing detail, gallery, seller identity, public contact, and directly relevant tests.

## Outcome

The owned public listing and dealer-profile lane is ready for RC verification. The canonical provider-free listing suite passes in both public Playwright projects with no retries or flaky tests. No provider, database, branch, worktree, or git history was mutated.

## Implemented fixes

- The first gallery image retains stable responsive `fill` dimensions, is eager, preloaded, and emitted with high fetch priority. Thumbnails remain lazy by default.
- Failed main, secondary, thumbnail, and fullscreen images render accessible vehicle fallbacks. Repeated media use stable occurrence keys rather than array indexes.
- Gallery hover motion is disabled under reduced-motion preference. Radix Dialog continues to provide a focus trap; Escape closes and restores focus to the trigger. Previous/next and close controls retain 44px touch targets.
- Seller-role precedence remains supply organization type, then resolved organization profile type, then legacy seller type. The same role and trust vocabulary appears on mobile listing summary, desktop seller card, vehicle cards, and public profiles.
- Sold and every other non-active listing status now disable contact before delivery/provider logic. Sold receives a truthful specific label; unpublished states receive a neutral unavailable label.
- Share now exposes pending, success, copied, cancelled, and failure states through a polite live region. It disables during the native/clipboard operation to prevent duplicate activation and re-enables for retry.
- Public contact submit now has a pending spinner, `aria-busy`, duplicate-submit protection, labels, native validation, server error alerts, privacy context, and live success/unavailable output.
- A forged `?sent=1` query can no longer claim success while the submission provider is unavailable. Provider-free mode never collects contact data.
- Canonical public E2E resolves contact-route fixtures directly only when the explicit server-side `AUTOMARKET_PUBLIC_E2E=true` flag is present, avoiding cross-suite data-mode drift without exposing demo data in production.
- The desktop summary wraps at 200% text size instead of collapsing the H1. The seller column is capped at 40% under enlargement, and specifications auto-fit without truncating values.
- Save and report actions retain explicit account-app URLs. Provider-free contact is shown as unavailable in flow, not as a misleading fixed CTA.

## Route and state matrix

| Route | State exercised | Result |
| --- | --- | --- |
| `/bg/listing/bmw-x5-xdrive40d-berlin-2022` | Verified importer, import/delivery quote, one image, failed image, share, gallery, 200% text | Importer role and profile link are consistent; delivery price is not invented; media/focus/reflow checks pass. |
| `/bg/listing/bmw-x5-xdrive40d-sofia-2022` | Verified dealer, fixed price | Dealer role links to `/bg/dealers/sofia-premium-cars`. |
| `/bg/listing/ford-ranger-wildtrak-ruse-2022` | Verified distributor, negotiable price | Resolved distributor role overrides the legacy dealer type and links to `/bg/dealers/danube-trucks`. |
| `/bg/listing/tesla-model-y-long-range-varna-2024` | Verified dealer, lease-monthly offer | Lease presentation and dealer link remain truthful at 390px and 1280px. |
| `/bg/listing/volkswagen-golf-variant-plovdiv-2020` | Unverified/pending private seller | No organization/profile link or verification badge is invented. |
| `/bg/listing/toyota-rav4-hybrid-burgas-2021` | Verified private seller | Private trust label is shown without an organization link. |
| `/bg/listing/audi-q5-45-tfsi-quattro-stara-zagora-2021/contact` | Provider unavailable, forged success query | Route stays navigable, exposes a live unavailable state, renders no form, and rejects fake success. |
| `/bg/dealers/sofia-premium-cars` | Dealer, published inventory | Profile role, inventory-first order, navigation, images, and responsive layout pass. |
| `/bg/dealers/automarket-import-demo` | Importer, published inventory | Profile and listing seller identity use the same importer/trust semantics. |
| `/bg/dealers/danube-trucks` | Distributor, one published listing | Distributor semantics and listing navigation pass. |
| `/bg/dealers/automarket-manufacturer-demo` | Unverified manufacturer, orderable availability, zero published listings | Availability remains distinct from published listings; no authorization claim is invented. |
| `/bg/dealers/ev-import-network-demo` | 45 available units, zero published listings | Wide stock-only state shows `45 наличности` and `0 обяви` without fake vehicle cards. |

Viewport coverage: 360, 390, 640 (200% zoom-equivalent reflow), 768, 1024, 1280, 1440, and 1918px. The dedicated text-resize case also sets the root text size to 200% at 1280px.

## Verification results

- `CI=true E2E_PUBLIC_GATE_MODE=demo node apps/e2e/run-public-gate.mjs specs/listing-detail-final.spec.ts`: **16 passed**, public mobile and desktop, zero retries/flakes.
- Targeted cross-lane contact rerun in the same canonical configuration: **4 passed** across `listing-detail-final` and `public-marketplace`, mobile and desktop.
- Focused organization profile matrix (`resolved distributor` and `representative profile`): **2 passed** across all required widths.
- `pnpm --filter @repo/marketplace-ui test`: **7 files / 35 tests passed**.
- Web lead/contact focused tests: **2 files / 10 tests passed**.
- `pnpm --filter @repo/marketplace-ui typecheck`: passed.
- `pnpm --filter web typecheck`: passed.
- `pnpm --filter e2e typecheck`: passed.
- `git diff --check`: passed.
- `pnpm check`: owned files are clean; the repository-wide command still reports **15 out-of-lane errors** in API feed/webhook code, authenticated app upload/auth tests, dealer-directory files, and database lead files. Those files were not edited in this lane.

## Screenshot evidence

- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-360-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-390-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-640-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-768-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-1024-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-1280-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-1440-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-1918-importer-listing-final.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-1280-gallery-dialog.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-1280-listing-200-percent-text.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-390-importer-failed-media.png`
- `M:\automarket-forge\.codex-artifacts\dealer-profile-upgrade\after-390-provider-free-contact.png`
- Profile evidence is in the same directory as `after-360-dealer-profile.png`, `after-1280-distributor-profile.png`, `after-1440-stock-only-profile.png`, and `after-1918-manufacturer-profile.png`.

## Exact owned-lane files changed in the combined checkout

- `apps/e2e/specs/listing-detail-final.spec.ts`
- `apps/e2e/specs/organization-profile.spec.ts`
- `apps/web/app/[locale]/dealers/[slug]/organization-profile-avatar-image.tsx`
- `apps/web/app/[locale]/dealers/[slug]/organization-profile-view.tsx`
- `apps/web/app/[locale]/dealers/[slug]/page.tsx`
- `apps/web/app/[locale]/listing/[slug]/contact/contact-submit-button.tsx`
- `apps/web/app/[locale]/listing/[slug]/contact/page.tsx`
- `apps/web/app/[locale]/listing/[slug]/page.tsx`
- `packages/marketplace-ui/components/listing-actions.tsx`
- `packages/marketplace-ui/components/listing-detail.tsx`
- `packages/marketplace-ui/components/listing-gallery.tsx`
- `packages/marketplace-ui/components/listing-specs.tsx`
- `packages/marketplace-ui/components/seller-contact-panel.tsx`
- `packages/marketplace-ui/lib/listing-truth.test.ts`
- `packages/marketplace-ui/lib/listing-truth.ts`

## Genuine handoffs and blockers

- Public `VehicleListing.status` has no `reserved` value. Reservation exists only in the separate inventory-offer contract. Mapping reservation into a public listing is a marketplace-domain/public-loader decision outside this lane.
- The public demo set has no manufacturer-owned published listing, no `finance_estimate` listing, and no multi-image/large-gallery listing. Manufacturer profile truth is covered, but end-to-end seller linking for a manufacturer, finance detail rendering, and large-gallery route performance need canonical domain fixtures owned by the fixture/data lane.
- Provider-free mode intentionally cannot exercise a real successful lead persistence round trip. Validation, rate limiting, unavailable, persistence failure, and success are deterministic unit tests; a release environment with an ephemeral database is needed for provider-backed E2E.
- At 200% root text size, the listing-detail root has no overflow, but the prohibited global footer's `apps/web/app/[locale]/components/footer.tsx:42` privacy link extends the document by 11px. The global masthead also visually compresses at that artificial text scale. Both are outside this task's ownership.
- Save and report destinations are the authenticated app on port 3100. Their public URLs and labels are verified here; authenticated success/validation states belong to the app lane.
