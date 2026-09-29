## MODIFIED Requirements

### Requirement: Every route segment renders a shell while its page is resolving

The locale home, the course overview, the module overview and the lesson route SHALL each
provide a `loading.tsx` whose content is a shape-accurate shell of that route's page.
Without one, a navigation holds the learner on the **previous route** until the payload for
the new one is complete — the learner then reads the page they are still on as the page
they asked for, and concludes it is missing whatever the new page was supposed to show.

Each shell SHALL reproduce the landmarks of its page:

- **Home** — the hero block, the section heading row, and the course ladder grid.
- **Course overview** — the course heading block and the module grid.
- **Module overview** — the module heading block and the lesson list rows.
- **Lesson** — the outline row, the breadcrumb, the 16:9 video frame, the lesson title, the
  notes tab row, and the closing card, in the page's own responsive grid.

In a production build the shell reaches the browser through the link's prefetch, which
Next issues for every link in view and which carries the route's `loading.tsx`. The shell
SHALL therefore be on screen while a slow navigation is still pending, without waiting for
any part of the navigation's own response. Verification of this requirement SHALL run
against a production build: `next dev` does not prefetch, so a test that passes there
proves nothing about what learners see.

#### Scenario: Starting a navigation replaces the previous route immediately
- **WHEN** the learner navigates to a route whose payload has not arrived
- **THEN** that route's shell renders in place of the previous page, rather than the previous page remaining on screen

#### Scenario: A prefetched lesson shows its shell while the navigation is slow
- **WHEN**, in a production build, the learner opens a lesson from its module overview after
  the lesson link's prefetch has landed, and the navigation's own payload is delayed
- **THEN** the lesson shell renders in place of the module overview before that payload
  arrives

#### Scenario: The lesson shell reserves the video frame
- **WHEN** the lesson shell renders
- **THEN** it includes a 16:9 block where the player will be, so the frame does not appear only once the payload lands

#### Scenario: Each shell carries its route's landmarks
- **WHEN** any of the four shells renders
- **THEN** it contains a placeholder for each landmark listed above for that route
