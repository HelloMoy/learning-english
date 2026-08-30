## Why

The module overview presents each lesson as an "episode row", and every row shows the
same thing in its thumbnail slot: a warm gradient with a generic play circle. Ten rows
look like ten copies of one row. The learner gets no visual cue about which lesson is
which, which is exactly what a thumbnail is for in an episode list.

The artwork is not missing. `VideoLesson` already carries an optional `poster`, the seed
populates it for all 107 lessons, and each JPEG sits on disk next to its MP4. The row
component simply never reads the field — it renders a decorative `<div>` marked
`aria-hidden="true"` instead.

The same tile also swallows clicks. A learner who clicks the thumbnail — the obvious
target in a list of video episodes — gets nothing, because the only link in the row is
the "Open" button at the far right.

## What Changes

- The episode row's thumbnail renders the lesson's `poster` image instead of a
  placeholder gradient.
- Lessons without a `poster` keep today's gradient-and-play-circle tile. Reading lessons
  have no `poster` field at all, so the fallback is the schema's guarantee, not an edge
  case to discover at runtime.
- The thumbnail becomes clickable and navigates to the same lesson the "Open" action
  already targets.
- **The row gains a second path to the same destination**, so the thumbnail link is
  exposed to pointer users only: it is removed from the accessibility tree and from the
  tab order, leaving "Open" as the single announced control per row. Without this, a
  107-lesson module would double its tab stops and announce every lesson twice.

## Capabilities

### New Capabilities

None. This changes how an existing surface renders and behaves.

### Modified Capabilities

- `cinema-module-overview`: the "Module overview renders as an episode list with a hero
  poster" requirement currently says each row shows "a thumbnail/play affordance" without
  saying where the artwork comes from or whether the tile is interactive. It gains the
  poster-with-fallback rule and the pointer-only navigation rule.

## Impact

**Code**

- `src/components/module-overview/module-overview.tsx` — the row's thumbnail `<div>`
  becomes a `next/image` inside a link; `THUMB_GLOW` stays as the fallback background.
- `src/components/module-overview/module-overview.test.tsx` — gains coverage for the
  poster, the fallback, and the pointer-only link.
- `src/components/module-overview/module-overview.stories.tsx` — needs a lesson without a
  `poster` so the fallback is reviewable.

**Precedent to follow, not reinvent**

- `src/components/poster-card/poster-card.tsx` already renders `next/image` with
  `fill` + `sizes` over the same gradient, and its docstring already resolved the
  "the link IS the control, so the play circle is decorative" question for the card case.
  The episode row is the two-controls variant of that same problem.
- `src/components/poster-card/poster-card.test.tsx` asserts artwork with
  `getByRole("img", { name })`; that pattern applies where the image is exposed, and
  deliberately does not where it is hidden (see design).

**Data — verified, not assumed**

- 107 of 107 lessons in `seed-content.ts` are `kind: "video"` and all 107 carry a
  `poster`. The fallback path therefore has no coverage from the real course; it must be
  exercised by a fixture.

**Not affected**

- No domain, port, use-case, or adapter code. Presentation only.
- The hero `PosterCard` at the top of the module overview, which already renders artwork.
- The "Open" action, its label, its href, and its focus ring.

## Non-goals

- Generating, resizing, or optimizing thumbnails. The JPEGs on disk are used as they are.
- Adding `poster` to reading lessons or backfilling artwork anywhere it is absent.
- Showing which lessons are already completed — that needs durable progress state and is
  its own change.
- Making the whole row a single link, or removing the "Open" button. The two-control
  layout is the existing design; this change makes the thumbnail work within it.
- Touching the outline sidebar, the course overview, or the home page.
- Moving content off `public/` to a bucket. The paths stay exactly as the seed emits them.
