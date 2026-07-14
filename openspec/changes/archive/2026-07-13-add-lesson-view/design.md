## Context

The codebase is a Next.js 16 + React 19 + TypeScript + Tailwind v4 + shadcn + Storybook app. It uses hexagonal architecture, established by the completed `adopt-hexagonal-architecture` change: pure domain under `src/domain/**` (allowlist: `zod`, `neverthrow`; no globals), driven adapters in `src/adapters/**`, driving adapters in `src/components/**` and `src/app/**`. The domain has `Course`, `Lesson` (a discriminated union with one variant today: `kind: "reading"`), and one use case `findNextLessonToRecommend` exercised by a Storybook `CourseNavigator` component.

The `CourseNavigator` precedent shows the driving-adapter pattern: a Client Component receives the use case (and any inputs) as props, calls the use case in `useEffect`, and renders. This change applies the same pattern at the page level — but the Lesson Page is the first Next.js Server Component to consume the domain.

**Why this change exists:** the platform has no way to view a video lesson, no way to attach supplementary materials to one, and no Course → Module → Lesson hierarchy. Every learning use case (progress, transcript, workbook) needs a Lesson Page to sit on top of. This change delivers that page with the minimum set of features that makes it a real product, and lays the domain foundations that follow-up changes build on without refactors.

**Constraints carried from the prior change:**
- `src/domain/**` may import only `zod` and `neverthrow`. No `Date.now()`, no `Math.random()`, no `crypto.*`. ESLint enforces both.
- Use cases return `ResultAsync<T, DomainError>` and never throw.
- Ubiquitous language lives in `GLOSSARY.md` — all new code uses the terms defined there.

## Goals / Non-Goals

**Goals**
- Extend the domain with `Module`, `VideoLesson`, `Resource`, and the ports/use cases that make them consumable. The `Lesson` discriminated union gains a `kind: "video"` variant.
- Ship the **Lesson Page** — a Next.js route that renders a Lecture with Outline (sidebar), native `<video controls>` Player, Resource list (right rail), Up next card (right rail), and Mark as complete button (footer).
- Introduce the first Next.js Server Component that consumes the course domain. Establish the pattern (Server Component calls the use case, passes resolved data as props to a Client Component composition) for future pages.
- No new runtime dependencies; no new dev dependencies.
- TDD throughout — every behavior-introducing task writes a failing test first.
- Storybook stories for each new component.

**Non-Goals** (deferred to follow-up changes, see `GLOSSARY.md § Deferred to a future change`)
- Captions, Transcript, Segment, Progress, Resume, Workbook, Notes, Enrollment, Learner, Instructor.
- Persistence, auth, real video hosting/CDN.
- A new home page, course catalog page, or course overview page.
- Custom video player chrome (the native `<video controls>` is the entire v1 player).
- Sticky video on scroll.

## Decisions

### D1 — `Resource` is a first-class domain entity (option B, not a Lesson field)

The Lesson entity does NOT carry its Resources as a field. The Lesson Page's use case fetches the Lesson and the Resources separately and composes them. This is the more expensive choice today (~80 lines of code vs ~10) and is the right one because:

- The Workbook view (deferred) needs a course-level query of all Resources. Without a port, Workbook requires a Lesson-by-Lesson fan-out at the adapter layer.
- Shared Resources across Lessons are a likely future requirement; option A cannot express them.
- Per-Resource analytics (which handout is downloaded most) become possible without a Lesson join in the adapter.
- The migration A → B later is a well-known refactor: split `resources: Resource[]` into `resourceIds: ResourceId[]` (on Lesson) + port. UI does not change.

**Alternatives considered:** A (`Lesson.resources: Resource[]`) — rejected for the reasons above.

### D2 — `Module` ships in v1 (Course → Module → Lesson from day one)

Adding Module now means the breadcrumb has the right shape (`Course › Module › Lesson`) and the Outline renders as collapsible accordions from the start. Deferring Module to a follow-up would require retrofitting the breadcrumb, the outline component, and the route structure in a way that touches the page and the domain at once.

