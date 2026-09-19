# Decision register

These are planning recommendations unless marked as an existing repository contract. An implementation request must still define the slice being authorized.

| ID | Decision / recommendation | State | Consequence |
| --- | --- | --- | --- |
| D01 | Keep Next/React/TypeScript, Tailwind v4 and pnpm/Turbo; reuse next-forge boundaries | Proposed, supported by audit | No rewrite or major upgrade sweep |
| D02 | Public dealer website in `web`; dealer workspace in `app`; agency prospects/provisioning in Cars | Proposed; Cars ownership already established | Avoid mixing two different kinds of leads |
| D03 | Separate website kind, data mode, services, theme and server readiness | Proposed high priority | Gradual compatibility migration from `staticDemoMode` |
| D04 | Preserve current mobile patterns; desktop is not approved | Current user direction | Separate mobile-parity and desktop-design acceptance |
| D05 | Keep existing token foundation; add only missing semantic roles | Proposed | No competing theme registry or global palette rewrite |
| D06 | Light public canvas plus deliberate inverse hero/header; admin mode independent | Proposed; owner confirmation needed | Do not silently enable/disable public dark preferences |
| D07 | Header and hero share an intentional composition; search belongs in it | Proposed | Review flow and overlap with real cards/art before rollout |
| D08 | Four vs five wide desktop cards determined by accepted layout and useful card width | Open visual choice | No universal column-count hardcoding |
| D09 | Reuse existing `Lead`/`Conversation`; dealer inbox is not an agency CRM | Proposed | Extend actual workflow before inventing tables |
| D10 | Retain complete workspace until proven pruning and root/Cars contract change | Existing contract | Optional does not mean immediately deletable |
| D11 | Two fictional brands and mounted-copy validation required | Proposed release gate | Schema/asset changes must remain adaptable |
| D12 | Main-only, one writer, no incidental publication of unpublished work | Existing contract / safety | No new branch/worktree or force push |
| D13 | Initial reuse stays approved snapshot/dealer copies, not a new runtime multi-tenant platform | Proposed | Central hosted control plane is a later product decision |

## Decisions to resolve before the affected phase

Before desktop rollout: approve the actual header/hero/search/card composition and wide-grid density. Before public theme behavior changes: decide whether the public website genuinely offers dark mode. Before dealer workflow: approve permissions for viewing contact data, assignment, exports and settings publication. Before all-service inbox integration: define persistence and success semantics for general/import/sell/finance enquiries. Before live release: choose actual providers, data ownership, retention and operational responsibility.

Proceed with reversible foundations while these decisions are open. Do not hide an unresolved choice inside a “cleanup” commit. No production/provider choice is settled merely because next-forge contains an integration package.
