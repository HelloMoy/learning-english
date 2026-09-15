## Context

`ModuleOverview` (`src/components/module-overview/module-overview.tsx`) is a Server
Component rendering a header and a `<ul>` of identical rows. Progress reaches the page
through two per-row client islands: `LessonCompletionMark` and `LessonWatchProgress`,
both reading `useLessonWatchState`, which combines the completion store
(`use-lesson-completion`) and the playback-position store (`use-saved-playback-positions`)
through `countsAsComplete` / `watchedFraction` in `src/lib/watch-progress`.

The chosen "E · Ruta" design needs state that no single row can compute on its own:
which lesson is *current* depends on every earlier lesson, and the panel needs module
totals. That forces the progress-dependent part of the page to be one client subtree
fed by one derivation.

Constraints: hexagonal boundaries (no domain changes are needed — `Lesson` already
carries `durationSeconds` and `poster`), next-intl for every string and number, the
folder-per-entity rule, and the existing "absence is the neutral state" rule for
anything read from `localStorage`.

## Goals / Non-Goals

**Goals:**

- One pure derivation from (lessons, completion set, positions) to route state, unit
  tested in isolation.
- One client subtree for the route and the panel; header and back link stay on the
  server.
- Pixel intent of the canvas's "E · Ruta" artboards on the existing dark tokens.

**Non-Goals:**

- Sections/groups inside a module, resource (PDF) counts — see proposal Non-goals.
- Changing completion or position storage, or the finish threshold.
- Light-theme tuning.

## Decisions

### D1 — Derive route state in a pure function in `src/lib/module-route`

`deriveModuleRoute(lessons, progress)` returns
`{ steps: { lessonId, state: "finished" | "current" | "upcoming", watchedFraction }[],
finishedCount, lessonCount, secondsLeft }`. It reuses `countsAsComplete` and
`watchedFraction`, so "finished" means exactly what it means everywhere else.

*Current* is found from an *anchor*. The anchor is the **last opened** lesson — the
continue-watching record — when it points into this module; otherwise the **furthest**
lesson, the highest `sequence` with any progress (finished, or watched fraction > 0).
If the anchor is unfinished it is current; if finished, the first unfinished lesson after
it; if none follows, the first unfinished lesson in the module; with no anchor, the first
lesson.

`deriveModuleRoute` takes the last opened lesson as an optional `lastOpenedLessonId` on
`LearnerProgress`. It checks membership against the module's own lessons, so a record
for another module or course — or a lesson that no longer exists — is simply not an
anchor, and no slug comparison is needed.

The rule went through three versions in this change, each driven by a real path through
a module:

- *Rejected — first unfinished lesson in sequence:* assumes videos are watched in order.
  A learner who skipped to video 25 and finished 25–27 was featured video 3.
- *Rejected — furthest progress alone:* fixes skipping ahead, but a learner who then
  went back and watched videos 1–2 was still featured video 28. Per-lesson progress
  carries no time, so "furthest" cannot see a return to the start.
- *Chosen — last opened, falling back to furthest:* the continue-watching record is
  written when a lesson page mounts (`RememberContinueWatching`), so it is the only stored
  signal of *when*. Its limits are handled by the fallback: it holds one course-wide slot,
  so a learner who moved on to another module leaves this one with no record, and the
  furthest-progress rule answers instead.

Trade-off accepted: opening an earlier video to review it moves the current lesson back
to that point. A review and a return to the start look identical in storage, and the
learner who returns to the start is the case the product must not get wrong.

`splitRuntime(seconds)` → `{ hours, minutes }` lives beside it so messages can format
"2 h 39 min" through ICU plurals rather than string concatenation.

### D2 — One hook, `useModuleRoute`, gated on hydration

`src/hooks/use-module-route/use-module-route.ts` reads `useCompletedLessons`,
`useSavedPlaybackPositions`, `useIsHydrated` and the continue-watching record through
`useContinueWatching`, and returns a typed reading: `{ isRead: false }` until hydrated
**and** the record has been read, otherwise `{ isRead: true, route }`. The record's read
is asynchronous (the port returns a `Promise`), so it is loaded in an effect; waiting for
it keeps the featured card from appearing on the furthest lesson and then jumping to the
last opened one. It mirrors
`use-module-watch-progress`. A distinct "not read yet" value (not an all-upcoming state)
keeps "not read yet" apart from "nothing watched", which the panel needs to decide
between no figures and 0%. A discriminated value rather than `null`, per the project's
"never return null" rule.

*Alternative:* let the server snapshot (empty store) drive the first render. Rejected: it
would feature video 1 and state 0% in the first frame for a learner on video 9.

### D3 — Component split

