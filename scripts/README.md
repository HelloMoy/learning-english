# scripts/

Build-time tooling that lives outside `src/` — manifest maintenance, slug
utilities, content placement and migration. Each script is standalone and has
its own tests colocated (`scripts/*.test.ts`).

There is **no seed generator**. The catalog is declared, not generated: see
`src/content/` below.

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

## `src/content/` — the one place a course is declared

The catalog is declared, in full, in one tracked manifest per course:
`src/content/<course-slug>.json`, enumerated by `src/content/courses.ts`.
Every course, module, lesson and resource the app serves is written there.
Nothing is inferred from the content tree at build or run time.

```jsonc
{
  "id": "a0cf4018-…", // UUIDv5, stable: it keys saved progress
  "slug": "basic-course",
  "title": "Basic Course",
  "description": "…",
  "language": "en",
  "sequence": 1, // rung of the home ladder, unique across courses
  "modules": [
    {
      "id": "b7029577-…",
      "slug": "2-vowels",
      "title": "Vowels",
      "sequence": 1,
      "lessons": [
        {
          "id": "c460d8c1-…",
          "slug": "1-the-vowel-sound-schwa", // the on-disk folder name
          "sequence": 1,
          "title": "The Vowel Sound: /ə/",
          "kind": "video",
          "description": "…",
          // A content key resolved by BlobStore, or an absolute URL used as-is.
          "source": "https://www.youtube.com/embed/27WXXMFimvE",
          "durationSeconds": 663,
          "poster": "basic-course/2-vowels/1-the-vowel-sound-schwa/thumbnail.jpeg",
          "notesKey": "basic-course/2-vowels/1-the-vowel-sound-schwa/readme.md",
          "resources": [{ "id": "…", "title": "…", "url": "…", "kind": "pdf" }],
        },
      ],
    },
  ],
}
```

The schema lives in
`src/adapters/persistence/content-manifest/course-manifest-schema/`, and the
adapter that loads and flattens it in
`src/adapters/persistence/content-manifest/`.

`lessonCount` and `moduleCount` are deliberately absent — they are derived from
the nesting, so they cannot drift. So are `courseId` / `moduleId` / `lessonId`
on nested rows: position in the tree already says what they are.

### One file per course, tracked in git

The manifests are tracked, so a fresh clone gets a working catalog without the
multi-gigabyte content tree. One course is one file, which makes the file both
the unit of editing and the unit of merge conflict.

They live under `src/` because the existing `@/*` alias resolves there. A
`@content/*` alias would have to be declared twice — `tsconfig.json` and
`vitest.config.ts` each declare it — for no gain.

**Where review happens.** In the manifest itself. It is the artifact, so its
diff is the change: a retitled lesson is a one-line diff on the line that says
the title.

### Behaviour when a manifest is absent or wrong

There is no fallback. A manifest that is missing, malformed, or fails the schema
raises `InvalidCourseManifestError` when the catalog is first imported, naming
the offending lesson by slug. A present-but-wrong manifest is an error, never a
silent default.

`durationSeconds` is the one field with no recovery: the domain requires it, and
for a lesson whose video is hosted elsewhere there is nothing local to probe.
`null` is representable in the file and rejected by the schema, which turns "I
forgot the duration" into a named error rather than a zero-length progress bar.

## `sync-course-manifest/` — append what disk has and the manifest lacks

```bash
pnpm sync:manifest
```

Walks the content tree and appends to each course's manifest only the lessons
and modules it does not already describe, deriving ids with the same UUIDv5
scheme. It exists so that adding a lesson does not mean hand-writing a UUID.

**It is not a generator.** It never overwrites, reorders or removes an existing
entry — a hand-edited title or a YouTube `source` survives every run. Identity
is the lesson's id: an already-declared lesson is skipped entirely, not
reconciled. A lesson folder with no video is appended with `durationSeconds:
null` and reported, so the run tells you what to fill in.

`discriminate-lesson.ts` encodes the on-disk conventions this command reads
(`.mp4` → video, `readme.md` → notes or reading body, `.pdf` → resource). It no
longer decides what the app serves.

## `content-locations.json` — where each asset lives

The **second** manifest, and not to be confused with the first. They answer to
different actors on different clocks:

|                | `src/content/<course>.json` | `content-locations.json`        |
| -------------- | --------------------------- | ------------------------------- |
| Read           | build time, by the app      | **runtime**, by the app         |
| Declares       | what a course **is**        | where each blob **lives**       |
| Tracked in git | **yes** (under `src/`)      | **yes** (repo root)             |
| On change      | nothing — it IS the catalog | nothing — next boot picks it up |

**A content key never changes when its asset moves.** The manifests hold opaque
keys; only the store that resolves them changes. That is why a migration
touches no lesson row and no manifest.

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

It writes one `assets` entry per key in the course manifests, each recording the
store and object path that key **already** resolved to — so it changes no URL.
It is idempotent (a no-op run rewrites the file byte-for-byte) and preserves any
`objectPath` you declared by hand.

This is opt-in. Without it the manifest stays an exception list, which is the
lighter thing to maintain. With it, `pnpm verify:content` additionally reports
any `assets` entry whose key the seed no longer has — an exhaustive block goes
stale as soon as content is renamed, so re-run materialize after the manifests
change.

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
pnpm verify:content   # walks every key in the manifests, exits non-zero naming any that miss
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

## The manifests are the catalog

`src/content/` is the only course source the app has. There is no env var
selecting between catalogs and no hand-written course to fall back on: the
courses declared there are the courses `pnpm dev` serves, in `sequence` order.

Because the manifests are tracked, a fresh clone serves the full catalog
immediately. What it will not have is the media: the content root is obtained
out of band, and without it every locally-stored asset 404s while the catalog
itself renders. Lessons served from YouTube play regardless.
