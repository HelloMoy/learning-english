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

### Server Actions — `next-safe-action`

Use `next-safe-action` for **any Server Action that takes input from the client**.
The client gets typed input, typed validation errors, and typed return values.

```ts
// src/lib/actions/users.ts
"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

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
import { useQueryState, parseAsString } from "nuqs";

const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
```

The `<NuqsAdapter>` is already mounted in `src/components/providers.tsx`. Declare parsers
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
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";

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
import NiceModal, { useModal } from "@ebay/nice-modal-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

// Trigger from anywhere:
import NiceModal from "@ebay/nice-modal-react";
const confirmed = await NiceModal.show(ConfirmModal);
```

The `<NiceModal.Provider>` is already mounted in `src/components/providers.tsx`. One
modal component per file under `src/components/modals/`, named `<Something>Modal`.

## Commit conventions

See [`COMMIT_CONVENTIONS.md`](./COMMIT_CONVENTIONS.md) for the commit format
(Conventional Commits + gitmoji). Key rules:

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
