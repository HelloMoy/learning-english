## ADDED Requirements

### Requirement: The Page Not Found state names the path that was requested

The localized Page Not Found state SHALL show the path the learner asked for, locale segment included, in a sentence that says nothing was found there. A learner who mistyped an address can then see the typo instead of guessing at it.

The path SHALL be shown as it was requested, percent-encoding intact. It SHALL NOT be decoded for display: a decoded path would let a crafted link place readable sentences of the sender's choosing on the site's own page.

A long path SHALL wrap inside the page's content column and SHALL be clamped to two lines, so it can neither push the page sideways nor push the actions off the screen.

The sentence SHALL exist in every configured locale.

#### Scenario: A mistyped path is named on the page
- **WHEN** a user visits `/es/leccion-perdida`
- **THEN** the page-not-found state shows a sentence in Spanish naming `/es/leccion-perdida`

#### Scenario: An encoded path stays encoded
- **WHEN** a user visits `/en/call%20this%20number`
- **THEN** the page names `/en/call%20this%20number` and does not render the decoded text "call this number"

#### Scenario: A very long path does not break the layout
- **WHEN** a user visits a path several hundred characters long on a phone-width viewport
- **THEN** the path wraps within the content column, the page does not scroll horizontally, and the actions remain below it

### Requirement: The Page Not Found state offers the course lobby as a second way out

Beside the home link, the Page Not Found state SHALL offer a link to the course lobby (`/courses`) of the **active** locale.

The home link SHALL be the primary action and the course lobby link the secondary one. The two SHALL be distinguishable by more than position: the primary action is filled, the secondary is outlined.

The link SHALL be offered to every visitor. A visitor without a session who follows it is taken through sign-in and returned to the lobby, which is how every personal route already behaves; the page itself reads no session.

#### Scenario: The course lobby link keeps the learner's locale
- **WHEN** a signed-in learner visits `/es/error` and follows "Ver cursos"
- **THEN** they arrive at `/es/courses`

#### Scenario: The home link is still offered
- **WHEN** a user visits `/pt/does-not-exist`
- **THEN** the page offers both "Ir para o início" and "Ver cursos", and the home link opens `/pt`

### Requirement: The Page Not Found state wears the Immersion Cinema theme

The Page Not Found state SHALL take every colour from the theme tokens (`foreground`, `muted-foreground`, `gold`, `primary`, `border`, `background`) and SHALL NOT use any palette outside them. It therefore follows the light and dark variants like every other page.

It SHALL be laid out on the same content column as the site header — left-aligned with the wordmark, without a bordered card — and SHALL read in this order: an eyebrow naming the error ("Error 404"), the heading, the description, the requested path, the actions.

The heading SHALL remain the page's only level-one heading, and the state SHALL remain an `alert` region so assistive technology announces it.

The page's `main` landmark SHALL carry the `main` id, so the skip link reaches it as it does on every other page.

#### Scenario: The state follows the dark variant
- **WHEN** a user with the dark theme visits `/es/error`
- **THEN** the heading is drawn in the theme's foreground colour, the eyebrow in the theme's gold, and the home link is a gold filled button

#### Scenario: The state follows the light variant
- **WHEN** a user with the light theme visits `/es/error`
- **THEN** the same elements are drawn with the light variant's tokens and remain legible on the ivory background

#### Scenario: The eyebrow names the error
- **WHEN** a user visits `/en/typo`
- **THEN** an "Error 404" eyebrow sits above the "Page not found" heading

#### Scenario: The skip link reaches the page
- **WHEN** a keyboard user activates the skip link on `/es/error`
- **THEN** focus moves to the page's `main` landmark
