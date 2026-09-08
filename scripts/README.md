# scripts/

Build-time tooling that lives outside `src/` — content seed generators, slug
utilities, ad-hoc migration scripts. Each script is standalone and has its
own tests colocated (`scripts/*.test.ts`).

## `slug.ts` — folder-name → URL slug

`slugify(rawName)` lowercases, strips accents, replaces spaces and special
characters (`&`, `#`, `:`, `/`) with `-`, collapses runs of `-`, and trims.
Empty results fall back to `"untitled"`. Idempotent. To force a different
slug, use the owning course's `slugOverrides` (see below) — `resolveSlug`
applies the map first and falls back to `slugify`.

```ts
import { slugify } from "./slug";

slugify("5 Sound Natural: American Intonation Essentials");
// → "5-sound-natural-american-intonation-essentials"
slugify("Contractions & Reductions"); // → "contractions-reductions"
slugify("Day#7"); // → "day-7"
```

## `courses.manifest.json` — the one place a course is declared

Everything about a course that the content tree cannot express is declared in
`public/local-filesystem-lesson/courses.manifest.json`: its identity, its place
in the home ladder, and its per-folder corrections. Adding a course is "drop the
folder, add an entry, regenerate" — no `.ts` file changes.

```jsonc
{
  "version": 1,
  "courses": [
    {
      "folder": "advanced-intermediate-course", // required: directory under the content root
      "sequence": 2, // required: rung of the home ladder, unique
      "slug": "advanced-intermediate-course", // optional: defaults to slugify(folder)
      "title": "Advanced Intermediate Course", // optional: defaults to humanize(slug)
      "description": "…", // optional: defaults to a generated sentence
      "language": "en", // optional: defaults to "en"

      // Raw on-disk folder name → slug, when the automatic one is wrong.
      "slugOverrides": { "1 Day#1": "1-day-01" },

      // Module slugs whose lesson titles come from each readme.md heading.
      "titleFromNotesModules": ["3-contractions-reductions"],

      // moduleSlug/lessonSlug → title, for lessons no automatic source names.
      "lessonTitleOverrides": { "3-contractions-reductions/6-i-d": "I’d, you’d, we’d" },
    },
  ],
}
```

The schema, and the reasoning behind each override field, live in
`scripts/courses-manifest/courses-manifest.ts`.

### The live manifest is untracked; the example is not

`public/local-filesystem-lesson/` is gitignored in full, so the live manifest is
too. It describes ~15 GB of untracked content and is only meaningful on a machine
that has it — the two are present and absent together.

`scripts/courses.manifest.example.json` is the tracked template AND the record of
the current course's reviewed values. It is a working manifest, not a stub:

```bash
cp scripts/courses.manifest.example.json public/local-filesystem-lesson/courses.manifest.json
```

on a machine with the content regenerates `seed-content.ts` with an empty diff.
This mirrors the repo's `.env` / `.env.example` split.

**Where review happens.** The manifest is not reviewable as a diff. What _is_
reviewable is the committed `seed-content.ts`: every title and slug the manifest
produces lands there, so a reviewer still sees each change. Update the example
manifest in the same commit whenever you change the live one.

### Behaviour when the manifest is absent or wrong

- **Absent** — the generator emits one course from the first top-level folder with
  every field derived. This is exactly the pre-manifest behaviour, so a content
  root that has not been configured still works.
- **Malformed, or naming a folder that is not on disk** — generation aborts
  non-zero without writing. A present-but-wrong manifest is an error, never a
  silent fallback to the defaults.
- **A folder no entry names** — reported on stderr and skipped, exit zero. An
  undeclared folder is a staging area, not a mistake.

## `content-locations.json` — where each asset lives

The **second** manifest, and not to be confused with the first. They answer to
different actors on different clocks:

|                | `courses.manifest.json`       | `content-locations.json`        |
| -------------- | ----------------------------- | ------------------------------- |
| Read           | build time, by the generator  | **runtime**, by the app         |
| Declares       | what a course **is**          | where each blob **lives**       |
| Tracked in git | no (sits in the content root) | **yes** (repo root)             |
| On change      | regenerate the seed           | nothing — next boot picks it up |

**A content key never changes when its asset moves.** The seed holds opaque
keys; only the store that resolves them changes. That is why a migration
touches no lesson row and never regenerates `seed-content.ts`.

```jsonc
{
  "version": 1,
  "stores": {
    "local": { "driver": "local", "baseUrl": "/local-filesystem-lesson" },
    "s3-video": {
      "driver": "s3",
      "bucket": "lessons-video",
      "region": "us-east-1",
      "pathPrefix": "v1/", // where keys sit INSIDE the bucket
      "visibility": "signed", // "public" | "signed" (default: signed)
      "signedUrlTtlSeconds": 21600, // optional; default 6 h
    },
    "gcs-docs": {
      "driver": "gcs",
      "bucket": "lessons-docs",
      "visibility": "public",
      "publicUrl": "https://cdn.example.com/docs", // required when public
    },
  },
  "default": "local",
  "routes": [{ "prefix": "advanced-intermediate-course/8-everyday/", "store": "s3-video" }],
  "overrides": { "advanced-intermediate-course/3-contractions/6-i-d/odd.mp4": "gcs-docs" },
}
```

