## Context

The lesson page lays out three columns in `LessonView`
(`grid gap-8 lg:grid-cols-[260px_1fr_280px]`). The first column is `OutlineDrawer`,
which renders the outline twice — a `<details>` accordion below `lg`, and a plain
`<aside className="... lg:block">` at `lg` and up. Neither branch bounds its height, so
on the Advanced Intermediate course (12 modules, 107 lessons) the expanded module pushes
the `<aside>` far past the viewport and the grid row grows with it. The page is the only
scroll container in play.

`LessonList` already renders the current row with `aria-current="page"` and a gold
border, and `ModuleList` already seeds the current lesson's module as expanded. So the
DOM anchor this change needs exists; what is missing is a bounded region to scroll and
something to set its offset.

Constraints that shape the design:

- `SiteHeader` is `sticky top-0 z-30`, roughly 4rem tall. A sticky sidebar has to clear
  it.
- `Outline` is documented as *not* owning the responsive shell — `OutlineDrawer` picks
  desktop sidebar vs. mobile drawer. The scroll container therefore belongs to
  `OutlineDrawer`, not to `Outline`.
- `ModuleList` is already `"use client"`, so the whole outline subtree ships to the
  client regardless; making the container client-side costs nothing new.
- jsdom reports `0` for every `getBoundingClientRect()` and every layout box, so any
  logic expressed directly against live DOM geometry is untestable at the component
  layer.

## Goals / Non-Goals

**Goals:**

- The desktop outline is a bounded, sticky, self-scrolling region.
- On arrival, the current lesson is visible inside that region, centred when the content
  allows it.
- The document's scroll position is never touched by this behavior.
- The mobile drawer gets the same positioning the moment it opens.
- The geometry is expressed as a pure function so it can be tested without a real layout
  engine.

**Non-Goals:**

- Persisting outline scroll across navigations.
- Re-positioning after the learner scrolls the outline or toggles a module.
- Virtualization, focus movement, or any change to outline styling beyond the container.

## Decisions

### D1 — The scroll container is the desktop `<aside>` and the mobile `<details>` body

`OutlineDrawer` owns both. Desktop gets `sticky` below the header plus a
viewport-bounded `max-height` and `overflow-y-auto`; mobile gets a bounded, scrollable
body inside the open `<details>`.

*Alternative considered:* put the scroll region on `Outline`'s `<nav>`. Rejected — it
would push responsive-shell knowledge into a component whose contract explicitly
disclaims it, and the two breakpoints need different bounds anyway.

*Alternative considered:* `position: fixed` sidebar. Rejected — it leaves the grid
column empty and reintroduces manual width/offset math that `sticky` gets for free.

### D2 — Set `scrollTop` on the container directly, never `Element.scrollIntoView()`

`scrollIntoView()` walks every scrollable ancestor including the scrolling element of
the document. On a page whose only other scroll container *is* the document, calling it
would drag the learner away from the player — the precise failure the proposal forbids.
Writing `container.scrollTop` scrolls exactly one element and nothing above it.

*Alternative considered:* `scrollIntoView({ block: "center" })` and accept the page
jump. Rejected — it contradicts the "Positioning the outline leaves the page where it
was" scenario.

*Alternative considered:* `container.scrollTo({ top, behavior })`. Equivalent for our
purposes, but jsdom does not implement `Element.prototype.scrollTo`, which would force
every component test to stub it. Plain `scrollTop` assignment works in jsdom.

### D3 — The adjustment is instant for everyone; no `prefers-reduced-motion` branch

The outline should read as *having always been* in the right place, not as animating
into it while the learner's eyes are on the player. Instant positioning is both the
better interaction and the trivially motion-safe one — there is no animation to suppress,
so no `matchMedia` read and no branch to test.

*Alternative considered:* smooth scroll with a `matchMedia("(prefers-reduced-motion:
reduce)")` guard. Rejected — jsdom ships no `matchMedia`, so it would need a global
stub in `src/test-setup/mocks/`, and it buys an animation nobody asked for. Note that
`globals.css` already forces `scroll-behavior: auto !important` under reduced motion,
but that rule does not govern the JS `behavior` option, so the guard would have been
real code, not a no-op.

### D4 — Geometry lives in a pure function, the effect stays thin

