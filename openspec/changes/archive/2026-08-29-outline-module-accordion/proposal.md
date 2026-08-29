## Why

In the Lesson Page's "Course outline" sidebar, every module title is a link to that
module's overview page (`moduleOverviewPath`), and only the module owning the current
lesson is expanded. A learner who wants to see what lives inside another module has no
way to peek: clicking the title tears them out of the lesson they are watching and
drops them on `/courses/{courseSlug}/modules/{moduleSlug}`, losing playback position and
context.

The outline is a browsing surface, not a navigation shortcut. Expanding a module should
be a cheap, in-place, reversible action — the learner stays on the lesson, opens as many
modules as they want to compare, and only leaves the page when they pick an actual
lesson.

## What Changes

- **BREAKING (UI behavior)**: a module title in the outline no longer navigates. It
  becomes an expand/collapse control for that module's lesson list.
- Any number of modules can be open at once. Opening one does not close another.
- The module owning the current lesson starts expanded, as it does today.
- Every module — open or collapsed — exposes its expanded/collapsed state to assistive
  technology and is operable by keyboard with a visible focus ring.
- Lesson rows keep their current behavior unchanged: locale-aware links, `aria-current`
  on the current lesson.
- The module overview page and its route are untouched; it stays reachable via the
  breadcrumb, the course overview page, and direct URL. Only the outline stops linking
  to it.

## Capabilities

### New Capabilities

None. This change modifies how an existing surface behaves; it introduces no new
capability.

### Modified Capabilities

- `cinema-lesson-view`: the "Lesson view renders as a cinema player with tabbed notes"
  requirement's outline scenario currently reads "the active module is expanded ... and
  other modules are reachable without expanding all 107 lessons" — where "reachable"
  means a link to the module overview. It changes to: inactive modules are expandable
  in place, multiple modules may be open simultaneously, and the module title no longer
  navigates.

## Impact

**Code**

- `src/components/lesson-view/module-list/module-list.tsx` — the module title stops
  being a `<Link>` and becomes a disclosure control; expansion stops being derived
  solely from `currentModuleId`.
- `src/components/lesson-view/module-list/module-list.test.tsx` — asserts
  `getByRole("link", { name: "Module A" })`; that assertion inverts.
- `src/components/lesson-view/module-list/module-list.stories.tsx` — gains a story
  covering a collapsed module and a multi-open state.
- `src/components/lesson-view/outline-drawer/outline-drawer.tsx` — on mobile the whole
  outline already sits inside a `<details>`; the per-module disclosure nests inside it
  and must not break that.
- `src/messages/{en,es,pt}.json` — new keys under `Components.ModuleList` if the
  disclosure needs an accessible label beyond the module title.
- `moduleOverviewPath` from `@/i18n/lesson-routes` loses its only caller in the outline;
  the helper itself stays (used elsewhere / by the module overview route).

**Specs**

- `openspec/specs/cinema-lesson-view/spec.md` — delta on the outline scenario.
- `openspec/specs/lesson-page/spec.md` — no requirement changes. Its outline requirement
  only mandates module ordering, lesson ordering, the current-lesson indicator, and that
  **lesson rows** link to lesson routes. None of that changes.

**Not affected**

- No domain, use-case, port, or adapter code. This is a presentation-layer change.
- No e2e spec asserts on module-title links today (`e2e/lesson-page.spec.ts` only checks
  the outline's `navigation` landmark name).

## Non-goals

- Persisting which modules the learner left open across page loads or navigations
  (no URL state via `nuqs`, no `localStorage`). Expansion resets to "current module
  open" on every load.
- An "expand all / collapse all" control.
- Any change to the module overview page, its route, or its content.
- Virtualizing or lazy-loading lesson rows for large courses. The 107-lesson course
  renders all rows today and continues to.
- Redesigning the outline's visual language beyond the affordance needed to show that a
  module is expandable (e.g. a chevron).
- Changing lesson-row behavior, `aria-current`, or the mobile drawer's outer `<details>`
  wrapper.