| Component (folder = file) | Kind | Responsibility |
| --- | --- | --- |
| `module-overview/module-overview.tsx` | Server | Back link, eyebrow, title, videos-and-runtime line; lays out the grid; mounts `ModuleRoute` |
| `module-route/module-route.tsx` | Client | Calls `useModuleRoute` once; renders the panel slot and the ordered steps with the rail |
| `module-route-step/module-route-step.tsx` | Presentational | One step in `finished` / `current` / `upcoming` form, marker included |
| `module-progress-panel/module-progress-panel.tsx` | Presentational | Ring, percentage, `N of M videos` or completed label, time left; figure-less when given no progress |

The panel and steps are presentational and receive plain props, so their tests and
stories need no storage. `LessonCompletionMark` and `LessonWatchProgress` stop being used
by the module overview; they are removed only if no other caller remains.

### D4 — Layout

The page container widens from `max-w-5xl` to `max-w-7xl` to match the site header and the
artboard. Below `lg` the panel renders first, above the route. From `lg` a two-column
grid `grid-cols-[minmax(0,1fr)_340px]` places the panel in the right column
(`lg:order-last`) with `lg:sticky lg:top-24`. DOM order stays panel → route so the
figures are read before the list on every width.

### D5 — The rail is drawn per step

Each step draws its own connector below its marker; a finished step's connector is gold,
others use the border token. No measuring, no absolutely positioned full-height line, so
wrapping titles and the expanded card never desynchronise the rail.

### D6 — One control per step

Upcoming and finished steps keep the existing `STRETCHED_HIT_AREA` pattern on their
trailing action; the featured card applies it to its primary action. Thumbnails and the
poster stay `aria-hidden` with `tabIndex={-1}`. Markers are decorative except the
finished marker's `sr-only` localized name.

### D7 — Ring

Inline SVG circle with `stroke-dasharray`, `aria-hidden`; the percentage is text formatted
with `format.number(fraction, { style: "percent" })`.

### D8 — Copy

New keys under `CourseCatalog.moduleOverview` in `en`, `es`, `pt`: `moduleEyebrow`,
`runtime`, `stats`, `youAreHere`, `continue`, `start`, `watchAgain`, `minutesLeft`,
`progressHeading`, `videosFinished`, `timeLeft`, `moduleCompleted`. The finished marker
reuses `Components.LessonCompletion.completed`. The now unused `lessonCount`-only
eyebrow copy is removed if nothing else reads it.

## Risks / Trade-offs

- [Layout shift on hydration: steps collapse and one card expands after the first frame]
  → Accepted as the cost of not asserting false progress; the card animates in with
  `motion-safe` only, and the panel reserves its height.
- [Client subtree grows: the whole route now hydrates, not two small islands] → Lessons
  are plain serializable objects (≤ 25 per module); no extra fetch. Measured on the
  25-video module before archiving.
- [Posters on every upcoming step on phones increase image requests] → `next/image` with
  `sizes` of the rendered thumbnail width, lazy by default.
- [e2e selectors tied to the old rows] → `module-overview` test id and the "Watch video"
  label are kept on upcoming steps, so `one-click-navigation` and `course-overview`
  assertions keep working; any other failure is updated in the e2e task.

## Testing strategy

| Behaviour | Layer | Where / pattern mirrored |
| --- | --- | --- |
| Step states, current rule, finished count, time left, `splitRuntime` | Vitest unit | `src/lib/module-route/module-route.test.ts`, mirroring `src/lib/watch-progress/watch-progress.test.ts` |
| `null` before hydration, derived state after, reacts to storage | Vitest hook | `src/hooks/use-module-route/use-module-route.test.ts`, mirroring `use-module-watch-progress.test.ts` (seed `localStorage`, `refreshSavedPlaybackPositions`) |
| Step variants: thumbnail presence, labels, one link, finished accessible name, card bar/labels | Vitest + RTL | `module-route-step.test.tsx`, mirroring the `next-intl` mock in `module-overview.test.tsx` |
| Panel: percentage, count, completed label, figure-less state | Vitest + RTL | `module-progress-panel.test.tsx` |
| Route composes steps from stored progress; first frame asserts nothing | Vitest + RTL | `module-route.test.tsx` |
| Header server content, runtime line, back link, no hero tile | Vitest + RTL | `module-overview.test.tsx` (rewritten) |
| Real page: featured card after seeding storage, panel beside route at 1440 and above at 390, no horizontal scroll, one-click row navigation | Playwright | new `e2e/module-route.spec.ts`; re-run `one-click-navigation.spec.ts`, `course-overview.spec.ts`, `course-catalog.spec.ts` |

Visual review against the canvas artboards is done with Playwright in the browser, at
1440px and 390px, dark theme.
