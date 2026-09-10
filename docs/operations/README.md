# AutoMarket operations index

These procedures define the launch gate for AutoMarket. They are written for
the three-project topology: public marketplace (`apps/web`), authenticated
workspace (`apps/app`), and service/API (`apps/api`).

- [`release-readiness.md`](release-readiness.md): controlled release gate and
  evidence checklist.
- [`launch-audit-2026-07-16.md`](launch-audit-2026-07-16.md): current candidate
  evidence, source-backed audit matrix, blockers, and release decision.
- [`launch-audit-2026-07-12.md`](launch-audit-2026-07-12.md): historical audit
  retained for comparison; it is not the current release decision.
- [`slos-and-alerts.md`](slos-and-alerts.md): proposed launch SLOs, indicators,
  and alert thresholds.
- [`incident-response.md`](incident-response.md): triage, containment, and
  communication procedure.
- [`preview-deployment.md`](preview-deployment.md): approval-gated Vercel
  preview and promotion procedure.
- [`privacy-and-security.md`](privacy-and-security.md): consent, logging,
  retention, and security review.
- [`neon-recovery.md`](neon-recovery.md): isolated Neon restore drill.
- [`webhook-replay.md`](webhook-replay.md): idempotent webhook replay drill.
- [`upload-abuse-drill.md`](upload-abuse-drill.md): media policy abuse checks.

No procedure in this directory grants permission to deploy, access private
accounts, alter secrets, mutate production data, or contact external parties.
Those actions require explicit user approval for the named environment.
