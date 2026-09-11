## Context

`LessonView` renders two `ResourceList` cards in the right rail: the real **Resources**
card (`nonNotesResources`) and a second one holding only the notes `Resource`, headed by a
`titleOverride` of `Components.LessonNotes.resourceTitle` ("Lesson notes (source)"). The
second card's single row is a plain anchor to the lesson's `readme.md` in `public/`, which
opens the unstyled Markdown source in a new tab.

That content is already on the page. The center column's Notes tab renders the same
`readme.md` through the safe Markdown renderer, in the learner's active locale, with the
theme's typographic hierarchy. The card is a second, worse door onto the same room, and the
`(source)` label does not tell a learner that.

Three facts constrain the removal:

- `notesResource` is not only the card's data — it is the key `LessonView` filters the
  Resources card by (`resources.filter((r) => r.id !== notesResource?.id)`). Dropping the
  prop would push the raw `readme.md` back into the Resources card. The prop stays; only
  its second use goes.
- `ResourceList`'s `titleOverride` prop exists solely for this card. Its JSDoc names the
  notes resource as the motivating case.
- `e2e/lesson-page.spec.ts` walks **every** `resourceRow` of the primary lesson and asserts
  each has a rendered link. The notes `readme.md` is one of those rows, so that test fails
  the moment the card disappears unless it is taught to skip the notes row.

## Goals / Non-Goals

**Goals:**

- No route from the right rail to the raw `readme.md`, under any heading.
- The Resources card keeps listing every non-notes resource, and shows its localized empty
  state when notes were the lesson's only resource.
- The Notes tab is untouched.
- No dead code or dead translation keys left behind by the removal.

**Non-Goals:**

- Touching the domain, the manifests, the `findLessonNotes` use case, or
  `LessonNotesRepository`. The notes `Resource` keeps flowing to the page.
- Changing the Notes tab, the Resources card's linking rule, or `ResourceItem`.
- Removing the already-unused `Components.ResourceList.titleWithNotes` key.

## Decisions

**D1 — Delete the card at the composition, not behind a flag.**
`LessonView` stops rendering the second `ResourceList`. No `showNotesRow` boolean, no
conditional, no prop to re-enable it. A hidden-but-present card is a card someone re-enables
by accident; the spec says the rail has two cards, so the code should have two cards.
_Alternative considered:_ keep the card and change its label to something clearer ("Download
notes"). Rejected — a clearer label on a link to unstyled Markdown still sends the learner
away from the rendered notes they were already reading.
_Alternative considered:_ CSS-hide it. Rejected outright — the link stays in the
accessibility tree and in the tab order, so a keyboard or screen-reader learner still hits
the confusing detour the change exists to remove.

**D2 — Remove `titleOverride` from `ResourceList` along with its only caller.**
The prop's whole purpose was letting one caller relabel the card; with that caller gone it is
an untested branch (`titleOverride ?? t("title")`) and a JSDoc paragraph describing a card
that no longer exists. `ResourceList` goes back to owning its heading.
_Alternative considered:_ leave the prop for future reuse. Rejected — speculative generality;
it is one line to reintroduce when a second heading is actually needed.

**D3 — Keep the `notesResource` prop on `LessonView`, and re-document it.**
Its remaining job is real and non-obvious: it is the identity the Resources card filters by,
so the `readme.md` the Notes tab renders is not also listed as a downloadable file. The JSDoc
must say that, because the name no longer hints at it once the card is gone.

**D4 — Teach the e2e to skip the notes row rather than narrow the loop by hand.**
`contentCatalog.notesKeys[lessonId]` is the notes content key and `ResourceRow.url` holds
that same key, so the notes row is identifiable from the catalog without hardcoding a
filename. The spec asserts the notes link is *absent*, so the e2e gains an explicit negative
assertion — the notes URL resolves to no link in the rail — instead of quietly having one
fewer row to walk. A shrunken loop would still pass if the card came back under a new label.

**D4a — The e2e fixtures needed restructuring, not just a filter (found during apply).**
D4 assumed the primary fixture lesson would still have a resource left after the notes
row was excluded. It does not: **every** resource in module A of
`advanced-intermediate-course` is a notes `readme.md`, so that lesson's Resources card is
now legitimately empty. Two fixtures therefore split apart — `PRIMARY_LESSON` keeps
driving route, breadcrumb, title, outline, and up-next (and now asserts the *empty* card,
which is the truth for it), while a new `LESSON_WITH_RAIL_RESOURCES` scans the whole
course for a lesson the rail actually lists rows for and drives the link assertions.
Those assertions are also now scoped to the Resources card: one such resource is titled
"Day", which a page-wide locator matched against the outline's fifteen "Day N" lesson
links.

**D5 — Remove the `Components.LessonNotes` namespace from all three locales.**
It holds exactly one key, `resourceTitle`, used only by the deleted card. Leaving it means
`en`, `es`, and `pt` each carry a string nothing renders.

## Risks / Trade-offs

- **The learner loses the ability to open the raw Markdown file.** → Intended. The Notes tab
  renders the same content, formatted and localized; the file itself is still served from
  `public/` for anyone who wants the URL.
- **A lesson whose only resource was the notes file now shows an empty Resources card.** →
  The card already has a localized empty state (`Components.ResourceList.empty`), which is
  the honest thing to show: that lesson genuinely has no downloadable materials. A scenario
  in the `lesson-page` delta pins this.
- **Removing `titleOverride` is a breaking prop change.** → `ResourceList` is
  project-internal with one other caller; `pnpm typecheck` catches any use missed.
- **The e2e regression is easy to miss locally**, since `pnpm verify` does not run Playwright.
  → The e2e change lands in the same task as the component change, and the run is done
  explicitly against a dev server on a non-3000 port. Confirmed: 154 tests on chromium,
  136 passed / 18 skipped / 0 failed.

## Testing strategy

| Behavior | Layer | Where |
| --- | --- | --- |
| The rail renders no "Lesson notes (source)" card when `notesResource` is present | Vitest component + RTL | `src/components/lesson-view/lesson-view/lesson-view.test.tsx` — mirrors the existing `mockUseTranslations` / `fixtures()` pattern already in that file |
| The notes resource is absent from the Resources card (no link to its URL anywhere) | Vitest component + RTL | same file — assert on `queryByRole("link", { name: notesResource.title })` |
| The Resources card shows its empty state when notes were the only resource | Vitest component + RTL | same file |
| The Notes tab still renders its body with `notesResource` set | Vitest component + RTL | same file — guards against the removal over-reaching |
| `ResourceList` heads itself from `Components.ResourceList.title` with no override path | Vitest component + RTL | `src/components/lesson-view/resource-list/resource-list.test.tsx` — drop any `titleOverride` case |
| Every *non-notes* resource link is unprefixed and fetches 200, and the notes URL has no link | Playwright e2e | `e2e/lesson-page.spec.ts` — extend the existing "resource links resolve" describe |

Storybook: `lesson-view.stories.tsx` has a story passing a real `notesResource`. It stays —
it is now the visual proof that a notes-carrying lesson shows one rail card, not two — with
its name and JSDoc updated to say so.

Red first on every task: each test above is written and seen failing before the component,
message, or e2e change that makes it pass.

## Migration Plan

None. No data, route, or persisted state changes; the change is a UI removal that takes
effect on deploy. Rollback is `git revert`.

## Open Questions

None.
