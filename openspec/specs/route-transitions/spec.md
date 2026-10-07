# route-transitions Specification

## Purpose

The `route-transitions` capability covers what moves when the learner goes from one page to another: which motion each route change plays, what holds still while it plays, how it degrades under reduced motion and in a browser without the View Transitions API, and how navigation code gets the motion without asking for it.

It exists because every route change was a hard cut, with nothing saying whether the learner had moved sideways to another section, gone deeper into a course, or come back out. The motion is chosen from the two routes a navigation connects, so the direction on screen always matches where the learner is in the app.

## Requirements

### Requirement: A route change's motion is derived from the two routes it connects

The system SHALL choose the motion of a route change from the route the learner
is leaving and the route they are entering, both taken without their locale
prefix. The motion SHALL be one of `slide-forward`, `slide-back`, `depth-in`,
`depth-out`, `rise`, `sink`, `fade`, or none.

Routes are placed as follows. **Sections**, in order: `/`, `/learning`,
`/courses`, `/achievements`, `/profile`. **Course pages**, one level below the
sections, in order: `/courses/{course}/about`, `/courses/{course}/progress`.
**Module pages**, two levels below: `/courses/{course}/modules/{module}`.
**Lesson pages**, three levels below:
`/courses/{course}/modules/{module}/lessons/{lesson}`. **Account pages**:
`/sign-in`, `/sign-up`, `/forgot-password`, `/reset-password`,
`/account-deleted`. **Onboarding steps**, in order: `/start`, `/start/avatar`,
`/start/first-course`. Every other route, including `/privacy`, `/terms` and
unknown paths, is **unplaced**.

#### Scenario: Moving to a later section slides forward

- **WHEN** the learner goes from `/learning` to `/courses`
- **THEN** the motion is `slide-forward`

#### Scenario: Moving to an earlier section slides back

- **WHEN** the learner goes from `/achievements` to `/learning`
- **THEN** the motion is `slide-back`

#### Scenario: Entering a deeper level goes in

- **WHEN** the learner goes from `/courses` to `/courses/basic-course/about`,
  from `/courses/basic-course/progress` to
  `/courses/basic-course/modules/vowels`, or from `/learning` straight to a
  lesson page
- **THEN** the motion is `depth-in`

#### Scenario: Returning to a shallower level comes out

- **WHEN** the learner goes from a lesson page to its module page, or from
  `/courses/basic-course/progress` to `/courses`
- **THEN** the motion is `depth-out`

#### Scenario: Course details and course progress are siblings

- **WHEN** the learner goes from `/courses/basic-course/about` to
  `/courses/basic-course/progress`
- **THEN** the motion is `slide-forward`
- **AND** the opposite direction is `slide-back`

#### Scenario: One lesson to another slides forward

- **WHEN** the learner goes from one lesson page to a different lesson page
- **THEN** the motion is `slide-forward`

#### Scenario: Onboarding steps slide in their order

- **WHEN** the learner goes from `/start` to `/start/avatar`
- **THEN** the motion is `slide-forward`
- **AND** going from `/start/avatar` to `/start` is `slide-back`

#### Scenario: Arriving at onboarding slides forward

- **WHEN** the learner goes from `/sign-up` to `/start`
- **THEN** the motion is `slide-forward`

#### Scenario: Account forms slide forward between each other

- **WHEN** the learner goes from `/sign-in` to `/forgot-password`, or from
  `/reset-password` to `/sign-in`
- **THEN** the motion is `slide-forward`

#### Scenario: Entering an account page from the app rises

- **WHEN** the learner goes from `/` to `/sign-in`, or from `/profile` to
  `/account-deleted`
- **THEN** the motion is `rise`

#### Scenario: Leaving the account or onboarding flow sinks

- **WHEN** the learner goes from `/sign-in` to `/learning`, or from
  `/start/first-course` to a lesson page
- **THEN** the motion is `sink`

#### Scenario: Unplaced routes fade

- **WHEN** either the route being left or the route being entered is unplaced,
  such as `/profile` to `/privacy` or `/privacy` to `/terms`
- **THEN** the motion is `fade`

#### Scenario: Staying on the same route has no motion

- **WHEN** the route being entered is the route being left, differing only in
  its query string or hash
- **THEN** there is no motion

#### Scenario: A locale prefix does not change the motion

- **WHEN** the two routes are given as `/es/learning` and `/es/courses`
- **THEN** the motion is the same as for `/learning` and `/courses`

### Requirement: Navigation through the app's own Link and router plays the motion

