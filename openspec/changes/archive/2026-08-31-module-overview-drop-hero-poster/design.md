## Context

The header was built as a two-column row: a fixed-width decorative tile on the left
(`sm:w-72`, `h-40`) beside a text stack on the right. Removing the tile leaves the
text stack as the header's only child.

## Decisions

**D1 — Remove the tile rather than hide it.** A `hidden` class would leave dead
markup, the `posterHeadline` derivation, and a spec requiring an element nobody
renders. The tile carries no artwork and no information, so there is nothing to keep.

**D2 — Keep `moduleNumber`, drop `posterHeadline`.** The ordinal is still shown, by
the eyebrow (`Lesson 01`). The headline — the first word of the title, uppercased —
existed only for the tile and dies with it.

**D3 — Keep `THUMB_GLOW`.** The constant is shared: the tile used it as a background,
and so does every row thumbnail as the fallback behind a lesson poster. It stays.

**D4 — Header becomes `flex flex-col gap-6`.** The `sm:flex-row sm:items-center`
pair existed to sit the tile beside the text; with one child they would centre a
lone column. The inner text stack keeps its own `gap-3`.

## Testing strategy

- **Vitest component + RTL** (`src/components/module-overview/module-overview.test.tsx`)
  is the right and only layer: this is a presentational removal with no logic.
  Mirror the existing cases in that file, which query by role and text.
- The tile was `aria-hidden`, so no role query can see it; assert its absence the way
  the file already reaches non-semantic nodes — `container.querySelector` on the
  tile's marker (the uppercased headline text), the same DOM-level approach
  `episode-list-thumbnails` used for the hidden `<img>`.
- No e2e: no navigation, no state, no route behaviour changes.
- No new unit layer: nothing pure was added.
