## Context

`ModuleList` (`src/components/lesson-view/module-list/module-list.tsx`) renders each
module title as a `<Link href={moduleOverviewPath(course, mod)}>` and derives expansion
from a single computed value:

```tsx
const isOpen = mod.id === currentModuleId;
```

There is no expansion state — `isOpen` is a pure function of the current lesson. Clicking
any module title navigates away. The proposal turns that title into a disclosure control
and lets several modules be open at once.

Three facts from the codebase shape the design:

1. **The subtree is already client-side.** `lesson-view.tsx:1` is `"use client"`, and it
   is the only caller of `OutlineDrawer` → `Outline` → `ModuleList`. Introducing
   `useState` in `ModuleList` adds no new client/server boundary and no RSC
   serialization concern for the `Map<string, Lesson[]>` prop.
2. **jsdom cannot drive `<details>`/`<summary>`.** The installed jsdom (29.1.1) ships
   `HTMLDetailsElement-impl.js`, which only fires a `toggle` event when the `open`
   attribute is *mutated*; there is no `HTMLSummaryElement-impl.js` and no activation
   behavior. A `user-event.click()` on a `<summary>` therefore does **not** open the
   `<details>` in Vitest. The existing `outline-drawer.test.tsx` is consistent with
   this — it asserts the `<details>` element *exists* and never clicks it.
3. **`OutlineDrawer` renders `Outline` twice** (mobile `<details>` branch + desktop
   `<aside>` branch), so whatever state we add exists in two independent instances.

## Goals / Non-Goals

**Goals:**

- The module title expands/collapses its lesson list in place and never navigates.
- Any number of modules open simultaneously; the current lesson's module open on mount.
- Conformant disclosure semantics: a real `<button>`, `aria-expanded`, keyboard operable
  with the project's visible focus ring.
- The behavior is covered by Vitest + RTL — the layer AGENTS.md mandates for component
  interaction — not deferred to Playwright.

**Non-Goals:**

- Persisting open state across navigations (see proposal § Non-goals).
- Introducing an accordion primitive (Radix, shadcn `Accordion`). The surface is one
  button plus a conditional list; a dependency would be more machinery than behavior.
- Touching `LessonList`, the mobile drawer's outer `<details>`, or the module overview
  route.

## Decisions

### D1 — A `<button>` disclosure, not a native `<details>`/`<summary>`

**Decision:** the module title becomes `<button type="button" aria-expanded={isOpen}>`,
with expansion held in React state.

**Alternative considered — native `<details open={isOpen}>`:** zero JavaScript, free
keyboard and a11y semantics, and it would keep `ModuleList` server-renderable. Rejected
on fact (2) above: jsdom has no `<summary>` activation behavior, so the central behavior
of this change ("clicking an inactive module reveals its lessons") could not be asserted
in Vitest + RTL. The fallbacks — asserting the `open` attribute we set ourselves, or
promoting this to Playwright — either test nothing or violate AGENTS.md's "Never test
React components with Playwright if Vitest + RTL can cover the case". Fact (1) removes
the usual reason to prefer `<details>` (staying off the client bundle): this subtree is
already client-side.

**Alternative considered — `<details>` plus a controlled `onToggle` handler:** inherits
the same jsdom blindness for the click path. Rejected.

### D2 — State shape: a `Set` of open module ids, seeded with the current module

**Decision:**

```tsx
const [openModuleIds, setOpenModuleIds] = useState<ReadonlySet<string>>(
  () => new Set(currentModuleId ? [currentModuleId] : []),
);
```

A `Set` expresses "many open" directly; a single `openModuleId: string | null` would
encode the exclusive-accordion semantics the user explicitly rejected. The lazy
initializer keeps `currentModuleId` out of the render path after mount, so a learner's
manual expansions are never clobbered by a re-render.

**Note on `currentModuleId` changing:** navigating to a lesson in another module is a
full route navigation, so `ModuleList` remounts and the seed is recomputed. No
`useEffect` sync is needed, and adding one would fight the learner's manual state.

### D3 — Collapsed modules keep their lessons unmounted; `aria-expanded` without `aria-controls`

**Decision:** keep today's conditional render (`{isOpen ? <LessonList .../> : null}`)
rather than rendering every module's lessons and hiding them with `hidden`.

Rationale: the real course has 107 lessons; unmounting keeps the DOM, the accessibility
tree, and the tab order at their current size, and it preserves the existing rendering
cost exactly. The trade-off is that `aria-controls` would point at an id that does not
exist while collapsed. `aria-expanded` alone is a conformant disclosure — the revealed
list immediately follows its button in DOM order, which is what screen readers announce
— so we omit `aria-controls` rather than emit a dangling reference. This differs from
`lesson-notes-tabs.tsx`, which does use `aria-controls`, because there the panel is
always in the DOM.

### D4 — No new translation keys

