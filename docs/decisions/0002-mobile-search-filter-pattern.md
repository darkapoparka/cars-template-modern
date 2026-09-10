# Decision 0002: Mobile Search And Filter Pattern

## Status

Accepted.

## Decision

AutoMarket mobile marketplace pages will use a compact two-row sticky search pattern:

1. Primary row with vehicle category selector on the left, global search in the center, and full filter button on the right.
2. Quick chip row below with Make and model, location, price, year, fuel, transmission, and sort.

## Context

The legacy prototype explored two patterns:

- a buy page with "Browsing / All Vehicles" and search/filter combined in a pill.
- a lease page with a cleaner compact left selector, center search, right filter button, and chips below.

The user prefers the existing compact AutoMarket styling and specifically rejected generic image-generated mobile UI. The `/lease` styling is the best reference.

## Rationale

Vehicle category is not the same as text search. Category should remain an explicit control. Search should stay free text. Make/model and other structured refinements should remain visible as chips, not hidden in a single search field.

This gives buyers quick access to the most important filters while keeping the header compact enough for mobile.

## Consequences

Positive:

- faster category switching.
- clearer structured filtering.
- better mobile scanability.
- aligns with the existing prototype styling.
- avoids overloading search.

Tradeoffs:

- requires careful responsive layout so the top row does not feel cramped.
- chips must be thoughtfully ordered.
- selected chip labels need truncation rules.

## Implementation Rules

- Left selector opens vehicle classes: Cars, Trucks, Motorbikes, and Vans.
- Lease is a global marketplace mode/navigation destination, not a vehicle class inside the category selector.
- Search input remains free text.
- Right icon opens full filter sheet.
- Make/model opens a drill-down sheet.
- Location, price, year, fuel, and sort open focused drawers.
- Chips scroll horizontally and must not wrap into multiple rows by default.
- Use accessible labels for icon-only controls.
