# AGENTS.md

Instructions for AI coding assistants (Claude Code, Codex CLI, OpenCode, etc.) working
on this project.

## Feature Workflow — OpenSpec + TDD (non-negotiable)

Every **new feature** or **behavior change** MUST follow this sequence. Do not skip steps
or reorder them.

1. **Spec first.** Before any production code, create a change proposal in
   `openspec/changes/<name>/` with the artifacts OpenSpec requires (`proposal.md`,
   `tasks.md`, `design.md`, delta specs — whatever applies). Use the OpenSpec skills:
   `openspec-propose` (full proposal), `openspec-new-change` (step-by-step), or the
   slash form `/opsx:propose "<idea>"`. The proposal says **what** changes and **why**,
   not the how. **Explore first** with `openspec-explore` if the problem is fuzzy.
2. **Apply.** Once the user approves the proposal, run `openspec-apply-change` (or
   `/opsx:apply`) to work through the tasks one by one.
3. **TDD on every task.** Before writing any production code, invoke the
   `test-driven-development` skill (at `.agents/skills/test-driven-development/`).
   Iron law: **NO production code without a failing test first.** If you wrote code
   first, delete it and start over — no "adapting", no "reference". Red → Green →
   Refactor. Use the project's testing stack table below.
4. **Verify and archive.** When tasks are done, run `openspec-verify-change`
   (`/opsx:verify`) to confirm implementation matches the change, then
   `openspec-archive-change` (`/opsx:archive`) to fold deltas into `openspec/specs/`
   and clean up `openspec/changes/`.

**Exceptions** (ask the human partner before skipping the flow): throwaway prototypes,
generated code, pure config files, and cosmetic-only fixes (typos, formatting).

When the user asks for a "feature", "new thing", or behavior change, default to this
flow even if they don't mention OpenSpec explicitly. Suggest `/opsx:propose` as the
first response.

## Code Quality — Clean Code (non-negotiable)

Every new code that is written MUST follow the `clean-code` skill (at
`.agents/skills/clean-code/SKILL.md` and `.claude/skills/clean-code/`). The skill
distills the principles from "Clean Code" by Robert C. Martin (Uncle Bob): "code that
works" → "code that is clean." Read the skill once and apply it on every change —
features, fixes, refactors, tests, stories, scripts.

**Apply it before, during, and after writing code:**

- **Before** — let the rules shape the design: meaningful names, single-responsibility
  functions, one level of abstraction per function, no hidden side effects.
- **During** — keep functions short (≪ 20 lines), prefer 0–2 arguments, express
  yourself in code rather than comments, surface errors as typed values (the skill's
  "don't return null" lines up with the codebase's `Result<T, DomainError>` use-case
  pattern).
- **After** — walk the implementation checklist (function size, single thing,
  intention-revealing names, comments replaced by clearer code, argument count,
  failing test for the change) before declaring the task done.

**Non-negotiables**, lifted straight from the skill in priority order:

1. **Meaningful names** — `elapsedTimeInDays`, not `d`; nouns for classes, verbs for
   methods; avoid `Manager`/`Data` weasel words.
2. **Functions do one thing** — small, single level of abstraction, no side effects.
3. **Comments explain why, not what** — if the code needs a comment, rewrite the code.
4. **Argument count** — 0 ideal, 1–2 fine, 3+ demands a strong justification.
5. **Error handling** — never silent returns, never pass or return `null`; surface
   errors as typed values (the codebase uses `ResultAsync` from `neverthrow` in the
   domain and `error boundaries` in React).
