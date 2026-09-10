# QA and Migration

## Migration approach

The refactor is behavior-preserving. Move one ownership boundary at a time, keep existing exported coordinators stable, and verify after each batch. Do not combine architectural extraction with visual redesign.

## Automated gates

Run from the repository root:

```powershell
pnpm check
pnpm boundaries
pnpm unit
pnpm typecheck
$env:SKIP_ENV_VALIDATION = "true"
pnpm build
pnpm --filter e2e e2e:public
```

`pnpm verify` should remain the canonical aggregate release gate.

## Interaction regression matrix

For marketplace search/filter flows verify:

- open/close each overlay repeatedly;
- Escape/backdrop close;
- focus entry and focus return to the trigger;
- body scroll restoration;
- nested make/model/derivative back navigation;
- draft changes cancel without applying;
- Apply performs one navigation;
- URL state survives refresh and browser Back/Forward;
- clear-one and clear-all preserve unrelated criteria;
- keyboard interaction at 200% zoom.

For the mobile dock/menu verify:

- exactly one active destination;
- last page content is not covered;
- safe-area padding;
- menu call/location links;
- drawer close/focus behavior;
- keyboard/browser toolbar changes do not displace the dock.

## Responsive evidence

Required widths:

- 320
- 360
- 390
- 430
- 768
- 1024
- 1440
- representative mobile landscape

Compare homepage, filtered results, listing detail, Import, Lease, Sell, full filters, quick filter, make/model picker, and mobile Menu against the accepted branch baseline.

## Runtime checks

- no hydration warnings;
- no React key/nesting warnings;
- no failed same-origin requests introduced by the refactor;
- no new unexpected third-party calls;
- no console exceptions while opening/closing overlays repeatedly;
- no measurable public bundle regression without an explicit explanation.

## Rollback

Keep refactor batches as separate commits. If a batch fails visual or interaction regression, revert that batch instead of layering compensating CSS or state workarounds over it.
