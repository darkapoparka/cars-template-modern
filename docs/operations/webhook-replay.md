# Webhook replay drill

Run only with synthetic events in local or approved isolated preview state.
Never replay a real production payload into another environment.

1. Create a signed synthetic provider event with a unique provider event ID.
2. Capture baseline durable row counts and audit-event counts.
3. Deliver the event once and verify the expected durable effect.
4. Deliver the byte-identical event again and verify a successful or explicitly
   duplicate response with no second durable effect.
5. Deliver the same event ID with changed payload content and verify rejection
   or quarantine.
6. Deliver invalid signature, stale timestamp, unsupported event type, and
   missing configuration cases; each must fail closed.
7. Search logs by correlation/event ID and confirm no raw payload, contact data,
   token, or signature is present.
8. Record handler, event type, status codes, durable checksums, and elapsed time.

Do not use provider dashboard “resend” controls without explicit approval: that
changes external state and can trigger real email, payment, or account effects.

