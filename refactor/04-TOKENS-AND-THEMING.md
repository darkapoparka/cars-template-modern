# Tailwind v4 tokens and dealership theming

## Start with the tokens that already exist

`packages/design-system/styles/globals.css` already defines `canvas`, `panel`, `control`, `selected`, `focus`, status colors, background/foreground pairs, typography, dimensions, elevation and `.dark` values. Its `@theme inline` block exposes these to Tailwind. The public layout adds an inline canvas override and several `--lead-site-accent-*` variables. Desktop then introduces independent palettes in three stylesheets.

The target is **one clear source for each role**, not another parallel token system. Inventory existing variables and actual computed values before changing them. Record whether a token is shared, public-site-specific, inverse-surface-specific or a compatibility alias. Do not change the global palette while simultaneously redesigning desktop.

## Role inventory

| Role | Meaning / migration |
| --- | --- |
| Canvas / panel / control | Page background, contained content and input surface; not interchangeable |
| Foreground / muted foreground / border | Text hierarchy and separation; validate contrast in context |
| Primary / selected | Existing neutral action/selection contract; do not automatically remap every primary to dealer red |
| Brand / brand foreground | Dealer-accent action with a verified readable foreground |
| Brand hover / active / soft / ring | Deliberate interaction states; do not assume mixing an arbitrary color with white/black guarantees contrast |
| Inverse surface / foreground / muted / border / control | Dark hero/header composition independent of global dark mode |
| Success / warning / destructive / info | Semantic feedback, never simply the dealer accent |
| Typography roles | Existing body, meta, compact-control, card-title, price, section-title, page-title and display scales |
| Radius / elevation | Small set of controls, cards and overlays; use current values first, review changes per surface |
| Layout | Shared page width/gutters, section gaps, control density and overlay/safe-area rules |

Literal dimensions are not all errors. An aspect ratio, icon size, responsive grid or deliberate hero art position can be local component geometry. Repeated color choices, brand identity, copy, prices and duplicated business rules are the hardcoding to remove. Do not turn every `gap-2` into an obscure custom variable.

## Suggested alias migration

The following is a **proposed pattern**, not a patch applied by this audit. Preserve existing aliases and use values chosen from reviewed current rendering.

```css
/* Existing shared theme entry remains authoritative. */
@theme inline {
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-hover: var(--brand-hover);
  --color-inverse: var(--inverse);
  --color-inverse-foreground: var(--inverse-foreground);
  --color-inverse-border: var(--inverse-border);
}

/* Compatibility during migration, not a second palette. */
:root {
  --lead-site-accent: var(--brand);
  --lead-site-accent-hover: var(--brand-hover);
}
```

Define concrete defaults in the shared/public theme layer and project the selected, validated public theme onto the root. Do not ship this example without defining the variables. Prefer approved presets initially. If accepting editable colors later, validate a narrow color format and derive/review foreground/state pairs on the server; never accept arbitrary CSS, selectors, imports or style text from a dealer form.

Use `bg-brand text-brand-foreground`, not dynamically interpolated `bg-${color}`. Tailwind source detection requires complete class names. Typed static variant maps are appropriate. Theme imports and `@source` paths must be verified from each consuming stylesheet's location in web, app and Storybook.

## Scope, portals and dark mode

Put public theme variables on the public app's root element so portalled dialogs, drawers, menus and toasts inherit the same theme. A wrapper-only brand scope can fail when a portal mounts under `body`; otherwise provide a deliberate portal container. Test the real portal, not only an inline Storybook imitation.

Public website dark mode is not an agreed product requirement. Proposed default: explicitly supported light public canvas with a deliberate inverse header/hero. The dealer workspace can retain independently supported light/dark modes. Do not assume existing `.dark` definitions make all bespoke public colors dark-mode-ready. Confirm this decision before changing the public `ThemeProvider` behavior or persisted preference handling.

## Surface and typography contracts

Use a page-width container without decorative treatment by default. Apply panel background/border only to true units: a vehicle card, search panel, financing calculator, contact/map block or related-inventory group. Section wrappers do not all need shadows and large rounded corners. Header and hero may share one inverse composition; search should feel part of that composition, not an accidentally overlapping extra panel.

Keep approved mobile sizes during token migration. A shared alias can initially preserve the exact old mobile value while desktop adopts a new component variant. Use proper line heights, wrapping and price emphasis. Long makes/models, translated labels, large counts and empty values must not be solved by progressively smaller text or excessive truncation. Font loading must remain through the existing Next font setup; do not add another font family for each surface.

## Incremental procedure and measurable completion

1. Capture computed styles for a representative button, chip, input, vehicle card, header, drawer and detail tab at mobile and desktop widths. Record token owner and fallback.
2. Add only missing roles/aliases. Test that web, app and Storybook resolve identical shared roles where intended; confirm there is one Tailwind entry responsibility per app.
3. Migrate the desktop header/hero/search owner. Remove its superseded declarations in the same slice. Do not append another override stylesheet.
4. Migrate discovery/cards, then detail/services/content/error states. Replace global child selectors with local variants or named slots where appropriate.
5. Test a neutral dark-brand and a contrasting brand preset, long identity, optional logo, all interaction states and portal inheritance. Use fixture identities, not real leads.
6. Retire compatibility aliases only after all consumers and Cars adaptation are verified.

Completion: no unexplained hardcoded brand colors in migrated components; no state that uses a different token source for default and hover; no unowned global cross-component overrides; mobile rendering preserved; a second dealer theme works without component edits. Raw literal-count reduction is supporting evidence, not the acceptance gate. Reduced-motion overrides and deliberate third-party fixes require an explanation, not automatic removal.

Official guidance: [Tailwind theme variables](https://tailwindcss.com/docs/theme), [source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files), [shadcn CSS-variable theming](https://ui.shadcn.com/docs/theming).
