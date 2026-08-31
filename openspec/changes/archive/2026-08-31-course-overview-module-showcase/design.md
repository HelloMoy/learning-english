## Context

The course overview renders one `PosterCard` per module in a 5-column grid. `PosterCard` was built for the home page's featured artwork and carries the visual grammar of a single playable item: a 16:9 artwork box, an oversized gold number, and a play circle. Reused for modules, that grammar asserts "one video" three times over, and the `Module` badge — the only counter-signal — is the smallest, dimmest element on the card. The `Season 1 · N episodes` heading above the grid states the same wrong thing in words.

Two facts found while investigating shape the design:

**The data is already loaded and thrown away.** `find-course-for-view.ts:60-67` calls `deps.lessons.listByCourse(course.id)` and uses the result only to compute `firstLesson`. Every module's lesson count, duration, runtime and poster is already in memory. Building the preview costs no additional I/O.

**The vocabulary is already broken.** `course-overview.tsx:62` passes `course.moduleCount` to `t("season")` — episodes are modules. `module-overview.tsx:144` passes `lesson.sequence` to `t("episode")` — episodes are lessons. The two pages contradict each other, and the contradiction is on the exact navigation step where the misreading happens.

The real content constrains the layout. Lessons per module: 4, 13, 6, 1, 6, 10, 31, 7, 13, 16 (107 total). Module durations run 28 to 635 minutes. Lesson titles are bimodal — 30 are ≤12 characters ("Intro", "Day 1", "Fast /i/"), 24 are ≥35 ("I'd, you'd, we'd — all the WOULD contractions"). In modules 7 and 8 — 38 lessons, 36% of the course — titles share a long prefix and differ only in a trailing number: "Common English Expressions 1" is 28 characters with the digit at position 27, so truncation at 16, 20 or even 26 characters leaves six visually identical tiles.

## Goals / Non-Goals

**Goals:**

- Make a module's plurality visible, stated and navigable, using three redundant signals so no single one has to carry the meaning: the gallery (you see several, in order), the count line (you are told), and a navigation verb (you are not offered playback).
- Fix the `Episode` collision so a term denotes one level everywhere.
- Keep every module reachable in sequence, with its ordinal legible regardless of how titles truncate.
- Extend the existing read model rather than adding a repository round-trip.

**Non-Goals:**

- Renaming domain types. `Module` and `Lesson` keep their names; component names follow the domain (`module-showcase-card`), user-facing strings follow the new vocabulary.
- Making the gallery a complete index of a module. It is a bounded preview; module 7 has 31 lessons.
- Special-casing the single-lesson module.
- Touching progress, resume, or the lesson page.

## Decisions

### D1 — A sibling component, not another `PosterCard` mode

`ModuleShowcaseCard` is new, under `src/components/module-showcase-card/`, alongside `.test.tsx` and `.stories.tsx`.

`PosterCard` already exposes 16 props across five orthogonal axes (`framed`, `showMeta`, `showPlay`, `aspect`, `size`, `numberPosition`, …). The showcase is a two-panel horizontal layout with an embedded child list — not a poster with different options. Adding a `variant="showcase"` would mean most existing props become meaningless in that mode, which is the shape of a component that wants splitting.

*Alternative considered:* extend `PosterCard`. Rejected — it would couple the home page's featured artwork to changes in the course overview, and `PosterCard` remains in use on the home page and as the module overview's hero.

### D2 — The card is a container, not a link

This is the decision with the widest blast radius, and it deliberately contradicts a pattern the codebase documents twice.

`poster-card.tsx:22-25` states that the inner play circle can be decorative *because* the whole card is a `Link` whose accessible name is the title. `module-overview.tsx:40-47` hides row thumbnails with `aria-hidden` + `tabIndex={-1}` *because* they duplicate a destination the row already exposes.

Both rest on the same premise: the inner element carries no information the outer control doesn't.

