## Context

`AvailableCoursesView` reads the learner's catalog through `useCourseShelf`, which returns
`featured`, `otherEnrolled`, `recommended` (first level course, only with no enrollment) and
`available` (not joined, less the recommended one), with a `CourseCardModel` for every enrolled or
recommended course. The page renders three pieces over it — `CourseCinemaHero`,
`EnrolledCourseCard`, `CourseShelfCard` — none of which is used anywhere else. `useCourseShelf` is
also read by My learning, which this change leaves alone.

The target look is the design-review artifact's variants 3 (Cartelera) and 6 (Continuar primero),
in the app's Immersion Cinema tokens (`--gold`, `--primary`, `--card`, `--border`, …), so every
colour maps to an existing Tailwind token.

Course copy is localized through `courseCopy(course, locale)` over optional manifest fields plus
`translations`; the course page already reads `outcomes` through it.

## Goals / Non-Goals

**Goals:**

- Replace the page body with one lobby of equal posters plus, for a learner enrolled in nothing, the
  next-up bar above the heading.
- Add `audience` and `highlights` to the course model end-to-end (manifest → entity → `courseCopy`)
  and write them for the three tracked courses in en/es/pt.
- Remove the three components the page no longer renders.

**Non-Goals:** see the proposal; notably My learning and `useCourseShelf`'s shape stay as they are.

## Decisions

### D1. A pure `courseLobby` orders the posters

`src/lib/course-lobby/course-lobby.ts` exports
`courseLobby(enrolled, courses): LobbyEntry[]`, where
`LobbyEntry = { kind: "enrolled"; model: CourseCardModel } | { kind: "joinable"; view: CourseForView }`.
It keeps `enrolled` (`[featured, ...otherEnrolled]`) in the order given, then every catalog view not
among them, sorted by `course.sequence`. Taking the catalog views rather than `recommended` matters:
a `CourseCardModel` carries no `CourseForView`, and a joinable poster needs one for its facts,
artwork and prize count.

*Alternative:* add a `lobby` field to `useCourseShelf`. Rejected — it would widen a hook My learning
shares for one page's layout.

### D2. The next-up bar reuses the recommended `CourseCardModel`

`shelf.recommended` is already the first level course read "as if joined": its `target` is the first
video (kind `start`), `tally` is 0 of N with the course's full runtime left. `NextUpBar` takes that
model, so the bar and a started course would never disagree on the first video. The view renders it
only when `shelf.recommended !== null`, which `courseShelf` guarantees only with no enrollment — the
optimistic enroll flips it off with no extra state. The bar sits above the `<header>` inside the same
section so the page's heading order stays h1 → posters' h2.

*Alternative:* a separate "first video" lookup via `courseFirstVideo`. Rejected — duplicates what the
model already carries and loses the time-left tally.

### D3. Components

| Component | Path | Story title |
| --- | --- | --- |
| `CoursePoster` | `src/components/course-poster/course-poster.tsx` | `Components/CoursePoster` |
| `CourseBrief` | `src/components/course-brief/course-brief.tsx` | `Components/CourseBrief` |
| `NextUpBar` | `src/components/next-up-bar/next-up-bar.tsx` | `Components/NextUpBar` |

`CoursePoster` takes a `LobbyEntry` and renders one of two bodies over a shared frame (at least 3:4 from `lg`, at
least 22 rem below, always a band of artwork above the copy so a long brief grows the poster instead
of covering its chips; artwork with a bottom-up fade; `data-testid="course-poster"`). The lobby is
one column below `lg` and three from `lg`: at `md` three columns are too narrow for the brief. Enroll
calls the existing `enrollInCourse(slug)`; links use `lessonPath` / `courseOverviewPath` from
`@/i18n/lesson-routes` through `@/i18n/navigation`'s `Link`. Its title is an `h2` (the page's h1 is
the heading). `CourseBrief` takes `course` and reads `courseCopy(course, useLocale())`, rendering
nothing when both fields are empty. `ProgressRing` is reused with `glow={false}` over artwork.

Messages: `Components.CoursePoster`, `Components.CourseBrief`, `Components.NextUpBar` in en/es/pt;
the unused keys of `AvailableCoursesView` and the three removed components' namespaces are deleted.
The prize count on a joinable poster is `coursePrizes(view, emptySet).length` — the same rule the
course overview counts by.

### D4. Manifest fields

`Course` gains `audience: z.string().min(1).optional()` and `highlights: CourseHighlights.optional()`
(`z.array(z.string().min(1))`); `CourseTranslation` gains both. `CourseManifest` and
`flattenCourseManifests` pass them through exactly as they pass `outcomes`. `CourseCopy` gains
`audience: string | undefined` and `highlights: ReadonlyArray<string>`. Content: the artifact's
Spanish copy is the starting point, with en and pt written to match.

The design review's `Cinema/` prefix is reserved for design-system primitives; these are page
components like the ones they replace, so their stories use `Components/`.

### D5. Removals

`CourseCinemaHero`, `EnrolledCourseCard` and `CourseShelfCard` (+ stories, tests, messages) are
deleted once nothing imports them. `CinemaHeroArtwork` stays (the course page uses it).
`useCourseShelf` drops `isFeaturedWatched` and `highestEnrolledLevel`, which only those sections read.

## Risks / Trade-offs

- [16:9 thumbnails cropped to 3:4 can cut faces] → `object-[center_25%]`, as in the artifact; checked
  in the browser for all three courses.
- [Three posters wrap to two rows with a fourth course] → the grid wraps; accepted by the proposal.
- [e2e specs locate removed test ids] → `available-courses.spec.ts` and
  `course-detail-page.spec.ts` move to `course-poster` / `next-up-bar`.

## Migration Plan

UI-only plus optional content fields; no data migration. Rollback is a revert.

## Testing strategy

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| Manifest accepts/rejects `audience`, `highlights` (+ translations); tracked manifests declare them in es/pt | Vitest unit | `course-manifest-schema.test.ts`, `flatten-course-manifests.test.ts`, `content-manifest.test.ts` |
| `courseCopy` returns audience/highlights with fallback | Vitest unit | `course-copy.test.ts` |
| `courseLobby` ordering (last watched first, catalog order, recommended merged back) | Vitest unit | `course-shelf.test.ts` |
| `CourseBrief`, `CoursePoster` (both kinds, resume line, completed, reference, enroll), `NextUpBar` | Vitest + RTL | `course-cinema-hero.test.tsx`, `course-shelf-card.test.tsx` |
| `AvailableCoursesView`: bar only with no enrollment, poster count/order, pending placeholders | Vitest + RTL | `available-courses-view.test.tsx` |
| Enroll from a poster persists; Preview does not enroll; bar for a new learner opens the first video | Playwright | `available-courses.spec.ts`, `course-detail-page.spec.ts` |

Visual check of `/es/courses` in both states, desktop and phone, with Playwright MCP.
