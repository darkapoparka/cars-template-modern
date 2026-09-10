# AutoMarket Lead and Support Delivery Runbook

## Scope and delivery truth

This runbook covers the public listing enquiry form and the public AutoMarket support form in `apps/web`. It does not cover authenticated conversation messages, saved-search alerts, provider webhooks, or production deployment.

The two public paths use different delivery channels:

| Path | Durable receipt | Success boundary | User-visible success means |
| --- | --- | --- | --- |
| Listing enquiry | `Lead.id` plus `lead.created` audit entry | The active listing is revalidated and the lead transaction commits to a dealer-owned inbox | The seller organization can retrieve the enquiry from AutoMarket |
| Support form | Resend provider message ID | Resend accepts the idempotent send request | The message was accepted by the configured mail provider, not that a human read it |

Delivery states are deliberately strict:

- `queued` is reserved for a future durable worker. The current synchronous public forms never claim this state.
- `sent` means the email provider accepted the request and returned a receipt.
- `delivered` means the listing enquiry committed to the durable dealer inbox. A Resend API acceptance is never promoted to `delivered` without a provider delivery webhook.
- `failed` means the provider, timeout budget, rate limiter, listing recheck, or persistence boundary failed. The UI does not show success.

Anonymous enquiries for private-seller listings fail closed. The current data model has neither a durable anonymous private-seller inbox nor a server-owned seller email address, so storing such a row would create a misleading lead.

## Request and abuse controls

Both forms enforce the controls on the server:

- same-origin request context;
- a 16 KiB aggregate text-form limit in addition to per-field schema limits;
- framework-generated Server Action fields count toward that aggregate limit;
- rejection of unknown fields, duplicate fields, and file values;
- normalized schema validation;
- correlation IDs generated server-side unless a valid incoming ID is present;
- IP and sender fingerprints in rate-limit keys so raw IP, email, phone, and message content do not enter logs or Redis keys;
- fail-closed distributed rate limiting in Production;
- local bounded in-memory limiting for development and deterministic fake-provider tests;
- honeypot suppression without a provider or database call;
- fixed server-side routing: user input cannot choose a seller, support recipient, or provider target;
- listing contact is exposed only for an active listing with a durable dealer organization inbox; anonymous private-seller contact remains unavailable.

Listing enquiries are limited across IP, IP-plus-listing, sender, and sender-plus-listing scopes. Support requests are limited across hourly IP, daily IP, and daily sender scopes.

## Configuration handoff

The Preview environment owner supplies these existing application values through the normal secret/configuration lane:

| Value | Used by | Requirement |
| --- | --- | --- |
| `DATABASE_URL` | Listing enquiry persistence and listing recheck | Preview database only |
| `UPSTASH_REDIS_REST_URL` | Distributed listing/support abuse control | Preview Redis only |
| `UPSTASH_REDIS_REST_TOKEN` | Distributed listing/support abuse control | Token for the Preview Redis instance |
| `RESEND_TOKEN` | Support email provider | Restricted Preview Resend key beginning with `re_` |
| `RESEND_FROM` | Fixed support sender and recipient | Plain verified, monitored Preview mailbox (for example, `preview-sender@example.com`); it is never accepted from form input |

Use a plain email address for `RESEND_FROM` so the value passes the application runtime schema. The standalone smoke parser also accepts display-name syntax, but that broader syntax is not recommended for runtime configuration.

The smoke command uses three shell-only guard values. They are intentionally not application runtime schema values:

| Value | Required value |
| --- | --- |
| `AUTOMARKET_DELIVERY_SMOKE_TARGET` | `preview` |
| `AUTOMARKET_PREVIEW_SMOKE_CONFIRM` | `send-disposable-preview-email` |
| `AUTOMARKET_PREVIEW_SMOKE_RECIPIENT` | One disposable, monitored Preview recipient |

The command exits successfully with `status: "skipped"` only when the provider sender, token, or disposable recipient is absent. It rejects Production targets, multiple recipients, malformed addresses, missing confirmation, and configured credentials without an explicit `preview` target.

## Local proof with fake providers

These tests never use a network provider or real recipient:

```powershell
& 'M:\automarket-forge\node_modules\.bin\vitest.CMD' run lib/email-delivery.test.ts lib/public-form-security.test.ts lib/public-support-submission.test.ts lib/public-support-rate-limit.test.ts lib/public-listing-lead-submission.test.ts lib/public-listing-lead-integration.test.ts lib/public-listing-contact.test.ts lib/public-lead-rate-limit.test.ts
```

Run that command from `M:\automarket-forge\apps\web`.

```powershell
& 'M:\automarket-forge\node_modules\.bin\vitest.CMD' run leads-create.test.ts
```

Run that command from `M:\automarket-forge\packages\database`.

```powershell
node --test preview-smoke.test.mjs
```

