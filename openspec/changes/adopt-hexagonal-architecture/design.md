## Context

The codebase is a Next.js 16 / React 19 / TypeScript / Tailwind 4 / shadcn/ui project with i18n via `next-intl` and Server Actions via `next-safe-action`. The intent of the application has just been stated for the first time: **a course platform** (initially English, intended to be course-agnostic). Today there is no application core to speak of — the existing code is all shell:

- `src/app/[locale]/page.tsx` renders a heading and the `LocaleSwitcher`; there is no business logic.
- `src/components/**` are presentational.
- `src/lib/safe-action.ts` is a thin shim over `next-safe-action`; it is the closest thing to a port but it has nothing plugged into it yet.
- `src/i18n/**` is locale plumbing.

No code today depends on a domain layer because the domain has not yet been articulated. We are about to introduce it. This is a structural change (cross-cutting), a new architectural pattern (hexagonal / ports & adapters), and a new external dependency (`neverthrow`) — all three triggers per the schema's design instruction. So `design.md` is required.

The reference for the architectural pattern is **Alistair Cockburn's "Hexagonal Architecture Explained"**. The central posture in that essay is: *"the application is unconcerned with the actors it interacts with."* It is **not** a layered architecture — there is no "left side" or "right side" in code, only in drawing. There are two kinds of boundary, both at the application's outer edge:

- **Driving adapters** (which trigger the application: UI, CLI, tests, scripts).
- **Driven adapters** (which the application calls: persistence, external services, system clock).

The application core defines **ports** — interfaces it requires — and adapters (concrete implementations) live outside the core, where the implementation specifics of frameworks, databases, and actors belong.

## Goals / Non-Goals

**Goals**

- Lay down a domain layer (`src/domain/**`) that is the source of truth for course-platform behavior.
- Make the domain unconcerned with delivery: no imports from `next/*`, `next-intl`, `next-safe-action`, `next-themes`, `zustand`, `nuqs`, or any adapter.
- Make errors explicit at the domain edge using `neverthrow`'s `Result<T, E>`. Use cases never throw.
- Lock dependency and side-effect boundaries with ESLint so the rule is enforced by tool, not by convention.
- Use Storybook — a real driving adapter in Cockburn's sense — to prove the hexagon works in isolation before wiring Next.js pages or Server Actions to it.
- Keep the change scoped to v0 read-only behavior: catalog + lesson + "next lesson" recommendation.

**Non-Goals**

- No database, JSON-on-disk, or HTTP-external storage in v0.
- No enrollment, progress tracking, scoring, auth, multi-tenancy.
- No DDD tactical patterns (aggregates, repository classes, domain services) beyond the minimum required by the first use case.
- No movement of existing code in `src/app/**`, `src/components/**`, `src/lib/**`, `src/i18n/**`.
- No additions to the ESLint allowlist without a spec update.

## Decisions

### D1. Domain primitives are Zod schemas, not TypeScript interfaces or classes

**Choice**: `Course`, `Lesson`, value objects (`CourseId`, `LessonId`, `Slug`, `Score`) are Zod schemas in `src/domain/entities/**`. Use cases and ports consume schemas with `z.infer<typeof X>`.

**Rationale**: Zod gives us runtime validation at adapter boundaries (incoming actions, persisted data) without inflating the domain with class machinery. For a small domain (two entities, one use case) this matches Cockburn's preference for keeping the core at the smallest needed complexity.

**Alternatives considered**:

- *Plain TS interfaces*: no runtime parsing. Repositories trusting untrusted data becomes a separate concern; harder to defend the hexagon against bad input.
- *Class-based entities with invariants*: more ceremony than the v0 domain needs. Can introduce later as a separate change if invariants multiply.

### D2. `neverthrow` for `Result<T, E>` in the domain

**Choice**: `Result`, `ResultAsync`, `ok`, `err` from `neverthrow` are imported only via `src/domain/result.ts` (a re-export module). Use cases return `ResultAsync<T, DomainError>`.

