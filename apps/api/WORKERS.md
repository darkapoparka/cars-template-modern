# API worker delivery contract

`required-workers.mts` is the typed source of truth for every durable route below
`app/cron`. `vercel.json` is the deployment schedule. Release preflight compares
both files with the discovered route tree and fails if a route, manifest entry,
or schedule exists on only one side.

Five previously orphaned workers are scheduled deliberately:

- auth recovery: every 10 minutes;
- inventory scan submission and import processing: every 5 minutes;
- inventory-import retention: daily at 02:15 UTC;
- KYB retention: daily at 02:45 UTC.

Inventory workers use bounded claims/leases and can safely encounter a prior
invocation. Provider-backed workers fail closed while their adapters are
unconfigured. Capability readiness must therefore block promotion whenever the
corresponding capability is launch-enabled; a schedule is not proof that the
provider is usable.

Vercel cron schedules use UTC and invoke `GET` with `CRON_SECRET`. The deployment
plan must support sub-hour schedules. If a worker is intentionally removed from
launch, change its manifest delivery to `disabled` with a reason and activation
requirements, remove it from `vercel.json`, and keep the route fail-closed until
the capability is re-enabled.
