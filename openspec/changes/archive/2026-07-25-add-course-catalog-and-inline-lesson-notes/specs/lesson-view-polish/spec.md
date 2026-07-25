## ADDED Requirements

### Requirement: The outline does not expand every module by default

The Lesson Page outline SHALL preserve access to all modules and lessons while opening only the current module's lesson group initially. Inactive modules SHALL remain discoverable through semantic disclosure controls or links to their module overview pages.

#### Scenario: The first lesson opens only its own module
- **WHEN** a user opens the `Welcome` lesson in module 1
- **THEN** module 1's lesson list is open initially and inactive modules do not expand all of their lesson rows into the initial vertical layout

#### Scenario: Every module remains reachable
- **WHEN** a user navigates the outline with a keyboard or pointer
- **THEN** they can open an inactive module or activate its module overview link and reach every lesson without relying on client-side virtualization

### Requirement: New course navigation controls meet keyboard and touch guidance

Course cards, module links, lesson rows, breadcrumbs, Up next links and completion controls SHALL use semantic interactive elements, provide visible `:focus-visible` styling, and expose a touch target of at least the project's standard minimum. No navigation SHALL be implemented with a click handler on a non-interactive element.

#### Scenario: A keyboard user can follow the course path
- **WHEN** a user presses Tab and Enter from the home card
- **THEN** focus is visible and Enter activates the course overview link

#### Scenario: A mobile user can activate a lesson row
- **WHEN** a user taps a module lesson row
- **THEN** the full row has a sufficiently large target and navigates without a double-tap delay

### Requirement: The course surfaces honor reduced motion and provide a skip target

The locale layout and new course pages SHALL provide a skip link to the main landmark and SHALL not require animation for navigation or comprehension. Any added transitions SHALL be limited to explicit properties and disabled or reduced under `prefers-reduced-motion: reduce`.

#### Scenario: A keyboard user skips repeated navigation
- **WHEN** a user focuses the first control on a course or lesson page
- **THEN** a skip link is available and moves focus to the page's main content

#### Scenario: Reduced motion does not remove content
- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** all course and lesson links, notes and controls remain available without animated-only state changes

### Requirement: Completion feedback is announced accessibly

When the Mark as complete action changes its label or state, the Lesson Page SHALL expose a polite live update in addition to the visual label change. The control SHALL retain a visible focus state while pending and after completion.

#### Scenario: Completion state is announced
- **WHEN** the learner activates Mark as complete successfully
- **THEN** the updated completion state is available through an `aria-live="polite"` region and the button remains keyboard operable
