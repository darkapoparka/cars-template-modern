# 0005: Seller identity and public verification

**Status:** Accepted
**Date:** 2026-07-23

## Context

AutoMarket has three different concepts that must not be presented as one:

1. **Authentication** proves that a user controls a login method.
2. **Seller identity** is the public person or organization attached to a listing.
3. **Verification** is a time-bounded trust decision backed by evidence.

Signing in, confirming an email, completing a profile, or choosing a seller role
does not make a seller verified. Verification words must never be stored in or
derived from a display name.

## Decision

### Public identity badge

Every listing uses one compact seller identity badge:

- The leading icon communicates the seller role:
  - store: dealer;
  - ship: importer;
  - boxes: distributor;
  - factory: manufacturer;
  - person: private seller.
- The badge text is the seller or organization display name.
- A verified check appears **inside the same badge**, after the name, only when
  the durable seller verification projection is `verified`.
- The accessible label includes the role, display name, and verified state.
- `pending`, `rejected`, `expired`, `revoked`, and `unverified` states do not
  receive a public verified check.

Seller verification and listing-level signals remain separate. Labels such as
certified vehicle, inventory current, VIN checked, or official authorization
must not imply that the seller identity itself is verified.

### Private seller lifecycle

| Moment | Durable state | Public treatment |
| --- | --- | --- |
| User signs up or confirms email/phone | Authenticated account only | No seller badge until a seller profile exists |
| User creates a seller profile | `unverified` | Person icon + chosen public display name; no check |
| User starts identity verification | `pending` | No public check; progress is shown only in the authenticated workspace |
| Provider and/or manual review approves evidence | `verified` with an active verification grant | Green verified check inside the identity badge |
| Review rejects the request | `rejected` | No public check; remediation is private |
| Grant expires, is revoked, or is suspended | `unverified` projection | Check is removed until re-verification |

Private-seller identity verification must be implemented behind a provider
adapter. Evidence and provider identifiers stay private. The public marketplace
consumes only the durable projection and never raw KYC evidence.

### Organization lifecycle

Creating a Clerk Organization provisions an AutoMarket `DealerOrg`, but does
not verify it. The organization flow is:

1. create or join the Clerk Organization;
2. choose the organization role;
3. complete the public and legal profiles;
4. submit KYB evidence;
5. pass provider/manual review;
6. receive an active, time-bounded verification grant;
7. project `DealerOrg.verificationStatus = verified`.

Only step 7 enables the public verified check. Importer verification additionally
requires the organization role to be `importer`; role selection alone is not
evidence.

## Enforcement

- New `SellerProfile` records default to `unverified`, not `pending`.
- Account authentication UI uses neutral account wording and never says
  “verified seller.”
- Public badges derive verification solely from the durable verification field.
- Generic demo identities such as `Private seller` render as a neutral role
  label. Demo names never contain `Verified`.
- Organization verification continues to use KYB cases and active verification
  grants as the source of truth.

## Follow-up

Before private-seller verification can be offered, add a durable private KYC
case, provider adapter, review decision, time-bounded grant, revocation/expiry
projection, authenticated progress UI, and audit events. Until that slice exists,
private sellers remain unverified unless explicitly seeded for demo coverage.
