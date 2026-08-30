## Why

Every link in the Lesson Page's **Resources** and **Lesson notes (source)** cards is broken: clicking one opens a 404 instead of the PDF or the notes file. `ResourceItem` renders the link with the locale-aware `Link` from `@/i18n/navigation`, and because `routing.localePrefix` is `"always"`, next-intl prefixes the active locale onto the `href`. A `Resource.url` is a site-relative **static asset** path under `public/` (e.g. `/local-filesystem-lesson/.../fast-i-vowel-pronunciation-practice-see-sound.pdf`), not an in-app route — assets in `public/` are not locale-scoped, so the prefixed URL resolves to nothing.

Verified against the running dev server on the "Fast /i/" lesson:

| Request | Status |
| --- | --- |
| `GET /local-filesystem-lesson/.../fast-i-vowel-pronunciation-practice-see-sound.pdf` | `200` |
| `GET /en/local-filesystem-lesson/.../fast-i-vowel-pronunciation-practice-see-sound.pdf` | `404` |

and the rendered markup emits exactly the second form:

```html
href="/en/local-filesystem-lesson/advanced-intermediate-course/2-advanced-vowel-pronunciation-in-american-english/2-fast-i/fast-i-vowel-pronunciation-practice-see-sound.pdf"
```

The regression is invisible to the current test suite because `resource-item.test.tsx` builds its fixture with `faker.internet.url()` — an **absolute** URL, which next-intl passes through untouched. The one shape that breaks in production is the only shape the tests never exercise.

## What Changes

- `ResourceItem` stops using the locale-aware `Link` and renders a plain `<a>`. A `Resource.url` never addresses an in-app route, so locale-awareness is not merely unnecessary — it is incorrect for both branches of `urlOrRelativePath` (absolute URLs and `public/` asset paths alike).
- The existing presentation is preserved verbatim: the per-`ResourceKind` icon, the title as link text, the visually-hidden kind label, `target="_blank"`, `rel="noopener noreferrer"`, and the gold underline/focus styling.
- `resource-item.test.tsx` gains a regression test that pins the site-relative case: a `Resource` whose `url` starts with `/` must render an `href` **identical** to that `url`, with no locale segment.
- The `lesson-page` capability gains an explicit requirement that resource links address the asset directly, so the locale prefix cannot be reintroduced.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `lesson-page`: the "Resources card renders a flat list of resource items" requirement is tightened — the row's link `href` SHALL equal the `Resource.url` verbatim, with no locale prefix applied, and the link SHALL open in a new tab.

## Impact

- **Code**: `src/components/lesson-view/resource-item/resource-item.tsx` (one import + one element swap), `src/components/lesson-view/resource-item/resource-item.test.tsx` (regression coverage).
- **Behavior**: fixes both right-rail cards at once — the main **Resources** card and the **Lesson notes (source)** card render through the same `ResourceList` → `ResourceItem` path.
- **Scope of the bug**: `resource-item.tsx` is the only component that feeds a non-route URL into the locale-aware `Link`. Every other `@/i18n/navigation` `Link` usage (`up-next-card`, `lesson-breadcrumb`, `lesson-list`, `course-navigator`, `poster-card`, `brand`, `featured-course`, `cinema-hero`, `module-overview`, `course-overview`, `lesson-page-error`) points at an in-app route and correctly keeps the prefix.
- **Dependencies**: none added or removed.
- **Data**: none. The seed URLs in `seed-content.ts` are already correct — they resolve on disk and serve `200` at the root path.

## Non-goals

- Changing how `Resource.url` values are generated or stored. `scripts/generate-course-content-seed.ts`, `seed-content.ts`, and the `BlobStore` path resolution are all correct and stay untouched.
- Changing the `Content-Type` of served resources, or rendering `readme.md` notes inline instead of as a download — the notes already render inline via `LessonNotesTabs`; this card is the "open the source file" escape hatch.
- Auditing the other `@/i18n/navigation` `Link` call sites for locale correctness beyond confirming they address in-app routes.
- Any visual, layout, or copy change to the Resources card, the Lesson notes card, or the right rail.
- Touching the in-flight `persistent-lesson-progress` or `video-title-overlay-cover-only` changes.
