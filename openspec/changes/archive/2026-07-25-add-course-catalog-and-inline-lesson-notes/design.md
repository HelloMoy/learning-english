## Context

The current application has two useful but disconnected surfaces:

- `src/app/[locale]/page.tsx` renders only the localized home copy and language selector.
- `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx` already renders the real course content through `findLessonForView`, including the video player, outline, resources, breadcrumbs, up-next navigation and completion action.

The opted-in `seed-content.ts` contains the normalized `advanced-intermediate-course` with 10 modules and 107 video lessons. The content keys are already resolved through `BlobStore` and the files are served from `public/local-filesystem-lesson/`. The existing storage contract must remain portable to an eventual S3/R2 adapter.

The current Lesson Page has no course or module overview route. Its course breadcrumb points to a missing course page, and its module breadcrumb currently points back to the current lesson URL. Markdown notes are emitted as `Resource` entries, but are not displayed as part of the lesson body.

The project uses Next.js 16 App Router, React Server Components for pages, `next-intl` locale-aware navigation, a hexagonal domain layer, Vitest/RTL, Storybook and Playwright. The domain cannot import delivery or storage implementation details.

## Goals / Non-Goals

**Goals:**

- Make `/en`, `/es` and `/pt` show a locale-aware course card backed by `CourseRepository.listAvailable()`.
- Add working course and module overview routes so the navigation hierarchy is complete:
  - `/[locale]/courses/[courseSlug]`
  - `/[locale]/courses/[courseSlug]/modules/[moduleSlug]`
  - the existing lesson route remains the leaf route.
- Add domain read use cases/view models for the catalog, course overview, module overview and lesson notes.
- Render existing `readme.md` content inline in video lessons while retaining an original-resource link.
- Reuse the existing `LessonView`, `BlobStore`, generated seed and lesson/resource repositories instead of introducing a second content source.
- Keep route params validated at the delivery boundary and keep all links locale-aware through `@/i18n/navigation`.
- Make the navigation accessible on keyboard and touch devices, honor reduced motion and avoid opening all 107 lesson rows in the outline by default.
- Validate the complete flow with unit, component, Storybook and Playwright coverage.

**Non-Goals:**

- No authentication, authorization or per-user access control. The local content remains public through the existing `public/` stand-in.
- No durable progress persistence; `ProgressTracker` remains the ephemeral v1 adapter.
- No S3/R2 adapter implementation or migration of the 15 GB content tree.
- No translation of course/module/lesson source content. Interface labels are localized; imported content remains as authored.
- No new lesson kind, course enrollment model, search, filtering, pagination or progress percentage.
- No custom video chrome or autoplay. Captions remain a follow-up because the current content tree has no VTT/WebVTT files.
- No broad redesign of the existing Lesson Page beyond navigation, inline notes and the accessibility/performance fixes required by this flow.

## Decisions

### D1. Use a three-level overview hierarchy

The card on the locale home links to the course overview, not directly to the first lesson. The course overview lists the 10 modules; each module overview lists only that module's lessons; each lesson links to the already implemented Lesson Page.

```text
/[locale]
  /courses/advanced-intermediate-course
    /modules/1-advanced-pronunciation-course
      /lessons/9e9d39a2-d2bb-57bb-9a5e-37de8c3e2a1c
```

This makes the existing breadcrumb contract truthful, gives the learner a meaningful place to orient themselves before starting, and avoids a 107-item catalog on the home page. A direct-first-lesson card was rejected because it hides the course structure and makes the course card's destination surprising.

The course and module routes use `notFound()`/the established localized error conventions for invalid or missing params, while preserving the existing Lesson Page error behavior where required by its current contract.

### D2. Add read use cases rather than reading repositories from pages

Extend `CoursePlatformDeps.useCases` with delivery-neutral read functions:

- `findCourseCatalog()` → ordered `Course[]` or a small catalog view containing the course and its entry lesson.
- `findCourseForView({ courseSlug })` → `{ course, modules, firstLesson }`.
- `findModuleForView({ courseSlug, moduleSlug })` → `{ course, module, lessons }`.
- `findLessonNotes({ lessonId })` → `{ resource, markdown } | null`.

