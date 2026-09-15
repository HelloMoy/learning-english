## Context

The locale home (`src/app/[locale]/page.tsx`) is a thin server shell that resolves the
catalog through `findCourseCatalog` and hands it to `HomeView`, which composes
`CinemaHero`, `ContinueWatching` and `CourseLadder` → `CourseLevelCard`. Whether a
learner is "returning" is only knowable in the browser: `useContinueWatching` reads a
`ContinueWatchingLocation` from `localStorage`, and `resolveContinueWatchingPanel`
(a `next-safe-action` Server Action) turns it into titles and an href. Per-lesson
progress is already derived client-side by `useCourseWatchProgress` from saved
playback positions and completion marks (`watch-progress` capability).

The chosen design (canvas pages "D · Final" and "D · Returning learner → R1") is an
editorial page in the Immersion Cinema tokens, light and dark, desktop and mobile.
Its two states share a skeleton — hero with the vowel-length card, a middle section,
the levels table, a closing band — and differ in what each slot says.

Constraints: hexagonal boundaries (domain imports only `zod`/`neverthrow`), every
string through `next-intl` in `en`/`es`/`pt`, TDD, folder-per-entity, stories + JSDoc
for every reusable component, and no new port unless required.

## Goals / Non-Goals

**Goals:**
- One home component tree that renders the new-visitor state on the server and
  switches to the returning state after the continue-watching record resolves, without
  flashing a state it cannot justify.
- Reuse the existing continue-watching resolution and the existing progress rule, so
  the home can never disagree with the course overview or the lesson outline.
- A self-contained, accessible, testable vowel-length card with real audio.

**Non-Goals:**
- Cross-device progress, a quiz, more minimal pairs, studio recordings (see proposal).
- Changing course/module/lesson routes, the header, or theme tokens.

## Decisions

### D1 · The state lives in one client hook, the server renders the new visitor

`useHomeLearnerState({ continueWatching?, resolve? })` returns a discriminated union:
`{ status: "new-visitor" } | { status: "resolving" } | { status: "returning"; panel }`.
It starts at `new-visitor` (the server render and the hydration pass), moves to
`resolving` as soon as storage reports a record, and to `returning` or back to
`new-visitor` when the Server Action answers.

- *Why server-render the new visitor:* crawlers and first-time visitors — the majority
  of cold traffic — get the full editorial copy in HTML, and `generateMetadata` already
  describes that page. A returning learner sees the resolving placeholder one effect
  tick after hydration, which is the same trade the current `ContinueWatching` panel
  makes.
- *Alternative rejected:* render the placeholder until storage answers. It delays the
  page for every new visitor to spare returning learners a single-frame swap.
- The two injectable parameters mirror `ContinueWatching`/`CourseLadder`, so tests
  inject fakes instead of driving `localStorage` or the action.

### D2 · `HomeView` becomes the client switchboard over presentational sections

`page.tsx` stays a server component: it resolves the catalog and passes plain props.
`HomeView` (client) calls `useHomeLearnerState` once and renders either
`NewVisitorHome` or `ReturningLearnerHome`; each composes presentational sections that
receive data by props and are individually testable and story-able:

| Section | New visitor | Returning |
| --- | --- | --- |
| `EditorialHero` | welcome copy + primary link to the first lesson | "Welcome back" + `ResumePanel` |
| `VowelLengthCard` | eyebrow "Hear the difference" | eyebrow "Quick review" |
| middle | `LearnerQuestions` | `CourseProgressList` |
| `LevelsTable` | every course "View course" | course in progress marked |
| `ClosingBand` | "Eight minutes…" → first lesson | "N videos left in …" → Resume |

- *Why one switch instead of per-section client islands:* the four slots change
  together; a single state source keeps them from disagreeing mid-resolution.
- The resolving state renders the new-visitor middle/table/band unchanged and swaps
  only the hero for a `HeroSkeleton` of the returning hero's shape — the only part whose
  wording would otherwise change under the learner.

### D3 · The catalog projects the whole structure the progress list needs

`CourseCatalogEntry` gains `modules: Module[]` (all, in `sequence` order) and
`lessonRuntimes: LessonProgressSlice[]` where
`LessonProgressSlice = { id; moduleId; durationSeconds }` (`0` for reading lessons),
built from the two repository reads the use case already performs. `leadingModules` is
removed — nothing previews modules any more.

`useCourseWatchProgress` widens its input from `Lesson[]` to
`ReadonlyArray<LessonProgressSlice>`; `OutlineDrawer` maps its lessons through one
`toLessonProgressSlice` helper. The counting rule (`countsAsComplete`) is untouched.

- *Why not a second action for the in-progress course:* the catalog already reads every
  lesson per course; projecting ids and runtimes costs no extra call, and the progress
  list renders from props without a waterfall.
- *Payload:* ~155 `{id, moduleId, durationSeconds}` triples across both courses —
  small, and far smaller than the lesson bodies the old `firstLesson` field shipped.
- *Alternative rejected:* a new `useCourseStructure` fetch — a round-trip and a loading
  state for data the server already had.

### D4 · The continue-watching panel reports where the lesson sits; the home counts

