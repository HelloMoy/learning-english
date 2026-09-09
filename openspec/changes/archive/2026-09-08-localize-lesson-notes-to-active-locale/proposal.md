## Why

The Notes tab shows every lesson's notes twice at once — a "Español" column beside an
"English" column — regardless of the language the learner picked in the app. A learner
reading in Spanish is asked to skip half the panel; a learner reading in Portuguese is
shown two languages, neither of which is the one they chose. The app already commits to
three locales (`en`, `es`, `pt`), and lesson notes are the last surface that ignores that
choice: the header switches, the UI copy switches, the notes do not.

## What Changes

- **BREAKING (presentation):** the Notes tab stops rendering two columns. It renders the
  single language section that matches the app's active locale, filling the full width of
  the center column. The "ESPAÑOL" / "ENGLISH" column labels disappear with the columns —
  the panel is in the locale the learner already selected, so it needs no label.
- Lesson notes bodies gain a third language section, `## 🇧🇷 Português`, mirroring the
  existing Spanish and English sections across every lesson that has notes.
- The notes splitter becomes locale-aware: it recognizes Portuguese language headings
  alongside Spanish and English, and returns the section for a requested locale rather
  than a fixed ES/EN pair.
- A resolution order covers lessons whose notes do not carry the active locale: active
  locale → English → Spanish → whatever single body the file holds. The learner always
  gets readable prose, never an empty panel and never two languages at once.
- The content shape checker (`scripts/verify-notes-shape`) treats Portuguese as a
  recognized language section, so a `## 🇧🇷 Português` section is validated for
  sub-headings and prose like the other two rather than silently ignored.

## Capabilities

### New Capabilities

<!-- none: this change alters how two existing capabilities behave -->

### Modified Capabilities

- `cinema-lesson-view`: the requirement "Notes tab shows a bilingual split; Transcript is
  present but disabled" changes — the Notes tab renders one language, selected by the
  active locale, with a defined fallback order, instead of a labelled ES/EN two-column
  split.
- `course-content-storage`: the requirement "Lesson notes bodies carry explicit language
  sections" changes — Portuguese joins Spanish and English as a recognized language
  section, every lesson with notes carries all three, and the mirroring rule that today
  binds two sections binds three.

## Non-goals

- **A per-panel notes language selector.** The notes follow the app's locale switcher;
  they do not get a control of their own. A learner who wants the English notes switches
  the app to English.
- **Translating anything other than lesson notes bodies.** Lesson titles, module titles,
  course descriptions and resource names stay as they are; they live in the catalog
  manifests, not in `readme.md`, and localizing them is a separate change.
- **Enabling the Transcript tab.** It stays present and disabled — no transcript data
  exists.
- **Adding a fourth locale**, or making the language-section vocabulary configurable at
  runtime. The recognized set stays `es` / `en` / `pt`, matching `src/i18n/routing.ts`.
- **Changing how notes are stored, cached or resolved** by the blob store. Only the body
  of each `readme.md` and the presentational splitter change.

## Impact

- **Content:** every lesson `readme.md` under `public/local-filesystem-lesson/` that
  carries notes (120 files) gains a `## 🇧🇷 Português` section. Because the first `#`
  heading is untouched, the seed generator's lesson-title derivation is unaffected.
- **Presentation:** `src/components/lesson-view/split-bilingual-notes/` (the splitter, its
  name and its return type) and
  `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.tsx` (single-column
  render, no column labels, locale read from `next-intl`).
- **Messages:** the now-unused `Components.LessonTabs.spanish` / `.english` keys are
  removed from `src/messages/{en,es,pt}.json`.
- **Scripts:** `scripts/verify-notes-shape/verify-notes-shape.ts` recognizes Portuguese
  headings.
- **Tests:** unit tests for the splitter, component tests for the tab panel, and the
  Storybook stories for `LessonNotesTabs` all encode the two-column behavior today and
  are rewritten.
- **Domain:** untouched. This is a presentational transform plus content; no port, use
  case or adapter changes.
