# AGENTS.md

Instructions for AI coding assistants (Claude Code, Codex CLI, OpenCode, etc.) working
on this project.

## Project

- **Stack**: Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui
- **Package manager**: pnpm
- **Node**: 22+
- **Path alias**: `@/*` → `src/*`

## Testing stack

Use the right tool for each layer. Do not mix them.

| Layer                        | Tool                                                                      | Where                         |
| ---------------------------- | ------------------------------------------------------------------------- | ----------------------------- |
| Unit (pure functions, utils) | **Vitest**                                                                | `src/**/*.test.ts` colocated  |
| Component (React)            | **Vitest** + **@testing-library/react** + **@testing-library/user-event** | `src/**/*.test.tsx` colocated |
| End-to-end (browser flows)   | **Playwright**                                                            | `e2e/*.spec.ts`               |

Never test React components with Playwright if Vitest + RTL can cover the case.
Never use Vitest for full browser flows — that's Playwright's job.

## Commands

```bash
pnpm test:run          # Vitest one-shot (unit + component)
pnpm test              # Vitest watch mode
pnpm test:coverage     # Vitest with v8 coverage
pnpm test:ui           # Vitest UI
pnpm test:e2e          # Playwright all browsers (chromium, firefox, webkit)
pnpm test:e2e:ui       # Playwright UI mode
pnpm test:e2e:codegen  # Playwright record-and-generate
```

## Conventions

- **Colocate tests** next to source: `foo.tsx` → `foo.test.tsx`.
- **E2E tests** live in `e2e/` (not inside `src/`).
- **Use `@faker-js/faker`** for arbitrary inputs (names, urls, numbers, words). Only
  hardcode values when the test verifies behavior tied to the exact form of the input
  (e.g. Tailwind class prefixes, specific falsy values).

## Existing mocks (vitest.setup.ts)

Already configured globally — do not re-mock in individual tests:

- `next/image` → renders a plain `<img>` with the same props
- `next/font/google` → Proxy that returns a mock font for any font name (Geist, Inter, etc.)
- `@testing-library/jest-dom/vitest` matchers (`toBeInTheDocument`, `toHaveAttribute`, …)
- `cleanup()` runs automatically after each test

If you need a new global mock, add it to `vitest.setup.ts`, not to individual tests.

## Commit conventions

See `.vscode/commit-instructions.md` for the commit format (Conventional Commits +
gitmoji). Key rules:

- Dependencies → `build` (never `chore`)
- Documentation → `docs` + `:memo:`
- Tests → `test` + `:white_check_mark:`
- First line ≤ 72 chars, kebab-case scope, imperative mood, no trailing period

## Before finishing

Run before considering a task done:

```bash
pnpm format:check
pnpm lint
pnpm test:run
```
