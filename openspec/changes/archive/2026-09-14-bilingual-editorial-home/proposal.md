## Why

The locale home asks "where does your ear get on?" but never helps anyone answer
it: the hero has no action, the one thing that sets the product apart — one sound
per video, with notes in Spanish and English — is never shown, and the second
course is introduced by a leftover generator sentence ("Course content generated
from public/local-filesystem-lesson."). A learner who comes back gets a generic
panel above the same page a stranger sees. The "Bilingual Editorial" direction
chosen in the design canvas (pages "D · Final" and "D · Returning learner → R1")
fixes both audiences with one page that changes its lead depending on whether the
device holds a continue-watching record.

## What Changes

- The home renders in one of two states, decided in the browser from the existing
  continue-watching record:
  - **New visitor** (no record, or a record that no longer resolves): an editorial
    hero aimed at Spanish and Portuguese speakers with a single primary action to
    the Basic Course's first lesson; an interactive vowel-length card; "Three
    questions learners ask first"; the levels table; a closing call-to-action band.
  - **Returning learner** (the record resolves): a "Welcome back" hero whose one
    primary action is **Resume** on the in-progress lesson, showing where it sits
    (`Lesson N · Video M of T`); the same card relabelled as a quick review; a
    per-lesson progress list for the course being continued; the levels table
    showing that course in progress; a "keep going" band stating how many videos
    remain in the current lesson.
  - While a record exists but has not resolved yet, the hero area is reserved with
    a placeholder of its own shape rather than flashing the new-visitor hero.
- A new interactive **vowel-length card** contrasts *ship* /ɪ/ and *sheep* /i/: a
  play button per word plays a recorded clip, a duration bar fills while it plays,
  a "Play both" control plays them in sequence, and a short Spanish explanation
  anchors both vowels to *sí* and *sé*. Its copy is localized; the IPA and the
  English words are not.
- The ladder of course cards is replaced by an editorial **levels table**: one row
  per catalog course, in sequence order, with its level, title, description, lesson
  and video counts, a progress state for the course being continued, and one link.
- **BREAKING (UI):** `CinemaHero`, `ContinueWatching`, `CourseLadder` and
  `CourseLevelCard` stop rendering on the home. Their responsibilities move into the
  new sections; components with no remaining caller are removed together with their
  stories and tests.
- The Advanced Intermediate Course declares a real catalog description instead of
  the generator's default sentence.
- The continue-watching resolution additionally reports the lesson's position in its
  module and how many videos the module holds, so the hero can say `Video 6 of 17`.
- The catalog read gives the home enough of every course's structure to count
  per-lesson progress without a second round trip.

## Capabilities

### New Capabilities
- `vowel-length-card`: the interactive minimal-pair card — its content, playback
  behaviour (single, sequential, interruption), playing state, duration bars,
  localization boundaries, audio assets, and accessibility.
- `returning-learner-home`: how the home decides between the new-visitor and
  returning-learner states, what the returning state shows (resume hero, quick
  review, per-lesson progress, keep-going band), and its pre-hydration and
  resolving behaviour.

### Modified Capabilities
- `cinema-home`: the home's composition changes — the editorial new-visitor hero with
  one primary action, "three questions", the levels table replacing the ladder of
  course cards, and the closing band. The requirements "Home renders the whole
  catalog as an ordered ladder of levels", "A course card is clickable across its
  body" and "The course being continued is marked on its card" are replaced.
- `continue-watching`: "The home offers to continue the last lesson" now describes
  the returning-learner hero instead of a standalone panel, and the resolved panel
  gains the lesson's position within its module.

## Impact

- **Routes:** `src/app/[locale]/page.tsx` (composition), `src/app/[locale]/actions.ts`
  (panel shape), `src/app/[locale]/loading.tsx` if the shell traces the old ladder.
- **Domain:** `find-continue-watching` (module lesson count and position),
  `find-course-catalog` (per-course lesson runtimes and all modules). No new ports.
- **Components:** new `home-view` sections, `vowel-length-card`, levels table,
  progress list; removal of the ladder/card/hero/panel components once unused.
- **Hooks:** reuse `useContinueWatching`, `useCourseWatchProgress` (may widen its
  input to the runtime slice the catalog already projects).
- **Content:** `src/content/advanced-intermediate-course.json` description;
  new audio clips under `public/audio/`.
- **i18n:** new `HomePage.*` and `Components.*` keys in `en`, `es` and `pt`; retired
  keys removed from all three.
- **Tests:** Vitest + RTL for every new component and changed use case;
  `e2e/home-course-ladder.spec.ts` rewritten for the two home states;
  `loading-skeletons` e2e updated if the shell changes.

## Non-goals

- Syncing progress across devices or accounts — progress stays per-device.
- More than one minimal pair, a listening quiz, or recording the learner's voice.
- Producing studio recordings: the clips ship as synthesized US English audio and are
  replaced by real recordings in a later change.
- Changing the course, module or lesson pages, the site header, or the theme tokens.
- Reworking the Advanced Intermediate Course's modules or lessons beyond its
  description.
- New visual variants beyond the chosen light/dark Immersion Cinema pair.
