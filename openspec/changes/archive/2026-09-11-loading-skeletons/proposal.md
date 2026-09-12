## Why

On a slow mobile connection the app has no vocabulary for "loading". Measured on an
iPhone 14 at 400 kbps against a lesson route: tapping a lesson leaves the learner on the
**previous page** for seconds — no spinner, no shell, nothing — and then the whole lesson
snaps in at once. The learner reads that dead tap as a page that has no video, because
the page they are looking at genuinely does not. Once the lesson does arrive, its video
frame is an undifferentiated black rectangle for seconds more: the server-rendered player
markup contains an `<iframe>` with no `src`, an `<img class="vds-poster">` with no `src`,
and an empty layout element, so nothing paints until the Vidstack bundle hydrates and the
YouTube embed loads. A flat black box does not say "loading", it says "broken".

Learners already know what a skeleton means. The app has none — no `loading.tsx`, no
`Suspense` boundary, and no skeleton primitive anywhere in the repository.

## What Changes

- Add the shadcn `Skeleton` primitive at `src/components/ui/skeleton/`, the shared shimmer
  every placeholder in this change is built from.
- Add a `loading.tsx` for each route segment — home, course overview, module overview,
  lesson — each one a **shape-accurate** shell of the page it stands in for, not a generic
  spinner. This is what removes the dead tap: Next renders the shell the moment the
  navigation starts instead of holding the learner on the previous route.
- Reserve and dress the lesson's video frame. The 16:9 box already reserves its space
  server-side; what it lacks is anything inside it. It gains a placeholder — the lesson's
  real thumbnail where one exists, plus a play-control and control-bar silhouette — which
  is retired when the player reports it can play, not merely when React hydrates.
- Reserve the home's `Continue watching` slot with a skeleton **only when a stored
  location exists**, so the section stops shoving the course ladder down when it resolves.
- Reserve the course card's progress badge and call-to-action while the stored location is
  being resolved, so the card's primary action stops changing its wording under the
  learner's thumb.
- Give the lesson completion control a third, pre-hydration state. Today it renders
  "Mark as complete" before `localStorage` can be read, which tells a learner who already
  finished the lesson something false about their own progress.

## Capabilities

### New Capabilities

- `ui-skeleton-primitive`: the shadcn `Skeleton` component — its shimmer, its accessibility
  contract, and the folder-per-component layout, stories, tests and JSDoc the project
  requires of every reusable component.
- `loading-skeletons`: where the app shows a loading placeholder and what each one must
  look like. Covers the four route-level shells, the lesson video frame placeholder and
  its retirement condition, and the rule that a placeholder must trace the shape of the
  content it stands in for.

### Modified Capabilities

- `continue-watching`: the home panel currently renders nothing until the record resolves.
  It will reserve its slot with a placeholder while the resolution is in flight, when and
  only when a stored location exists.
- `cinema-home`: a course card currently renders the not-started state until the record
  resolves. It will reserve the badge and call-to-action instead when a stored location
  exists, rather than asserting "not started" and correcting itself.
- `cinema-lesson-view`: the video frame currently relies on the player painting its own
  thumbnail. It will carry a placeholder of its own until the player can play.
- `lesson-completion-toggle`: the control currently has exactly two states. It gains a
  third, shown only before completion can be known.

## Non-goals

- **Per-row progress indicators stay as they are.** `LessonWatchProgress`,
  `ModuleWatchProgress`, `LessonCompletionMark` and the mobile outline meter deliberately
  render nothing before hydration, each with its reasoning written down: a bar at zero
  asserts the learner has watched nothing, which may be false. Absence is already the
  honest neutral state, and a shimmer on every row of a 155-lesson outline is noise, not
  reassurance.
- **No `placeholder="blur"` on poster images.** Every `next/image` in the app uses `fill`
  inside a box with a fixed aspect ratio, so no poster causes layout shift today and each
  box already shows its own gradient while the image loads.
- **No performance work.** `generateStaticParams`, route caching, prefetch tuning, bundle
  splitting and the 166 KB course-page document are real problems and none of them are
  this change. Skeletons make the wait legible; they do not shorten it.
- **No change to the player library, the YouTube provider, or the enlarge/fullscreen
  behaviour.** The placeholder sits over the existing player and reads its events.
- **No global top-of-page loading bar or app-wide spinner.**

## Impact

- **New**: `src/components/ui/skeleton/` (component, stories, tests); four `loading.tsx`
  files under `src/app/[locale]/**`; a lesson video placeholder component under
  `src/components/lesson-view/`.
- **Modified**: `lesson-view.tsx` (the video frame and its gold title cover gate),
  `lesson-video-player.tsx` / `playback-positioned-video-player.tsx` (surfacing the
  player's readiness), `continue-watching.tsx`, `course-ladder.tsx`,
  `lesson-completion-toggle.tsx`.
- **i18n**: new keys under `Components.Skeleton` and the loading shells' accessible names,
  added to `src/messages/{en,es,pt}.json`. Story-only copy goes to
  `.storybook/messages/*` under `Stories.*`.
- **Dependencies**: none added — `Skeleton` is a shadcn copy-in with no runtime package.
