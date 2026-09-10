# Partner onboarding and inventory-feed requirements

## Verification before publication

AutoMarket should verify the contracting organization and its right to represent the relevant brand in Bulgaria before showing an importer/distributor verification state. Minimum evidence:

1. Registered legal entity name, company identifier, billing address, and authorized signatory.
2. Manufacturer-controlled or official local-brand evidence connecting that entity to Bulgaria.
3. Official domain and organizational contact route.
4. Named operational owners for inventory, leads, aftersales facts, finance disclosures, and data protection.
5. Written permission for supplied copy and media, including geographic and duration limits.

Verification must record the evidence URL or document, reviewer, review date, scope, and next review date. Dealer verification, official-import status, and paid placement are separate states.

## Onboarding sequence

1. Confirm legal entity, representation scope, brands, dealer network, and pilot owners.
2. Agree the stock scope: Bulgarian physical stock, demonstrators, inbound allocated vehicles, and factory-order vehicles must be distinguishable.
3. Map a sample of 10 records and resolve taxonomy, price, warranty, delivery, and media issues.
4. Validate a full feed in a non-public environment and return row-level errors.
5. Obtain publication approval for the mapped sample and public organization profile.
6. Publish the agreed stock set and test lead routing end to end.
7. Monitor daily feed health during launch week, then move to the agreed cadence.

## Required inventory fields

| Area | Required fields |
| --- | --- |
| Identity | partner vehicle ID, VIN or privacy-safe stable stock ID, brand, model, variant/trim, model year |
| Vehicle | powertrain, fuel/energy type, power, transmission, body type, doors, seats, exterior/interior colour |
| EV/hybrid | usable battery capacity where officially supplied, electric range and test cycle, charging power, connector type; for PHEV/REEV, combined-system facts and fuel engine details |
| Condition | new/demonstrator/used, registration date where applicable, mileage and unit, damage/repair disclosure |
| Commerce | gross consumer price, currency, VAT status, price-valid-from date, mandatory fees, optional equipment pricing |
| Availability | stock status, physical city/site, quantity or unique unit, expected delivery window, last-confirmed timestamp |
| Ownership support | warranty scope/duration/mileage, battery warranty, roadside support, service locations, parts-support route |
| Finance | product type, deposit, term, monthly amount, final payment, interest/APR where applicable, total payable, eligibility and validity date |
| Media | rights-cleared image URLs, ordering, alt description, primary image, usage expiry or restriction |
| Routing | responsible dealer/site, quote/test-drive destination, approved contact channel, lead-routing key |
| Governance | created/updated timestamps, deletion status, source system, partner approval state |

## Feed contract

- Preferred launch formats: UTF-8 CSV over an agreed secure transfer or a documented HTTPS JSON feed. Manual spreadsheets are acceptable only for the sample and early pilot.
- Stable unique keys are mandatory. Updates must be idempotent; missing rows must not silently delete stock.
- Full snapshot and incremental semantics must be declared explicitly.
- Prices use numeric values plus currency, VAT treatment, and effective date; display strings alone are rejected.
- Dates and timestamps use ISO 8601 with timezone where relevant.
- Enumerations and units use the agreed mapping table; unknown values return a validation error rather than being guessed.
- Image URLs must be HTTPS, fetchable by the agreed ingestion service, and licensed for marketplace use.
- Partner feed data is not silently enriched into warranty, service, availability, or finance claims.

## Freshness and error handling

- Recommended stock refresh: at least daily; higher-frequency updates for sold/reserved status.
- Each import returns accepted, rejected, warning, and unchanged counts plus row-level reasons.
- A stale-feed threshold and escalation owner are agreed before publication.
- Sold, reserved, withdrawn, and price-changed vehicles must be represented explicitly.
- AutoMarket should suppress materially stale stock instead of displaying plausible but unverified availability.

## Lead and privacy requirements

- Record a lawful purpose, privacy notice, retention period, routing destination, and deletion process before collecting personal data.
- Route only the fields required for the requested quote or test drive.
- Agree acknowledgement and follow-up expectations, business hours, retry/escalation handling, and duplicate-lead logic.
- Never place personal contact details or lead data in inventory feeds or public asset metadata.
