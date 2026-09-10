# Reuse guide

`darkapoparka/cars-template-modern` is the reusable master for `modern`. Do not build a dealer by editing this repository's `main` branch in place.

For a lead, create a clean copy, follow `docs/LEAD-BUILD.md`, personalize the existing composition, run `docs/QA.md`, and commit the result to the dealer project/repository. For a shared design/system improvement, work here and keep the result dealer-neutral and reusable.

The normal dealer portfolio uses three independent designs: `auto-best`, `carwow`, and `modern`. `import` is a conditional fourth for businesses whose real proposition includes vehicle sourcing/import/transport/order-from-Europe.

Preserve provenance and licenses. Never copy secrets, `.git`, deployment bindings, dependencies or generated caches into a lead copy. Historical pre-split reuse instructions are archived under `docs/legacy/from-cars-2026-09-10/` and are not current policy.
