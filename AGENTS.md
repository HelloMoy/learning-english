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
- Every story must have a `title` so it shows up in the sidebar (use the `UI/<Component>` convention).
- Don't mock next/link or next/navigation — the `nextjs-vite` framework provides working mocks automatically.
- Accessibility violations appear in the addon panel — switch the `a11y.test` parameter from `"todo"` to `"error"` in CI if you want hard enforcement.

### Adding shadcn/ui components

When adding a new shadcn/ui component (via `pnpm dlx shadcn@latest add <name>` or manually), the work is **not done** until all four of these are true:

1. **Storybook stories colocated** — create `<Component>.stories.tsx` next to the file. Follow the `storybook-story-writing` skill.

2. **i18n-compatible** — if the component renders any user-facing string, follow the conventions in the `Internationalization — next-intl` section above. Add the new keys to **every** locale's message file under a `Components.<ComponentName>` namespace. Verify the story renders correctly in `en`, `es`, and `pt` using the toolbar locale switcher.

3. **Tests colocados** — create `<Component>.test.tsx` next to the file. Follow the `testing-conventions` skill.

4. **JSDoc documentation** — document the component, its props, and any exported variants/types using the `jsdoc-typescript-docs` skill.

If the component is purely presentational and stateless (icons, dividers, skeleton loaders with no text and no interaction), rules 2 and 3 may collapse to "skip" — but rules 1 (stories) and 4 (JSDoc) still apply.

**Example** — adding `shadcn add calendar`:

```bash
pnpm dlx shadcn@latest add calendar
# → src/components/ui/calendar.tsx created

# 1. Stories → src/components/ui/calendar.stories.tsx (per storybook-story-writing)
# 2. i18n audit → src/messages/{en,es,pt}.json under Components.Calendar.*
# 3. Tests → src/components/ui/calendar.test.tsx (per testing-conventions)
# 4. JSDoc → JSDoc blocks on Calendar, its props, and exported variants
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
