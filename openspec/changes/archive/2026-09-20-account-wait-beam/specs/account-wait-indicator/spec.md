## ADDED Requirements

### Requirement: An account request in flight is shown on the control that started it

While an account request is in flight, the button that started it SHALL swap its label for that
surface's pending label and SHALL show a turning gold arc beside it. The button SHALL be disabled
for as long as the request is in flight, so a second press cannot send a second request.

The arc SHALL carry no accessible name and SHALL be hidden from assistive technology: it repeats
what the pending label already says in words.

This behaviour SHALL be defined in exactly one place and reused by every account surface, so that
a form's submit button and the profile page's delete button wait identically.

#### Scenario: Pressing the button shows the arc
- **WHEN** a learner submits an account form
- **THEN** the button shows the pending label and a turning arc, and is disabled

#### Scenario: The arc is not announced
- **WHEN** the button is in its pending state
- **THEN** the arc exposes no accessible name, and the button's accessible name is its pending label alone

#### Scenario: The button comes back when the request ends
- **WHEN** the request is refused
- **THEN** the button shows its ordinary label again with no arc, and can be pressed again

### Requirement: An account request in flight is shown on the surface that is waiting

While an account request is in flight, an indeterminate gold beam SHALL sweep the top edge of the
surface the request was started from, clipped to that surface's card. The beam SHALL make no claim
about how far along the request is: it SHALL NOT report a percentage, a stage, a step count or an
estimated time.

The beam SHALL be hidden from assistive technology, and SHALL NOT be rendered at all when no
request is in flight.

#### Scenario: The beam appears with the request
- **WHEN** a learner submits an account form
- **THEN** a beam sweeps the top edge of the card, hidden from assistive technology

#### Scenario: The beam is absent at rest
- **WHEN** the form is idle
- **THEN** no beam is rendered

#### Scenario: The beam claims no progress
- **WHEN** the beam is showing
- **THEN** nothing on screen states a percentage, a stage, a step count or a remaining time

### Requirement: The part of the surface that is out of play is dimmed and inert

While an account request is in flight, the fields and links the learner can no longer act on SHALL
be dimmed and SHALL be made inert: they SHALL NOT accept pointer events, SHALL NOT be reachable by
keyboard, and SHALL be removed from the accessibility tree.

They SHALL NOT be unmounted. When a request is refused, the learner's typed values SHALL still be
there, exactly as typed, with no field cleared and no layout shift beyond the dimming lifting.

The button that started the request SHALL stay outside the inert region, at full opacity, so its
arc and pending label remain visible.

#### Scenario: The fields go out of play
- **WHEN** a learner submits an account form
- **THEN** the fields are still in the document, dimmed and inert, and cannot be focused or typed into

#### Scenario: A refusal returns the learner to their own typing
- **WHEN** the request is refused
- **THEN** the fields are live again and hold exactly the values the learner had typed, and the refusal's message is shown

#### Scenario: The button stays visible
- **WHEN** the request is in flight
- **THEN** the button is outside the inert region and its pending label and arc are visible

### Requirement: A waiting surface announces itself exactly once

A surface with a request in flight SHALL expose exactly one `role="status"` live region. That
region SHALL be mounted whether or not a request is in flight, and SHALL be empty when there is
none: a live region inserted into the document together with its text is not reliably announced,
whereas one that is already there and then filled is.

The region SHALL hold the sentence naming the work that surface is waiting on — "checking your
details", not "in progress" — so that what is announced is what a learner watching the screen
reads. It SHALL name the work, never the progress, and SHALL NOT change while the request lasts,
so the wait is announced once rather than narrated.

The same sentence SHALL also be shown visibly alongside the button, and that visible copy SHALL be
hidden from assistive technology, so the wait is read once rather than twice.

Any other status region the surface would otherwise show SHALL NOT be exposed at the same time —
either because it sits inside the inert region, or because its state is mutually exclusive with
waiting. Error messages SHALL remain `role="alert"` and SHALL NOT coexist with a request in flight.

#### Scenario: One live region while waiting
- **WHEN** a request is in flight on an account surface
- **THEN** the surface exposes exactly one `role="status"` region, holding that surface's sentence

#### Scenario: The live region is there before it is needed
- **WHEN** the surface is idle
- **THEN** it still exposes exactly one `role="status"` region, and that region is empty

#### Scenario: The wait is not read twice
- **WHEN** a request is in flight
- **THEN** the visible status line is hidden from assistive technology, and only the live region carries the sentence

#### Scenario: The announcement does not change
- **WHEN** the request stays in flight
- **THEN** the live region's text is the same sentence throughout

#### Scenario: A prior notice does not add a second region
- **WHEN** a learner who has just reset their password submits the sign-in form, which was showing a "password updated" status
- **THEN** that notice is inside the inert region and the surface still exposes exactly one `role="status"`

### Requirement: The wait reads correctly with motion stilled

The beam and the arc SHALL be ordinary CSS animations, covered by the application's global
`prefers-reduced-motion` handling, and SHALL additionally be named in the reduced-motion block that
sets `animation: none` on the application's named animation classes.

With motion stilled, the wait SHALL still be legible: the dimmed and inert region, the pending
label, the visible status line and the live region SHALL all remain. No part of the wait's meaning
SHALL depend on something moving.

#### Scenario: A learner who asked for stillness still sees the wait
- **WHEN** a request is in flight and the learner prefers reduced motion
- **THEN** the beam and the arc do not animate, and the pending label, the status line, the live region and the dimmed inert region are all present

### Requirement: The wait is localized

Every string the wait shows SHALL come from `next-intl` and SHALL be present in `en`, `es` and
`pt`. The sentence SHALL be per surface, because each surface waits on different work, and the
same string SHALL feed both the live region and the visible line.

#### Scenario: The wait speaks the learner's language
- **WHEN** a request is in flight on `/es/sign-in` or `/pt/sign-in`
- **THEN** the pending label, the status line and the live region are in that locale, with no raw message key and no English fallback
