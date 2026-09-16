## Context

The Achievements page is the end of a road. A learner arrives from the waiting-prize dialog, claims the
prize, watches the reveal, closes it — and is left on the shelves. The reveal dialog says so in its own
documentation today: *"it is the payout, so it leads nowhere: one control closes it and leaves the
learner on the counter"*. That was a defensible reading of a celebration; it is a poor reading of the
moment, which is the likeliest a learner will ever be to start the next lesson.

Everything needed to offer the way back already exists and is used by My learning:

- `useResolvedContinueWatching({ continueWatching, resolve })` reads the device's record and resolves it
  through a Server Action into a `ContinueWatchingPanel` carrying `lessonHref` and `lessonTitle`, in
  three honest states: `none`, `resolving`, `resolved`.
- `homeFirstLesson(entries)` projects the catalog's first lesson, for a learner with nothing started.
- `AchievementsPage` is already a thin server shell that resolves the catalog and hands it to the
  client view.

So this change adds no machinery. It decides **where the destination is computed, how it is offered in
two places, and what is shown before it is known.**

## Goals / Non-Goals

**Goals:**

- One destination, decided once, offered both on the page and in the reveal.
- Reuse the continue-watching record exactly as the rest of the app reads it — one definition of "where
  I left off".
- Never guess or silently change the destination under the learner's finger.
- Leave the page usable for a learner who has claimed but started nothing.

**Non-Goals:**

- Changing how the continue-watching record is written or resolved.
- Navigating for the learner (no autoplay, no redirect after a claim).
- Offering a choice among courses — that stays My learning's job.
- Touching the shelves, the claim, the ticket notification or the waiting-prize announcement.

## Decisions

### D1 — The destination is resolved once by the view, not by the dialog

`AchievementsView` calls `useResolvedContinueWatching` and derives a single destination, which it both
renders in the page's closing action and passes to `PrizeRedeemedModal` as a prop.

- *Alternative:* let the modal resolve it itself. Rejected: it would fire a Server Action round-trip
  inside a celebratory dialog — the destination would arrive mid-animation, and "where I left off" would
  have two sources of truth on one page.

### D2 — While the record resolves, the action is reserved, not guessed

`resolving` renders the action's shape without a destination, exactly as My learning reserves
`ResumePanelSkeleton`. The learner never sees an action whose target changes.

- *Alternative:* render the fallback immediately and swap it for the resumed lesson when it arrives.
  Rejected: the link changes under the finger — the worst outcome is a learner who aimed at their lesson
  and landed on lesson one.

### D3 — With nothing started, the action offers the first lesson

The server page resolves `homeFirstLesson(entries)` and passes it down, as the home and My learning
already do. `none` — no record, a stale record, or a resolver failure — offers that lesson.

- *Alternative:* hide the action when there is nothing to continue. Rejected: that is precisely the
  learner this change exists for — someone who claimed a prize and has no obvious next step.

### D4 — The reveal keeps its closing control and gains the onward one beside it

`Close` stays the dialog's primary, filled control and keeps its celebratory copy; the new control sits
beside it in the quieter, gold-link treatment `ResumePanel` already uses for its secondary way out. The
dialog therefore never offers two equal primary actions.

This reverses the "leads nowhere" decision deliberately, so the component's JSDoc and the requirement
sentence that records it are both amended rather than left contradicting the code.

- *Alternative:* make **Continue** the primary control and demote the close. Rejected for now as a
  bigger change to a celebration the learner asked for — see Open Questions.

### D5 — Choosing the onward control settles the dialog before navigating

The counter shows the reveal with `NiceModal.show(...).then(() => focusPrize(moduleSlug))`. The onward
control resolves and hides the modal as `Close` does, then navigation proceeds; the trailing
`focusPrize` lands on a document already being replaced, which is harmless but must not be relied on.
Focus return on the closing path is unchanged.

### D6 — The action names where it is going

Resolved, it names the lesson being continued; falling back, it names the course being started. The copy
lives under `Achievements.*` for the page and `Components.PrizeRedeemedModal.*` for the dialog, in
`en`/`es`/`pt`.

## Risks / Trade-offs

- **Two in-flight changes describe the same reveal requirement** → this change amends the single
  sentence ("with one control that closes it") in the unarchived `learner-achievements` spec, and both
  changes are re-validated with `openspec validate --strict`.
- **A stale record pointing at a lesson no longer in the catalog** → `resolveContinueWatchingPanel`
  already answers `null` for that, which is the `none` path: the first lesson.
- **Hydration mismatch** → the hook starts at `none` by design, and the server renders the same fallback
  state it renders on the client's first pass.
- **A Server Action round-trip on a page that did not make one before** → it is the same call My
  learning makes, it is not on the page's critical path, and the reserved state is what the learner sees
  until it answers.

## Migration Plan

None. This is additive UI over an existing device record: nothing is stored, no data shape changes, and
reverting the change removes the two controls and nothing else.

## Testing strategy

- **Vitest + RTL — `src/components/achievements-view/achievements-view.test.tsx`** (extends the existing
  suite, which already renders under `NuqsTestingAdapter` with injected repositories): the action is
  reserved while the record resolves; it offers the resumed lesson once resolved; it offers the first
  lesson when there is nothing to continue; and the same destination reaches the reveal dialog. Fakes for
  `continueWatching` and `resolve` are injected as props, mirroring `my-learning-view.test.tsx`.
- **Vitest + RTL — `src/components/modals/prize-redeemed-modal/prize-redeemed-modal.test.tsx`**: the
  dialog offers both controls with accessible names, Escape still closes it, the closing path still
  returns focus to the prize, and the onward control points at the destination it was given.
- **Playwright e2e — `e2e/achievements.spec.ts`** (extends "The Achievements page"): claiming a prize and
  then choosing to continue lands the learner on a lesson page.
- **Stories**: `achievements-view.stories.tsx` gains the resolved and nothing-started states;
  `prize-redeemed-modal.stories.tsx` shows the dialog with the onward control.
- **Localization** is covered as the suites already cover it — an `es` rendering assertion on the page
  and the shared key-parity guard in `src/messages/messages.test.ts`.

## Open Questions

- Should **Continue** eventually become the reveal's primary control, with the celebratory close demoted?
  D4 says no for now; it is a one-line change of treatment if the answer turns out to be yes.