The card holds a heading, a count line, a call to action and a body of artwork. Wrapping all of it in one `Link` makes its accessible name the concatenation of every one of those — a paragraph announced as a link name, per card, ten cards deep. That is the case against the single-link pattern here, and it holds regardless of what the artwork turned out to be.

So the card is a `<div>`. The module title is the link (wrapping the heading), and the CTA is a second link to the same destination. Two links per card, both announced with the module title as their name.

*Trade-off:* the whole-card click target is lost, which is a real regression on touch. Mitigated by making the CTA a full-width, `min-h-11` target on small screens.

*History:* this decision was originally argued from the artwork carrying lesson titles, which made it non-redundant content that could be neither swallowed by a link nor hidden. The artwork lost its labels in D3 and became a gallery in D9, so that particular argument no longer applies — but the conclusion stands on the accessible-name grounds above.

### D3 — The gallery is decorative, and not interactive

**Revised twice during implementation.** Tiles were first built as list items carrying an ordinal, an image and a lesson title; the labels were then removed; the grid then became a gallery (D9).

Removing the labels inverted D2's premise for the artwork itself. The gallery no longer carries information found nowhere else — what it communicates, "this module holds several videos in order", the count line beside it states outright, and every lesson it previews is listed with title and runtime on the module overview one click away. It is therefore decorative and marked `aria-hidden`, which is exactly how `module-overview.tsx:40-47` already treats its row thumbnails and for exactly the same reason. Announcing six unlabelled images per card, ten cards deep, would be noise.

This does mean the front card's title and clock are visible but unannounced. That is the one deliberate concession: adding a bare "Introducción 05:44" into the card's announced content, with no context to hang it on, reads worse than omitting it, and the same fact is a click away in a properly labelled list.

The remainder disclosure (`+25 more`) stays outside the hidden region: it is the only textual signal that a module holds more than the gallery shows.

Cards are non-interactive, with no hover affordance and no cursor change, so they do not advertise interactivity they lack.

*Consequence for D2:* with the mosaic decorative, wrapping the whole card in a single `Link` becomes viable again, which would restore whole-card click. Not done — the CTA would have to stop being a link to avoid nesting, and the current two-link container works. Worth revisiting if touch ergonomics matter more than the button.

### D9 — A receding gallery, not a grid

**Superseded the mosaic during implementation.** Lessons are laid out as landscape cards receding to the right: each narrower and darker than the one in front, all sharing one perspective rotation, overlapping slightly.

The grid was abandoned after several rounds of trying to match a masonry reference. The sticking point was always the same: a masonry needs tiles of differing shape, differing shape means re-cropping, and these posters are text-bearing title cards, not scenery. A 5:4 crop turns "INTRO" into "NTRO" and "Que Necesitas?" into "Que Necesita". Every workaround traded away either the layout or the artwork.

A gallery dissolves that conflict rather than managing it. Cards are landscape, matching the posters' own orientation, so shape variation comes from *size* rather than from re-cropping and the artwork survives intact.

Geometry lives in one `DECK` constant block, derived from each card's index: a falloff in flex ratio, a matching falloff in shading, one shared `rotateY`, and descending `z-index` so each card is overlapped by the one in front. Nothing is randomised — the server and client must emit identical markup or hydration tears.

Two sizing rules were learned the hard way on screen:

- **Sizes are flex ratios, not pixels.** A pixel-sized gallery overflowed the panel and printed itself over the module title.
- **Height comes from width via `aspect-ratio`.** Setting height from a fixed stage while width came from flex let the two disagree, which quietly turned the cards portrait and cropped the posters all over again — the exact failure the gallery was adopted to avoid. A `max-width` also bounds a lone card so a one-lesson module does not stretch one image across the panel.

Cards carry a visible edge and a shadow thrown onto the card behind, so one card is legibly distinct from the next rather than dissolving into a strip of images.

### D10 — The gallery carries no text at all

Cards went through labels and back: first an ordinal and a title per tile, then a title and runtime on the front card only, and finally nothing. What settled it is that a label has to survive the smallest card in the row, and the rear cards are narrow by construction — a title there wraps into an unreadable stack or truncates to nothing useful.