The app's navigation module SHALL tag each navigation it starts with the motion
for its route pair: both the `Link` component and the `useRouter` hook exported
from `@/i18n/navigation`, so that call sites need no change. Both SHALL remain
locale-aware.

#### Scenario: A link navigates with its route pair's motion

- **WHEN** a `Link` with `href="/courses"` is rendered on `/learning` and
  followed
- **THEN** the navigation carries the transition type `route-slide-forward`

#### Scenario: A link that knows better overrides the motion

- **WHEN** a `Link` is given an explicit `transitionTypes` prop
- **THEN** the navigation carries exactly those types

#### Scenario: A link with no motion carries no type

- **WHEN** a `Link` points at the current route, at an external URL, or
  switches locale on the current route
- **THEN** the navigation carries no transition type

#### Scenario: A link rendered outside a known route does not fail

- **WHEN** a `Link` is rendered where the current pathname is not available
- **THEN** it renders its anchor and carries no transition type

#### Scenario: Programmatic navigation plays the motion

- **WHEN** code on `/start` calls `push("/start/avatar")` on the router from
  `useRouter`
- **THEN** the navigation carries the transition type `route-slide-forward`
- **AND** `replace` behaves the same way

#### Scenario: Programmatic navigation keeps the caller's options

- **WHEN** code calls `replace(pathname, { locale })` on the router from
  `useRouter`
- **THEN** the locale option reaches next-intl unchanged

### Requirement: Each motion has a defined look on wide and narrow viewports

The system SHALL render each motion as follows, with the page content as the
only thing that moves.

- `slide-forward`: the old view fades out while shifting left; the new view
  fades in from the right. `slide-back` mirrors it. The shift is 36 px, or
  64 px on a viewport narrower than 640 px.
- `depth-in`: the old view fades out while growing to 1.04; the new view fades
  in from 0.96. On a viewport narrower than 640 px the new view instead slides
  in from the right edge over the old view, which shifts left and dims.
- `depth-out`: the old view fades out while shrinking to 0.96; the new view
  fades in from 1.04. On a viewport narrower than 640 px the old view instead
  slides off to the right edge, uncovering the new view as it brightens.
- `rise`: the old view fades out; the new view fades in while rising 36 px. On
  a viewport narrower than 640 px the new view instead slides up from the
  bottom edge over a dimming old view.
- `sink`: the old view fades out while sinking 36 px, on top of the new view
  fading in. On a viewport narrower than 640 px the old view instead slides
  down off the bottom edge.
- `fade`: the old view fades out, then the new view fades in.

No motion SHALL last longer than 450 ms from start to finish.

#### Scenario: Going deeper on a desktop

- **WHEN** a `depth-in` navigation plays on a 1280 px wide viewport
- **THEN** the new view scales from 0.96 to 1 while fading in

#### Scenario: Going deeper on a phone

- **WHEN** a `depth-in` navigation plays on a 390 px wide viewport
- **THEN** the new view slides in from the right edge, fully opaque, over the
  old view

### Requirement: The site header holds still during a route transition

The site header SHALL NOT move, fade or scale while a route transition plays,
and SHALL stay painted above the moving page content. The site footer is part
of the page content and moves with it.

#### Scenario: Header during a slide

- **WHEN** a `slide-forward` navigation plays
- **THEN** the header is drawn in place for the whole transition
- **AND** page content sliding beneath it is never drawn on top of it

### Requirement: Reduced motion replaces every motion with a short crossfade

Every route transition SHALL be a crossfade of 120 ms with no translation,
scaling or dimming when the learner's system asks for reduced motion.

#### Scenario: Depth navigation under reduced motion

- **WHEN** a `depth-in` navigation plays with `prefers-reduced-motion: reduce`
- **THEN** the old view fades out and the new view fades in over 120 ms
- **AND** neither view is translated or scaled

### Requirement: Navigations without a motion stay instant

A navigation that carries no transition type SHALL commit without any route
transition, as it did before this capability existed. This covers browser back
and forward, server-side redirects, `router.refresh()`, and same-route updates.
A browser without the View Transitions API SHALL navigate normally with no
animation and no error.

#### Scenario: Browser back button

- **WHEN** the learner presses the browser's back button
- **THEN** the previous page is shown without a route transition

#### Scenario: Content revealed after a loading skeleton

- **WHEN** a route's `loading.tsx` skeleton is replaced by its content
- **THEN** the replacement plays no route transition

#### Scenario: Browser without view transitions

- **WHEN** a link is followed in a browser where `document.startViewTransition`
  is not defined
- **THEN** the navigation completes and the new page is shown