`src/lib/centered-scroll-top/centered-scroll-top.ts` exports a pure function taking the
measurements (item offset within the container's content, item height, container
viewport height, maximum scrollable offset) and returning the clamped target offset.
Clamping is part of the function: a current lesson in the first module must not produce
a negative offset, and one in the last module must not produce an offset past the end —
in both cases the row lands off-centre but visible, which is correct.

`src/hooks/use-scroll-current-into-view/use-scroll-current-into-view.ts` is the thin
adapter: it hands back a container ref, and in a layout effect reads the geometry, calls
the pure function, and assigns `scrollTop`. It resolves the row by
`querySelector('[aria-current="page"]')` inside the container rather than by a passed-in
ref, so it stays decoupled from `LessonList`'s internals and works for both breakpoints.

Item offset is computed from bounding-rect deltas plus the container's current
`scrollTop`, not from `offsetTop` — `offsetTop` is relative to the nearest positioned
ancestor, which differs between the sticky desktop `<aside>` and the mobile body, and
would silently produce wrong numbers in one of them.

### D5 — A layout effect, not `useEffect`

`useLayoutEffect` runs before paint, so the outline is never painted at offset 0 and
then jumped. Guard the hook for SSR the way the codebase already handles client-only
reads, or accept that the component is client-only (it is — `ModuleList` is
`"use client"`).

### D6 — The mobile drawer re-runs the effect on open, keyed by open state

The `<details>` body is display-none-ish while closed, so measurements taken at mount
are meaningless there. `OutlineDrawer` tracks the `<details>` open state via `onToggle`
and passes it to the hook as its activation flag; the effect runs when the flag turns
true. Desktop passes `true` from mount.

## Risks / Trade-offs

- **[Sticky sidebar can trap the learner's scroll]** → The region is bounded to less than
  the viewport height, so the page's own scroll is always reachable outside it; the
  header offset keeps the outline heading visible.
- **[`max-height` guesswork against the header]** → Express the bound in terms of the
  header's height in one place (a single `calc()` in `OutlineDrawer`) so a header resize
  is a one-line fix rather than a hunt.
- **[Measurement runs before web fonts settle, so the centre is slightly off]** → Being a
  few pixels off centre still satisfies the requirement (the row is visible with context
  around it). Not worth a `ResizeObserver`.
- **[Expanding a module by hand shifts the current row out of view]** → Accepted and
  listed as a non-goal; re-positioning on every toggle would fight the learner who
  expanded that module precisely to look at it.
- **[jsdom cannot exercise the real geometry]** → Mitigated by D4: the arithmetic is unit
  tested on plain numbers, and Playwright covers the real-layout claim end to end.

## Testing strategy

| Behavior | Layer | Where |
| --- | --- | --- |
| Centred offset arithmetic, clamping at both ends, item taller than the region | **Vitest unit** | `src/lib/centered-scroll-top/centered-scroll-top.test.ts`, mirroring `src/lib/playback-resume-thresholds/playback-resume-thresholds.test.ts` |
| Hook writes `scrollTop` on the container when a current row exists; leaves it untouched when none exists; does not run while inactive | **Vitest + RTL** (`renderHook` / a probe component) | `src/hooks/use-scroll-current-into-view/use-scroll-current-into-view.test.ts`, mirroring `src/hooks/use-playback-position/use-playback-position.test.ts` |
| `OutlineDrawer` renders a bounded scrollable desktop region and wires the drawer's open state | **Vitest + RTL** | `src/components/lesson-view/outline-drawer/outline-drawer.test.tsx` |
| Existing outline behavior (module accordion, `aria-current`, completion marks) still passes unchanged | **Vitest + RTL** | existing `module-list.test.tsx`, `lesson-list.test.tsx`, `outline.test.tsx` — regression, no new cases |
| A late-module lesson opens with the current row inside the viewport, and the page is still scrolled to the top | **Playwright e2e** | `e2e/lesson-page.spec.ts`, alongside the existing outline landmark check |
| Visual: long course with the current lesson in a late module, desktop and mobile | **Storybook** | `outline-drawer.stories.tsx` new story; verified in the browser with Playwright MCP, not handed back to the user |

Every task follows Red → Green → Refactor per `AGENTS.md`: the failing test named in the
row above is written before the production code it covers.

## Open Questions

None blocking. The one judgement call already made: the outline positions on arrival
only, never continuously — see D6 and the proposal's non-goals.
