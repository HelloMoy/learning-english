## Why

The first Playwright walkthrough of the lesson-page change (archived as `2026-07-13-add-lesson-view`) exposed four user-facing issues that block the change from being genuinely shippable: the "Go home" link from every error state lands on a generic Next.js 404, the page `<title>` is hard-coded to "Create Next App", the seed produces duplicated "(PDF) (PDF)" labels on resources, and an unknown locale renders the same generic 404. None of these break the happy path, but together they erode the polish of what is otherwise a working Lesson Page. This change addresses them plus three smaller issues uncovered in the same walkthrough (the `next-themes`/React 19 script warning, the missing `not-found.tsx` at the locale segment, and the missing `ResourceItem` story for the `code` kind).

## What Changes

- **Re-point the "Go home" link** in `LessonPageError` from `/[locale]/courses` to `/[locale]` (home). The catalog page is deferred to a follow-up change, and the current link routes every error state to a dead end.
- **Set dynamic `<title>`** via `generateMetadata` on the locale layout (home reads `HomePage.title`) and the lesson page (renders `lesson.title + course.title`). Replace the static `metadata` object in `src/app/[locale]/layout.tsx:23-26`.
- **Clean up the seed resource titles**: drop the `"(PDF)"` / `"(slides)"` suffixes from `seedResources` so the kind label is the sole kind signal (kind icon + label). The component itself stays unchanged.
- **Add `src/app/[locale]/not-found.tsx`**: localized "Idioma no soportado" / "Locale not supported" message with a link back to the default locale's home. Covers the case where the middleware redirects `/xx` → `/en/xx` and the segment 404s.
- **Investigate the `notFound()` URL transition** in `next build && next start` (production mode). If the URL does transition to `/404` only in production, document the difference; if it never transitions, add a top-level not-found fallback that at least localizes the message.
- **Keep `next-themes` as the theme provider.** Document the React 19 "Encountered a script tag" warning (which `next-themes@0.4.6` emits via `React.createElement("script", { dangerouslySetInnerHTML })`) as a known, non-blocking issue. Do not reimplement the provider — the upstream is migrating past this and the warning is non-breaking.
- **Add a `ResourceItem` Storybook story** for the `code` kind to lock in the label/icon for non-PDF resources (only PDF is reachable from the current seed's first lesson).

## Capabilities

### New Capabilities

- `lesson-view-polish`: Cross-cutting UX fixes for the Lesson Page — error-state destination, dynamic page metadata, localized locale-404, and the seed/component cleanup needed for the resource label.

### Modified Capabilities

- `lesson-page`: The existing capability's "page handles domain errors with a user-facing error state" requirement now points the recovery affordance at the locale home (not a non-existent courses list). A new requirement is added for dynamic per-page metadata.
- `architecture-boundaries`: No change to boundary rules, but a new requirement codifies that `next-themes` script injection must not warn at runtime (drives the React 19-compatible migration).

## Impact

- **Modified code paths**:
  - `src/components/lesson-view/lesson-page-error/lesson-page-error.tsx` — link href change
  - `src/components/lesson-view/lesson-page-error/lesson-page-error.tsx` — segment-level `not-found.tsx` (same change)
  - `src/messages/{en,es,pt}.json` — add `LocaleNotFound` namespace; remove `(PDF)`/`(slides)` suffixes from seed-driven strings
  - `src/app/[locale]/layout.tsx` — replace static `metadata` with `generateMetadata`
  - `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx` — add `generateMetadata`
  - `src/app/[locale]/not-found.tsx` — new file
  - `src/app/[locale]/[...notFound]/page.tsx` — catch-all trigger that calls `notFound()` to surface the locale-segment not-found
  - `src/components/theme-toggle/theme-toggle.tsx` — JSDoc note documenting the `next-themes` React 19 warning
  - `src/adapters/persistence/in-memory/seed/seed.ts` — drop kind suffix from resource titles
  - `e2e/lesson-page.spec.ts` — assertions updated for new "Go home" destination and the new `<title>`
- **No new runtime dependencies** and no dep changes — `next-themes` stays as-is.
- **No breaking changes to existing runtime paths.** The hexágono is untouched; all changes are driving-adapter or seed-shape.
- **No breaking changes to ESLint boundary rules.**