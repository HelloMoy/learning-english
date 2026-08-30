## Why

The "Resume from MM:SS" prompt is the only modal in the app, and it is not a
modal at all: `lesson-video-resume.tsx` hand-rolls a `<div role="dialog">` with
raw `<button>` elements and inline Tailwind. It has no portal, no overlay, no
focus trap, no Escape-to-close, no `aria-modal`, and no accessible title or
description element — it only *claims* the dialog role. A screen-reader or
keyboard learner can tab straight past the prompt into the page behind it, and
there is no way to dismiss it.

The project already decided how modals are built: `AGENTS.md` §Modals mandates
`@ebay/nice-modal-react` paired with a shadcn `<Dialog>`, and its example
imports `@/components/ui/dialog`. That file does not exist — `src/components/ui/`
contains only `button/`. As a result `<NiceModal.Provider>`, mounted in
`global-providers.tsx`, is dead code that nothing has ever used. The convention
is unenforceable until the primitive exists, so the next modal will be
hand-rolled too.

## What Changes

- Add the shadcn `Dialog` primitive at `src/components/ui/dialog/dialog.tsx`,
  built on the `radix-ui` unified package already in use by `button.tsx`
  (`import { Dialog as DialogPrimitive } from "radix-ui"`). No new dependency.
  Exports `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogClose`,
  `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`,
  `DialogTitle`, `DialogDescription`.
- Restyle the primitive's defaults onto the project's own tokens (`border`,
  `bg-card`, `radius`, `ring`, the Immersion Cinema surface treatment) rather
  than shipping stock shadcn neutrals — the primitive must look like this
  product, not like a starter template.
- **BREAKING (UX)**: the resume prompt becomes a real centered modal — dark
  backdrop over the whole viewport, focus trapped in the card, Escape and
  backdrop-click dismiss it. It no longer renders as a non-blocking card
  anchored over the top of the video. The two actions ("Resume from MM:SS",
  "Restart from beginning") and the MM:SS formatting are unchanged.
- Move the prompt to `src/components/modals/lesson-video-resume-modal/` and
  build it with `NiceModal.create` + `useModal`, per `AGENTS.md` §Modals.
  `PlaybackPositionedVideoPlayer` stops rendering it as a child and instead
  calls `NiceModal.show(...)`, awaiting the learner's choice. This makes the
  mounted provider live and establishes the pattern for every future modal.
- Extract the pure threshold logic (`isPositionResumable`,
  `MIN_SECONDS_FROM_START`, `SECONDS_NEAR_END`) out of the component into
  `src/lib/playback-resume-thresholds/`, so the player can gate on it without
  importing a modal component.
- Dismissing the modal without choosing (Escape, backdrop, close button) is
  equivalent to "Restart from beginning": the video stays at `0`. The learner is
  never trapped.

## Capabilities

### New Capabilities

- `ui-dialog-primitive`: the project's shadcn `Dialog` primitive and the
  `NiceModal` + `Dialog` composition contract that every modal in the app must
  follow — accessible structure, dismissal semantics, theming on project tokens,
  and the imperative `NiceModal.show()` trigger.

### Modified Capabilities

- `playback-position`: the requirement "The Lesson Page offers to resume from
  the saved position when within sensible bounds" currently specifies a
  non-blocking *overlay*. It becomes a modal dialog with focus trap and
  dismissal, and gains a requirement for what dismissal-without-choosing means.
  The threshold rules (`< 30s`, within last `10s`, no stored position) are
  unchanged.

## Non-goals

- Converting `OutlineDrawer`'s mobile `<details>` accordion into a Dialog or
  Sheet. It is a deliberate, documented design decision and is not a modal.
- Adding any other shadcn primitive (`Sheet`, `AlertDialog`, `Popover`,
  `Drawer`). Only `Dialog` is in scope; the rest arrive when a feature needs them.
- Building a demo or example modal that exists only to exercise `NiceModal`.
  The resume modal *is* the first real consumer.
- Changing the resume thresholds, the debounced write cadence, the
  `localStorage` adapter, or anything else about how the position is persisted.
- Changing the copy of the resume prompt beyond adding the accessible
  description that `DialogDescription` requires.

## Impact

**New files**

- `src/components/ui/dialog/dialog.tsx` (+ `.stories.tsx`, `.test.tsx`)
- `src/components/modals/lesson-video-resume-modal/lesson-video-resume-modal.tsx`
  (+ `.stories.tsx`, `.test.tsx`)
- `src/lib/playback-resume-thresholds/playback-resume-thresholds.ts` (+ `.test.ts`)

**Modified**

- `src/components/lesson-view/playback-positioned-video-player/playback-positioned-video-player.tsx`
  — drops the `savedPosition` render branch and the `LessonVideoResume` child;
  calls `NiceModal.show()` from the mount effect instead. Its test file needs a
  `NiceModal.Provider` wrapper.
- `src/messages/{en,es,pt}.json` — the `Components.LessonVideoResume` namespace
  is renamed to `Components.LessonVideoResumeModal` and gains a `description`
  key (for `DialogDescription`) and a `closeLabel` key (for the close button's
  `sr-only` text). A `Components.Dialog.closeLabel` key covers the primitive's
  default close affordance in all three locales.
- `openspec/specs/playback-position/spec.md` — via the delta spec.

**Deleted**

- `src/components/lesson-view/lesson-video-resume/` (component, test, stories) —
  replaced by the modal under `src/components/modals/`.

**Dependencies** — none added. `radix-ui@^1.6.0`, `@ebay/nice-modal-react@^1.2.13`
and `lucide-react@^1.21.0` are already installed.

**Risk** — `NiceModal.show()` renders through a portal at the provider root, so
the modal escapes the player's `relative` wrapper. Any test or e2e selector that
scoped the resume prompt to the player subtree must query the document instead.
