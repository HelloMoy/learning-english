## MODIFIED Requirements

### Requirement: Components are colocated in `src/components/lesson-view/` and each has a Storybook story

Every component introduced by this capability (Outline, ModuleList, LessonList, NativeVideoPlayer, ResourceList, ResourceItem, UpNextCard, LessonCompletionToggle, LessonBreadcrumb, LessonView) SHALL live under `src/components/lesson-view/<component-name>/` with its implementation, its Vitest + RTL test, and its Storybook story. Each component SHALL be importable from a barrel `@/components/lesson-view`.

#### Scenario: Each component has at least one Storybook story
- **WHEN** a Storybook build runs
- **THEN** each component under `src/components/lesson-view/` is represented by at least one story in its `*.stories.tsx` file

#### Scenario: Each component has a passing unit test
- **WHEN** `pnpm test:run` runs
- **THEN** every test file under `src/components/lesson-view/` passes

## REMOVED Requirements

### Requirement: The Mark as complete button is a manual, ephemeral action

**Reason**: The control is no longer ephemeral (the browser adapter persists it, per `lesson-progress`), no longer toggles between two labels on one button, and no longer disables itself. Rewriting it in place would have left a requirement whose name asserts the opposite of the behaviour.

**Migration**: Replaced by "The completion control is a manual, reversible action" below, which keeps the Server-Action contract and adds the un-mark half.

## ADDED Requirements

### Requirement: The completion control is a manual, reversible action

The Lesson Page SHALL render a completion control below the Player, inside the closing card. While the lesson is incomplete the control SHALL be a primary **Mark as complete** button, and activating it SHALL call the `markLessonComplete` use case via a Next.js Server Action. Once the lesson is complete the control SHALL state that it is complete and SHALL offer a **non-primary, enabled** un-mark action, which SHALL call the `unmarkLessonComplete` use case via its own Server Action after the learner confirms in a dialog. The control SHALL NOT express completion by disabling itself.

Every label SHALL be translated via `next-intl`. Whether completion survives is a property of the bound adapter: the server's in-memory tracker forgets it, the browser's `localStorage` adapter does not, and the control reads the browser's — see the `lesson-progress` and `lesson-completion-toggle` capabilities.

#### Scenario: The control starts in the "Mark as complete" state
- **WHEN** the page loads for a lesson that is not recorded complete on this device
- **THEN** the control shows the primary "Mark as complete" button

#### Scenario: Marking swaps the control to its completed state
- **WHEN** the learner activates "Mark as complete"
- **THEN** the control states the lesson is complete and offers the un-mark action instead of the primary button

#### Scenario: The completed state survives a reload on the device that recorded it
- **WHEN** the learner marks a lesson complete and then refreshes the page
- **THEN** the control is still in its completed state, because the browser adapter recorded it

#### Scenario: No control is left disabled to express completion
- **WHEN** the control is in its completed state
- **THEN** nothing in it is disabled — the un-mark action is activatable