Each use case follows the existing `makeXxx(deps) => ResultAsync<T, ErrorUnion>` convention, never throws, and uses the existing repository ports. The course/module view models are read models; no new `Course` fields such as `thumbnail` or `progress` are added to the entity.

The first lesson is selected deterministically by module sequence and then lesson sequence. The catalog may use the first lesson poster as artwork, but the visual card must still work when no poster is present.

Pages call the use cases through `getCoursePlatformDeps()` and use React `cache()` for request-level deduplication between page data and `generateMetadata`. They do not import repository implementations directly.

Alternative rejected: composing repositories directly in each Server Component. It would be shorter for one page but would make the delivery layer responsible for domain composition and duplicate error handling.

### D3. Read Markdown through an explicit storage/domain boundary

The current `BlobStore` supports `url()` and `exists()` only. Inline notes require a text-read capability that remains portable to S3/R2.

The design therefore extends the storage contract with a constrained UTF-8 text read and adds a `LessonNotesRepository` domain port. The local implementation receives the generated resource-key index and a `BlobStore`; it resolves only known Markdown resources for a lesson and delegates the bytes to `BlobStore.readText(key)`. A future S3/R2 implementation can use the same contract.

Rules:

- The browser never submits a filesystem path or arbitrary content key.
- The notes adapter only reads a key emitted by the normalized seed/resource index.
- Local path resolution rejects absolute paths and any normalized path containing `..` before touching the filesystem.
- `readText` is used only for `.md` resources and applies a bounded UTF-8 read; PDFs, DOCX, PPTX, images and videos remain binary resources.
- Missing notes return `null`, not an error state for the lesson.

The generator will emit the minimal server-side mapping needed to associate lesson/resource IDs with normalized content keys. It will not embed 15 GB of binary data or duplicate the full Markdown in the domain seed.

Alternative rejected: reading `public/` directly from the page or deriving a filesystem path from `Resource.url`. That would couple the page to the local driver and make a future bucket migration unsafe.

### D4. Render notes as safe server-side Markdown

A Server Component will render the resolved Markdown below the video description under an accessible `Notes` heading. The original Markdown resource remains available as an explicit link.

The renderer must not enable arbitrary HTML passthrough. Links, headings, paragraphs, emoji and basic lists are sufficient for the current corpus. If the existing dependency graph has no suitable Markdown renderer, implementation must request explicit approval before modifying `package.json`; the preferred package-level solution is `react-markdown` without `rehype-raw`, optionally with `remark-gfm` for basic Markdown extensions. A hand-rolled `dangerouslySetInnerHTML` renderer is not acceptable.

The notes section is omitted cleanly when no `readme.md` exists, as in the `Welcome` lesson.

### D5. Use a course-specific practice-track visual language

The visual system will be distinctive but restrained:

- paper-like light surface and dark ink for reading comfort;
- signal blue for navigation and primary actions;
- practice yellow sampled from the course artwork for the course accent;
- a restrained red reserved for error/attention states;
- existing Geist body text plus a condensed display treatment for course/module headings if the existing font setup permits it without a new runtime dependency.

The signature element is a 10-beat practice track. On the home card it is a non-interactive summary with an accessible textual equivalent (`10 modules`). On the course overview it becomes an ordered set of locale-aware module links. It encodes the actual module sequence rather than adding ornamental numbering.

The card uses the existing course poster when available and falls back to the practice-track/typographic treatment when it is not. It is one large editorial card rather than an artificial multi-column grid for a single course.

### D6. Keep the large outline navigable without expanding everything

The current LessonView computes all modules and lessons, which produces a very tall outline for the content seed. The outline will use native disclosure behavior or equivalent semantic sections so only the active module is open initially; other modules remain reachable through their overview links.

Lesson rows will use locale-aware `<Link>` elements, `aria-current="page"` for the active lesson, explicit `focus-visible` styles and at least the project’s standard touch target height. The module breadcrumb will link to `/courses/{courseSlug}/modules/{moduleSlug}` rather than the current lesson URL.

