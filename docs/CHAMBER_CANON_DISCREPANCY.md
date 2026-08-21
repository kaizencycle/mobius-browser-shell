# Chamber count discrepancy (6 vs 7)

**Status:** Documented — behavior unchanged pending human disposition.

## What the code shows

| Source | Claim |
|--------|--------|
| `PUBLIC_CHAMBERS` comment | "Seven public chambers" |
| `PUBLIC_CHAMBERS` array | **6 entries**: Learn, Memory, Pulse, World, Council, Archives |
| `EXTENDED_CHAMBERS` | Includes Core (room 11), Reflect, Shield, JADE, Wallet |
| `civicRoutes.ts` hallway description | "Seven doors: … Core" |
| `Hallway.tsx` subtitle | "Seven chambers · one substrate" |
| `public/school-of-chambers.html` | Lists seven including Core |

## Interpretation

Public marketing and route copy treat **Core** as the seventh primary chamber. The onboarding grid (`PUBLIC_CHAMBERS`) currently shows six featured doors; **Core** lives only in the extended hallway grid (`EXTENDED_CHAMBERS`, not `featured`).

## Decision required (human merge gate)

- Move Core into `PUBLIC_CHAMBERS` as chamber 07, or
- Update all "seven chambers" copy to "six primary chambers + extended rooms", or
- Another canon disposition from Mobius governance.

## This PR

Does **not** resolve the discrepancy. Metadata extensions (`humanQuestion`, `intentionAction`) apply to existing arrays without moving Core.
