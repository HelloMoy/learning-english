## Why

Not every lecture is an MP4 the project hosts. Some of the course's video is
already published on YouTube, and today a lesson whose `source` is a YouTube
link renders a broken player: `LessonVideoPlayer` hands Vidstack
`{ src: source, type: "video/mp4" }` unconditionally, so the provider tries to
load a YouTube watch page as an MP4 byte stream and fails. There is no way to
author a YouTube lecture at all.

The cost of getting this wrong is not the missing video — it is losing the
behavior built around the player. The resume overlay, the debounced position
persistence, and the localized Default Layout controls are all specified
capabilities. A second, parallel player for YouTube would fork every one of
them. Vidstack ships a first-class YouTube provider driven by YouTube's IFrame
API, so the same `<MediaPlayer>` tree — same events, same `currentTime`, same
overlay slot — can serve both kinds of source. The change is therefore a change
of **source resolution**, not a change of player.

## What Changes

- A YouTube link in `VideoLesson.source` is recognized and routed to Vidstack's
  YouTube provider. The player's `src` becomes `youtube/<videoId>` instead of
  `{ src, type: "video/mp4" }`.
- Recognition is a pure, testable function that parses a URL and yields either a
  YouTube video id or nothing. It lives in `src/lib/`, not inside the component,
  and not in `src/domain/**` — which player provider serves a URL is a delivery
  concern, and the domain already models `source` as an opaque URL string.
  Accepted forms: `youtube.com/embed/<id>`, `youtube.com/watch?v=<id>`,
  `youtu.be/<id>`, with or without `www.`, `m.`, or `youtube-nocookie.com`, and
  with any extra query parameters (`si`, `list`, `t`) present.
- Everything the player already guarantees keeps holding for a YouTube lesson,
  unbranched: the in-player resume overlay, the debounced write cadence, the
  translated Default Layout controls, the app-theme chrome, and the 16:9 frame.
- **The "start at minute N" behavior is the existing resume mechanism, not a URL
  parameter.** The saved position is applied by the same seek the MP4 path uses,
  which means it stays *readable* as well as writable — a YouTube lecture keeps
  recording where the learner stopped, instead of only being told where to begin.
- A YouTube lesson's thumbnail comes from the provider, which discovers it
  automatically. Such a lesson therefore counts as having a poster for the
  purpose of the gold title cover, so the cover is not painted over YouTube's
  own thumbnail.
- A non-YouTube `source` keeps its current behavior exactly. This is additive;
  no existing lesson changes.
- The demo seed (`src/adapters/persistence/in-memory/seed/seed.ts`) gains one
  YouTube lecture, so the path is exercisable end to end without touching the
  generated content seed.

## Capabilities

### New Capabilities

None. The URL parser is an implementation detail of an existing requirement, not
a capability of its own.

### Modified Capabilities

- `lesson-page`: the Player requirement currently states that the player's `src`
  SHALL be the Lesson `source` URL, which describes only the self-hosted MP4
  case. It changes to say that the `src` is **derived** from `source` — YouTube
  links select the YouTube provider, everything else stays a direct video
  source — and that every other guarantee in that requirement (localized
  controls, theme, 16:9, overlay slot) holds identically for both.
- `cinema-lesson-view`: the gold title cover currently renders when the lesson
  has no `poster` field. A YouTube lesson has a provider-supplied thumbnail even
  with `poster` absent, so the condition changes from "the lesson has no
  `poster`" to "the player shows no thumbnail of its own".

## Non-goals

- **A raw `<iframe>` player.** Considered and rejected: a bare embed is opaque to
  the page, so the resume overlay and position persistence would both die for
  YouTube lessons. Vidstack's provider is a YouTube iframe underneath — this
  change buys the same embed without forking the specified behavior.
- **Authoring / ingestion.** Declaring a YouTube lecture in
  `public/local-filesystem-lesson/courses.manifest.json` and teaching
  `scripts/generate-course-content-seed.ts` to emit it is a separate change.
  Related: `resolveLessonRow` runs every `source` through `BlobStore.url`, which
  would mangle an absolute YouTube URL into a content key. Nothing here relies on
  that path; a follow-up change owns it.
- **Migrating any existing lesson** off self-hosted MP4.
- **YouTube-sourced captions, chapters, quality menus, or playlists.** The
  Default Layout exposes these; wiring them is out of scope, as it already is for
  MP4.
- **A `?start=` URL parameter.** The start position is the stored playback
  position applied by seek; encoding it in the embed URL would make it write-only.
- **Changing `VideoLesson`'s schema.** `urlOrRelativePath()` already accepts an
  absolute `https` URL, and `durationSeconds` stays required and author-supplied.

## Impact

**Code**

- `src/lib/youtube-source/youtube-source.ts` (new) — the pure parser, plus its
  colocated test.
- `src/components/lesson-view/lesson-video-player/lesson-video-player.tsx` —
  chooses the `src` shape from the parse result; the poster branch becomes
  provider-aware.
- `src/components/lesson-view/lesson-view/lesson-view.tsx` — the gold-cover
  condition consults "does the player show a thumbnail", not `lesson.poster`.
- `src/adapters/persistence/in-memory/seed/seed.ts` — one YouTube lecture.
- Colocated tests and Storybook stories for both touched components; a YouTube
  story per the component rules.

**Dependencies** — none. `@vidstack/react` already ships the YouTube provider;
no package is added.

**Runtime** — a YouTube lesson loads a third-party iframe from
`youtube-nocookie.com`. Vidstack preconnects and lazy-loads it by default and
sets no cookies until playback, so no consent surface is introduced. Any CSP or
`next.config.ts` frame policy that would block it must be checked.

**Tests** — `src/test-setup/stubs/vidstack-player.ts` stubs the player for
component tests; the stub must expose whatever the new `src` assertion reads.