**Alternatives considered:** No Module in v1 (Course → Lesson directly) — rejected because the breadcrumb would be wrong and the outline component would have to be re-shaped.

### D3 — `findLessonForView` is the single composition use case for the page

The Lesson Page calls one use case: `findLessonForView({ courseSlug, moduleSlug, lessonId })`. The use case composes `CourseRepository.bySlug`, `ModuleRepository.byCourse`, `LessonRepository.byId`, `ResourceRepository.listByLesson`, and `LessonRepository.listByCourse` (for the next-lesson calculation) into one `ResultAsync<View, FindLessonForViewErrors>`. The Server Component calls the use case; the resolved data is passed as props to the Client Component composition.

**Why one use case, not several:** the page has one concern ("show this lesson in its course context"). Splitting the use cases would push composition into the Server Component, which would then need the domain's ports directly — violating the hexágono. The use case IS the composition.

### D4 — `findNextLessonToRecommend` extends to cross module boundaries

The existing use case now returns the first lesson of the next module when the current lesson is the last in its module. The return type is unchanged (`Lesson | null`). `CourseNavigator` and any future consumer keep working without changes.

### D5 — Native HTML5 `<video controls>` is the entire v1 Player

No custom chrome, no overlay, no JavaScript wrapper. The native control gives play/pause, scrubber, current time / duration, playback rate, mute, volume, fullscreen, and a caption track slot for free. The Mark as complete button sits **next to** the Player in the page footer, not in the Player chrome, because the native chrome cannot be extended.

**Alternatives considered:** Mux Player, video.js, vidstack — rejected as dependencies for v1. They become necessary when adaptive bitrate, custom analytics, or branded chrome become requirements.

### D6 — `markLessonComplete` is a use case, but the adapter is in-memory and ephemeral

The Mark as complete button calls a `markLessonComplete({ lessonId })` use case via a Server Action. The use case writes to a `ProgressTracker` port backed by an in-memory `Set<LessonId>` in the adapter. **Refreshing the page loses the completed state** — this is the v1 limitation, documented in the spec and in the Storybook story.

The use case interface does not change when persistence arrives; the adapter is replaced and the storage becomes durable. The button does not change.

**Why a use case at all if the data is ephemeral:** the use case is the contract. Without it, the button would mutate state in the adapter directly, which is what the hexágono exists to prevent. The use case is the cheap part; the adapter is what changes.

### D7 — Components live under `src/components/lesson-view/`, one folder per component

Per `AGENTS.md`'s folder-per-entity convention. The folder holds the component, its test, and its Storybook story:
- `src/components/lesson-view/lesson-breadcrumb/`
- `src/components/lesson-view/outline/`
- `src/components/lesson-view/module-list/`
- `src/components/lesson-view/lesson-list/`
- `src/components/lesson-view/native-video-player/`
- `src/components/lesson-view/resource-list/`
- `src/components/lesson-view/resource-item/`
- `src/components/lesson-view/up-next-card/`
- `src/components/lesson-view/mark-as-complete-button/`
- `src/components/lesson-view/lesson-view/` (the composition that owns the page layout)

### D8 — i18n Option A: Lesson content in Course's `language`, UI chrome translated

The Lesson entity's `title` and `description` are stored in a single string. The Course's `language` field is the source of truth for which locale the content is in. The UI chrome (button labels, headings, "Resources", "Up next") is translated via the existing `next-intl` setup. See `GLOSSARY.md § Decision log` 2026-07-07 (Option A row).

### D9 — Resolved open questions from the proposal

