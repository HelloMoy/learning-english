## Why

Claiming a prize is the moment a learner is most willing to start the next lesson — and it is the
moment the application leaves them with nowhere to go. The reveal dialog closes onto the shelves, and
the only ways back into the course are the header menu or the browser's back button. The counter is a
room with one door, entered from a dialog that congratulated them.

## What Changes

- The Achievements page gains a closing action that takes the learner back into the course **where they
  left off**, read from the continue-watching record the rest of the app already keeps.
- The prize reveal dialog gains a second control beside **Close**: continue the course, to the same
  destination. This **reverses** a deliberate decision recorded in the current requirement ("with one
  control that closes it") and in the component's own documentation ("it is the payout, so it leads
  nowhere"). The reversal is the point of this change: the payout should hand the learner back to the
  course, not strand them.
- With nothing started, both actions offer the first lesson of the first course instead, so the page is
  never a dead end for a learner who has only claimed.
- While the continue-watching record is still resolving, the action is **reserved** rather than guessed,
  so the destination never changes under the learner's finger — the same rule My learning follows.
- The action's copy is localized in `en`, `es` and `pt`.

## Capabilities

### New Capabilities

<!-- None: this extends the counter and the reveal, both owned by learner-achievements. -->

### Modified Capabilities

- `learner-achievements`: the Achievements page offers a way back into the course, and the prize reveal
  offers continuing the course beside closing. The capability's base spec is still in flight in the
  `learner-achievements` change, so this change carries its delta as ADDED requirements — the same way
  `unclaimed-prize-reminder` does — and amends the one sentence of the reveal requirement that this
  contradicts, so the two in-flight changes do not disagree.

## Non-goals

- **Changing how continue-watching is recorded or resolved.** This only reads the existing record; the
  `continue-watching` capability's requirements are untouched.
- **Navigating on the learner's behalf.** No autoplay, no redirect after claiming — the learner presses
  something or stays where they are.
- **A course picker.** One destination, not a menu of courses; choosing among courses stays My
  learning's job.
- **Touching the shelves, the claim itself, the ticket notification or the waiting-prize announcement.**

## Impact

- `src/components/achievements-view/achievements-view.tsx` — resolves the continue-watching record,
  renders the closing action, and hands the destination to the reveal dialog.
- `src/components/modals/prize-redeemed-modal/prize-redeemed-modal.tsx` — a second control, the focus
  behaviour that follows from leaving rather than closing, and JSDoc that no longer claims the dialog
  leads nowhere.
- `src/app/[locale]/achievements/page.tsx` — resolves the first-lesson fallback with the existing
  `homeFirstLesson` projection.
- Reuses `useResolvedContinueWatching`, `resolveContinueWatchingPanel` and `homeFirstLesson` as they
  stand; adds no new port, adapter or store.
- `src/messages/{en,es,pt}.json` — `Achievements.*` and `Components.PrizeRedeemedModal.*`.
- Tests and stories: `achievements-view`, `prize-redeemed-modal`, and `e2e/achievements.spec.ts`.
- `openspec/changes/learner-achievements/specs/learner-achievements/spec.md` — the reveal requirement's
  "one control that closes it" sentence, amended as described above.
