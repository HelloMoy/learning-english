# BlobStore

A driven-adapter primitive that resolves opaque content **keys** to URLs and
checks whether a key exists in the underlying store.

## Why it exists

Course content (videos, PDFs, thumbnails) needs to be served by the app from
_somewhere_. In development that "somewhere" is `public/local-filesystem-lesson/`
on disk; in production it will be an S3-compatible bucket. The
`LocalFilesystemLessonRepository` and `LocalFilesystemResourceRepository`
adapters must not care which.

`BlobStore` is the abstraction that lets both adapters stay agnostic. They
take a pre-resolved seed (URLs already baked in at seed-gen time), so they
don't even import the `BlobStore` type today — but the seed generator does,
and that is where the abstraction earns its keep.

```
                       ┌──────────────────┐
                       │  Seed generator  │
                       │  (scripts/...)   │
                       └────────┬─────────┘
                                │ url(key)
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
5. Wire the new driver in the seed generator (when that lands in group 7).

## Migration story

When the time comes to point the app at a real bucket, three things change:

1. Replace the `LocalFilesystemBlobStore` constructor call in the seed
   generator with an `S3BlobStore` constructor call.
2. Move the assets from `public/local-filesystem-lesson/` to the bucket.
3. Re-run the seed generator against the new location.

The domain, the lesson/resource adapters, and the lesson page **do not
change**. The "config swap" benefit is real.

## Why "blob"?

`BlobStore` mirrors industry terminology — S3 calls itself "Simple Storage
Service" and stores "objects" (which are opaque bytes, i.e. blobs). The name
signals that the abstraction is content-type-agnostic; it does not assume
HTTP, does not assume videos, does not assume anything about the bytes.
