## Why

The module overview is where a learner works through a lesson's videos, one ticket at a time, and it is
the one place that says nothing about the prize those tickets are for. The learner sees `11 of 17
videos` but not that the eleven tickets already point at a prize, nor — once the last video is watched —
that a prize is waiting on the counter. The reward only surfaces in a toast on the lesson page and on
the Achievements page, away from the route where the learner decides to keep going.

The approved design explorations (options 1 and 2 of the "Premio de la lección · Vowels" canvas) put the
prize in two places on this page: beside the progress, and at the end of the route. Both must keep the
counter's surprise: the prize stays the same silhouette the counter shows until it is claimed there.

## What Changes

- The **progress panel** gains a prize row under the progress figures: the module's prize drawn as the
  counter draws it, with the tickets collected and what is still needed.
- The **route ends at the module's prize**: after the last video the rail continues into a final prize
  marker and card — a goal to walk towards, not another video step. The marker carries a trophy icon.
- Both surfaces follow the module's existing prize state (`locked`, `collecting`, `ready`, `claimed`):
  - **locked / collecting** — the silhouette, the name withheld as `???`, the tickets as `N / M`, and how
    many tickets are left;
  - **ready** — still the silhouette and `???`, stating every ticket is collected, with a **Claim prize**
    text link — styled like the page's other secondary text links, not a button — that opens the
    Achievements counter asking for this module's prize (the same destination the prize-ready dialog
    uses);
  - **claimed** — the coloured illustration, its name, and that it was redeemed.
- Once every ticket is collected, the route's finale offers **Start Lesson NN →** as its primary action,
  leading to the next lesson of the course the way the course overview's tile for that lesson does; the
  last lesson of a course has no next lesson and offers none.
- No prize state, ticket count or action is shown until the learner's progress has been read, as with
  the rest of the route and panel; the panel keeps the row's shape with the silhouette meanwhile.
- Copy localized in `en`, `es` and `pt`.

## Capabilities

### New Capabilities

<!-- None: the module overview already belongs to cinema-module-overview, and the prize rules to
     learner-achievements. -->

### Modified Capabilities

- `course-platform-domain`: `findModuleForView` also names the course's next lesson (module) that holds
  videos, with its lessons, so the page can offer it.
- `cinema-module-overview`: the progress panel shows the module's prize, and the route ends at it. The
  existing requirements about steps, the featured card, the panel's figures and the first frame are
  unchanged; the prize finale is explicitly not a lesson step.

## Non-goals

- **Claiming on this page.** The Claim prize action only leads to the counter; the claim and its reveal
  stay on the Achievements page.
- **Sharing the prize.** No share action on either surface for now.
- **A second definition of tickets or prize state.** Both surfaces read `learnerAchievements` through the
  existing stores; no new store, key or rule.
- **Changing the progress figures.** The panel keeps counting videos finished now; tickets stay earned
  after an un-mark, so the prize row may read `17 / 17` while the panel reads `16 of 17 videos`, exactly
  as the counter already does.
- **Other surfaces.** Lesson page, course overview, counter and dialogs are unchanged.

## Impact

- `src/domain/use-cases/find-module-for-view/` — resolves the next module holding lessons.
- `src/i18n/lesson-routes.ts` — `moduleEntryPath`, the course overview tile's rule for where a lesson (module)
  starts, shared with this page.
- `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/page.tsx` and `module-overview.tsx` — pass the
  next lesson down to the route.
- `src/hooks/use-module-prize/` (new) — this module's prize, state and tickets from
  `useLearnerAchievements`, for one module.
- `src/components/module-route/module-route.tsx` — reads the prize once and hands the same reading to the
  panel and to the route's finale; renders the finale after the list of steps.
- `src/components/module-progress-panel/module-progress-panel.tsx` — renders the prize row it is handed.
- `src/components/module-prize/` (new) — one component drawing the prize in its two layouts, the panel
  row and the route finale, with stories, tests and JSDoc.
- Reuses `PrizeIcon`, `prizeForModule`, the `.lesson-ticket` and `.prize-glow` styles unchanged.
- `src/messages/{en,es,pt}.json` — `Components.ModulePrize`; the counter's own `Components.PrizeShelfItem` wording and
  `Components.PrizeIcon.names` are reused so both pages say the same thing.
- `module-route.fixtures.ts` gains ticket and claim seeding; `e2e/module-route.spec.ts` covers the states.
