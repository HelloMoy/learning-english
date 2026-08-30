# BlobStore

A driven-adapter primitive that resolves opaque content **keys** to URLs and
checks whether a key exists in the underlying store.

## Why it exists

Course content (videos, PDFs, thumbnails) needs to be served by the app from
_somewhere_. In development that "somewhere" is `public/local-filesystem-lesson/`
on disk; in production it will be an S3-compatible bucket. The
`LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository`
adapters must not care which.

`BlobStore` is the abstraction that lets both adapters stay agnostic. The
generated seed stores opaque **keys**; the adapters resolve them through the
`BlobStore` on every read, then parse the result into domain entities. Nothing
downstream of the adapters ever sees a key.

```
                       ┌──────────────────┐
                       │ Lesson/Resource  │
                       │    adapters      │
                       └────────┬─────────┘
                                │ url(key), at read time
                                ▼
                       ┌──────────────────┐
                       │   BlobStore      │
                       │  (interface)     │
                       └────────┬─────────┘
                                │ implements
                  ┌─────────────┴─────────────┐
                  ▼                           ▼
        ┌──────────────────┐         ┌──────────────────┐
        │ LocalFilesystem  │         │      S3BlobStore │
        │   BlobStore      │         │     (future)     │
        └──────────────────┘         └──────────────────┘
                  │                           │
                  ▼                           ▼
        /public/local-filesystem-    https://bucket.s3...
        lesson/<key>                 /<key>
```

## Adding a new driver

1. Create a folder under `src/adapters/persistence/blob-store/<driver>-blob-store/`.
2. Implement the `BlobStore` interface (`url(key)` and `exists(key)`).
3. Mirror the constructor shape of `LocalFilesystemBlobStore`: take what the
   driver needs as **separate** arguments (URL prefix ≠ filesystem path).
4. Add a test file using `mkdtempSync` for filesystem-isolated fixtures and
   a fake bucket client for S3-isolated tests.
5. Select the new driver in `use-case-dependencies.ts` — that is the only
   composition root, and the same instance is shared by the lesson, resource
   and notes adapters so they cannot disagree about where content lives.

## Configuration

The driver's public prefix and local root come from the environment, read on
every dependency-graph build (so a dev can flip them without restarting Node):

| Variable             | Default                          | Meaning                                           |
| -------------------- | -------------------------------- | ------------------------------------------------- |
| `CONTENT_BASE_URL`   | `/local-filesystem-lesson`       | public URL prefix prepended to every content key  |
| `CONTENT_LOCAL_ROOT` | `public/local-filesystem-lesson` | filesystem root the local driver reads bytes from |

Both are optional; unset means today's local behaviour, byte for byte.

Setting `CONTENT_BASE_URL` to an absolute URL also widens
`images.remotePatterns` in `next.config.ts` (derived from the same variable),
because `next/image` rejects undeclared remote hosts. That derivation is
evaluated once at config load, so changing the _host_ needs a server restart
even though the URLs themselves repoint per request.

> These variables are also listed in `.env.example`, but note that the repo's
> `.gitignore` matches `.env*` — that file is untracked, so this table is the
> versioned source of truth.

## Migration story

When the time comes to point the app at a real bucket:

1. Implement `S3BlobStore` and select it in `use-case-dependencies.ts`.
2. Move the assets from `public/local-filesystem-lesson/` to the bucket.
3. Set `CONTENT_BASE_URL` to the bucket/CDN prefix.

The domain, the lesson/resource adapters, the seed and the lesson page **do
not change** — the seed stores keys, not URLs, so it is not regenerated. This
is also what makes per-request **signed** URLs possible: a signed URL expires,
so it could never have been baked into a committed file.

## Why "blob"?

`BlobStore` mirrors industry terminology — S3 calls itself "Simple Storage
Service" and stores "objects" (which are opaque bytes, i.e. blobs). The name
signals that the abstraction is content-type-agnostic; it does not assume
HTTP, does not assume videos, does not assume anything about the bytes.