The button's accessible name is the module title, which is already meaningful content
from the domain. `aria-expanded` conveys the state to assistive technology natively, and
browsers localize that announcement themselves. The chevron is decorative
(`aria-hidden="true"`). So `Components.ModuleList` stays absent from the message files —
adding a redundant "Expand module" label would produce a doubled announcement.

### D5 — Chevron affordance via `lucide-react`

A `ChevronRight` (per AGENTS.md § Icons: import the specific icon) rotated 90° with a
CSS transform when open, marked `aria-hidden="true"`, so the control reads as expandable
before it is activated. `resource-item.tsx` is the in-repo precedent for icon usage.

### D6 — State stays inside `ModuleList`

Neither `Outline` nor `OutlineDrawer` needs to read or set expansion, so lifting the
state would add prop plumbing for no consumer. The consequence of fact (3) — two
independent `ModuleList` instances, one per breakpoint — is acceptable: only one branch
is visible at a time, and expansion is intentionally ephemeral (proposal § Non-goals),
so the two states never need to agree.

## Testing strategy

| Behavior | Layer | File |
| --- | --- | --- |
| Current module open on mount; its toggle reports `aria-expanded="true"` | Vitest + RTL | `module-list.test.tsx` |
| Inactive module collapsed: `aria-expanded="false"`, its lesson titles absent from the DOM | Vitest + RTL | `module-list.test.tsx` |
| Clicking an inactive module's title reveals its lessons | Vitest + RTL + `user-event` | `module-list.test.tsx` |
| The module title is **not** a link (no navigation) | Vitest + RTL | `module-list.test.tsx` |
| Opening a second module leaves the first open (multi-open) | Vitest + RTL + `user-event` | `module-list.test.tsx` |
| Clicking an open module collapses it | Vitest + RTL + `user-event` | `module-list.test.tsx` |
| Keyboard: the toggle is tab-reachable and activates on `Enter`/`Space` | Vitest + RTL + `user-event` | `module-list.test.tsx` |
| Lesson rows still link to lesson routes with `aria-current` on the current one | Vitest + RTL (existing, unchanged) | `lesson-list.test.tsx` |
| Outline landmark/heading still render; the current lesson is still reachable | Vitest + RTL (existing, must stay green) | `outline.test.tsx`, `outline-drawer.test.tsx` |
| Visual review of collapsed / multi-open states across `en`/`es`/`pt` | Storybook | `module-list.stories.tsx` |

**Patterns mirrored:** `user-event` setup follows
`src/components/lesson-view/mark-as-complete-button/mark-as-complete-button.test.tsx`
and `src/components/lesson-view/lesson-notes-tabs/lesson-notes-tabs.test.tsx` (the
closest interactive precedents). Fixture construction (faker-generated ids, `Course` /
`Module` / `Lesson` via `.parse`, the `vi.mock("next-intl")` translation stub) follows
the existing `module-list.test.tsx`. Test names keep the repo's
`WHEN … THEN …` phrasing and Arrange/Act/Assert comments.

**Existing assertion that inverts:** `module-list.test.tsx:66` currently asserts
`screen.getByRole("link", { name: "Module A" })`. It becomes a `button` assertion — this
is the failing test that opens the TDD cycle, not an afterthought fix.

**No new Playwright spec.** `e2e/lesson-page.spec.ts` asserts only the outline's
`navigation` landmark name and never clicks a module title, so nothing there breaks.
Adding an e2e for this disclosure would duplicate RTL coverage, which AGENTS.md forbids.

## Risks / Trade-offs

- **The module overview page loses its entry point from the outline** → Verified it stays
  reachable: `lesson-breadcrumb.tsx:41-46` links the module segment via
  `moduleOverviewPath`, and the course overview page lists modules. No route becomes
  orphaned by this change.
- **Two independent expansion states across the mobile/desktop branches** (fact 3) → A
  learner who expands modules on desktop, then narrows the viewport below `lg`, sees the
  mobile branch's default state. Accepted: expansion is ephemeral by design, and the
  breakpoint switch is not a flow real users hit mid-session.
- **`user-event` + `useState` requires the click to be awaited** → Tests use
  `await user.click(...)`; a missing `await` produces a flaky pass. The mirrored
  precedents already await, so the pattern carries over.
- **The learner may read "collapsed" as "no content"** → D5's chevron is the mitigation;
  Storybook stories for the collapsed and multi-open states make it reviewable, and the
  a11y addon flags contrast/name issues on the new button.
- **`moduleOverviewPath` becomes unused in this file** → Remove the import in the same
  commit or `pnpm lint` fails on the unused binding. The exported helper stays; the
  module overview route still uses it.

## Open Questions

None blocking. The three decisions that were genuinely open — whether the title still
navigates, single vs. multi-open, and whether to run the OpenSpec flow — were settled by
the user before this document was written.
