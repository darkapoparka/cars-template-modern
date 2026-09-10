# Release readiness gate

## Decision rule

AutoMarket is releasable only when every required gate below has current
evidence from the same candidate revision. A skipped check is a blocker unless
the user records an explicit waiver with owner, scope, reason, expiry, and
rollback condition.

## Candidate identity

Record before verification:

- Git commit and dirty-state summary.
- Node `22.22.0` and pnpm `11.4.0`.
- Exact public, app, and API candidate URLs.
- Database branch identifier; never record a connection string.
- Migration version and fixture version.
- Tester, timestamp, and browser versions.

## Local gates

Run sequentially from the repository root:

```powershell
node --version
pnpm --version
pnpm release:preflight:contracts
pnpm release:preflight:test
pnpm check
pnpm boundaries
pnpm typecheck
pnpm unit
pnpm audit --prod --audit-level=high
pnpm e2e:public
pnpm build
git diff --check
```

Required outcomes:

- All commands exit zero on Node 22.
- Preview/Production environment preflight passes without printing values or
  enabling `SKIP_ENV_VALIDATION`. A build with that variable is compile
  evidence only and cannot satisfy this release gate.
- Production builds cannot enable mock marketplace inventory.
- No high-severity dependency, application-security, or accessibility finding.
- No unsupported trust, verification, warranty, finance, or partnership claim.
- No secret, token, raw webhook body, contact data, or connection string in
  application logs or generated evidence.
- The guarded public browser gate runs both provider-free demo and production
  inventory-unavailable modes and leaves no local server listener behind.

## Browser evidence

Capture the same critical journeys at 390×844, 768×1024, 1280×720, and
1440×1100. Preserve screenshots only when they contain fixture data and no
private account information.

The local public gate provides 390×844 and 1440×1100 Chromium coverage. The
full four-viewport matrix and every authenticated persona remain mandatory on
the immutable Preview candidate.

- Public discovery, filtering, pagination, and listing detail.
- Buyer save/search/message/account journey.
- Seller create/draft/review/publish journey.
- Dealer and importer inventory and lead journey.
- Admin authorization and moderation journey.
- Keyboard navigation, focus visibility, overlays, and sticky controls.
- Loading, empty, error, unavailable, unauthorized, and not-found states.
- Console errors, failed requests, hydration errors, and layout overflow.

## Service and recovery evidence

- `/health` returns liveness independently of downstream services.
- `/ready` returns `503` when the database is absent or degraded and never
  includes a secret or raw exception.
- Webhook replay produces one durable effect for one provider event ID.
- Upload policy rejects unsupported type, extension/signature mismatch,
  oversize payload, count/quota excess, and cross-owner mutation.
- An approved isolated Neon point-in-time recovery drill meets the recovery
  targets in [`neon-recovery.md`](neon-recovery.md).
- Alerts are routed to an owned destination and a synthetic alert is
  acknowledged; documentation alone does not count as an alert drill.

## Release decision

The final audit must state one of:

- `PASS`: all required evidence is current.
- `PASS WITH WAIVERS`: every exception has an explicit, unexpired waiver.
- `FAIL`: one or more blockers remain.

Absence of a connected Vercel or Neon project means preview, alert-routing, and
restore execution remain `NOT RUN`, and therefore the production release gate
cannot be `PASS`.
