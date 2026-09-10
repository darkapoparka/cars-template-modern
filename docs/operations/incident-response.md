# Incident response runbook

## Severity

- **SEV-1:** unauthorized access, secret exposure, destructive data loss,
  production mock inventory, or core marketplace unavailable.
- **SEV-2:** sustained journey failure, cross-organization risk without known
  exploitation, webhook duplication, or upload abuse affecting customers.
- **SEV-3:** localized degradation with a safe workaround.

## First 15 minutes

1. Name an incident commander and scribe.
2. Record UTC start time, environment, deployment ID, affected journey, and
   correlation IDs. Do not copy raw bodies, tokens, email, phone, or VIN data.
3. Confirm impact using `/health`, `/ready`, aggregate telemetry, and one
   controlled browser reproduction.
4. Contain the incident using the least destructive reversible action. Traffic
   promotion, rollback, secret rotation, provider disabling, or database
   restore requires the authority appropriate to that external system.
5. Preserve logs and evidence with access controls and documented retention.

## Diagnosis order

1. Candidate revision and environment drift.
2. Readiness dependencies and database connectivity.
3. Authorization and organization boundary failures.
4. Webhook idempotency and delayed/replayed events.
5. Upload/storage quota or validation failures.
6. Third-party provider degradation.

Use the `x-correlation-id` response header to join browser, function, and
provider evidence. If a supplied ID is invalid, the application replaces it to
prevent header or log injection.

## Recovery and validation

- Prefer a previously verified artifact or isolated recovery branch.
- Do not apply ad-hoc production schema changes during incident response.
- After recovery, repeat the affected E2E journey, authorization boundary,
  readiness check, and data-integrity query.
- Monitor for at least one full alert evaluation window before closing.

## Follow-up

Within two business days, record impact, timeline, detection gap, contributing
conditions, corrective actions, owners, and due dates. Avoid blame and avoid
including personal data in the retrospective.

