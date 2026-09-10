# Lead build workflow — Modern

Use this checklist when turning the `modern` master into one dealer-specific variant. Work in a **copy**, never by converting the template master's `main` branch into a dealer.

## 1. Establish the lead fact pack before coding
Confirm the dealer's exact public name, city/country, website or marketplace profile, phone(s), email/contact path, address/map location, opening hours if published, social accounts, real services, current inventory source(s), currencies/units, and any import/finance claims. Record source URLs and a verification date in the lead project. Do not put private CRM notes in a public repo.

## 2. Create the lead copy
Clone this repository to a temporary worktree or copy its tracked working tree into the target dealer repository. In the normal multi-design dealer repo, place this variant under `modern/`. Exclude `.git`, dependency directories, build output, `.vercel`, runtime logs, and secret `.env` files. Keep the full source structure; for Modern, keep the entire monorepo.

## 3. Personalize without redesigning
Start with the owned surfaces listed in `TEMPLATE.md`. Replace logo/favicon, brand colors through existing tokens, business identity, contact destinations, maps, metadata, hero/supporting artwork, real services, inventory and vehicle imagery. Preserve the existing component hierarchy and interaction patterns unless the task explicitly requests a shared template improvement.

## 4. Asset standard
Use a real published logo when usable. If it is weak or absent and a professional refresh is authorized, create a clean lead-specific asset, store it locally, and wire every logo/favicon/social-preview consumer. Do not ship generated placeholder text or inherited watermarked stock. Preserve required provenance/license notes.

## 5. Inventory and claims
Prefer current published stock. Recheck sold/reserved flags and record the source date. Match photos, title, year, mileage, fuel, gearbox, price, VAT/finance notes and status to the source record. If the task explicitly allows representative demo stock, label it honestly and never imply live availability. Remove source-dealer testimonials, staff, awards and claims unless they are verified for the new dealer.

## 6. Localization
Use the dealer's market language, correct currency, metric/imperial units as appropriate, local phone format, address conventions and market terminology. Do not mechanically translate brand names. Check all navigation, filters, CTAs, vehicle specs, legal/footer copy and metadata.

## 7. Full stale-identity sweep
Search code, JSON/data, metadata, alt text and static filenames for inherited dealer markers. Start with `Day & Night|Day Night|day-night|0877 733 110|Атанас Манчев|kristiankirilov` plus the source logo/domain/social names you replaced. Review every hit manually; provenance files may intentionally retain historical names.

## 8. QA before handoff
Run the checks in `docs/QA.md`. Browser-test the entry page, inventory/search, one real vehicle detail, contact, the primary conversion path, navigation/menu dismissal and a filter at 390px and 1440px. Check broken media, overflow, console/page errors and contact URLs. Do not treat a rendered success state as proof of real form delivery.

## 9. Handoff
State the dealer, template/version or commit, exact variant folder/repo, source fact/inventory date, key identity/assets changed, checks run, browser routes/widths checked, known limitations, and public preview only if it was actually deployed and verified. Never claim outreach occurred unless it actually did.
