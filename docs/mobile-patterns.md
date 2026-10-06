# Mobile interaction patterns

Modern uses the shared marketplace overlay and control styles for inventory,
filters, import, selling and financing. Keep route components responsible for
their data and actions rather than copying control markup.

## Shared boundaries

- `MobileDealerChrome` owns the 16px page gutter and the 12px gap between the
  brand row and primary control. Header fields share 48px geometry and quiet
  18px icons through `lib/mobile-form-control.ts`; inventory, import, VIN,
  financing and guides reuse it. The compact scrolling inventory bar keeps
  44px controls. Guides use a 44px clear action and retain typing focus.
- `packages/marketplace-ui/lib/mobile-overlay-styles.ts` owns focus, field,
  icon-action, scrolling and primary-action geometry. Icon targets are 44px;
  primary actions have a 48px minimum and allow translated labels to wrap.
- `MobileMarketplaceOverlayField` owns the 52px search/entry field, its single
  clear control and focus restoration after clearing. Supply an accessible
  label, controlled value, change handler and localized clear action.
- `MobileMarketplaceOverlayShell` owns initial dialog focus. Opening a general
  search or picker does not raise the keyboard; explicit VIN entry may opt in
  with `onOpenAutoFocus`. Closing restores the route's triggering control.
- `MobileMarketplaceOverlayHeader` wraps long localized titles. Full-screen
  overlays serve search and forms; short choices use its sheet presentation.
  Existing draggable navigation/help drawers share the same icon-action style.
- Vehicle search and full-filter prompts use `search.makeModelPlaceholder` from
  the shared localized control copy. Category choices use a title, regular-weight
  subtext capped at two lines on mobile, and a 64px artwork tile; keep the line
  clamp's display style intact rather than overriding it with `block`.
- The existing visual-viewport bridge and safe-area styles continue to govern
  keyboard height and scrolling. Do not introduce route-specific viewport or
  global Escape handlers.
- The cmdk taxonomy picker retains combobox/listbox semantics and shares field
  styles through `CommandInput.wrapperClassName` and `endAdornment`.

## Verification — 29 September 2026

Browser checks on the local static-demo preview covered:

- Inventory search and full-filter make search: type, clear, retained input
  focus, Escape and return to the opener; one visible clear control.
- Import URL entry: default dialog focus, clear, disabled/enabled continuation.
- Nested country sheet: Escape closes only the child, restores the country
  trigger and preserves the parent draft. Germany plus BMW/X5 selection works.
- Taxonomy combobox: filtering, clear with focus retained, make/model selection.
- Financing: search, clear, vehicle selection and primary action layout.
- Selling: manual entry focuses the dialog; explicit VIN entry focuses VIN.
- Menu open/close and the homepage loading state resolving to inventory.
- 320px and 390px layouts, a Bulgarian title wrapping at 320px, an 844x390
  landscape overlay, and the desktop make selector at 1440px.

Screenshots are in ignored `runtime/mobile-standardization-2026-09-29/`.
Typecheck, production build, 186 web tests and 83 marketplace UI tests passed.
A later default-worker test retry hit a Vitest worker termination error; the
complete 83-test suite passed with two workers. The local dev server was
restored after it stopped; a CSS hot-reload error cleared with a page reload.

These checks verify the changed interactions and layout, not complete WCAG
certification or physical-device soft-keyboard behavior. No dealer refresh,
provider configuration or live enquiry submission is included.
