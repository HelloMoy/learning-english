## Why

The guide teaches four taps, but iOS 26 Safari requires five. A screen recording of the
real device (11 Sep 2026) shows that choosing **Share** opens the share sheet **collapsed**:
the header, the app row, and a row of round actions ending in **View More**. «Add to Home
Screen» is not on that screen at all — it only appears after the learner taps **View More**
and the sheet expands into its list.

So the guide's third step tells the learner to "scroll the list and choose Add to Home
Screen" while their phone is showing a sheet that has no such list and nothing to scroll.
That is the exact failure the guide was built to prevent — it is why step one names «···»
instead of a share glyph — reappearing one step later.

## What Changes

- The flow becomes **five taps**: «···» → Share → **View More** → Add to Home Screen → Add.
- A new depicted surface: the **collapsed share sheet**, with **View More** picked out —
  the last item in the round-action row, where iOS actually puts it.
- The existing share-sheet depiction becomes explicitly the **expanded** sheet: the same
  header, app row and action row, now with the list below it. The learner sees the sheet
  they tapped *grow*, which is what tapping View More does.
- New copy in `Components.AddToHomeScreenGuide`, in **all three locales**: the iOS label
  (`iosViewMore`) and the instruction (`stepViewMore`).
- The step counter reads "Step N of 5" without being touched — it counts `INSTALL_STEPS`.

Not breaking: the guide's public surface (`GuideAutoplay`, `GuidePhoneScreen`) is unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `add-to-home-screen-guide`: the requirement *The guide teaches the four taps iOS actually
  requires* changes to five taps, naming **View More** between Share and Add to Home Screen,
  and the depiction requirement gains the collapsed share sheet as a surface of its own.

## Non-goals

- Detecting whether a given learner's share sheet is already expanded. iOS remembers the
  expansion per device, so some learners will not need the tap. The guide teaches the flow
  from a clean sheet, which is the state it cannot know it is not in; a tap on an
  already-expanded sheet's «View Less» is recoverable, a missing step is not.
- Any change to the header control, the dialog, the swipe gesture, the timer, or the result
  frame.
- Redrawing the share sheet's app row or header. Only the actions row and the list below it
  are affected.
- Re-recording or shipping the reference video; it stays a source, not an asset.

## Impact

- `src/components/add-to-home-screen-guide/install-steps/install-steps.ts` — a fifth step,
  and a new `InstallStepSurface` member.
- `src/components/add-to-home-screen-guide/guide-phone-screen/guide-phone-screen.tsx` — the
  collapsed share sheet, and the action row gaining a labelled View More in both sheets.
- `src/messages/{en,es,pt}.json` — two new keys per locale.
- Tests colocated with both files, plus the stories, which enumerate the surfaces.
- No domain, adapter, or route changes.
