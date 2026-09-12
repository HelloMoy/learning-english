# loading-skeletons Specification

## Purpose

The `loading-skeletons` capability covers what the app shows while it has nothing else to show: the four route shells that stand in for a page whose payload has not arrived, the placeholder that dresses the lesson's video frame until its player can play, and the rule that binds them — a placeholder traces the shape of what replaces it, so the arriving content fills positions that are already correct.

It exists because the app had no vocabulary for "loading". Without a route shell, Next holds the learner on the page they came from until the whole payload lands, and they read that stale page as the one they asked for — a lesson that appears to have no video. Without a frame placeholder, the player's server-rendered markup is an empty black rectangle for as long as the bundle and the embed take, and a black rectangle does not say "loading", it says "broken".

Nothing here makes anything faster. It makes the wait legible.

The shared shimmer comes from `ui-skeleton-primitive`. The ubiquitous language is `GLOSSARY.md`.

## Requirements
### Requirement: A placeholder traces the shape of what replaces it

Every loading placeholder in the app SHALL be built from the `Skeleton` primitive arranged
in the **same containers, at the same breakpoints, with the same spacing** as the content
it stands in for. A placeholder SHALL NOT be a centred spinner, a bare progress bar, or a
block of undifferentiated grey: the arriving content must fill shapes that are already in
the right place, so the swap reads as a fill-in rather than as a second layout.

Where the real layout changes at a breakpoint, its placeholder SHALL change at the same
breakpoint. A placeholder that is shape-accurate on one viewport and wrong on another
reintroduces the re-layout this capability exists to remove.

Placeholders SHALL NOT be gated on viewport size. The condition they answer to is a slow
connection, which a desktop reaches as easily as a phone; on a fast connection every
placeholder is retired within a frame or two on both.

#### Scenario: A placeholder matches its content's container
- **WHEN** a route shell renders in place of its page
- **THEN** it reproduces that page's outermost container, grid and spacing classes, so the arriving content occupies the same positions

#### Scenario: A placeholder follows its content across breakpoints
- **WHEN** the viewport crosses a breakpoint at which the real layout changes
- **THEN** the placeholder changes at that same breakpoint

#### Scenario: Desktop gets the same placeholders
- **WHEN** a wide viewport loads a route slowly
- **THEN** it renders the same placeholders a narrow viewport does, in that viewport's own shape

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

#### Scenario: Starting a navigation replaces the previous route immediately
- **WHEN** the learner navigates to a route whose payload has not arrived
- **THEN** that route's shell renders in place of the previous page, rather than the previous page remaining on screen

#### Scenario: The lesson shell reserves the video frame
- **WHEN** the lesson shell renders
- **THEN** it includes a 16:9 block where the player will be, so the frame does not appear only once the payload lands

#### Scenario: Each shell carries its route's landmarks
- **WHEN** any of the four shells renders
- **THEN** it contains a placeholder for each landmark listed above for that route

### Requirement: A shell announces that it is loading exactly once

Each route shell SHALL expose exactly one live region with `role="status"` carrying
localized text that says the page is loading, and the shapes themselves SHALL be hidden
from assistive technology. A learner using a screen reader SHALL hear one announcement per
navigation, not one per shape.

Because `loading.tsx` receives no route params and therefore cannot call
`setRequestLocale`, that live region SHALL be a client component reading its copy from the
`NextIntlClientProvider` already mounted in the locale layout. Its copy SHALL be present in
every supported locale (`en`, `es`, `pt`).

#### Scenario: One announcement per shell
- **WHEN** a route shell renders
- **THEN** exactly one element with `role="status"` is present, and the placeholder shapes expose no accessible name

#### Scenario: The announcement is localized
- **WHEN** the shell renders under any supported locale
- **THEN** the live region's text is that locale's copy, with no key or English fallback shown

### Requirement: The lesson's video frame carries a placeholder until the player can play

The lesson's video frame SHALL render a placeholder over the player's 16:9 box, and that
placeholder SHALL be present in the server-rendered HTML — not mounted after hydration,
because the window it exists to cover starts before hydration.

The placeholder SHALL show the lesson's own poster where the lesson declares one, dressed
with a play-control silhouette and a control-bar silhouette so the box reads as a player
that is coming, not as a still image. A lesson with no poster SHALL show those silhouettes
over a `Skeleton` fill.

The placeholder SHALL be retired when the player reports it **can play**, and SHALL NOT be
retired on hydration. Hydration is not readiness: React can finish hydrating seconds before
a third-party embed has a frame to show, and retiring the placeholder then simply restores
the black box.

The placeholder SHALL NOT interfere with the player's own controls, gestures, resume
overlay or enlarge behaviour once retired, and SHALL NOT be focusable or clickable while
shown.

#### Scenario: The frame is dressed in the first paint
- **WHEN** a lesson page's HTML is server-rendered
- **THEN** that HTML contains the video placeholder inside the 16:9 frame

#### Scenario: A lesson with a poster shows it while the player boots
- **WHEN** the lesson declares a poster and the player cannot yet play
- **THEN** the placeholder shows that poster with the play-control and control-bar silhouettes over it

#### Scenario: A lesson without a poster shows the shimmer
- **WHEN** the lesson declares no poster and the player cannot yet play
- **THEN** the placeholder shows the silhouettes over a `Skeleton` fill

#### Scenario: Readiness, not hydration, retires the placeholder
- **WHEN** the page has hydrated but the player still reports it cannot play
- **THEN** the placeholder is still shown

#### Scenario: A ready player owns its frame
- **WHEN** the player reports it can play
- **THEN** the placeholder is removed and the player's own controls are unobstructed

#### Scenario: A player that never becomes ready keeps its placeholder
- **WHEN** the player never reports it can play, because its source is unreachable
- **THEN** the placeholder remains, rather than being replaced by an empty black frame on a timer
