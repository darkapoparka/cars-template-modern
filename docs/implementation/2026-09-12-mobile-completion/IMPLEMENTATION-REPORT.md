# Modern mobile implementation — completion pass

Date: 12 September 2026.
Repository: `J:/template-repos/cars-template-modern`; branch: `astra`.
GitHub: `darkapoparka/cars-template-modern`; public preview: `http://127.0.0.1:3001`.

## New repairs in this pass

### Preserve the selected vehicle, including custom makes
The mobile truck form displayed Scania while its CSS-hidden desktop select serialized Audi. This was reproduced against the live preview using native FormData before editing. Make/model now serialize once from shared state, independently of the visible layout. Custom makes also remain valid native select options. The selected-vehicle desktop branch now retains its make/model inputs without changing its layout.

### Make reset survive refresh
Clearing a Sell draft now removes draft fields from the current URL as well as clearing the form. Locale, unrelated query parameters and hashes are preserved. Refresh no longer resurrects a vehicle the user explicitly cleared. Whitespace-only make/model values no longer satisfy required-field validation.

### Improve content-search recovery
The empty state now offers “Show all articles,” clearing both query and category. Clear/reset actions return focus to the search field. The search has a real associated label, a single visible clear action, preserved history state, and a semantic result-count output. Existing article return/search/category behavior remains intact.

### Give component styles one owner
Removed 100 lines of route-specific overrides from `mobile-final-polish.css`, reducing it from 176 to 76 lines. Leasing actions, external-import card actions, and generic dock typography now own their geometry in the components that render them. Desktop variants remain explicit. The keyboard/visualViewport compatibility rules were retained, not replaced with overflow hiding.

### Keep the fixes covered
Added six regression scenarios to both Chromium and WebKit: three custom vehicle categories through continuation and edit, reset followed by refresh, content empty-state recovery, and selected-vehicle form serialization across the desktop breakpoint. These cases are also included in the public demo gate. The test runner blocks non-read network requests.

## Earlier saved work preserved and revalidated
The interrupted sessions had already saved the typed Sell draft, VIN/manual handoff repairs, contained listing map, bounded landscape content drawer, shared Sell copy and step geometry, contrast fixes, content-record metadata, mobile recovery navigation, and dependency/package-boundary repairs. Those changes were inspected and retained rather than replaced or attributed as new work in this pass.

The running Next.js package was confirmed as 16.3.3. A fresh production dependency audit reported zero advisories across severity levels. This is an audit result, not a guarantee that the application has no security defects.