| Question | Decision |
| --- | --- |
| Breadcrumb on the Lesson Page? | **Yes.** `Course › Module › Lesson`. Lives in `LessonBreadcrumb` component, locale-aware via the existing `Link` from `@/i18n/navigation`. |
| Outline on mobile? | **Collapsible drawer.** Use the existing shadcn `Sheet` (or `Dialog` if `Sheet` is not present) on screens narrower than the `md` breakpoint. Permanent sidebar on `md` and up. |
| Resources list: flat or grouped by `ResourceKind`? | **Flat with per-kind icon.** A `<ul>` where each `ResourceItem` shows a `lucide-react` icon chosen by `ResourceKind` (PDF → `FileText`, slides → `Presentation`, code → `Code`, other → `Paperclip`). No section headers. |
| Resource URL: static or signed? | **Static in v1.** PDFs live in `/public/handouts/`. The Resource entity carries a relative URL. Signed URLs arrive with the S3/CDN adapter in a follow-up. |

## Data flow

```
[User visits /[locale]/courses/[slug]/modules/[slug]/lessons/[id]]
       │
       ▼
[Next.js Server Component — page.tsx]
       │  imports findLessonForView
       │  calls makeFindLessonForView(deps)(input)
       ▼
[findLessonForView use case]
       │  composes (in order):
       │   1. courseRepository.bySlug(courseSlug)
       │   2. courseRepository.byId(courseId)  // for module count
       │   3. moduleRepository.listByCourse(courseId) → find by slug
       │   4. lessonRepository.byId(lessonId)
       │   5. resourceRepository.listByLesson(lessonId)
       │   6. lessonRepository.listByCourse(courseId) → next lesson
       ▼
[ResultAsync<{ course, module, lesson, resources, nextLesson }, Error>]
       │
       ▼
[Server Component passes data as props]
       │
       ▼
[<LessonView> Client Component composition]
       │
       ├── <LessonBreadcrumb course module lesson>
       ├── <aside><Outline course modules currentLessonId /></aside>
       ├── <main>
       │     <NativeVideoPlayer source poster title />
       │     <header><Lecture title /></header>
       │     <p><description /></p>
       │     <MarkAsCompleteButton lessonId />
       │   </main>
       └── <aside>
             <ResourceList resources />
             <UpNextCard nextLesson | null />
           </aside>
```

`MarkAsCompleteButton` is a Client Component that calls the `markLessonComplete` use case through a Next.js Server Action (`'use server'`). The Server Action resolves the use case dependencies and returns the result.

## Risks / Trade-offs

- **Many new components at once** → the change has ~10 new components. **Mitigation:** each component is a separate folder with its own test and Storybook story. The composition (`LessonView`) is the only file that knows about all the others. Tasks are ordered bottom-up: primitives first (icons, formatting helpers), then simple components (ResourceItem), then compositions (ResourceList, UpNextCard), then the page.

- **HTML5 `<video>` accessibility is limited** (no custom keyboard shortcuts, no branded chrome). **Mitigation:** acceptable for v1. Custom chrome arrives with the Caption + Progress change. The native control already supports captions via `<track>` when that ships.

- **`markLessonComplete` is ephemeral** — refreshing the page loses the completed state. **Mitigation:** documented in the spec, the Storybook story, and the component's JSDoc. Persistence is the next change that touches the Progress port.

- **No captions → v1 is not WCAG-compliant for deaf/HoH users.** **Mitigation:** the platform's first user-facing product ships without captions, which is a known limitation tracked in `GLOSSARY.md § Deferred to a future change`. The Caption + Transcript change is the next accessibility work.

- **Single in-memory adapter means data is lost on server restart.** **Mitigation:** the in-memory adapter is explicitly a v1 implementation; persistence is a separate concern that the hexágono's port boundary keeps isolated. A real adapter (Postgres, etc.) is a follow-up change.

- **The YAML parse error in `openspec/config.yaml`** (multi-line implicit key) is a non-fatal CLI warning that the OpenSpec tool emits. It does not block the change workflow. **Mitigation:** tracked separately; the config file can be linted/reformatted in a tooling change.

## Open Questions

None blocking implementation. The four minor questions from the proposal are resolved in §D9 above.
