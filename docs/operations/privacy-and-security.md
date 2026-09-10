# Privacy and security launch review

## Analytics and consent

- Optional browser analytics remain disabled until explicit consent.
- Decline is as easy to reach as accept.
- Global Privacy Control or `Do Not Track: 1` resolves to denial.
- Consent changes update collection without requiring account creation.
- Consent is stored as a versioned record, remains denied when storage is
  blocked or malformed, is localized, and can be reopened and revoked.
- Consent is origin-scoped: the public web and authenticated app do not share a
  decision through a cross-domain cookie.
- PostHog autocapture and session recording stay disabled; Google Analytics,
  PostHog, and Vercel Analytics are not mounted before consent.
- Public analytics keys may be exposed; tokens and secrets must never use a
  `NEXT_PUBLIC_` name.
- Server-side operational and security events must have a documented lawful
  purpose and data-minimizing payload; browser consent does not authorize raw
  PII in server logs.

## Logging contract

Central logging must remove or mask authorization headers, cookies, sessions,
tokens, passwords, connection strings, webhook bodies, messages, names,
addresses, email, and phone. It must neutralize CR/LF characters and preserve a
non-sensitive event name, result, timestamp, environment, deployment, and
correlation ID.

Do not log full URLs when query strings can contain search or contact data.
Never expose raw errors from readiness endpoints.

## Security launch checks

- Authorization is revalidated at server layouts, actions, and route handlers;
  proxy protection is defense in depth.
- Cross-user and cross-organization access is denied and tested.
- Webhooks validate signature, configuration, idempotency, and event scope.
- Cron requires a secret and fails closed when configuration is absent.
- Uploads enforce owner, allowed type, extension/signature agreement, size,
  count, quota, safe filenames, and cleanup.
- User-controlled service/feed URLs cannot become SSRF targets.
- Security headers and CSP are measured in the candidate response.
- Supported Next.js and React security patch levels are verified from current
  official advisories before release.

## Technical cookie and storage contract

- `Next-Locale` is host-only, `HttpOnly`, `SameSite=Lax`, `Path=/`, expires
  after one year, and is `Secure` in production. Explicit locale navigation is
  authoritative and prefetch must not change it.
- `automarket.analytics-consent` is versioned localStorage, not an auth cookie.
- Marketplace view and theme storage contain UI preferences only.
- Clerk owns authenticated session cookies. Verify their deployed attributes,
  custom-domain behavior, and cross-app redirect behavior on Preview.
- No feature package may write a cookie that is not read or documented.
- Revocation must disable analytics and expire known analytics cookies without
  deleting Clerk, locale, or unrelated first-party state.

## Retention decisions required before launch

The product owner must approve retention periods for leads/messages, account
data, moderation/audit evidence, analytics, application logs, upload metadata,
and backups. Each class needs purpose, access owner, deletion mechanism, legal
basis, and incident hold procedure. Until approved, avoid presenting the
privacy notice as a completed legal determination.

Standards: [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/),
[OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html),
and [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
