## Why

The Lesson Page's right rail carries a "Lesson notes (source)" card whose only row links to
the lesson's raw `readme.md`. Clicking it drops the learner out of the app onto an unstyled
Markdown file — the same content the Notes tab already renders inline, formatted and in the
learner's own language. The card offers nothing the page does not already show, and its one
outcome is a confusing detour.

## What Changes

- The Lesson Page's right rail no longer renders the "Lesson notes (source)" card. The rail
  keeps its **Resources** and **Up next** cards.
- The notes `Resource` stays excluded from the **Resources** card, so hiding the dedicated
  card does not push the raw `readme.md` link back into the list under a different heading.
- The Notes tab remains the single place the lesson's notes are read, unchanged.
- The `Components.LessonNotes.resourceTitle` message and the `titleOverride` prop that
  existed only to label this card are removed.

## Capabilities

### New Capabilities

<!-- None. This change only removes behavior from existing capabilities. -->

### Modified Capabilities

- `cinema-lesson-view`: the right rail's composition drops "Lesson notes (source)"; the
  rail is Resources + Up next.
- `lesson-page`: the scenario governing how the "Lesson notes (source)" card links is
  removed — the card no longer exists. The verbatim-`href` rule for the Resources card is
  untouched.

## Non-goals

- Removing the notes `Resource` from the domain, the seed content, or the
  `findLessonForView` view model. The resource stays in the data; only the UI card goes.
- Changing the Notes tab: its locale selection, fallback chain, and Markdown rendering are
  untouched.
- Changing the Resources card's linking behavior, iconography, or empty state.
- Deleting the `readme.md` files under `public/local-filesystem-lesson/`.
- Removing `Components.ResourceList.titleWithNotes`. That key is already unused today; it
  is not this change's to clean up.

## Impact

- `src/components/lesson-view/lesson-view/lesson-view.tsx` — drops the second `ResourceList`
  and the `Components.LessonNotes` translations hook.
- `src/components/lesson-view/resource-list/resource-list.tsx` — the `titleOverride` prop
  and its `titleWithNotes` fallback lose their only caller.
- `src/messages/{en,es,pt}.json` — the `Components.LessonNotes` namespace is removed.
- Tests and stories for `LessonView` and `ResourceList` that assert the notes card.
- `notesResource` continues to flow from the page into `LessonView` only as the filter key
  that keeps the raw `readme.md` out of the Resources card.