This preserves access to every lesson through stable URLs while reducing visual overload and initial page height. It does not introduce client-side virtualization that could make keyboard navigation or deep links unreliable.

### D7. Add shared navigation and accessibility foundations without replacing existing components

The locale layout will expose a small consistent header/utility area and a skip link targeting the page’s `main` landmark. New and adjusted interactive elements will use semantic links/buttons, visible `:focus-visible` states and explicit hover states. Global motion rules will include a reduced-motion variant; no new animation will be required for comprehension.

The existing native video element remains unchanged in principle: controls, poster, no autoplay and no custom chrome. The absence of captions is documented as a follow-up rather than simulated with inaccurate text.

### D8. Localize interface copy, preserve source content

Add the new namespaces to all three application message files and Storybook message files. Route titles, labels, empty states, buttons, breadcrumbs and error messages are translated. The imported course titles, module titles, lesson titles and Markdown remain the original source strings so content is not silently mistranslated.

Course/module pages use `getTranslations` in `generateMetadata`, following the existing locale-aware metadata pattern.

### D9. Test the public journey and the storage boundary

Tests will cover:

- use case success, missing course/module, empty catalog and notes-not-found paths;
- local notes reads with known keys, missing keys and traversal-like input;
- CourseCard, course overview, module overview, notes rendering and updated breadcrumbs;
- locale-aware hrefs in `en`, `es` and `pt`;
- E2E journey `/en` → card → course overview → module overview → first lesson → next lesson;
- keyboard activation/focus, reduced-motion class behavior and stable 404 behavior;
- video source/poster URLs and the existing HTTP range behavior without downloading the full MP4 in tests.

## Risks / Trade-offs

- **[Markdown dependency approval]** → `react-markdown` is not currently listed in `package.json`. Ask for explicit approval before adding it; do not substitute unsafe HTML injection. If approval is declined, keep notes as linked resources and stop the inline-notes portion rather than shipping an unsafe parser.
- **[Public asset exposure]** → Everything under `public/local-filesystem-lesson/` is anonymously addressable. This is accepted for the local development stand-in, documented as a non-goal for access control, and preserved behind `BlobStore` so the later S3/R2 migration can introduce signed URLs.
- **[Seed/runtime divergence]** → `USE_COURSE_CONTENT_SEED=1` selects the 107-lesson seed at runtime. Tests must set or mock the same source explicitly; route tests must not silently fall back to the small A1 seed.
- **[Large outline]** → The content seed creates 107 lesson links. Collapsing inactive modules reduces rendered height, while keeping every lesson reachable through module pages and stable URLs.
- **[Source-language copy]** → Some notes mix English and Spanish and some titles are generated from normalized source names. The interface will label the course honestly and preserve source text; translating content is deferred.
- **[Missing captions]** → The corpus has no VTT assets. The native player remains accessible to keyboard users, but full non-visual parity requires a separate caption/transcript sourcing change.
- **[Ephemeral completion]** → The course overview must not claim durable progress. CTAs use `Start course`/`Open course`, not a misleading percentage or `Continue` state.

## Migration Plan

1. Add/update the delta specs and domain contracts for the read use cases, notes repository and text-capable BlobStore.
2. Implement unit-tested adapters and use cases while keeping the existing A1 seed behavior unchanged when `USE_COURSE_CONTENT_SEED` is not `1`.
3. Add the course/module pages, card, view components, messages and metadata using the content seed when enabled.
4. Add inline notes and update LessonView breadcrumbs/outline/accessibility behavior.
5. Run typecheck, lint, unit tests, Storybook checks and the Playwright flow against the real local content seed.
6. Rollback is code-only: remove the new routes/components and restore the previous dependency composition. No content files are renamed or deleted by this change.

## Open Questions

- Before implementation, confirm whether adding `react-markdown`/`remark-gfm` to `package.json` is approved. This is the only expected tooling change; it is not performed by the proposal.
- Caption files are not available in the current content tree and remain explicitly deferred.
- The local public asset URLs remain intentionally unauthenticated until the future storage migration changes that policy.
