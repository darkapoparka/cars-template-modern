# Modern mobile implementation

Date: 12 September 2026. Status: final regression gates in progress.

## Repository
Active folder: `J:/template-repos/cars-template-modern`.
Remote: `darkapoparka/cars-template-modern`; working branch: `astra`.
Modern was split from `J:/cars/templates/modern` on 10 September 2026. This was verified against GitHub TEMPLATE.md. Port 3001 runs the standalone template.

## Recovery
The failed conversational response did not report substantial work already saved on disk. Existing implementation and timestamped test logs were inspected and continued, not repeated. Owner changes remain intact.

## Completed source work
- Typed Sell draft retains VIN, manual details and notes through handoff, edit and refresh, with validation and explicit reset.
- Listing map uses contained rounded geometry rather than overflowing negative margins.
- Shared Sell process copy, stable step-number geometry and corrected contrast.
- Content metadata belongs to records; server-built card summaries avoid sending article bodies to the client hub.
- Content filters have bounded scrolling, a close control and preserved search/category state.
- Shared mobile recovery navigation replaces the legacy error header.
- Dependency and package-boundary repairs are present in the working tree.

## Recovery fixes
- Added the content hub main landmark.
- Mobile discovery controls establish the trigger before opening, fixing Safari focus return.
- SEO and UI URL helpers now share the router locale configuration: Bulgarian unprefixed, English under `/en`.
- The exact package dependency contract now includes the two deliberate edges from SEO and marketplace UI to internationalization; the acyclic-graph check remains enforced.
- Sitemap includes article records and omits the redirect-only blog alias.
- Added English article navigation and article sitemap regressions.
- Moved the one-off screenshot script into this evidence folder; application lint rules remain enforced.

## Fresh mobile result
All 56 Chromium and WebKit mobile cases passed in the complete run. Evidence: `recovery-mobile-complete.log`. Coverage includes five listing widths, Sell round trips, validation/reset, content filters in landscape, article return state, search/filter state, import and leasing drafts, menu/gallery focus, and automated accessibility.
