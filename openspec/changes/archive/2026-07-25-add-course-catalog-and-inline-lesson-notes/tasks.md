## 1. Domain read contracts

- [x] 1.1 Add catalog, course-overview and module-overview view types plus `findCourseCatalog`, `findCourseForView` and `findModuleForView` use cases with discriminated `ResultAsync` errors.
- [x] 1.2 Add the `LessonNotesRepository` port and `findLessonNotes` use case; cover missing notes, adapter rejection and invalid lesson identity without throwing.
- [x] 1.3 Extend `CoursePlatformDeps` and its content-seed/in-memory builders to expose the new read use cases while preserving the A1 fallback when `USE_COURSE_CONTENT_SEED` is unset.
- [x] 1.4 Add unit tests for deterministic module/lesson ordering, first-lesson selection, course/module scoping and the new error unions.

## 2. Storage and generated content bridge

- [x] 2.1 Extend `BlobStore` with bounded UTF-8 `readText(key)` and implement safe Markdown-only reads in `LocalFilesystemBlobStore` with traversal and binary-extension tests.
- [x] 2.2 Extend the content seed generator with a generated lesson/resource-to-normalized-notes-key mapping and validate every emitted notes key with `BlobStore.exists`.
- [x] 2.3 Implement the local `LessonNotesRepository` using the generated key mapping and `BlobStore.readText`; add an in-memory/stub adapter for domain tests.
- [x] 2.4 Verify that no page or client component derives filesystem paths, accepts arbitrary keys, or reads binary assets as text.

## 3. Course catalog and overview routes

- [x] 3.1 Add the locale home course catalog and `CourseCard` component with the real course title/counts, poster fallback, practice-track summary, locale-aware link and empty state.
- [x] 3.2 Add the course overview route `/[locale]/courses/[courseSlug]` with metadata, course summary, first-lesson CTA, ordered module entries and the interactive ten-step practice track.
- [x] 3.3 Add the module overview route `/[locale]/courses/[courseSlug]/modules/[moduleSlug]` with metadata, ordered lesson rows, durations and locale-aware Lesson Page links.
- [x] 3.4 Add colocated CourseCard, course overview, module overview, module entry and lesson row tests and Storybook stories following the repository folder-per-component convention.
- [x] 3.5 Add localized course/module route error and empty states that reuse the existing recovery patterns and never show raw domain error kinds.

## 4. Lesson notes and existing LessonView integration

- [x] 4.1 Obtain explicit approval before changing `package.json`; if approved, add the selected server-side Markdown renderer without raw HTML passthrough, otherwise stop and report the dependency blocker.  ✅ Approved by the user during the apply session (2026-07-20, /opsx:apply Group 4) before running `pnpm add react-markdown@^9 remark-gfm@^4`.
- [x] 4.2 Add a server-rendered inline notes component that supports the current headings, paragraphs, emoji and basic lists, with a localized heading and no unsafe HTML injection.
- [x] 4.3 Load notes alongside the existing LessonView data, render notes only when present, and retain the original Markdown resource link in the Resources region.
- [x] 4.4 Fix `LessonBreadcrumb` so Course links to the course overview and Module links to the module overview, preserving locale-aware navigation and `aria-current` on the lesson.
- [x] 4.5 Add tests for notes rendering, missing notes, original-resource preservation and binary resource behavior.

## 5. UX, accessibility and responsive behavior

- [x] 5.1 Add the shared skip link/main target and the minimal course-platform header utilities without breaking locale switching or theme toggling.
- [x] 5.2 Update the LessonView outline to keep the active module open and inactive module lesson groups collapsed or reachable through module overview links.
- [x] 5.3 Add visible `focus-visible` styles and minimum touch targets to course cards, module links, lesson rows, breadcrumbs, Up next and Mark as complete controls.
- [x] 5.4 Add reduced-motion handling for new transitions and announce Mark as complete state changes through an `aria-live="polite"` region.
- [x] 5.5 Validate light/dark/mobile layouts against the practice-track visual direction; use explicit image dimensions and safe text wrapping for long generated titles.

## 6. Localization and end-to-end coverage

- [x] 6.1 Add all new interface namespaces and messages to `src/messages/{en,es,pt}.json` and the Storybook message fixtures.
- [x] 6.2 Add Playwright coverage for `/en` → CourseCard → course overview → module overview → first lesson → next lesson, including working breadcrumb destinations.
- [x] 6.3 Add locale coverage for the same navigation under `/es` and `/pt`, plus unknown course/module and empty-catalog recovery states.
- [x] 6.4 Add browser assertions for the real video source/poster URL and avoid downloading the full MP4 in tests; keep the existing HTTP range behavior as the storage contract.

## 7. Verification

- [x] 7.1 Run formatting, typecheck, lint, domain lint and unit tests; fix all failures without weakening architectural boundary rules.
- [x] 7.2 Run Storybook/component checks and the Playwright suite with `USE_COURSE_CONTENT_SEED=1` against the real local content tree.
- [x] 7.3 Run the repository verification workflow and manually inspect `/en`, the course overview, a module overview and the first lesson at desktop and mobile widths.
- [x] 7.4 Record the missing-caption limitation and any remaining `next-themes` warning without hiding console errors or changing the storage policy.
