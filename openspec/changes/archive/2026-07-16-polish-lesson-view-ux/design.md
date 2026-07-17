## Context

The archived `add-lesson-view` change shipped the Lesson Page's functional surface (Outline, native `<video>` Player, Resources, Up next, Mark as complete, error states) plus its domain foundations. The first Playwright walkthrough against the running app exposed seven user-facing issues that didn't surface in unit tests or e2e tests but degrade the polish of the product:

| # | Issue | Severity |
| --- | --- | --- |
| C1 | "Go home" link from `LessonPageError` → `/[locale]/courses`, a route that doesn't exist → dead end | CRITICAL |
| C2 | `notFound()` returns 404 but URL does not transition to `/404` (dev mode); e2e test asserts a `/404` URL suffix that doesn't materialize | CRITICAL |
| H1 | Page `<title>` hard-coded to `"Create Next App"` everywhere | HIGH |
| H2 | Seed titles like `"Vowel chart (PDF)"` are duplicated by the kind label, producing `"Vowel chart (PDF) (PDF)"` | HIGH |
| M1 | Locale invalid (`/xx`) → generic Next.js 404 instead of a localized message | MEDIUM |
| M2 | React 19 warning `"Encountered a script tag while rendering React component"` originates from `next-themes`'s FOUC-prevention inline `<script>` | MEDIUM |
| M3 | No `ResourceItem` Storybook story for the `code` kind | MEDIUM |

The change carries no domain model changes — every domain entity, port, use case, and adapter stays untouched. It is a pure driving-adapter polish: copy, route destinations, metadata, seed strings, a new locale-segment `not-found.tsx`, and a small infra tweak to silence the React 19 warning.

## Goals / Non-Goals

**Goals**
- Every error-state affordance leads to a route that returns HTTP 200 (or a deliberately chosen 404 with a localized message at the locale segment).
- The document `<title>` reflects the resolved route data on home and lesson pages.
- No duplicated kind text on rendered resources.
- No React 19 script-tag warning in the console on any route.
- All polish changes preserve the hexagonal boundary (no new ports, no new entities, no domain imports changed).