**Resolution order**: a declared `assets` entry, then an exact `overrides` hit,
then the LONGEST matching `routes` prefix, then `default`. A prefix matches on
path boundaries, so `course/` never captures `coursework/`.

### `assets` — declaring where an asset actually is

`routes` and `overrides` move a key between stores while it keeps its
key-derived path (`pathPrefix` + key). That covers migrations, which preserve
the object layout. It does not cover an asset whose real path does not follow
its key:

```jsonc
"assets": {
  // Two lessons, one object.
  "curso/1-intro/1-welcome/video.mp4": { "store": "s3-video", "objectPath": "shared/welcome-2024.mp4" },
  // Renamed inside the bucket; store unchanged.
  "curso/2-vowels/3-fast/notes.md":    { "objectPath": "legacy/fast-notes.md" },
  // Moved store; path still derived from the key.
  "curso/3-contr/6-i-d/odd.mp4":       { "store": "gcs-docs" }
}
```

Both fields are optional, but an entry must declare at least one — one that
declares neither is rejected, not ignored. A declared `objectPath` replaces the
key **and** the store's `pathPrefix`. `assets` is the only layer that may change
a path, so you can always predict where a bulk migration lands.

| I want to…                                | Use                  |
| ----------------------------------------- | -------------------- |
| Migrate a module to a bucket              | a `routes` prefix    |
| Move one file to another store            | an `overrides` entry |
| Point a key at a differently-named object | an `assets` entry    |

### Making the manifest exhaustive

To have every asset's placement written down rather than inferred:

```bash
pnpm materialize:content-assets
```

It writes one `assets` entry per key in `seed-content.ts`, each recording the
store and object path that key **already** resolved to — so it changes no URL.
It is idempotent (a no-op run rewrites the file byte-for-byte) and preserves any
`objectPath` you declared by hand.

This is opt-in. Without it the manifest stays an exception list, which is the
lighter thing to maintain. With it, `pnpm verify:content` additionally reports
any `assets` entry whose key the seed no longer has — an exhaustive block goes
stale as soon as content is renamed, so re-run materialize after regenerating
the seed.

**Credentials never go here** — this file is tracked. Bucket names, regions and
CDN URLs are not secrets; access keys come from the environment
(`AWS_ACCESS_KEY_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, …). See `.env.example`.

### Moving content

Do not hand-edit the manifest. The script copies, verifies at the destination,
and only then records the placement — so an interrupted move leaves the
manifest pointing at bytes that are still there:

```bash
# A whole module (trailing slash ⇒ a route)
pnpm move:content --to s3-video --select advanced-intermediate-course/8-everyday/

# One file (no trailing slash ⇒ an override)
pnpm move:content --to gcs-docs --select advanced-intermediate-course/3-contractions/6-i-d/odd.mp4

# Remove the source objects only after every copy has verified
pnpm move:content --to s3-video --select advanced-intermediate-course/8-everyday/ --delete-source
```

Then check the whole inventory against the routed stores:

```bash
pnpm verify:content   # walks every key in seed-content.ts, exits non-zero naming any that miss
```

### Private stores

A `signed` store's keys resolve to `/api/content/<key>`, which signs a URL and
answers **302**. Bytes are never proxied through the Node process — the browser
fetches and range-requests directly from the bucket, which is what keeps video
seeking working. Signed URLs default to a 6-hour TTL, deliberately longer than
any viewing session: one that expires mid-playback breaks seeking rather than
prompting a re-fetch.

`BlobStore.url()` stays synchronous because of that redirect. Signing is async;
a redirect is not.

### Posters and `next/image`

`next.config.ts` derives `images.remotePatterns` from every PUBLIC store in the
manifest, scoped to each store's path prefix. Signed stores contribute nothing —
their posters come from the app's own origin. The config is evaluated once at
load, so restart the dev server after editing the manifest.

## `generate-course-content-seed.ts` — seed generator

Walks every course folder `courses.manifest.json` declares, infers lessons
and resources from file presence (`.mp4` → video, `.md` → reading body,
`.pdf` → resource), extracts `durationSeconds` from each `.mp4` via
`ffprobe`, and emits `src/adapters/persistence/in-memory/seed/seed-content.ts`
with a `seedContentCourses` array.

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

## The generated seed is the catalog

`seed-content.ts` is the only course source the app has. There is no env var
selecting between seeds and no hand-written course to fall back on: the courses
`courses.manifest.json` declares are the courses `pnpm dev` serves, in
`Course.sequence` order.

That makes the content root a prerequisite, not an option. A machine without it
boots the real catalog with media that does not resolve — which names the actual
problem. Obtain the content root out of band, copy
`scripts/courses.manifest.example.json` to
`public/local-filesystem-lesson/courses.manifest.json`, and regenerate.
