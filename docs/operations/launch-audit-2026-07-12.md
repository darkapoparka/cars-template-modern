# AutoMarket launch audit — 2026-07-12

## Decision

`FAIL — DO NOT RELEASE`

The local candidate compiles and its public marketplace checks are strong, but
the required release evidence is incomplete and the dependency audit reports
high-severity vulnerabilities. No waiver was supplied. This report does not
authorize a deployment, promotion, rollback, secret change, private-account
access, or production-data operation.

## Candidate

- Repository revision: `b01c65f32e9e` plus a dirty shared checkout (212 status
  entries at audit time). The candidate must be committed and re-audited before
  release so all evidence refers to one immutable revision.
- Runtime: Node `22.22.0`; pnpm `10.31.0`.
- Surfaces: public marketplace, authenticated app, and API.
- Database and hosting: no connected AutoMarket Neon project and no approved
  Vercel preview.
- Browser: Playwright `1.61.1`, Chromium `149.0.7827.55`; agent-browser
  `0.20.0` for an independent visual and console check.

## Evidence summary

| Gate | Result | Evidence |
| --- | --- | --- |
| Formatting/lint | PASS | `pnpm check`: 444 files |
| Package boundaries | PASS | `pnpm boundaries`: 530 files, no issues |
| TypeScript | PASS | `pnpm typecheck`: 25 tasks |
| Unit/integration | PASS | `pnpm unit`: 54 tests across 9 workspaces |
| Production build | CONDITIONAL PASS | `pnpm build` passes for database generation, web, app, API, and Storybook with `SKIP_ENV_VALIDATION=true`; local placeholder values fail strict validation as intended |
| Public E2E | PASS | 20/20 discovery, detail, not-found, sitemap, robots, and JSON-LD checks across 390×844, 768×1024, 1280×720, and 1440×1100 |
| Accessibility | PASS | 12/12 keyboard and Axe serious/critical checks across the viewport matrix after adding an accessible name to the desktop sort control |
| Critical API | PASS | 12/12 liveness, readiness, cron-auth, and webhook-method checks; `/ready` fails closed with `503` and a redacted database failure state |
| Webhook replay | PASS (local) | Unit integration proves replay produces one mutation and logs no raw PII |
| Upload abuse policy | PASS (local) | Focused storage tests cover type/signature/size/count and ownership policy |
| Public visual/console check | PASS | Independent mobile home and desktop cars checks; no browser page errors; screenshots below |
| Production mock detection | PASS | Policy tests prohibit demo inventory in production; production start without `DATABASE_URL` returns an unavailable state rather than mock listings |
| Dependency security | FAIL | `pnpm audit --prod --audit-level=high`: 90 findings, including 21 high severity |
| Authenticated personas | NOT RUN | Buyer, seller, dealer, importer, and admin require approved Clerk test identities and uncommitted storage states |
| Production-like performance | NOT RUN | `next start` correctly refuses marketplace inventory without a real database; no connected isolated database was available |
| Preview and alert drill | NOT RUN | No approved/connected Vercel projects, environment, or alert destination |
| Neon migration/restore | NOT RUN | No connected AutoMarket Neon project; Task 08 also reports its migration and persisted-database journey were not executed |

Browser evidence:

- [`public-mobile.png`](../superpowers/execution-logs/2026-07-12-task-09/browser/public-mobile.png)
- [`cars-desktop.png`](../superpowers/execution-logs/2026-07-12-task-09/browser/cars-desktop.png)

## Blocking findings

### 1. High-severity production dependency advisories

