## MODIFIED Requirements

### Requirement: The Lesson Page closes with one "complete and continue" block on phone-class viewports

At every viewport width the Lesson Page SHALL end its right rail — directly below
the **Resources** card — with a single closing block containing, in this order:

1. a localized prompt inviting the learner to close the lesson and move on;
2. the **Mark as complete** button, rendered at the block's full width;
3. a separator;
4. the **next-lesson row** — a locale-aware link to the next Lesson carrying a play
   glyph, the localized "Up next" eyebrow, and the next Lesson's title.

The block SHALL be the last thing in the right rail. Below `lg` the rail stacks after
the center column, so the block is the last thing on the page and the learner reaches it
immediately after the lesson's own content and its materials. The block SHALL NOT
collapse, hide any of its parts, or change the button's width at any breakpoint: the
desktop renders the same closing surface the phone does, and the page SHALL NOT render
a second, standalone **Mark as complete** button anywhere.

The block SHALL carry the same surface vocabulary as the page's other cards — the card
background, the border token, and the card corner radius — and the next-lesson row SHALL
be visually separated from the button by a divider, so the two actions read as one
closing surface with two steps rather than as two unrelated controls.

The **Mark as complete** behaviour SHALL be unchanged: the same button, the same dual
write, the same completed and pending states.

#### Scenario: The closing block renders at phone width
- **WHEN** a video lesson with a next lesson is rendered at a 390px viewport width
- **THEN** the page ends with one block, below the Resources card, containing the prompt, the "Mark as complete" button, a divider, and a link to the next lesson — in that order

#### Scenario: The closing block renders the same at desktop width, in the rail
- **WHEN** the same lesson is rendered at a 1440px viewport width
- **THEN** the right rail ends with the same block — card surface, prompt, full-width "Mark as complete" button, divider and next-lesson link — directly below the Resources card and to the right of the player, and no other "Mark as complete" button is on the page

#### Scenario: Marking complete from inside the block still records the lesson
- **WHEN** the learner activates the "Mark as complete" button inside the closing block
- **THEN** the lesson is recorded exactly as it is today and the button moves to its completed state, with the next-lesson row unaffected

### Requirement: The Resources card precedes the closing block on phone-class viewports

The page SHALL render the lesson's **Resources** card exactly once, in the right rail,
directly above the closing block, at every viewport width. Below the `lg` breakpoint the
rail stacks after the center column, so the learner meets the lesson's materials after
the lesson's own content and before the action that ends the lesson, and the closing
block remains the last thing on the page. The page SHALL NOT render a second copy of the
Resources card for any breakpoint.

#### Scenario: Materials come before the closing block on a phone
- **WHEN** a lesson with resources is rendered at a 390px viewport width
- **THEN** the Resources card appears after the lesson's content and above the closing block, and the closing block is the last thing on the page

#### Scenario: The Resources card is shown once
- **WHEN** the same lesson is rendered at 390px and at 1280px
- **THEN** exactly one Resources card is on the page at each width, in the rail directly above the closing block

## REMOVED Requirements

### Requirement: The closing block's next-lesson affordance is phone-only

**Reason**: The closing block now renders at every viewport width, and the rail's "Up next"
card is removed, so the block is the page's only next-lesson affordance and there is no
breakpoint at which its chrome should collapse.

**Migration**: The "offered exactly once" invariant moves into the `lesson-page` and
`cinema-lesson-view` layout requirements, which now place the next lesson in the closing
block alone. Browser tests that located the rail's `Up next` region locate the closing
block's link instead.