`findContinueWatching` is unchanged: it deliberately never enumerates the course's lessons
(`find-continue-watching.test.ts` — "does not enumerate the course's other lessons").
`ContinueWatchingPanel` gains `courseSlug`, `moduleId`, `moduleSequence` and
`lessonSequence`, all already on the entities the use case returns. The home derives the
module's lesson count from the catalog's `lessonRuntimes` (D3), filtered by `moduleId`,
so the hero renders `Lesson 2 · Video 6 of 17` and the progress list and table key the
course in progress by slug.

- *Alternative rejected:* counting inside `findContinueWatching` via
  `lessons.listByCourse`. It breaks the use case's existing guarantee to load three
  entities, for a number the home already holds.
- *Alternative rejected:* `LessonRepository.listByModule`. It widens a port for one count
  the catalog projection already answers.

### D5 · The vowel-length card plays static clips through an injectable player

`VowelLengthCard({ variant, createAudio? })` is a client component. Playback goes
through `useClipSequence(createAudio = (src) => new Audio(src))`, which plays a list of
clip ids in order, exposes the id currently playing, stops the current clip before
starting another, and returns to idle when a clip ends **or** `play()` rejects.

- Clips are static files at `public/audio/minimal-pairs/{ship,sheep}.mp3` (mono MP3,
  synthesized US English). They are UI assets like icons, not course content, so they
  do not go through `BlobStore`.
- *Alternative rejected:* the Web Speech API. Voices differ per OS and some browsers
  ship none; the contrast being taught must sound the same everywhere.
- The duration bars are static tracks with a fill that animates (`scaleX`) only while
  its word plays; `motion-reduce:animate-none` removes the motion, not the state.
- English words and IPA are not translated; labels, eyebrow, "Play both", accessible
  names and the anchor note come from `Components.VowelLengthCard`. The anchor note is
  written in each locale and compares the vowels to Spanish words in `en`/`es` and to
  Portuguese words in `pt`.

### D6 · Copy and component placement

- New keys: `HomePage.newVisitor.*`, `HomePage.returning.*`, `HomePage.levels.*`,
  `HomePage.questions.*`, `Components.VowelLengthCard.*`, `Components.LevelsTable.*`,
  `Components.CourseProgressList.*`. Keys only used by removed components are deleted
  from all three locales (`messages.test.ts` enforces parity).
- Components live under `src/components/<name>/<name>.tsx` with stories titled
  `Components/<Name>` (home sections) and colocated tests.
- `CinemaHero`, `ContinueWatching`, `CourseLadder`, `CourseLevelCard` are deleted once
  `grep` shows no caller; `resolve-continue-watching.ts` stays (the hook uses it).
- `src/app/[locale]/loading.tsx` is redrawn to trace the editorial hero and the levels
  table (loading-skeletons: "A placeholder traces the shape of what replaces it").

## Risks / Trade-offs

- [Returning learners see one frame of the new-visitor hero before the placeholder] →
  Acceptable per D1; the swap happens in the first effect after hydration and the
  placeholder has the returning hero's dimensions, so nothing below it moves.
- [Synthesized audio may not voice the vowels naturally] → Clip paths are the only
  coupling; replacing the two files with recordings needs no code change.
- [Removing four components touches existing stories/tests and e2e] → Removal is its own
  task after the new home is green; `pnpm verify` and the e2e suite gate it.
- [Autoplay policies] → Clips only start from a click, which is a user gesture in every
  browser; a rejection returns the card to idle instead of throwing.
- [Draft courses] → The table reads the same catalog `findCourseCatalog` already filters
  for draft visibility; no new visibility rule is introduced.

## Migration Plan

Pure UI/data-shape change behind the same route; no stored data changes. The
continue-watching `localStorage` record is read unchanged. Rollback is reverting the
change set.

## Testing strategy

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `findCourseCatalog` projects `modules` and `lessonRuntimes` | Vitest unit | `find-course-catalog.test.ts` |
| `findContinueWatchingAction` panel fields (`courseSlug`, `moduleId`, sequences) | Vitest unit | `actions.test.ts` |
| Module lesson count derived from `lessonRuntimes` | Vitest unit | colocated with the helper that derives it |
| `useCourseWatchProgress` accepts progress slices | Vitest hook test | existing hook test |
| `useHomeLearnerState` transitions (none / resolving / returning / unresolvable) | Vitest hook test with injected fakes | `continue-watching.test.tsx` injection pattern |
| `useClipSequence` order, interruption, end, rejection | Vitest hook test with fake audio factory | — |
| `VowelLengthCard` names, playing state, Play both, variants, locale | Vitest + RTL + user-event | `course-level-card.test.tsx` |
| `EditorialHero`, `ResumePanel`, `LearnerQuestions`, `CourseProgressList`, `LevelsTable`, `ClosingBand`, `HeroSkeleton` | Vitest + RTL | existing colocated component tests |
| `HomeView` renders the right state per hook result | Vitest + RTL | `home-view.test.tsx` |
| Message parity across locales | Vitest | `messages.test.ts` |
| Real boot: new visitor CTA and levels rows; open a lesson → "Welcome back", position, Resume navigates; `/es` copy; clicking Play reaches a playing state | Playwright | rewrite of `e2e/home-course-ladder.spec.ts` as `e2e/home.spec.ts` |
| Home loading shell still matches | Playwright | `e2e/loading-skeletons.spec.ts` |
| Visual check light/dark, desktop/mobile | Playwright MCP (manual) | — |
