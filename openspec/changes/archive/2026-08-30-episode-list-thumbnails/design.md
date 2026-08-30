## Context

The episode row today (`module-overview.tsx:103-113`):

```tsx
<div
  className="relative hidden h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border sm:flex"
  style={{ background: THUMB_GLOW }}
  aria-hidden="true"
>
  <PlayButton size="sm" decorative />
</div>
```

A fixed 96×56 tile, hidden below `sm`, decorative by declaration, inert by construction.
The only link in the row is the "Open" action at the end.

Three facts constrain the design:

1. **The artwork is real and complete.** All 107 seed lessons are `kind: "video"` and all
   107 carry a `poster` pointing at a JPEG under `public/local-filesystem-lesson/`.
   Nothing needs fetching or generating.
2. **`poster` is optional in the schema.** `VideoLesson.poster` is
   `urlOrRelativePath().optional()`, and `ReadingLesson` has no such field. A row must
   render correctly with no artwork, even though the current course never exercises it.
3. **The row already has a control.** Adding a link to the thumbnail means two links to
   one destination, in a list that is 107 rows long on the largest module.

## Goals / Non-Goals

**Goals:**

- Each row shows its own lesson's artwork, so the list reads as distinct episodes.
- Clicking the thumbnail opens the lesson, matching what the artwork invites.
- Exactly one announced, tabbable control per row — adding a pointer affordance must not
  degrade keyboard or screen-reader use.
- The no-poster path is a designed state, not an accident.

**Non-Goals:**

- Restructuring the row into a single full-width link (see proposal § Non-goals).
- Any image pipeline work — no resizing, no placeholder blur, no format negotiation.

## Decisions

### D1 — The thumbnail link is pointer-only: `aria-hidden` + `tabIndex={-1}`

**Decision:** wrap the tile in a `Link` carrying `aria-hidden="true"` and
`tabIndex={-1}`, with the image at `alt=""`. The "Open" action stays the row's single
accessible control.

This is the standard treatment for a *redundant* link — one whose destination is already
reachable from a labelled control in the same row. The alternative shapes are worse:

**Alternative — give the thumbnail an accessible name (e.g. the lesson title):** two tab
stops and two announcements per row. On the 13-lesson module the learner tabs through 26
controls to cross the list; a screen reader reads every lesson twice, once as artwork and
once as "Open". The second link adds no destination the first did not already offer.

**Alternative — leave the tile inert and keep only "Open":** honest and accessible, but
it is the current behaviour and it is what the user reported as broken. A poster in an
episode list reads as clickable; not honouring that is the bug.

**Consequence for tests:** `aria-hidden` removes the image from the accessibility tree,
so `getByRole("img")` — the pattern `poster-card.test.tsx` uses — cannot see it here.
Assertions go through the DOM (`container.querySelector`) instead. That is a deliberate
divergence from the existing precedent, not an oversight: `PosterCard` exposes its image
because the card *is* the control; here the tile is decoration next to a control.

### D2 — `next/image` with `fill` + `sizes`, mirroring `PosterCard`

The tile is a fixed 96×56 box, so `fill` plus `object-cover` crops rather than distorts,
and `sizes="96px"` tells Next the real rendered width instead of letting it assume the
viewport. `PosterCard` is the in-repo precedent for this exact composition (image over
`THUMB_GLOW`, scrim on top).

No `priority`. These rows sit below the fold, and preloading 107 thumbnails would compete
for bandwidth with the hero — the reasoning `PosterCard`'s docstring already spells out
for grids.

### D3 — Fallback is the current tile, chosen on `poster` presence

```tsx
const poster = lesson.kind === "video" ? lesson.poster : undefined;
```

The discriminated union makes this total: `ReadingLesson` has no `poster` key, so the
check is a type narrowing rather than a runtime guess. When `poster` is absent the row
renders exactly today's gradient + `PlayButton`, so the fallback needs no new visual
design and no new translation.

The gradient stays behind the image as well, not only in the fallback: it is what the
box looks like while the image is still loading, and what shows through if the JPEG 404s.

### D4 — Keep the tile hidden below `sm`

Unchanged from today (`hidden … sm:flex`). On a phone the row is title + duration +
"Open"; adding a 96px image would push the title into a two-line truncation for no gain.
This also means the pointer-only link only exists at widths where a pointer is likely.

## Testing strategy

| Behavior | Layer | File |
| --- | --- | --- |
| A lesson with a `poster` renders an `<img>` whose `src` is that poster | Vitest + RTL | `module-overview.test.tsx` |
| A lesson without a `poster` renders no `<img>` and keeps the fallback tile | Vitest + RTL | `module-overview.test.tsx` |
| The thumbnail links to the same href as that row's "Open" action | Vitest + RTL | `module-overview.test.tsx` |
| The thumbnail link is out of the a11y tree and out of tab order (`aria-hidden`, `tabIndex="-1"`) | Vitest + RTL | `module-overview.test.tsx` |
| Each row still exposes exactly one link by accessible name ("Open") | Vitest + RTL | `module-overview.test.tsx` |
| Existing rows, ordering, duration and back-link behaviour still hold | Vitest + RTL (existing, must stay green) | `module-overview.test.tsx` |
| Poster and fallback states are visually reviewable | Storybook | `module-overview.stories.tsx` |

**Patterns mirrored:** fixture construction and assertions follow the existing
`module-overview.test.tsx`; image assertions adapt `poster-card.test.tsx` to the hidden
case per D1. `next/image` is mocked globally through `src/test-setup/mocks` (loaded by
`vitest.setup.ts`), rendering a plain `<img>` with the same props — so `src` is
assertable without touching the loader.

**Fixture note:** the real course cannot exercise the fallback — all 107 lessons have a
poster. The no-poster case needs a hand-built lesson in both the test and the story, or
it goes uncovered.

**No new e2e.** `e2e/` has no module-overview spec, and this is component-level rendering
that RTL covers; AGENTS.md forbids reaching for Playwright when RTL suffices.

## Risks / Trade-offs

- **Pointer-only links are invisible to keyboard users** → Intended (D1), but it means the
  thumbnail must never become the *only* path to something. It is not: "Open" sits in the
  same row with the same href, and the test asserts they agree.
- **107 full-size JPEGs rendered into 96px boxes** → `next/image` resizes on demand, so
  the wire cost is the 96px variant, not the original. Worth re-checking in the browser
  if the module overview feels slow, since these files are camera-sized snapshots.
- **A missing or renamed JPEG shows an empty tile rather than a broken-image icon** → The
  gradient sits behind the image (D3), so a 404 degrades to today's appearance instead of
  a visible failure. The trade-off is that broken paths get quieter; the seed generator
  is what guarantees they are correct.
- **The image is `alt=""` and hidden** → Correct for a redundant decorative tile, but if
  the row is ever restructured so the thumbnail becomes the primary control, that must
  flip to a real accessible name. Called out here so the next editor sees the coupling.

## Open Questions

None. The two decisions the user made — thumbnails render the real artwork, and clicking
one opens the lesson — are settled; the a11y treatment follows from them.
