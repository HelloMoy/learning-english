## Why

The codebase has no separation between application intent and its delivery mechanism. Today every consumer (Next.js pages, Server Actions, Storybook stories, Playwright tests, future API routes or cron jobs) reaches directly into libraries like `next-safe-action`, `next-intl`, `zustand`, `nuqs`, and React itself. Because there is no domain boundary, "the application is unconcerned with the actors it interacts with" — the Cockburn invariant — is currently violated by structure, not merely by intent. We are about to introduce a second actor (course content) and a first real navigation flow (`findNextLessonToRecommend`); establishing the hexagon now, while the codebase is small, costs little and prevents the migration tax we would incur later.

The proposed domain is a **course platform** — initially serving English, but the delivery is intended to be course-agnostic. That intent — *deliver courses to a student, regardless of subject* — is exactly the kind of statement a hexagon protects.

## What Changes

- Introduce `src/domain/**` containing entities, use cases, ports, and pure domain logic. **No existing code is moved into this directory in v0**.
- Introduce `src/adapters/**` for driven adapter implementations (in-memory seeded with a sample course).
- Introduce `src/domain/result.ts` (re-exporting `neverthrow`) as the dependency injection point for `Result<T, E>` semantics in domain code.
- Add `neverthrow` as a runtime dependency.
- Configure ESLint with an **allowlist** rule (`no-restricted-imports`) for `src/domain/**` that allows only `zod`, `neverthrow`, and (optionally) `ts-pattern`. Adding any other dependency requires updating the spec.
- Add an ESLint `no-restricted-syntax` rule for `src/domain/**` forbidding `new Date()`, `Date.now()`, `Math.random()`, and `crypto.*` calls — these are gateway leaks that bypass the `Clock` and `IdGenerator` ports.
- Seed the first domain use case, `findNextLessonToRecommend`, with failing tests written first (TDD), implementation last.
- Wire **Storybook as the first driving adapter**. Storybook is a real Cockburn actor (it reads the application in isolation); proving the hexagon in Storybook before wiring Next.js removes the assumption that delivery is needed to validate the domain.
- Lock these rules in `openspec/specs/architecture/` so they outlive this change and are visible to future agents via `AGENTS.md`'s reference to OpenSpec.

## Capabilities

### New Capabilities

- `course-platform-domain`: The domain primitives for a course platform. Courses and lessons (Lesson as a discriminated union starting with `kind: 'reading'`), ports (`CourseRepository`, `LessonRepository`, `Clock`, `IdGenerator`), and the first use case `findNextLessonToRecommend`. Use cases return `Result<T, DomainError>` via `neverthrow`; they never throw.
- `architecture-boundaries`: The architectural rule that the domain is unconcerned with delivery: imports are allowlisted, side-effect globals (clock, RNG, UUID) are forbidden by name in `src/domain/**`, ESLint enforces both. New dependencies require spec updates.

### Modified Capabilities

(none — `openspec/specs/` is currently empty; this change adds new specs without modifying any existing one.)

## Impact

- **New code paths**: `src/domain/**`, `src/adapters/**`, `src/test-setup/mocks/` (seeded in-memory adapters).
- **New runtime dependency**: `neverthrow`.
- **New dev dependency**: (none; ESLint plugin is already in the project via `eslint.config.mjs`).
- **Configuration changes**: `eslint.config.mjs` gains a flat-config block scoped to `src/domain/**`.
- **Existing code**: untouched. `src/app/[locale]`, `src/components/**`, `src/lib/utils.ts`, `src/lib/safe-action.ts`, `src/i18n/**`, `src/proxy.ts` remain as they were. The page currently renders a heading and the locale switcher; it is not yet a consumer of the domain.
- **No breaking changes** for any existing runtime path.

## Non-goals

- **Not in scope here**: enrollment, progress tracking, scoring, auth, multi-tenancy, persistence to disk or database, Server Actions consuming the domain, Next.js pages consuming the domain, Playwright e2e for the flow. Each of these lands in its own follow-up change.
- **Not modifying**: existing files under `src/app/**`, `src/components/**`, `src/lib/**`, `src/i18n/**`. v0 introduces structure; it does not migrate what is already there.
- **Not introducing**: DDD tactical patterns (aggregates, domain services, repositories as classes) beyond what the use case needs. `Course` and `Lesson` are Zod schemas; use cases are pure functions. If the domain later needs aggregates, that is a separate change with its own design rationale.
- **Not introducing**: a port for HTTP, since we have no HTTP-only behavior in v0. Server Actions and pages, when they arrive, use the existing ports via `safe-action` adapters.
- **Not introducing**: i18n logic in the domain. The `Course.language` field is data; locale routing and translation live in adapters.
