## MODIFIED Requirements

### Requirement: Course routes require a learner profile

Every course route SHALL first require a session, as the `learner-account` capability's "Personal routes require a session" defines. A signed-in learner SHALL then, after hydration, be replaced to `/[locale]/start?next=<path>` when the device holds no learner profile. Course routes are `/[locale]/courses/[courseSlug]`,
`/[locale]/courses/[courseSlug]/modules/[moduleSlug]` and
`/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]`. `<path>` is the
requested route's path without the locale prefix. The redirect SHALL apply however the route was
reached (landing link, shared link, typed URL). Nothing SHALL be decided while the profile is
unknown. The server SHALL render the route's full content only to a request with a valid session.

#### Scenario: A lesson link on a device without a profile opens the onboarding
- **WHEN** a signed-in learner whose device has no profile opens `/en/courses/c/modules/m/lessons/l`
- **THEN** they land on `/en/start?next=%2Fcourses%2Fc%2Fmodules%2Fm%2Flessons%2Fl`

#### Scenario: A landing catalog card on a device without a profile opens the onboarding
- **WHEN** a signed-in learner whose device has no profile follows a course card from `/en`
- **THEN** they land on `/en/start` carrying that course path as `next`

#### Scenario: A learner with a profile stays on the course route
- **WHEN** a signed-in learner whose device has a saved profile opens `/en/courses/c`
- **THEN** the course overview stays open

#### Scenario: A visitor without a session is sent to sign in first
- **WHEN** `/en/courses/c` is requested without a session
- **THEN** the response redirects to `/en/sign-in?next=%2Fcourses%2Fc` and contains no course content
