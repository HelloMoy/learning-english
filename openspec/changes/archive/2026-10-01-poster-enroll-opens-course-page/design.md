## Context

`CoursePoster` (`src/components/course-poster/course-poster.tsx`) draws each course of the Available
courses lobby. Its joinable reading — a course the learner has not joined — ends in two actions:

- **Enroll**, a `<button>` whose `onClick` calls `enrollInCourse(course.slug)` from
  `use-enrolled-courses`. That writes the course into the learner store optimistically, calls
  `enrollInCourseAction`, and rolls back when the server refuses. Because `AvailableCoursesView` reads the
  store, the poster re-renders as an enrolled poster, moves among the enrolled courses, the summary count
  rises and the next-up bar leaves.
- **View details**, a locale-aware `Link` to `courseDetailPath(course)` — `/courses/<slug>/about`.

The course page at that route (`course-detail-page`) already renders `CourseEnrollAction` in its hero,
enroll card and phone bar, and that action already enrolls.

The change moves the decision to enroll onto the course page: the poster's **Enroll** stops enrolling and
opens the course page instead.

## Goals / Non-Goals

**Goals:**

- **Enroll** on a joinable poster opens `/[locale]/courses/[courseSlug]/about` and enrolls nothing.
- The poster looks the same: same label, same icon, same primary styling, same place.
- The learner enrolls on the course page with the action that is already there.

**Non-Goals:**

- Any change to `CourseEnrollAction`, `enrollInCourse`, `enrollInCourseAction` or the learner store.
- Any change to enrolled posters, the lobby order, the summary or the next-up bar's own markup.
- Removing or rewording **View details**.
- New message keys.

## Decisions

### Enroll becomes a `Link`, not a button that navigates

The primary action renders as `Link` from `@/i18n/navigation` with `href={courseDetailPath(course)}`,
keeping the `PRIMARY_ACTION` classes, the `Plus` icon and the `enroll` message.

*Why over `useRouter().push` in an `onClick`:* it is navigation, so it should be an anchor — it works
before hydration, supports open-in-new-tab and middle-click, is prefetched by Next, and announces itself
as a link. It also mirrors the sibling **View details** and the enrolled poster's actions, which are all
`Link`s, and reuses `courseDetailPath` so the route is spelled in one place.

*Consequence:* `JoinablePoster` no longer imports `enrollInCourse`. `PRIMARY_ACTION` keeps
`cursor-pointer`, which is redundant on an anchor but shared with the enrolled poster's primary link.

### The label stays "Enroll"

The action keeps the `Components.CoursePoster.enroll` message (`Enroll` / `Inscribirme` /
`Inscrever-me`). The request is to change where the button leads, not what it says, and the label still
describes the learner's intent — the course page is the first step of enrolling.

*Alternative considered:* rewording to something like "See course". Rejected: it would duplicate **View
details** in wording as well as in destination, and it is not what was asked.

### View details stays

Both actions now share one destination. **View details** is kept because removing it is a layout and copy
decision the request did not make; it is raised under Open Questions.

### No return trip after enrolling

After enrolling on the course page the learner stays there, in its enrolled state, exactly as
`course-detail-page` already specifies ("Enrolling keeps the learner on the course page"). The page then
offers **Start course**. No redirect back to Available courses is added.

### The next-up bar requirement loses its "leaves at once" clause

`AvailableCoursesView` still derives the bar from the learner store, so the code path that hides it when
an enrollment appears is unchanged. But no action on the page enrolls any more, so the scenario
"Enrolling removes the bar" cannot be reached from the page and is removed from the spec together with
the clause that described it. "An enrolled learner sees no bar" still covers the rule.

## Testing strategy

- **Vitest component + RTL — `course-poster.test.tsx`.** Replace "WHEN Enroll is activated THEN the
  learner is enrolled at once AND it is saved" with two specs that mirror the neighbouring "WHEN View
  details is read THEN it opens the course page": **Enroll** is a link whose `href` is
  `/courses/advanced-intermediate-course/about`, and activating it calls no `enrollInCourseAction` and
  leaves `learnerStore`'s `enrolledCourses` without the course. One more spec renders in `es` and reads
  the link by its Spanish name. These go red first (today it is a button that enrolls).
- **Vitest component + RTL — `available-courses-view.test.tsx`.** Drop the three specs that depend on the
  poster enrolling ("its poster reads Enrolled at once", "the enrollment is refused", "the next-up bar
  leaves"). Replace them with one: activating **Enroll** on the Advanced poster leaves the summary at
  `3 courses · you’re enrolled in 1` and the poster not marked Enrolled. Change the "every course is a
  joinable poster" assertion from three `button`s named Enroll to three `link`s.
- **Playwright e2e — `e2e/available-courses.spec.ts`.** Replace "WHEN the learner enrolls from a poster
  THEN it reads Enrolled AND stays after a reload" with the whole journey, which only a browser can
  cover: Enroll on the Advanced poster lands on `/en/courses/advanced-intermediate-course/about` with the
  database still holding only the Basic enrollment; **Enroll** on that page enrolls; back on
  `/en/courses` the Advanced poster reads Enrolled. Remove "WHEN they enroll from a poster THEN the
  next-up bar leaves". Reuse the file's `learnerState` fixture and `COLD_ROUTE` timeouts. A second spec
  covers "Enroll is locale-aware" on `/es/courses`: the global `@/i18n/navigation` mock renders a plain
  anchor in Vitest, so only a browser sees the `/es` prefix.
- **Storybook — `course-poster.stories.tsx`.** No new story; the `Joinable` story's description is
  updated, and the poster is checked in the browser with Playwright MCP in `en` and `es`.
- No unit-layer tests: no pure function changes.

## Risks / Trade-offs

- [Two actions on one poster open the same page] → Accepted for this change; see Open Questions. Each
  keeps a distinct accessible name, so neither is ambiguous to assistive technology.
- [A learner expects one click to enroll and now needs two] → This is the requested behavior; the course
  page's **Enroll** is in the hero, above the fold, and in the phone bottom bar.
- [Specs elsewhere assumed the poster enrolls] → Checked: only `available-courses` describes it;
  `course-enrollment` and `course-detail-page` do not mention the poster.

## Migration Plan

A single front-end change with no data migration. Rollback is reverting the commit.

## Open Questions

- Should **View details** leave the joinable poster now that **Enroll** opens the same page? This change
  keeps it. Removing it would leave **Enroll** as the poster's only action and is a small follow-up.