Run that command from `M:\automarket-forge\packages\email`. The suites cover acceptance, permanent provider rejection, unavailability, timeout, retry with one idempotency key, circuit opening, duplicate submission, rate limiting, malformed input, oversized bodies, cross-origin requests, honeypot abuse, inactive routing, and replay payload conflicts.

## Disposable Preview provider proof

This command sends one real disposable Preview email. Do not run it with Production credentials, a customer address, or a shared operational mailbox.

```powershell
$env:AUTOMARKET_DELIVERY_SMOKE_TARGET='preview'
$env:AUTOMARKET_PREVIEW_SMOKE_CONFIRM='send-disposable-preview-email'
$env:AUTOMARKET_PREVIEW_SMOKE_RECIPIENT='disposable-preview-recipient@example.com'
$env:VERCEL_ENV='preview'
$env:RESEND_FROM='preview-sender@example.com'
$env:RESEND_TOKEN='re_preview_value_from_secret_store'
pnpm --filter @repo/email smoke:preview
```

The smoke sends the same payload twice with one provider idempotency key. Passing proof requires both calls to return the same provider receipt ID and a subsequent provider receipt lookup to succeed. Terminal output contains only:

- `state: "sent"`;
- the provider receipt ID;
- the run ID;
- a truncated SHA-256 recipient fingerprint;
- `duplicateSafe: true`.

It never prints the token, sender, recipient, subject body, or application message content.

After the provider smoke passes, submit one disposable support form on the Preview deployment. Confirm that the UI reports success only after the provider accepts the request and that the structured `public_support_sent` log has the same request correlation ID and a provider receipt.

For listing proof, publish a disposable dealer-owned Preview listing, submit one enquiry, and capture:

1. the browser result showing success;
2. the `public_listing_lead_delivered` structured log;
3. the `Lead.id` receipt in the Preview database;
4. the matching `lead.created` audit entry;
5. the enquiry visible in Dealer Studio for the owning organization.

Repeat the listing POST with the same inquiry dedupe key and unchanged payload. It must return the same lead without creating another row. Reusing that key with changed content must fail.

## Operator logs and privacy

Use the correlation ID to join application events. Relevant event names are:

- `public_listing_lead_delivered`;
- `public_listing_lead_failed`;
- `public_listing_lead_rate_limited`;
- `public_listing_lead_rejected`;
- `public_listing_lead_suppressed`;
- `public_support_sent`;
- `public_support_failed`;
- `public_support_rate_limited`;
- `public_support_rejected`;
- `public_support_suppressed`.

Logs contain delivery state, stage, attempt count, listing ID, lead/provider receipt ID, correlation ID, safe error code/name, and retryability. They do not contain message content, names, email addresses, phone numbers, IP addresses, credentials, or provider payloads. The shared observability sink applies a second redaction pass.

## Failure recovery

### Provider timeout or transient error

The provider adapter makes at most three attempts, each with a three-second timeout and exponential backoff. Every attempt carries the same Resend idempotency key, including after an ambiguous timeout. Do not generate a new key for an operational retry of the same form payload.

After three consecutive failed delivery operations, the in-process circuit opens for 30 seconds. Requests fail quickly while open. Restore provider availability, wait for the open interval, and resubmit the unchanged disposable request. The provider idempotency key prevents a timeout-then-retry duplicate within the provider retention window.

### Permanent provider rejection

Authentication, sender validation, malformed-provider-request, and other permanent failures are not retried. Correct the Preview sender/key configuration and rerun the guarded smoke. Do not copy raw provider responses into tickets or logs.

### Rate-limit backend unavailable

Production fails closed. Verify both Upstash values, Preview network reachability, and the `public_*_failed` event with `errorCode: "rate_limit_unavailable"`. Do not bypass the limiter to prove mail delivery; use the provider smoke command instead.

### Listing unavailable or routing rejected

Confirm that the listing is still `active`, not deleted, and still belongs to an active durable dealer or seller identity. Imported inventory also requires a current eligible destination publication. Sold, paused, expired, private-without-anonymous-routing, deleted, or destination-ineligible listings must not create a successful lead.

### Replay conflict

An inquiry dedupe key is bound to the normalized listing, buyer contact, intent, locale/destination, and message payload. A mismatch is an abuse or client-state signal. Preserve the correlation ID, do not alter the existing lead, and have the buyer load a fresh form only when they intend a new enquiry.

## Evidence packet

Keep one redacted evidence packet for the release decision:

- commit or checkout identifier supplied by the release owner;
- focused fake-provider test output;
- affected typecheck/check output;
- smoke guard test output;
- guarded Preview smoke JSON receipt;
- one Preview support correlation ID and provider receipt ID;
- one Preview listing correlation ID, lead ID, and audit entry ID;
- screenshots of the disposable form result and dealer inbox receipt;
- confirmation that no Production target or customer recipient was used.

The remaining activation step is supplying the real Preview-only provider/database/rate-limit values and executing the guarded disposable proof. No Production provider mutation or send is part of this runbook.