The audit includes multiple vulnerabilities affecting the directly used
Next.js `16.1.6`, with patched versions at or above `16.2.6`, plus high findings
in transitive Hono, Undici, LangSmith, form-data, ws, Effect, and Lodash paths.
Representative primary advisories include
[GHSA-26hh-7cqf-hhc6](https://github.com/advisories/GHSA-26hh-7cqf-hhc6),
[GHSA-8h8q-6873-q5fj](https://github.com/advisories/GHSA-8h8q-6873-q5fj),
and [GHSA-vmh5-mc38-953g](https://github.com/advisories/GHSA-vmh5-mc38-953g).

Required closure: update direct packages and dependency constraints, explain
any unreachable tooling-only advisory, rerun the entire gate, and produce a
zero-high report. No automatic audit fix was applied to the dirty shared tree.

### 2. No immutable preview with validated environment

Local `.env.local` files contain non-secret placeholders. Strict builds reject
them. The successful compile used the documented validation bypass only to
test code generation; API readiness deliberately rejects that bypass in
production. The preview must provide correctly scoped values and prove that
`/ready` is `200` without `SKIP_ENV_VALIDATION`.

Required closure: follow [`preview-deployment.md`](preview-deployment.md) after
explicit approval, validate variables without printing them, run the complete
suite against immutable URLs, and acknowledge a synthetic alert.

### 3. Database migration, persistence, degradation, and recovery are unproved

Without an isolated Neon project, this audit could prove only fail-closed
readiness and local data-policy behavior. Migration apply, durable seller and
Dealer Studio flows, degraded-database recovery, point-in-time restore, RPO,
and RTO remain unverified.

Required closure: execute [`neon-recovery.md`](neon-recovery.md) in an approved
synthetic-data branch, run the Task 08 persisted journey, and record branch ID,
migration version, checksums, recovery point, recovery duration, and cleanup
approval without recording a connection string.

### 4. Authenticated role journeys are unproved

The browser suite includes buyer, seller, dealer, importer, admin, and
anonymous authorization cases, but intentionally skips them unless approved
Clerk test configuration and local Playwright storage states are supplied.

Required closure: run every persona against the same preview and isolated
database, prove cross-role denial and organization boundaries, and retain only
synthetic screenshots and traces.

### 5. Production performance budget is unproved

The budget is 1,500 DOM elements and 500,000 transferred JavaScript bytes for
the public home page. Development measurements are excluded. A production
server without `DATABASE_URL` correctly does not serve demo inventory, so the
budget could not be measured honestly.

Required closure: run `E2E_PERFORMANCE=true` against the immutable preview with
an isolated database and record the four viewport results.

## Privacy, trust, SEO, and observability conclusions

- Optional client analytics stays disabled until consent is granted; Global
  Privacy Control or Do Not Track denies collection. The API app does not mount
  browser analytics.
- Logs normalize correlation IDs and redact credentials, email-like values,
  URL credentials, CR/LF injection, and sensitive keys. Health and readiness
  are non-cacheable and do not return raw exceptions.
- Public data policy prohibits production mock fallback. The Chinese EV/hybrid
  collection explicitly says it is unpaid and makes no partnership claim.
- Unit and browser checks cover canonical locale metadata, crawlable listing
  links, robots, sitemap, parseable Vehicle JSON-LD, 404 behavior, and the four
  viewport layouts.
- Automated accessibility found and drove correction of one icon-only desktop
  combobox. No serious or critical Axe violations remain on the audited public
  routes; manual assistive-technology testing is still part of preview signoff.

Standards used: [WCAG 2.2](https://www.w3.org/TR/WCAG22/),
[OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/),
[OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html),
[OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html),
[Google sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview),
and [Google structured-data guidance](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

## Release recheck

After all five blockers close, run from the immutable candidate on Node
`22.22.0`:

```powershell
pnpm install --frozen-lockfile
pnpm check
pnpm boundaries
pnpm typecheck
pnpm unit
pnpm audit --prod --audit-level=high
pnpm build
pnpm e2e
git diff --check
```

The release decision may change only when every command passes without an
environment-validation bypass, every required browser journey runs without a
skip, the preview returns ready, the alert is acknowledged, and Neon recovery
evidence meets the approved targets.