So the artwork is the whole of it. The module's own ordinal sits outside the panel, the count line states how many videos and how long, and the module overview names every lesson properly. Nothing the labels carried is lost; it is only stated where there is room to state it.

This is what keeps the gallery decorative and therefore `aria-hidden` (D3). It also meant reverting two things added for the labelled version: `LeadingLesson.durationSeconds` and a `formatClock` helper, both removed once nothing consumed them rather than left in the read model as dead weight.

### D4 — The ordinal renders inside the component, outside the frame

`ModuleShowcaseCard` renders an `<Eyebrow>` with `Lesson N` followed by its bordered panel. The ordinal is visually outside the card but owned by the component, so callers cannot forget it and the numbered-index reading is guaranteed by construction.

Placing the ordinal outside the frame — rather than inside as the reference mockup does — is what makes it immune to the truncation problem: it never competes with a title for horizontal space.

### D5 — The read model gains `ModuleSummary`

`CourseForView` grows a `moduleSummaries` field keyed by module id, each entry carrying `lessonCount`, `totalDurationSeconds`, and `leadingLessons` (the first N in `sequence` order, with title and poster).

The grouping happens in the use case, from the array already fetched at line 62. The component receives finished data and does no aggregation. A test asserts `listByCourse` is called exactly once, so a future refactor cannot quietly turn this into an N+1.

`leadingLessons` is capped in the domain rather than sliced in the component, so the view cannot accidentally serialise 31 lessons' worth of data into the client payload for one card.

*Alternative considered:* a new `ModuleRepository.summarize()` port. Rejected — it would add a round-trip for data already in hand, and summarisation is view-shaping, not persistence.

### D6 — Six tiles, three columns, remainder disclosed

Full-width card at `max-w-7xl` minus `px-11` is 1192px; a ~45/55 split gives the mosaic ~510px usable. Three columns with gaps put each tile at ~162px, which at 12px type fits ~24 characters per line — two lines cover the 45-character p90. Two rows of three is six tiles.

Below `lg` the card stacks vertically and the mosaic drops to two columns; below `sm`, to one.

When a module holds more than six lessons the card discloses the remainder (`+25 more`) rather than letting six tiles imply the module holds six. Modules 2, 6, 7, 9 and 10 all exceed six, so this is the common case, not an edge.

### D7 — Duration formatting is a shared, hours-aware helper

`src/lib/format-duration/format-duration.ts` turns seconds into localized parts. Module 10 runs 635 minutes; rendering that as `635 min` is technically true and practically useless. Above an hour it produces an hours component.

The helper returns structured values for the message catalogue to interpolate rather than building strings itself, so pluralisation stays in ICU messages across the three locales.

### D8 — Vocabulary lives in the message catalogues only

The rename touches `src/messages/{en,es,pt}.json` and the `t()` keys that read them. `src/domain/**` is untouched. This is the hexagonal boundary paying off: user-facing naming is a delivery concern, and the domain never knew the word "episode".

Keys renamed: `season` and `episodesGridLabel` are removed; `moduleLabel` becomes the module ordinal; `episode` becomes the video ordinal. New keys cover the count line, the CTA and the remainder disclosure.

## Risks / Trade-offs

- **The page becomes roughly 2.7× taller** (from a 5×2 grid to 10 stacked rows) → Accepted deliberately: clarity over density for a 10-module course. Flagged as the thing to revisit first if the catalogue grows past ~25 modules, where a collapsed or paginated variant would be needed.

- **Losing whole-card click hurts touch users** → The CTA becomes a full-width `min-h-11` target below `sm`, and the module title is independently tappable.

- **Six posters × ten modules = 60 images on one route** → All are `next/image` with explicit `sizes`, none marked `priority`, so they lazy-load below the fold. The existing `PosterCard` comment already establishes that only above-the-fold artwork gets `priority`; the same rule applies here.

- **Gallery cards look clickable but are not** (D3) → No hover state, no pointer cursor. If user testing shows people clicking them anyway, D3 flips to links — the card is already a container, so nothing structural blocks it.