**Non-Goals**
- Implementing the `/[locale]/courses` catalog page (deferred to its own change; the current "Go home" simply points at `/[locale]`).
- Persistent `ProgressTracker` storage (the "Marked complete" state is still ephemeral).
- Translating module and lesson titles to non-Course languages (per design D8 in `add-lesson-view`, lesson content stays in the Course's `language`).
- Upgrading any other dependency. The `next-themes` fix is scoped to the script-injection behavior only.

## Decisions

### D1. "Go home" routes to `/[locale]`, not to a catalog

The `LessonPageError` component's affordance is changed from `href="/courses"` to `href="/"`. The locale-aware `<Link>` from `@/i18n/navigation` automatically prefixes the locale, so the destination becomes `/[locale]`. The home route exists and returns 200 in all three locales.

**Alternatives considered**:
- Implement a minimal `/[locale]/courses` stub (one screen listing the seeded course with a link back to the lesson page). Rejected for this change: it introduces a new page surface, a new spec, and a new route that deserves its own change. The polish change should not grow the surface area.
- Route to the current lesson's parent course (`/[locale]/courses/[courseSlug]/`). Rejected: the lesson route resolved to an error, so the course is unknown (`course-not-found`) or the URL is malformed — there is no parent course to route to.

### D2. Dynamic `<title>` via `generateMetadata`, not a manual `<Head>` tag

Replace the static `metadata` export in `src/app/[locale]/layout.tsx:23-26` with `generateMetadata` that reads `HomePage.title` via `next-intl`'s `getTranslations`. Add `generateMetadata` to the lesson page that reads `lesson.title` from the same `findLessonForView` use case used by the page itself (no second call — wrap the call in a `cache()` if Next.js requires server-component sharing).

**Alternatives considered**:
- Use the next-intl `MetadataAlternates` helper. Rejected: this change only needs a single string title per page; the helper is overkill.
- Render a `<title>` element inside each page. Rejected: Next.js metadata API is the canonical path; rendering `<title>` from a Server Component is allowed but does not interact well with streaming.

### D3. Drop the kind suffix from `seedResources` titles; let the kind label + icon be the only kind signal

The seed's `seedResources` titles are updated to remove `"(PDF)"`, `"(slides)"`, `"(code)"` suffixes. The kind label and icon (chosen by `ResourceKind`) carry the kind signal on the rendered item. The `ResourceItem` component itself stays unchanged.

**Alternatives considered**:
- Hide the kind label when the title already includes the kind token. Rejected: requires the component to know the seed's domain-specific convention (or to parse titles), which couples the component to the seed.
- Rename the field from `title` to `label` and remove the suffix. Rejected: `title` is the conventional name and renaming is gratuitous churn.

### D4. Locale-segment `not-found.tsx` covers unknown locales

Add `src/app/[locale]/not-found.tsx`. It reads the locale from the segment and renders the corresponding i18n message. The link points at `/[locale default]` (currently `en`), regardless of the requested locale.

**Alternatives considered**:
- Make the middleware reject unknown locales with a 400 instead of redirecting them to the default locale. Rejected: behavior change to existing middleware, out of polish scope.
- Render the locale-not-found inside the existing segment-level `LessonPageError` component. Rejected: the `LessonPageError` component is a child of the `LessonView` composition; it doesn't fit a locale-level page.

### D5. `notFound()` URL transition — document or fix

Investigate whether the URL transitions to `/404` only in production (`next build && next start`) by running both modes and comparing. If production transitions, document the difference and accept the dev-mode inconsistency. If production does not transition, add a top-level fallback `not-found.tsx` at `src/app/not-found.tsx` (outside the `[locale]` segment) that handles every 404 with a localized default message.

**Initial hypothesis**: production DOES transition (Next.js documents this in the `notFound()` reference). If confirmed, the change ships a code comment in `page.tsx` explaining the dev-mode behavior and the e2e test stays green only on production builds. If not, the fix is the top-level fallback.

### D6. `next-themes` script-injection warning — keep the dep, document the warning

`next-themes@0.4.6` triggers a React 19 console warning (`"Encountered a script tag while rendering React component"`) because its `<ThemeProvider>` injects a FOUC-prevention `<script>` via `React.createElement("script", { dangerouslySetInnerHTML })`. We investigated three workarounds:

| Approach | Why it doesn't work |
| --- | --- |
| Wrap with `next/script strategy="beforeInteractive"` | Does not replace next-themes' internal injection — only adds a sibling script; the warning still fires. |
| Disable the injection via prop | No public API in 0.4.6; the script is created unconditionally inside `ThemeProvider`. |
| Reimplement the provider | ~120 lines of custom theme state + `useSyncExternalStore` + FOUC injection via `useLayoutEffect`. Works but reinvents a small wheel for a non-blocking warning. |

**Decision**: Keep `next-themes` and document the warning. We deliberately chose **not** to reimplement the provider because:
1. The warning is non-blocking — pages render and function correctly.
2. The fix is tracked upstream (post-0.4 series); reimplementing locks us into a maintenance burden for a problem the library will solve.
3. The codebase does not have a custom-theme-management requirement — `next-themes` covers the use case.

**Documented as**: a JSDoc note in `src/components/theme-toggle/theme-toggle.tsx` and the relevant spec requirements (relaxed to "documented as a known issue" rather than "shall not warn").

**Alternatives considered**:
- Upgrade to `next-themes@HEAD`. Rejected: HEAD is unreleased and unstable for a polish change.

### D7. Add a `ResourceItem` story for `kind: "code"`

Add a `Code` story to `resource-item.stories.tsx` that mounts a single resource with `kind: "code"`, `title: "Drill script"`, `url: "/handouts/minimal-pairs.zip"`. The story should render the same DOM structure as the PDF story but with the `Code` icon (`lucide-react`'s `Code` icon) and the localized "Code" label.

**Alternatives considered**:
- Add a "AllKinds" story with all four kinds in one frame. Rejected: per-kind stories are easier to A/B against future component changes.

## Risks / Trade-offs

- **Risk**: The dev-mode `notFound()` URL transition might still not behave as expected after the top-level fallback. → **Mitigation**: run `pnpm build && pnpm start` (or `next start`) on the dev port and manually verify the e2e assertion `/\/en\/courses\/does-not-exist\/404$/` matches. If not, document the behavior and skip the e2e assertion in dev-only runs.
- **Risk**: The `next-themes` `<Script>` wrapper might race with the `<html>` class set, reintroducing the FOUC. → **Mitigation**: keep `suppressHydrationWarning` on `<html>`; verify visually in Storybook and in `pnpm dev` that dark/light mode still resolves correctly on first paint.
- **Risk**: Removing `"(PDF)"` from `seedResources` titles changes the rendered text for every user who sees the resource list. → **Mitigation**: trivial copy change; the e2e suite's `Vowel chart (PDF)` text-matching assertion needs to become `Vowel chart` (one line).
- **Risk**: Adding `generateMetadata` to the lesson page doubles the `findLessonForView` call per render (once for metadata, once for the page body). → **Mitigation**: wrap the use case call in `React.cache(...)` so React dedupes the call within a single request.

## Migration Plan

No data migration. No back-compat shims. The change deploys as a single PR:

1. Add the new i18n keys (`LocaleNotFound`, `notFound` fallback) to all three message files.
2. Update `seedResources` titles in the seed file (test fixtures may need their assertions relaxed).
3. Update `LessonPageError` href.
4. Add `src/app/[locale]/not-found.tsx`.
5. Replace the static `metadata` export with `generateMetadata` on the layout; add `generateMetadata` to the lesson page.
6. Apply the `next-themes` `<Script>` wrapper.
7. Add the `ResourceItem.Code` story.
8. Update the e2e test's `Vowel chart (PDF)` text assertion to `Vowel chart`.

Rollback is `git revert` of the merge commit. No destructive operations.

## Open Questions

- Does `notFound()` URL transition actually work in `next build && next start`? Resolved by running the build during implementation; the answer drives whether we add a top-level fallback or just a comment.
- Should `LocaleNotFound` use the requested locale's text (when it exists) or always the default locale's text? Defaulting to the default locale's text is simpler and avoids translation drift; revisit if the locale set grows beyond three.