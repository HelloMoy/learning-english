## MODIFIED Requirements

### Requirement: The content seed is opt-in via env var

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL include the filesystem-backed course from `seed-content.ts` in the dependency graph only when the environment variable `USE_COURSE_CONTENT_SEED` is set to `"1"`. When unset or set to any other value, the catalog holds the A1 hardcoded seed (`seed.ts`) alone.

The flag is **additive**: when set, the filesystem-backed course JOINS the A1 course in one catalog rather than replacing it, and the two are ordered by `Course.sequence`. The A1 course is never removed from the catalog by configuration — the flag only decides whether content that needs a large local content root is present.

Because the two seeds are backed by different adapters (in-memory entities and content rows resolved through a `BlobStore`), the lesson and resource ports SHALL be bound to composite adapters that fan out over both. Every read remains filtered by `courseId`, so a delegate that owns none of a course's content contributes nothing.

The default behaviour (A1 seed alone) MUST NOT change as a side effect of this change landing — only an explicit opt-in adds the second course.

#### Scenario: Default dev boot still uses the A1 seed alone

- **WHEN** a developer runs `pnpm dev` without setting `USE_COURSE_CONTENT_SEED`
- **THEN** `getCoursePlatformDeps()` returns a graph whose catalog holds exactly the `seed.ts` course, identical to pre-change behaviour

#### Scenario: Opt-in boot serves both courses

- **WHEN** a developer runs `USE_COURSE_CONTENT_SEED=1 pnpm dev`
- **THEN** `getCoursePlatformDeps()` returns a graph whose catalog holds both the A1 course and the "Advanced Intermediate Course", in `Course.sequence` order, and the home lists both

#### Scenario: Each course's lessons resolve through the adapter that owns them

- **WHEN** lessons are listed for the A1 course and for the filesystem-backed course under the opt-in flag
- **THEN** the A1 course's lessons come back with their literal URLs unchanged, and the filesystem-backed course's lessons come back with their content keys resolved through the `BlobStore`

#### Scenario: A lesson id is resolved by whichever delegate owns it

- **WHEN** `LessonRepository.byId` is called with an id belonging to either seed
- **THEN** the composite returns that lesson, and returns `null` for an id belonging to neither