- **The rename touches two specified capabilities at once** → Doing it in one change is what avoids an intermediate state where the new card says "6 videos" while the module overview still says "Episode N", which is the cross-page inconsistency being fixed. The cost is a wider diff in `src/messages/`.

- **Existing component tests assert the old copy and the poster grid** → `course-overview.test.tsx` is largely rewritten and `module-overview.test.tsx` needs its eyebrow assertions updated. Both mock `next-intl` with a key-echoing implementation, so assertions are on message keys rather than English strings — which limits the churn to keys that actually changed.

## Migration Plan

Presentation-only; no data migration and no persisted state. Sequence:

1. Domain first — extend `CourseForView` with `moduleSummaries` and its tests. Nothing consumes it yet, so this lands green on its own.
2. `format-duration` helper with its unit tests.
3. `ModuleShowcaseCard` plus stories and component tests, developed against the real distribution (1, 6 and 31 lessons as story fixtures).
4. Message catalogues in all three locales.
5. Swap `CourseOverview` to the showcase list; rewrite its tests.
6. Rename `Episode N` → `Video N` in `module-overview.tsx` and its tests.
7. `pnpm verify`, then a visual pass on `/en/courses/advanced-intermediate-course` and the `es` locale.

Rollback is a git revert — no schema, no stored state, no external contract.

## Testing strategy

**Vitest unit — domain and helpers**

- `find-course-for-view.test.ts` (extend existing): summaries reflect per-module counts and summed durations; a module with no lessons yields a zero summary rather than being omitted; `leadingLessons` respects the cap and `sequence` order and carries each lesson's poster, absent for reading lessons; `LessonRepository.listByCourse` is called exactly once (spy assertion, guarding D5 against an N+1 regression).
- `format-duration.test.ts` (new): sub-hour, exactly 60 minutes, 635 minutes, zero, and the 59m30s case that must roll into an hour rather than read "60 min". Table-driven, mirroring the style of `resolve-content-row.test.ts`.

**Vitest component + RTL**

- `module-showcase-card.test.tsx` (new): renders the ordinal outside the framed panel; renders one card per leading lesson; asserts the gallery recedes monotonically (each card narrower, darker, further back), stays landscape, bounds a lone card, carries no text at all, and is `aria-hidden` (D3), while the remainder disclosure stays outside the hidden region; discloses the remainder when lessons exceed the cap; renders a one-card gallery for a one-lesson module; asserts the card exposes exactly two links, both naming the module (D2); falls back to the gradient when a lesson has no poster.
- `course-overview.test.tsx` (rewrite): one card per module in sequence; no season heading; no `Module` badge; "Start course" still targets the first lesson.
- `module-overview.test.tsx` (update): rows labelled with the video-ordinal key rather than the episode key; every other assertion unchanged.

All three follow the established pattern in `course-overview.test.tsx` — `vi.mock("next-intl")` with a key-echoing `useTranslations`, so assertions bind to message keys and survive copy edits.

**i18n consistency**

- A test asserting `en.json`, `es.json` and `pt.json` share an identical key set under the touched namespaces, and that no catalogue still contains a season or episode key. This is what makes the `course-vocabulary` requirement enforceable rather than aspirational.

**Storybook**

- `module-showcase-card.stories.tsx`: `SingleLesson` (module 4), `Typical` (module 3, six lessons), `Overflowing` (module 7, 31 lessons), `LongDuration` (module 10, 635 min), and `MissingPoster`. Real titles, runtimes and posters from the seed. `Overflowing` and `SingleLesson` are the two to check the sizing against — the widest and narrowest galleries the real course produces.

**Playwright e2e**

- `e2e/course-overview.spec.ts` (new, mirroring `course-catalog.spec.ts`): the route renders ten ordinals in order; a card's CTA navigates to its module overview; the gallery renders real images (non-zero `naturalWidth`, catching a broken `BlobStore` URL that jsdom cannot); no season or episode text is present in `en` or `es`.
