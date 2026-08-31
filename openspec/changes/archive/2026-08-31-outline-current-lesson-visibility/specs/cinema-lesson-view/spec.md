## ADDED Requirements

### Requirement: The outline keeps the current lesson visible on arrival

The "Course outline" sidebar SHALL be a self-contained scroll region on desktop: it
SHALL stick below the site header, its height SHALL be bounded by the viewport, and its
content SHALL scroll inside it rather than extending the page. On arrival at a lesson,
the outline SHALL position its own scroll offset so the row marked `aria-current="page"`
is visible within that region, placed near the middle of the region when there is enough
content above and below it to allow it. Positioning the outline SHALL NOT change the
document's scroll position — the learner still arrives at the top of the lesson, looking
at the player.

The same positioning SHALL be applied in the mobile drawer at the moment the learner
opens it, so the drawer never opens onto the first module of a long course.

The adjustment SHALL be instant — the outline SHALL be at its offset by the time the
learner sees it, with no animated scroll. This holds for every learner and therefore
satisfies `prefers-reduced-motion: reduce` by construction.

Bounding the region SHALL NOT cost the outline its own label: the "Course outline"
heading SHALL remain visible while the region is scrolled, so the sidebar still
identifies itself once the current lesson is in view. Where the shell already names the
region — the mobile drawer's `<summary>` — the outline SHALL NOT add a second visible
heading saying the same thing; the region's accessible name SHALL be unaffected either
way. The title of the module being scrolled SHALL likewise stay visible, pinned
directly below the outline heading, so the learner reading a list of exercises never
loses track of which module they belong to.

When no row is marked current — the outline renders without a current lesson, or the
learner has collapsed the module that holds it — the outline SHALL leave its scroll
offset untouched and SHALL continue to render normally.

#### Scenario: A lesson in a late module opens with the outline showing where the learner is
- **WHEN** the learner opens a lesson belonging to one of the course's last modules, on a viewport shorter than the full outline
- **THEN** the outline's own scroll offset is set so the current lesson row is inside the visible part of the sidebar, without the learner scrolling anything

#### Scenario: The outline scrolls on its own, not with the page
- **WHEN** the outline is taller than the space available beside the lesson
- **THEN** the sidebar is a bounded, scrollable region that stays in view as the page scrolls, and its overflow scrolls inside it instead of lengthening the page

#### Scenario: Positioning the outline leaves the page where it was
- **WHEN** the outline positions the current lesson on arrival
- **THEN** the document's scroll position is unchanged — the player and the lesson title remain in view

#### Scenario: The current lesson is centred when there is room
- **WHEN** the current lesson has enough lessons above and below it inside the outline to fill the region
- **THEN** the current lesson row sits near the middle of the outline's visible area, so neighbouring lessons give context in both directions

#### Scenario: The adjustment is never animated
- **WHEN** the outline positions the current lesson, with or without `prefers-reduced-motion: reduce` set
- **THEN** the outline is already at its offset when first painted — no animated scroll runs, so no motion preference can be violated

#### Scenario: The outline still names itself once scrolled
- **WHEN** the outline has scrolled to bring the current lesson into view
- **THEN** the "Course outline" heading is still visible at the top of the region rather than scrolled out of it

#### Scenario: The module being scrolled keeps its title in view
- **WHEN** the learner scrolls through the lessons of an expanded module
- **THEN** that module's title stays pinned below the outline heading until the next module's title replaces it, and lesson rows pass behind it rather than through it

#### Scenario: The drawer does not name itself twice
- **WHEN** the outline renders inside a shell that already labels the region, such as the mobile drawer's `<summary>`
- **THEN** only one visible "Course outline" label appears, and the region keeps its accessible name

#### Scenario: The mobile drawer opens onto the current lesson
- **WHEN** the learner opens the collapsed outline drawer on a small viewport
- **THEN** the drawer's outline positions the current lesson into view the same way the desktop sidebar does

#### Scenario: No current lesson leaves the outline alone
- **WHEN** the outline renders with no row marked `aria-current="page"`
- **THEN** no scroll adjustment is made, the outline renders at its natural offset, and nothing fails
