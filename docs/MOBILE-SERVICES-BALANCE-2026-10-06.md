# Mobile Services card balance

The owner found the service artwork too small beside the longer text. This follow-up changes only the existing mobile rules in `apps/web/app/[locale]/services/services.module.css`.

- Artwork and copy now share equal columns instead of 34% / 66%.
- Mobile cards show the existing service title and Explore link. Descriptions remain in the service data, search index and desktop cards.
- Title size stays at the shared 16px card token. The card still grows with content; no text clamp or fixed card height was added.
- Desktop CSS and concurrent desktop changes are preserved. No commit, release or deployment was requested.

Local browser checks cover BG and EN at 320px and 390px, plus EN at tablet and desktop widths. Images load, titles fit and the page has no horizontal overflow. Searching the hidden description text `оценка` still finds the Sell service. Scoped Biome passes. A fresh page load has no console errors; the earlier development tab logged transient Turbopack CSS update errors during live changes.

The generated MODERN logo has not been located in the template assets, Cars shared assets or the relevant local image directories. The current wordmark is a text placeholder, and the owner has been asked for the original artwork path or generating chat. No replacement logo was generated or claimed to be the original.

Evidence: [card comparison](mobile-services-balance-2026-10-06/before-after.jpg), [BG 320px](mobile-services-balance-2026-10-06/after-bg-320.jpg), [EN 390px](mobile-services-balance-2026-10-06/after-en-390.jpg), [measurements](mobile-services-balance-2026-10-06/checks.json). The comparison normalizes screenshot output widths; original captures are retained beside it.
