# scripts/

Build-time tooling that lives outside `src/` — content seed generators, slug
utilities, ad-hoc migration scripts. Each script is standalone and has its
own tests colocated (`scripts/*.test.ts`).

## `slug.ts` — folder-name → URL slug

`slugify(rawName)` lowercases, strips accents, replaces spaces and special
characters (`&`, `#`, `:`, `/`) with `-`, collapses runs of `-`, and trims.
Empty results fall back to `"untitled"`. Idempotent.

```ts
import { slugify } from "./slug";

slugify("5 Sound Natural: American Intonation Essentials");
// → "5-sound-natural-american-intonation-essentials"
slugify("Contractions & Reductions"); // → "contractions-reductions"
slugify("Day#7"); // → "day-7"
```

## `slug-overrides.ts` — manual override map

If the automatic slug is awkward, list a raw name → slug pair in
`SLUG_OVERRIDES`. The seed generator (when it lands) will read this map and
prefer the manual entry. Each addition is reviewed in code review alongside
the content it represents.

```ts
export const SLUG_OVERRIDES: Record<string, string> = {
  "1 Day#1": "1-day-01",
  "3 Day# 3": "3-day-03",
};
```

## `generate-course-content-seed.ts` — seed generator

Walks `public/local-filesystem-lesson/`, infers lessons and resources
from file presence (`.mp4` → video, `.md` → reading body, `.pdf` →
resource), extracts `durationSeconds` from each `.mp4` via `ffprobe`,
and emits `src/adapters/persistence/in-memory/seed/seed-content.ts`.

### How to regenerate the seed

The canonical way is via vitest (handles the TS + `@/...` aliases natively):

```bash
pnpm vitest run scripts/regenerate-content-seed.test.ts
```

The test is gated by `describe.skipIf(!existsSync(REAL_CONTENT))`, so
it's a no-op on machines without the real content folder and runs the
generator when it is present.

A bare `node --experimental-strip-types scripts/generate-course-content-seed.ts`
path was attempted but hits a zod 4 `@zod/source` condition mismatch —
vitest is the supported runtime. If `tsx` is added to `package.json`
later, the script will run via `pnpm tsx scripts/generate-course-content-seed.ts`
without changes.

## Environment variable: `USE_COURSE_CONTENT_SEED`

Set `USE_COURSE_CONTENT_SEED=1` before booting the app to use the
generator's output instead of the A1 hardcoded seed:

```bash
USE_COURSE_CONTENT_SEED=1 pnpm dev
```

Default behaviour (env var unset) is the A1 seed — tests, Storybook, and
local dev boot continue to work without any change. Only the literal string
`"1"` activates the content seed; `"true"`, `"yes"`, etc. do not.