6. **The Three Laws of TDD** — section 7 of the skill; production code appears only
   after a failing test (see [Feature Workflow](#feature-workflow--openspec--tdd-non-negotiable)
   above) and the tests follow F.I.R.S.T. (Fast, Independent, Repeatable,
   Self-Validating, Timely).

**Scope:** every change under `src/` and `e2e/` falls under this rule. Pure config
edits, throwaway scripts, and unmodified output from tooling like `pnpm dlx shadcn@latest
add` are exempt — reformat by feel, do not fight the skill while scaffolding. Any
hand-edit to generated code is **not** exempt; the next line you write must obey the
principles.

**Where the skill defers to the project — read these before refactoring existing code:**

- **JSDoc vs "don't comment."** The skill says most comments are bad. The project still
  requires JSDoc on exported contracts (see [API documentation — TypeDoc](#api-documentation--typedoc)).
  The principle holds: **inline** comments explain the _why_ (regex intent, a non-obvious
  business rule, a workaround), never the _what_. JSDoc is a different layer — it
  documents an exported contract for external callers. Do not delete JSDoc to satisfy the
  skill.
- **Exceptions vs `Result<T, DomainError>`.** The skill's "Use Exceptions instead of
  Return Codes" is from a 2008 era and gets superseded by modern typed error returns.
  This project uses `ResultAsync` from `neverthrow` in the domain and `next-safe-action`
  at delivery boundaries — that _is_ the project's "surface errors as typed values"
  rule, just expressed idiomatically. Do not refactor use cases to throw.
- **JSX verbosity vs "functions under 20 lines."** A component whose JSX legitimately
  grows past the limit (form, table row, layout block) is fine _if_ it has a single
  responsibility. If the JSX mixes concerns (header + body + sidebar logic in one body),
  split via compound components. Resist the urge to extract purely structural sub-components
  that exist only to satisfy the line count — that fragments the tree without adding
  clarity.
- **Hexagonal jargon (`Repository`, `UseCase`, `DrivenAdapter`, `CourseRepository`).**
  These are domain terms the team shares, not the "Manager" / "Data" weasel words the
  skill warns against. Keep them — they map to specific architectural roles enforced by
  ESLint. Same for shadcn/ui primitives.

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

### Folder structure — file name matches folder name (across hexagonal layers)

Every module that owns a named, reusable concept lives in its own folder, and the entry
file carries that folder's name. This keeps each directory self-contained and the
relationship between file, tests, and (where applicable) stories obvious in any IDE tree
view.

The rule applies across all layers of the hexagon:

| Layer                        | Path                                      |
| ---------------------------- | ----------------------------------------- |
| Reusable component (shadcn)  | `src/components/ui/<name>/<name>.tsx`     |
| Reusable component (project) | `src/components/<name>/<name>.tsx`        |
| Domain port                  | `src/domain/ports/<name>/<name>.ts`       |
| Domain entity                | `src/domain/entities/<name>/<name>.ts`    |
| Domain use case              | `src/domain/use-cases/<name>/<name>.ts`   |
| Driven adapter               | `src/adapters/<storage>/<name>/<name>.ts` |
| Custom hook                  | `src/hooks/<name>/<name>.ts`              |
| Lib utility                  | `src/lib/<name>/<name>.ts`                |

Folder and file names use kebab-case (`course-repository`, not `CourseRepository` or
`courseRepository`). The only exception is the `components/` layer: components stay in
PascalCase (`Button` → `button/button.tsx`) so the import name matches the folder. Tests
(`<name>.test.ts[x]`) and stories (`<name>.stories.tsx`) sit next to the entry file.

Plain helpers used in exactly one place do not need a folder — keep them in their
caller's file. The rule kicks in the moment something is exported and meaningful on its
own.

**Enforcement:** the custom ESLint rule
`local-structure/folder-per-entity` (in `eslint.config.mjs`) flags any `.ts`/`.tsx` file
that lives directly under a watched hexagonal root (`src/domain/**`, `src/lib/**`,
`src/hooks/**`, `src/adapters/persistence/in-memory/**`). It runs as part of `pnpm lint`,
which `pnpm verify` already invokes — new violations fail CI without manual review.

## Existing mocks (vitest.setup.ts)

Already configured globally — do not re-mock in individual tests:

- `next/image` → renders a plain `<img>` with the same props
- `next/font/google` → Proxy that returns a mock font for any font name (Geist, Inter, etc.)
- `@testing-library/jest-dom/vitest` matchers (`toBeInTheDocument`, `toHaveAttribute`, …)
- `cleanup()` runs automatically after each test

If you need a new global mock, add it to `vitest.setup.ts`, not to individual tests.

## Libraries

This project uses a curated set of libraries. Use them in the **standard way** documented
below — do not invent custom wrappers or alternative patterns.

### Icons — `lucide-react`

Use `lucide-react` for icons. Import the specific icon, never the whole library.

```tsx
import { Check, ChevronRight } from "lucide-react";

<Button>
  <Check /> Confirm
</Button>;
```

### Internationalization — `next-intl`

**This is non-negotiable: every locale-sensitive value must go through `next-intl`.** Never hardcode UI text, dates, times, numbers, currencies, relative times, lists, plurals, ordinals, or navigation calls. Never call `next/link` or `next/navigation` directly. Never render English-only text assuming it will be translated later.

If a string appears in the UI, it belongs in `src/messages/<locale>.json` and is fetched via `useTranslations` / `getTranslations`. If you need a new translation key, add it to **every** locale's message file — never leave a key untranslated for a locale.

**The complete surface that must go through `next-intl`:**

| What you need            | Use this from `next-intl`                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| UI string / label        | `useTranslations("Namespace").("key")` (or `t.rich` / `t.markup` for embedded React elements / HTML)       |
| Plural-aware copy        | `t.plural(count, { one: "...", other: "# ..." })` — ICU plural rules, never hand-roll `"count + ' items'"` |
| Enum-based copy          | `t.select(value, { male: "...", female: "...", other: "..." })` — ICU select                               |
| Ordinal copy (1st, 2nd)  | `t.ordinal(n)`                                                                                             |
| Date / time              | `format.dateTime(date, { year, month, day, hour, minute, ... })` — locale-correct order and separators     |
| Relative time ("2h ago") | `format.relativeTime(date, { style: "long" })` — not `moment`, not `date-fns`, not hand-rolled math        |
| Number                   | `format.number(1234.5, { style: "decimal" })` — locale-correct grouping/decimal separators                 |
| Currency                 | `format.number(amount, { style: "currency", currency: "USD" })` — symbol, position, separators per locale  |
| Unit (km, °C, kg, …)     | `format.number(value, { style: "unit", unit: "kilometer" })`                                               |
| List / "A, B, and C"     | `format.list(items, { type: "conjunction" \| "disjunction" })` — no manual `.join(", ")`                   |
| `Link` / `useRouter`     | Import from `@/i18n/navigation`, never `next/link` / `next/navigation`                                     |
| Current time (server)    | `getNow()` from `next-intl/server` — never `new Date()` in Server Components (breaks static rendering)     |
| Time zone (server)       | `getTimeZone()` from `next-intl/server` — never `Intl.DateTimeFormat().resolvedOptions().timeZone`         |

Use `next-intl` for all UI strings, dates, numbers, currencies, and locale-aware navigation. Locales live in `src/i18n/routing.ts` (currently `en`, `es`, `pt` with `en` as default and `localePrefix: 'always'` — so URLs always include the locale, e.g. `/en/about`).

**Always import navigation APIs from `@/i18n/navigation`, never from `next/link` or `next/navigation`.** The wrappers there (`Link`, `redirect`, `usePathname`, `useRouter`) preserve the active locale automatically.

**This is non-negotiable.** Importing `Link` from `next/link` or `useRouter` / `redirect` from `next/navigation` bypasses the locale prefix: the user ends up on `/about` instead of `/en/about`, the middleware redirects them, and the locale context is lost. Always use the wrappers from `@/i18n/navigation`. ESLint will not catch this — it's a runtime bug.

```tsx
// ✅ Locale-aware — preserves `/en` in the URL
import { Link, useRouter } from "@/i18n/navigation";

// ❌ NEVER do this — bypasses the locale prefix and drops the locale context
import Link from "next/link";
import { useRouter } from "next/navigation";
```

**Server Components** use `useTranslations` after calling `setRequestLocale(locale)` from `next-intl/server`. Use `React.use(params)` to unwrap the locale — never `await params` inside the component body, otherwise the `react-hooks/rules-of-hooks` ESLint rule fires when calling `useTranslations`:

```tsx
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

type Props = { params: Promise<{ locale: string }> };

export default function Home({ params }: Props) {
  const { locale } = use(params);
  setRequestLocale(locale);

  const t = useTranslations("HomePage");
  return <h1>{t("title")}</h1>;
}
```

Layouts and pages that don't call hooks (e.g. `setRequestLocale` only) can stay `async` and use `await params`.

**Adding a new locale:**

1. Add the code to `locales` in `src/i18n/routing.ts`.
2. Create `src/messages/<locale>.json` with the same keys as the others (use `en.json` as the source of truth).
3. Add a label entry in every locale's `LocaleSwitcher` block.

**Message files** live in `src/messages/<locale>.json` and use nested namespaces (e.g. `HomePage.title`, `LocaleSwitcher.label`). Group related strings under a namespace; never flatten everything to the top level.

### Server Actions — `next-safe-action`

Use `next-safe-action` for **any Server Action that takes input from the client**.
The client gets typed input, typed validation errors, and typed return values.

```ts
// src/lib/actions/users.ts
"use server";

import { actionClient } from "@/lib/safe-action";

import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export const createUserAction = actionClient.schema(schema).action(async ({ parsedInput }) => {
  // parsedInput is fully typed: { name: string, email: string }
  return { id: "..." };
});
```

Always pair with a **Zod schema**. For actions that need auth, derive a new client via
`.use(...)` — see the docstring in `src/lib/safe-action.ts`.

### URL search params — `nuqs`

Use `nuqs` for **filter, sort, pagination, and other URL-bound state**. The state is
shareable, back-button-friendly, and survives reloads.

```tsx
"use client";

import { parseAsString, useQueryState } from "nuqs";

const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
```

The `<NuqsAdapter>` is already mounted in `src/components/global-providers.tsx`. Declare parsers
once at module scope (e.g. `parseAsInteger`, `parseAsStringEnum`) — never inline in
components.

### Server-only code — `server-only`

Mark files that must **never** be bundled into the client. Import `server-only` as the
**first statement** of the file (no `import type` ordering tricks).

```ts
// src/lib/server/db.ts
import "server-only";
```

If a client component accidentally imports this file, the build fails immediately.

### Debounce — `use-debounce`

Use `use-debounce` for **delaying a value or callback** (search inputs, autosave, etc.).

```tsx
"use client";

import { useDebouncedValue } from "use-debounce";

const [query, setQuery] = useState("");
const [debouncedQuery] = useDebouncedValue(query, 300);
```

For callbacks use `useDebouncedCallback`. Default delay is 500ms — pass an explicit
delay when the UX matters (search: 200–300ms, autosave: 1000–2000ms).

### Validation — `zod` (v4)

Use `zod` for **all input validation**: Server Action inputs, form schemas, env vars,
API boundaries. **This project uses Zod v4** — the API differs from v3.

```ts
import { z } from "zod";

const schema = z.object({
  email: z.email(), // v4: top-level, NOT z.string().email()
  url: z.url(), // v4: top-level, NOT z.string().url()
  age: z.number().int().positive(),
});
```

Notable v4 changes from v3: `z.string().email()` → `z.email()`, `z.string().url()` →
`z.url()`, `z.string().uuid()` → `z.uuid()`. Infer TS types with `z.infer<typeof schema>`.

### Global state — `zustand`

Use `zustand` for **client-side global state** that doesn't belong in URL (UI state,
multi-step wizard, ephemeral app flags). **Not for server state** — use Server Actions
or a data fetcher for that.

```ts
// src/stores/use-ui-store.ts
"use client";

import { create } from "zustand";

type UIState = {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
```

Selectors: `const open = useUIStore((s) => s.sidebarOpen)`. Keep state **flat** —
prefer multiple slices over deeply nested objects.

### Tables — `@tanstack/react-table`

Use `@tanstack/react-table` for **any tabular data**. It's headless — you bring the UI.

```tsx
"use client";

import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
});
```

Compose row models (`getCoreRowModel`, `getSortedRowModel`, `getFilteredRowModel`,
`getPaginationRowModel`) as needed. Define `columns` at module scope with stable refs.

### Modals — `@ebay/nice-modal-react`

Use `@ebay/nice-modal-react` for **imperative modal triggers** from anywhere in the tree
(no prop drilling). Pair with shadcn `<Dialog>` for the UI.

```tsx
// src/components/modals/confirm-modal.tsx
"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import NiceModal, { useModal } from "@ebay/nice-modal-react";
// Trigger from anywhere:
import NiceModal from "@ebay/nice-modal-react";

export const ConfirmModal = NiceModal.create(() => {
  const modal = useModal();
  return (
    <Dialog
      open={modal.visible}
      onOpenChange={modal.hide}
    >
      <DialogContent onClose={() => modal.remove()}>
        <DialogTitle>Confirm</DialogTitle>
        <button onClick={() => modal.resolve(true)}>Yes</button>
        <button onClick={() => modal.resolve(false)}>No</button>
      </DialogContent>
    </Dialog>
  );
});

const confirmed = await NiceModal.show(ConfirmModal);
```

The `<NiceModal.Provider>` is already mounted in `src/components/global-providers.tsx`. One
modal component per file under `src/components/modals/`, named `<Something>Modal`.

### Component development — Storybook

Use **Storybook** for isolated component development, visual review, and accessibility checks. The dev server runs at `http://localhost:6006`.

**Story files live next to their component**, named `<Component>.stories.tsx` (e.g. `Button.tsx` → `Button.stories.tsx`). Never put stories in a separate `stories/` folder.

**Framework:** `@storybook/nextjs-vite` — Vite-based, recommended over the webpack-based `@storybook/nextjs` for all Next.js projects (faster, better testing integration). The `addons` enabled are `@storybook/addon-docs`, `@storybook/addon-a11y`, `@storybook/addon-themes`, and `@storybook/addon-vitest`.

**CSF3 format with `Meta` + `StoryObj`**, types imported from `@storybook/nextjs-vite` (NOT `@storybook/react` — that's not installed):

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: { control: { type: "select" }, options: ["default", "outline", "destructive"] },
  },
  args: { children: "Click me" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Destructive: Story = { args: { variant: "destructive" } };
```

**Translations in stories:** the preview wraps every story with `NextIntlClientProvider` (see `.storybook/preview.tsx`). To render a story in a specific locale, set `parameters.locale`:

```tsx
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: { children: "Haz clic" },
};
```

**Scripts:**

- `pnpm storybook` — dev server on port 6006
- `pnpm build-storybook` — produce a static build (for Chromatic / docs hosting)

**Rules:**

- One `*.stories.tsx` per component, colocated.
- Every story must have a `title` so it shows up in the sidebar (use the `Components/<ComponentName>` convention — e.g. `Components/ThemeToggle`).
- Don't mock next/link or next/navigation — the `nextjs-vite` framework provides working mocks automatically.
- Accessibility violations appear in the addon panel — switch the `a11y.test` parameter from `"todo"` to `"error"` in CI if you want hard enforcement.

### Adding reusable components

When adding **any reusable component** — shadcn/ui primitives (via `pnpm dlx shadcn@latest add <name>`), project-specific components (`<ThemeToggle>`, `<LocaleSwitcher>`), or feature widgets — the work is **not done** until all four of these are true:

1. **Storybook stories colocated** — create `<Component>.stories.tsx` next to the file. Follow the `storybook-story-writing` skill.

2. **i18n-compatible** — if the component renders any user-facing string, follow the conventions in the `Internationalization — next-intl` section above. Add the new keys to **every** locale's message file under a `Components.<ComponentName>` namespace. Verify the story renders correctly in `en`, `es`, and `pt` using the toolbar locale switcher.

3. **Tests colocados** — create `<Component>.test.tsx` next to the file. Follow the `testing-conventions` skill.

4. **JSDoc documentation** — document the component, its props, and any exported variants/types using the `jsdoc-typescript-docs` skill.

If the component is purely presentational and stateless (icons, dividers, skeleton loaders with no text and no interaction), rules 2 and 3 may collapse to "skip" — but rules 1 (stories) and 4 (JSDoc) still apply.

> The folder-per-component layout below follows the general **Folder structure** rule
> in the [Conventions](#conventions) section — see that section for the full table of
> layer paths.

#### For shadcn/ui components specifically

- **The folder-per-component rule applies to every shadcn component** — whether it lands via `pnpm dlx shadcn@latest add <name>`, gets copied from another project, or is written by hand. End state is always `src/components/ui/<component>/<component>.tsx` (+ `.stories.tsx` + `.test.tsx`).
- The shadcn CLI is the canonical source, but it writes flat (`<aliases.ui>/<component>.tsx`). The `mv` post-add is the workaround until/unless shadcn adds folder-per-component support natively.
- The translation namespace is always `Components.<ComponentName>` (e.g. `Components.Button`, `Components.Calendar`)
- shadcn components often render aria-labels, tooltips, or copy that needs translation — audit carefully

**Example A** — adding via the shadcn CLI:

```bash
pnpm dlx shadcn@latest add button
# → src/components/ui/button.tsx created (flat, by default)

# Move into the folder-per-component layout
mkdir -p src/components/ui/button
mv src/components/ui/button.tsx src/components/ui/button/button.tsx

# 1. Stories → src/components/ui/button/button.stories.tsx (per storybook-story-writing)
# 2. i18n audit → src/messages/{en,es,pt}.json under Components.Button.*
# 3. Tests → src/components/ui/button/button.test.tsx (per testing-conventions)
# 4. JSDoc → JSDoc blocks on Button, its props, and exported variants
```

**Example B** — adding by hand (no CLI):

```bash
mkdir -p src/components/ui/calendar

# Create the three files directly inside the folder:
#   src/components/ui/calendar/calendar.tsx           # the component
#   src/components/ui/calendar/calendar.stories.tsx   # per storybook-story-writing
#   src/components/ui/calendar/calendar.test.tsx      # per testing-conventions
# + JSDoc on Calendar, its props, and exported variants

# i18n audit → src/messages/{en,es,pt}.json under Components.Calendar.*
```

The final structure for `Button`:

```
src/components/ui/button/
├── button.tsx
├── button.stories.tsx
└── button.test.tsx
```

#### For project-specific reusable components (e.g. `<ThemeToggle>`, `<LocaleSwitcher>`)

- Place under `src/components/<component-name>/<component-name>.tsx` — same folder convention as shadcn components, file name matches the folder.
- The same four rules apply — colocated stories, i18n, tests, JSDoc
- Translation namespace follows the same `Components.<ComponentName>` convention

**Example** — adding a new project-specific component:

```bash
# → src/components/my-widget/my-widget.tsx

# 1. Stories → src/components/my-widget/my-widget.stories.tsx
# 2. i18n     → add namespace to src/messages/{en,es,pt}.json under Components.MyWidget.*
# 3. Tests    → src/components/my-widget/my-widget.test.tsx
# 4. JSDoc    → JSDoc blocks on MyWidget, its props, and exported helpers
```

A component merge without its stories is incomplete. A component with hardcoded strings is a regression. A component without tests is unverified. A component without JSDoc is undocumented.

#### Translations vs Faker in stories

Story copy has **two distinct categories** with different sources. Conflating them bloats production bundles, breaks determinism, or defeats i18n — pick the right source for each case.

**Translations** (DEFAULT for any string the reviewer reads):

- Lives in `.storybook/messages/<locale>.json` under the `Stories.*` namespace
- NEVER in `src/messages/<locale>.json` — that namespace is for production strings only
- Translators can ignore the entire `Stories.*` namespace; it never reaches end users
- Always translated for every locale
- Always deterministic — the reviewer must know exactly what to expect when reading a story

**Faker** (EXCEPTION for generated sample data, only when determinism doesn't matter):

- Use when a story needs a long list of fake users, mock transactions, generated dates, etc. — and the exact values don't matter
- MUST be internationalized — import the helper from `.storybook/utils/getFakerIntl.ts` and pass it the locale from the Storybook toolbar (`context.globals.locale`). **Never** default to the English `faker` instance when the toolbar shows `es` or `pt`; that produces Spanish UI labels with English fake names, which defeats the i18n switcher

```ts
import { getFakerIntl } from "../../../.storybook/utils/getFakerIntl";

function UserProfileStory(
  _: unknown,
  context: { globals: { locale: "en" | "es" | "pt" } },
) {
  const fakerIntl = getFakerIntl(context.globals.locale);
  return (
    <UserProfile
      name={fakerIntl.person.fullName()}
      email={fakerIntl.internet.email()}
    />
  );
}
```

The import path has three levels (`../../../`) because stories live at `src/**/*.stories.tsx` and `.storybook/` sits outside `src/` — the project's `@/` alias doesn't cover it.

**Decision rule**: if removing determinism would make the story confusing or unreviewable (e.g. "I told the reviewer to click 'Delete' but the button shows 'Excluir'"), use **translations**. If the exact value is incidental (e.g. "this table has 50 rows of fake users"), use **faker**.

## API documentation — TypeDoc

The project uses **[TypeDoc](https://typedoc.org/)** to generate a static HTML reference from JSDoc comments in the source code. Output lives in `./docs/` (gitignored — regenerated by `pnpm docs`).

**Scripts:**

- `pnpm docs` — generate the static site
- `pnpm docs:watch` — regenerate on file changes
- `pnpm docs:serve` — serve `./docs/` on `http://localhost:8080` via `http-server`

**Configuration** lives in `typedoc.json` at the repo root. Notable choices:

- `entryPointStrategy: "expand"` from `./src` — covers the whole codebase, not just a library-style public surface
- `excludeNotDocumented: true` — files with no JSDoc on their exports are skipped, keeping output focused on things worth documenting
- `exclude` filters out tests, stories, and Next.js build artifacts
- `excludePrivate` / `excludeInternal` / `excludeExternals` — only project-internal, exported, documented symbols appear

**No i18n on TypeDoc output.** The generated site is English-only (matching the source code). Translating rendered HTML is out of scope and not worth the maintenance cost.

### When to add JSDoc for TypeDoc

JSDoc is **required** for anything that becomes a "reference" — the kind of code where a future contributor (human or AI) needs to understand _what it is, when to use it, and how to use it_ without reading every line. Apply TypeDoc-grade JSDoc to:

- **Reusable components** (`src/components/**/<component>.tsx`) — summary, props, variants, examples
- **Custom hooks** (`src/hooks/**` or wherever they live) — return value, args, when to use
- **Lib utilities** (`src/lib/**`) — what the function does, params, return value, throws
- **Exported types/interfaces/enums** that form a contract used elsewhere
- **Server actions** (`src/lib/actions/**` or wherever) — input schema, auth requirements, side effects
- **Reusable i18n wiring** (`src/i18n/routing.ts`, decorators) — locale config, decorator precedence

JSDoc is **not required** for:

- Plain page components under `src/app/` that are mostly JSX with no exported helpers
- Internal helpers used in one place and never imported elsewhere
- Test files (excluded from TypeDoc)

### JSDoc tags TypeDoc understands

Use these tags to enrich the generated docs:

| Tag                   | Purpose                                                                | Example                                     |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------- |
| `@remarks`            | Extended description below the summary                                 | `@remarks Useful for batch operations`      |
| `@example`            | Code sample rendered as a block                                        | See the block format with ` ```ts ... ``` ` |
| `@param` / `@returns` | Already standard JSDoc; TypeDoc renders them in the function signature | `@param amount - Amount in cents`           |
| `@throws`             | Document error conditions                                              | `@throws if amount is negative`             |
| `@see`                | Cross-link to another symbol                                           | `@see otherFunction`                        |
| `@category`           | Group related symbols under a category in the sidebar                  | `@category Utilities`                       |
| `@internal`           | Mark as internal (excluded from output even if exported)               | Just add the tag — no value needed          |

### Example — JSDoc that TypeDoc renders well

````ts
/**
 * Joins a list of class names, dropping falsy values.
 *
 * @remarks
 * Mirrors the behavior of `clsx` but uses the project's preferred
 * `tailwind-merge` for conflict resolution. Use this instead of `clsx`
 * everywhere in the app — the merge step is important for utility-first
 * classes like `px-2` vs `px-4`.
 *
 * @example
 * ```ts
 * cn("px-2", isActive && "bg-blue-500", undefined); // "px-2 bg-blue-500"
 * ```
 *
 * @param inputs - Class names, objects, or falsy values to merge
 * @returns A single space-separated class string with falsy values dropped
 */
export function cn(...inputs: ClassValue[]): string {
  // ...
}
````

## Commit conventions

See [`COMMIT_CONVENTIONS.md`](./COMMIT_CONVENTIONS.md) for the commit format
(Conventional Commits + gitmoji). Key rules:

- Dependencies → `build` (never `chore`)
- Documentation → `docs` + `:memo:`
- Tests → `test` + `:white_check_mark:`
- First line ≤ 72 chars, kebab-case scope, imperative mood, no trailing period

## Before finishing

A task is **not done** until all checks pass. Run them and fix any failures before
declaring the task complete.

```bash
pnpm typecheck      # TypeScript types
pnpm format:check   # Prettier formatting
pnpm lint           # ESLint rules
pnpm test:run       # Vitest unit + component
```

**Shortcut**: `pnpm verify` runs all four in sequence and stops on the first failure.

### If a check fails

1. **Read the error message** — never ignore or dismiss a check failure.
2. **Identify the root cause** — don't paper over with `@ts-ignore`, `eslint-disable`, or
   `prettier --write` without understanding why.
3. **Fix the underlying issue** — change the code, the config, or the data; never the
   check itself unless the check is genuinely wrong.
4. **Re-run all checks** — a fix in one area can surface issues in another.
5. **Only then declare the task done**.

### What "failing" looks like

- `typecheck` → TypeScript reports an error → fix the type or the code, not the tsconfig
- `format:check` → Prettier says which files differ → run `pnpm format` to apply, then
  re-verify (do NOT commit `.prettierrc` changes that loosen the rules just to pass)
- `lint` → ESLint reports a rule violation → fix the code; if a rule is genuinely wrong,
  discuss before disabling it project-wide
- `test:run` → a test fails → either fix the code (if the test caught a real bug) or
  fix the test (if the test was wrong); never delete a failing test to make it pass

## Architecture — Hexagonal (Cockburn)

This codebase uses Alistair Cockburn's hexagonal architecture (Ports & Adapters). The application intent ("deliver courses to a student") lives in `src/domain/**` and is unconcerned with how it is invoked. Boundary rules are enforced by ESLint — `pnpm lint:domain` shows them.

**One-line rule:** `src/domain/**` may import only `zod`, `neverthrow`, and `ts-pattern`. Anything else goes through a port.

**Ports** are interfaces in `src/domain/ports/**` (`CourseRepository`, `LessonRepository`, `Clock`, `IdGenerator`). **Use cases** in `src/domain/use-cases/**` are factories that take ports and return `ResultAsync<T, DomainError>` via `neverthrow`. **Driven adapters** live under `src/adapters/**`. **Driving adapters** (UI, tests) live wherever they belong outside the domain.

**Quick checks before touching domain code:**

- Domain code does not import `next`, `next-intl`, `next-safe-action`, `next-themes`, `zustand`, `nuqs`, `server-only`, `@/i18n`, `@/adapters`, `@/components`, or `@/app`. ESLint enforces this — add exceptions to the rule before using a new package here.
- Domain code does not call `new Date()`, `Date.now()`, `Date.UTC()`, `Math.random()`, or `crypto.*`. Use ports (`Clock`, `IdGenerator`) instead. ESLint enforces this.
- Use cases do not throw. They return `Result<T, DomainError>`. Adapters translate `Err` to delivery-specific shapes.

**Authoritative spec:** `openspec/specs/architecture-boundaries/spec.md` (boundary rules) and `openspec/specs/course-platform-domain/spec.md` (domain rules). Updates to the allowlist or forbidden-syntax list go through an OpenSpec change.

**i18n for components in the hexágono** — every component lives under `Components.<ComponentName>` in `src/messages/<locale>.json` (see § Internationalization above). The component's `useTranslations("Components.<ComponentName>")` resolves the namespace. Outside the hexágono, pages use namespaces like `HomePage.*` for their own copy.

**Commit message format is enforced mechanically** — `commitlint` runs via `.husky/commit-msg` and validates every commit against the rules in `commitlint.config.cjs` (which mirror `COMMIT_CONVENTIONS.md`). Bad messages are blocked; do not bypass with `--no-verify` for normal commits.
