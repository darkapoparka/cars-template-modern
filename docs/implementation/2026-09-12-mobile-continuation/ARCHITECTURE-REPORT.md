# Mobile architecture and delivery boundaries

Repository: `J:/template-repos/cars-template-modern`; branch `astra`.
Starting HEAD: `ffd46d6`; no staged or unstaged owner changes at start.
Raw evidence: `D:/astra-mobile-architecture-20260912/` on the remote Windows machine.
The existing preview on 127.0.0.1:3001 is retained. No push, deployment, provider call or database mutation is authorized by this work.

## 1. Defer the global financing form

Split the global financing interceptor from the enquiry form. The interceptor retains link handling, draft ownership, and the immediate, dismissible overlay shell. The form and its server-action reference now load through React.lazy only when requested. SSR remains enabled; this is not a client-only page conversion.
The loading state uses the existing overlay and localized status text. Closing before the chunk arrives and reopening are supported; existing drafts, preferences and focus return are preserved.
The browser test deliberately holds new JavaScript requests after route hydration, verifies an immediate loading state and working dismissal, then releases the scripts and exercises reopening and draft retention.
Four focused Chromium/WebKit cases passed: delayed form loading/dismissal and the existing leasing preferences/draft flow (`finance-browser.log`). Web typecheck passed (`finance-typecheck.log`).
The initial network capture confirmed the full form was present in initial JavaScript on all five inspected routes: cars, sell, imports, lease and guides (`network-before.json`). These are development-bundle observations, not production speed measurements.

## Review scope and remaining work

Inspected the public layout/frame, inventory shell and suggestions, vehicle cards, mobile service composition, Import and financing form boundaries, content hub, and public styles. File size and tests alone are not architecture acceptance.
Physical devices, screen readers, live delivery, database integration and production Core Web Vitals remain separate acceptance items.
