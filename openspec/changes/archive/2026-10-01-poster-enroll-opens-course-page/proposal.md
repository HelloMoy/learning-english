## Why

On Available courses (`/[locale]/courses`), **Enroll** on a poster enrolls the learner on the spot, before
they have seen what the course teaches, how long it runs or what its syllabus holds. The course page at
`/[locale]/courses/[courseSlug]/about` already answers those questions and already carries its own
**Enroll**. Joining a course should happen there, as an informed choice, not as a one-click side effect of
the lobby.

## What Changes

- **BREAKING** (behavior): **Enroll** on a not-joined poster no longer enrolls. It becomes a locale-aware
  link that opens the course page at `/[locale]/courses/[courseSlug]/about`, where the existing enroll
  action does the enrolling.
- The poster no longer turns into an enrolled poster in place, and no optimistic enrollment or rollback
  happens on Available courses.
- The next-up bar no longer leaves the page in response to a poster's **Enroll**, because nothing on the
  page enrolls any more. It still renders only for a learner enrolled in nothing.
- **View details** on the poster is kept as it is; it opens the same course page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `available-courses`: the requirement "A course the learner has not joined is offered on its poster"
  changes **Enroll** from an optimistic enrollment to a link to the course page, and the requirement
  "A learner enrolled in nothing is shown the first step" drops the bar leaving on a poster enrollment.

## Non-goals

- Changing the course page (`course-detail-page`) or its enroll action: it enrolls exactly as today.
- Changing how enrollment is stored, the `enrollInCourse` client function or `enrollInCourseAction`
  (`course-enrollment`).
- Changing the first-course step of onboarding, which keeps enrolling on its own action.
- Changing enrolled posters, the lobby order or the page summary.
- Rewording or removing **View details**, or changing the poster's layout or copy.
- Sending the learner back to Available courses after they enroll on the course page.

## Impact

- `src/components/course-poster/course-poster.tsx` — the joinable poster's primary action, and its JSDoc.
- `src/components/course-poster/course-poster.test.tsx` and `course-poster.stories.tsx`.
- `src/components/available-courses-view/available-courses-view.test.tsx` — the specs that enroll from a
  poster.
- `e2e/available-courses.spec.ts` — the two specs that enroll from a poster.
- `openspec/specs/available-courses/spec.md` on archive.
- No message keys, routes, server actions, database or dependencies change.
