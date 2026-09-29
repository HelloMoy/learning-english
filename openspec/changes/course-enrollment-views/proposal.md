## Why

With the Basic and Advanced Intermediate courses both in production, the platform must guide a new
learner to the right first course, let every learner see which courses they are enrolled in, and bring
them back to where they left off in whichever course they watched last. The data now exists
(`course-enrollment`); nothing shows it yet. The screens were chosen from design explorations: the
"wide cinema" Available courses page, the "Basic first" onboarding step, and the course-overview-style
My learning.

## What Changes

- **New onboarding step 3 — "Your first course"** at `/[locale]/start/first-course`. It shows only the
  first catalog course (the Basic Course) as **Recommended for you**, with its hero, the list of its
  modules, a primary **Start the Basic Course** action, and a secondary **See all courses** link. There is
  no "Not now". Finishing step 2 opens this step instead of My learning. A valid course `next` still goes
  straight to that course.
- **New page — Available courses** at `/[locale]/courses`, laid out in three sections:
  - **Featured:** the course the learner watched last, as a wide cinema hero with its progress, prizes and
    next video.
  - **Your other courses:** the learner's other enrolled courses, in compact cards with progress and
    **Continue**. A finished course reads **Completed** and offers **Watch again**.
  - **More courses:** the courses they are not enrolled in, each with **Enroll** and **Preview course**.

  A learner enrolled in nothing sees the first course featured as recommended.
- **BREAKING (My learning):** `/[locale]/learning` is rebuilt as the course-overview hero for the video to
  resume in the most recently watched course, beside that course's progress panel, followed by
  **Your courses**: one card per enrolled course, each with its own next video. The lesson-card grid and
  the courses table are removed.
- **My learning redirects:** a learner with a profile but no enrolled course is sent to the first-course
  step (without the step indicator, since they are not in the middle of onboarding).
- The avatar menu gains **Courses** (between My learning and Achievements), the header eyebrow reads
  `COURSES` on the new page, and My learning links to it with **Browse courses**.
- The course overview reads its own course's resume location instead of the single global one, so a
  learner's place in Basic survives watching Advanced.
- Onboarding step labels read "Step N of 3".

## Capabilities

### New Capabilities
- `available-courses`: the `/[locale]/courses` page, its three sections, the enroll action from the
  shelf, and its empty-enrollment state.
- `first-course-recommendation`: onboarding step 3. It shows the recommended first course, starting it
  (enroll and open its first video) and the path to all courses, and it is the destination of the
  My learning redirect.

### Modified Capabilities
- `my-learning`: the page is rebuilt around the last watched course and the list of enrolled courses,
  and redirects when nothing is enrolled; the lesson cards and courses table are removed.
- `continue-watching`: My learning's continue offer comes from the most recently watched enrolled
  course's own location, computed on the client from the course data; the course overview uses its own
  course's location.
- `learner-onboarding`: step 2 finishes into step 3, and the progress indicator counts three steps.
- `cinema-home`: the avatar menu offers My learning, Courses, Achievements and Profile, and the header
  eyebrow names `COURSES`.

## Non-goals

- Leaving a course, or ordering "Your courses" by anything other than course sequence.
- A "finished on" date for completed courses (no completion timestamp exists).
- Changing the landing page, the achievements page, the profile's learner card, or the lesson page.
- Recommending anything other than the first catalog course; no placement quiz.
- Showing hypothetical future courses; the layouts only have to hold more courses when they exist.

## Impact

- **Routes:** new `src/app/[locale]/courses/page.tsx` (under the existing session + profile layout),
  new `src/app/[locale]/start/first-course/page.tsx`; `learning/page.tsx` loads per-course view data.
- **Server helper:** load the course view (modules and lessons with posters) of every catalog course,
  cached per request, next to `catalog-levels.ts`.
- **Pure logic:** a function that sorts the catalog into featured, other enrolled and not enrolled
  courses, with each course's progress and continue target, built on `courseOverviewProgress`.
- **Components (with stories, tests, JSDoc and `Components.*` messages in en/es/pt):**
  - new: available courses view, cinema hero, enrolled course card, course shelf card, first course
    step, resume tile, enrolled course summary card;
  - rewritten: My learning view;
  - adjusted: `CourseProgressTile` (heading level and an optional link), `OnboardingProgress` (three
    steps), `OnboardingAvatarStep` (next destination), `SiteHeader` (menu item and section),
    `CourseProgressBoard` (per-course location).
- **Removed** from My learning: `ResumePanel` / `StartPanel` / `CourseProgressList` / `LevelsTable`
  usage; components left unused are deleted.
- **e2e:** new specs for Available courses, the first-course step and My learning; existing specs that
  open My learning seed an enrollment; onboarding specs expect step 3.
