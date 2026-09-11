## Context

`INSTALL_STEPS` is the one place the install flow is written down: the instruction text, the
mock screen and the ordering all read from it. `GuidePhoneScreen` switches on a step's
`surface` to pick which iOS screen to draw, and `GuideAutoplay` walks the array and reports
`INSTALL_STEPS.length` as the total.

That array says four taps. The 11 Sep 2026 recording of iOS 26 Safari says five: the sheet
that **Share** opens is collapsed, and **Add to Home Screen** is not on it. The row of round
actions — Copy, Add to Bookmarks, Add to Reading List, **View More** — is the whole sheet.
Tapping **View More** expands it into the list the guide's current step three describes.

`GuidePhoneScreen.ShareSheet` already draws that action row, as four unlabelled grey circles,
*and* the list below it. So today's single depiction is the expanded sheet with its View More
anonymised — the one control that would have told the learner the sheet can grow.

Constraints that shape this: the depiction is a hand-drawn picture of someone else's UI, kept
in fixed pixels and Apple's colours deliberately; every label the learner hunts for is read
from the same message key its instruction uses; the whole component is `aria-hidden`.

## Goals / Non-Goals

**Goals:**

- The guide names every tap iOS requires, in iOS's order.
- The collapsed and expanded sheets read as one sheet growing, not two screens.
- The step total follows the array, so this change moves "of 4" to "of 5" without anyone
  editing a number.
- `View More` carries a real label in the collapsed *and* expanded sheets, in the learner's
  locale.

**Non-Goals:**

- Detecting a learner whose sheet is already expanded (see the proposal's non-goals).
- Any change to `GuideAutoplay`, the header control, the dialog, the gesture, or the timer.
- Redrawing the sheet header or app row.

## Decisions

### A fifth surface, not a variant flag on `share-sheet`

`InstallStepSurface` gains `"share-sheet-collapsed"`, and the existing `"share-sheet"` keeps
its name and its meaning (the expanded one).

*Alternative considered:* one `share-sheet` surface plus an `expanded: boolean` on the step.
Rejected — `surface` is documented as "the iOS surface a step acts on, and so the one the
guide depicts for it", and the collapsed sheet **is** a different surface to the learner: it
shows different things and answers a different tap. A boolean would also break the existing
test that every step names a distinct surface, which is the invariant that caught this class
of bug in the first place.

*Naming:* `share-sheet-collapsed` rather than `share-sheet-expanded` for the new one, because
renaming `share-sheet` would touch the stories, the tests and the spec for no behavioural
gain, and "share-sheet" unqualified is the sheet the learner spends the longer step on.

### The action row is extracted and shared, not duplicated

Both sheets draw the same header, app row and action row. The requirement is that they agree,
so the shared parts become one component (`ShareSheetTop` or equivalent) that both render,
rather than two copies that can drift. The collapsed sheet is then that component alone; the
expanded sheet is that component plus the list card.

This also gives the action row one place to learn about View More: it takes the label and
whether View More is the pointed target.

*Alternative considered:* leave `ShareSheet` alone and add a separate `CollapsedShareSheet`
that redraws the top. Rejected — two hand-drawn copies of the same pixels is exactly the
drift the spec's "SHALL share their header, app row and action row unchanged" forbids.

### View More keeps its place in both sheets, but is named only in the collapsed one

Today the action row is four anonymous circles. The fourth becomes a chevron in a circle in
both states: named `iosViewMore` and pointed in the collapsed sheet, and **unlabelled** in the
expanded one, with the chevron turned over.

**Revised during implementation.** The plan was to label it in both, so the learner who
arrives by tapping it does not see it vanish. The recording says iOS relabels that control
**View Less** the moment the sheet opens, so a "View More" label on the expanded frame names
a word the learner's phone is not showing — the exact failure this whole change exists to
fix. Naming it "View Less" instead would mean translating a control the guide never asks
anyone to tap, which the `iosViewLess` alternative was already rejected for.

So the place and the chevron carry the continuity and the label does not, which is exactly
the existing rule for "controls the learner does not need": drawn at their true position and
size, unlabelled. The chevron turns over because on the real sheet it does.

The two states are told apart by which control the caller passes in, not by a flag — the
difference is a different control, not a variation on one.

### The collapsed sheet is sized by its own rows

**Added during implementation.** The first cut reused `SHEET_BASE`, which pins a sheet from a
fixed top to the bottom of the screen, and the collapsed sheet came out full-height with a
large empty area under the action row. On the device it is a short sheet with the page still
visible above it — and that is the whole visual argument for the next frame, which is the same
rows having climbed the screen with a list under them.

It therefore sets `top: auto` and keeps `bottom: 0`: its height is its content. A percentage
or a pixel top would be a number to keep in step with whatever the rows come to.

### Two new message keys, three locales

`iosViewMore` (the bare iOS control label) and `stepViewMore` (the instruction sentence),
added to `en`, `es` and `pt` — the same `targetKey` / `messageKey` split every other step
uses, so the picture and the sentence cannot name different controls.

iOS's own strings: **View More** (en), **Ver más** (es), **Ver mais** (pt).

The instruction says the sheet grows, not merely that a control exists — the learner needs to
expect the list to appear, otherwise step four looks like it arrived from nowhere.

### `stepAddToHomeScreen` is reworded

Today: "Scroll the list and choose «Add to Home Screen»." After View More the list is already
on screen and typically needs no scrolling, so "scroll" now misdescribes it in the other
direction. It becomes a straight "choose it in the list that appears", in all three locales.

## Risks / Trade-offs

- **[A learner whose sheet iOS already remembers as expanded sees no View More]** → They see
  a sheet already showing the list, with a **View Less** where the guide points. The guide
  holds each frame 3.5s and loops, so the step reads as a caption for a control they have
  already passed rather than a dead end; the next frame is the list they are looking at. The
  alternative — branching on a state the page cannot observe — is not available.
- **[Five frames plus the result is a longer loop: 21s to see it all]** → Acceptable. The
  gesture added in PR #44 is the answer to a learner who missed a frame, and this is the
  reason that gesture exists. No pacing change is bundled here.
- **[The action row gains a label where iOS draws small text]** → The depiction is already
  scaled to fit by `useFitScale`; a 7–8px label matches the home-screen icon captions the
  result frame already draws at that size.
