# Mobile Drawer Contract

This is an owner-approved preservation rule for Day & Night mobile UI.

## Use a full-screen overlay for decisions

Use the shared `MobileMarketplaceOverlay` / dialog pattern when the user is actively searching, filtering, selecting vehicle taxonomy, or completing a form with multiple fields. These surfaces own the viewport, have one scroll owner, use surfaced 44px icon actions, and keep primary CTAs inside the scroll flow.

## Use a bottom drawer for short contextual content

Use the shared shadcn `Drawer` treatment for short contextual surfaces such as Menu and “How it works”. The shared surface styles live in `packages/marketplace-ui/components/mobile-marketplace-drawer.ts`.

A contextual drawer uses:

- a rounded top sheet with a visible grab handle;
- one quiet zinc surface instead of a separate white header band plus gray body;
- a surfaced 44px close action;
- compact content that normally fits without scrolling, with overflow only as a small-screen fallback;
- no fixed or sticky CTA footer.

## Triggers stay compact

Do not place a large promotional/info card on a service landing page merely to open contextual information. Use a compact secondary button/pill that clearly opens the drawer. Detailed steps and explanatory copy belong inside the drawer.

## Menu composition

Menu remains a bottom drawer. Call and Location are compact quick actions. Secondary destinations remain separate accessible buttons/rows rather than being visually merged into one ambiguous compound control.

## Do not regress

- Do not convert short informational drawers into full-screen overlays without an owner request.
- Do not turn search/filter/data-entry overlays into partial-height drawers.
- Do not add sticky drawer CTAs.
- Do not use naked close icons.
- Do not create a new one-off drawer visual language when the shared drawer surface can be reused.
