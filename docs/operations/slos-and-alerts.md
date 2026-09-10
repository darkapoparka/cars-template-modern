# Launch SLOs and alerts

These are proposed launch objectives, not claims about historical performance.
Measure them over rolling 28-day windows after production traffic begins.

| Journey or service | Proposed SLI | Launch objective |
| --- | --- | --- |
| Public discovery and detail | Successful non-5xx requests | 99.9% |
| Authenticated workspace | Successful non-5xx requests | 99.5% |
| API readiness | Ready samples | 99.9% |
| Lead creation | Accepted, durably persisted requests | 99.5% |
| Webhook processing | Valid events processed once within 5 minutes | 99.9% |
| Inventory feed | Valid feeds generated within 60 seconds | 99.0% |

Performance budgets for production-like browser runs:

- LCP ≤2.5 seconds at the 75th percentile.
- CLS ≤0.1 at the 75th percentile.
- INP ≤200 milliseconds at the 75th percentile once field data exists.
- Home-route transferred JavaScript ≤500 kB compressed in the controlled
  Playwright budget; revise only with measured justification.
- No more than 1,500 DOM elements on the public discovery fixture.

## Alert definitions

| Alert | Trigger | Initial response |
| --- | --- | --- |
| API not ready | 3 consecutive `/ready` failures over 3 minutes | Page on-call; inspect database/config without logging secrets |
| Elevated 5xx | ≥2% for 5 minutes with ≥50 requests | Page on-call; correlate by request ID and deployment |
| Lead failure | ≥5 failed writes in 10 minutes | Page product/on-call; preserve request IDs only |
| Webhook lag | Oldest valid unprocessed event >5 minutes | Page integrations owner; pause unsafe replay |
| Webhook duplicate | More than one durable effect for one event ID | Page integrations owner; contain writes |
| Upload abuse | Rejection rate >20% or quota spike for 10 minutes | Warn security/on-call; inspect aggregate reason codes |
| Production mock | Any production response identified as demo/mock inventory | Page immediately; remove candidate from traffic |
| Error-log silence | No expected heartbeat/log delivery for 15 minutes | Warn on-call; verify drain and SDK health |

## Burn-rate policy

- Fast burn: page when 2% of the 28-day error budget is consumed in one hour.
- Slow burn: ticket when 10% is consumed over three days.
- Alerts require a runbook link, owning team, environment, and correlation or
  deployment identifier. Never include raw request bodies or user contact data.

Alert thresholds must be exercised in an approved preview environment before
production. A configured rule without a delivered and acknowledged synthetic
alert is not verified.