**Rationale**: Standardizes the error channel at the domain boundary. The `safe-action` adapter translates `Ok → return data`, `Err → returnValidationErrors(zod)` (per the spec's rules). The `ResultAsync` chain composition keeps the use case readable.

**Alternatives considered**:

- *Custom `Result` type*: re-implements what a tested library already does well.
- *`fp-ts`*: powerful but brings HKTs and a larger learning surface than a course platform needs.
- *`@mobily/ts-belt`*: pulls 120 utilities for one type; overreach.

### D3. ESLint allowlist (not denylist) for `src/domain/**`

**Choice**: `eslint.config.mjs` gains a block scoped to `src/domain/**` with `no-restricted-imports` whose `patterns` is `["*"]` and `allow` is exactly `["zod", "neverthrow", "ts-pattern"]`. Plus a `no-restricted-syntax` block forbidding `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomUUID()` (and the rest of `crypto.*`) inside `src/domain/**`.

**Rationale**: Denylist grows with every `pnpm add` and silently legitimizes whatever it does not list. Allowlist is a closed-world rule; growth requires a conversation (a spec change). The same linter also closes time, randomness, and identity leakage through globals — those were the original three ports in the diagram (`Clock`, `IdGenerator`, `MathRNG`), and we want them to be replaced by port calls, not just discouraged.

**Alternatives considered**:

- *Custom dependency-cruiser config*: heavier, requires its own tool.
- *Pure convention / code review*: unenforceable across agents. We have AGENTS-driven workflows and the boundary needs to be mechanical.

### D4. Storybook as the first driving adapter

**Choice**: After domain primitives ship with passing unit tests, we install Storybook (already configured in the project) and add a story under `src/domain/find-next-lesson/find-next-lesson.stories.ts` — no, that is the wrong folder. Correction: story lives under `src/components/course-navigator/` or similar, **driven by** the domain use case. Story wires the use case to an `InMemory` adapter and renders the navigation result.

**Rationale**: Cockburn treats Storybook as a legitimate actor — it reads the application in isolation from HTTP/DB and proves the adapter/port wiring works. Doing this before Next.js page wiring means we can ship the domain to merge while the page integration is a separate, lower-risk change.

**Alternatives considered**:

- *Wire Next.js first*: requires Server Action / page work and conflates domain proof with delivery.
- *Playwright first*: heavier harness for an actor that has not yet been proven to work.

### D5. In-memory repository adapters in v0

**Choice**: `InMemoryCourseRepository` and `InMemoryLessonRepository` in `src/adapters/persistence/in-memory/**`, seeded with one course ("Basic — Foundational Pronunciation") and three reading lessons.

**Rationale**: Satisfies the hexágono first without provisioning a database. In-memory adapters make the domain's tests deterministic and Storybook stories reproducible. Postgres lands later as another adapter, with no domain changes.

**Alternatives considered**:

- *JSON-on-disk adapter*: introduces I/O, breaks fast deterministic testing.
- *Postgres from day one*: heavy infra for a hexágono whose boundaries we are still testing.

### D6. Use cases are factory functions taking port dependencies

**Choice**: A use case is `(deps) => (input) => ResultAsync<T, DomainError>`. Plain factory. No classes, no DI container.

**Rationale**: Plain functions compose without ceremony. The type signature documents the dependency graph. Pair-function style means tests can hand in stub ports without mocking frameworks.

**Alternatives considered**:

- *Class with constructor injection*: allocates instance per call. Same readability, twice the boilerplate.
- *DI container*: unnecessary at this domain size.

## Risks / Trade-offs

- **Risk**: The ESLint allowlist depends on `no-restricted-imports`'s `allow` semantics working correctly with `patterns: ["*"]`. → **Mitigation**: confirm the rule against a synthetic violation (e.g., a temporary `import { setRequestLocale } from "next-intl/server"` inside a domain file) during task execution. If it does not fire, fall back to an explicit list of forbidden packages in `patterns`.
- **Risk**: `neverthrow` is small but adds a runtime dependency. If a future migration moves to `Effect` or another scheme, every use case call site changes. → **Mitigation**: Use cases import `ResultAsync` and friends via `src/domain/result.ts` only — this single re-export module is the chokepoint for a future swap.
- **Risk**: Without DB persistence, refreshed Storybook sessions reseed every time. → **Mitigation**: This is expected for v0; the persistence adapter arrives in a later change.
- **Risk**: The Storybook story's "actor" status is debatable — designers and QA do interact with the app in a real, non-trivial way, but if a maintainer views it as "only a dev tool," the design's intent gets diluted. → **Mitigation**: The `design.md` and `docs/ARCHITECTURE.md` (when written) both call Storybook out as an actor with equal standing to a Next.js page.
- **Trade-off**: In-memory adapters mean v0 has no true test of the persistence port. Test doubles cover the contract; the contract itself is exercised later when a Postgres adapter arrives. Acceptable for a hexágono's first iteration.

## Testing strategy

Tests are written **before** the implementation (Red → Green → Refactor), per the project's `AGENTS.md` and the test-driven-development skill.

| Layer             | Tool                          | What is covered                                                                        |
| ----------------- | ----------------------------- | -------------------------------------------------------------------------------------- |
| Domain unit       | Vitest                        | `Course` / `Lesson` schemas; `findNextLessonToRecommend` happy path and error variants; `Result` translation. Lives in `src/domain/**/*.test.ts`. |
| Adapter unit      | Vitest                        | `InMemoryCourseRepository` and `InMemoryLessonRepository` obey the port contract; seeded data round-trips. Lives in `src/adapters/**/*.test.ts`. |
| Component         | Vitest + Testing Library      | The Storybook story rendered as a React component reads the use case's result and surfaces next-lesson state. Lives colocated. |
| Storybook a11y    | Storybook a11y addon          | Visual smoke of the rendered state for the "navigate" flow. |
| E2E               | Playwright                    | **Defer** — a future change wires the domain into the Next.js page. This change's verification runs Vitest only; Playwright is not added. |

The verification task at the end of `tasks.md` will run `pnpm test:run` and `pnpm typecheck`. ESLint runs automatically through the normal pipeline; we will additionally add a `pnpm lint:domain` script that limits the lint run to `src/domain/**` for fast feedback during development.

## Migration Plan

There is no migration: no existing files move. The change introduces new directories (`src/domain/**`, `src/adapters/**`) and adds ESLint rules. Rollback, if ever needed, is "delete the new directories, remove the ESLint rules" — both safe and small.

When this change is archived, the two new specs (`course-platform-domain`, `architecture-boundaries`) fold into `openspec/specs/`. They become normative rules referenced from `AGENTS.md`'s future architecture section (added in a separate documentation change, or in this one if scope is comfortable).

## Open Questions

- **Q1**: Should `src/domain/find-next-lesson/find-next-lesson.stories.tsx` live in `src/components/` instead? Storybook typically renders components, and the story here is structurally a `<CourseNavigator currentLessonId={...} courseId={...} />`. We can make this choice at apply time; both locations respect the hexagon. Default position: put the React rendering under `src/components/course-navigator/` (it is a presentation adapter, not domain), and keep `src/domain/**` 100% framework-free.
- **Q2**: Should the `architecture-boundaries` spec also own the `no-restricted-syntax` rule for `Math.random()` etc., or is that a separate rule spec? Default position: same capability. The rule is logically the boundary rule — it operates on the same files for the same reason.
- **Q3**: Will `pnpm install` fail locally if `next-themes` is also blocked by the same allowlist, since the `src/components/theme-toggle/` already imports it? Default: yes, that's correct — the boundary is on `src/domain/**`; components are not domain and continue to import what they need.
