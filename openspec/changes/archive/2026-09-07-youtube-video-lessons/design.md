## Context

`LessonVideoPlayer` hands Vidstack a hardcoded source descriptor:

```tsx
src={{ src: source, type: "video/mp4" }}
```

That `type` is a promise to the library: "this URL is an MP4 byte stream." A
YouTube link is not, so the provider fails to load and the lesson shows a dead
player. Nothing else in the pipeline objects — `urlOrRelativePath()` already
accepts an absolute `https` URL, so a YouTube `source` parses into a valid
`VideoLesson` and reaches the component intact. **The break is one line, in one
component.**

What makes this more than a one-line fix is what sits on top of that player.
Three specified behaviors compose into it as siblings in a tree we own:

- `LessonVideoResumeOverlay`, rendered through the `children` slot
  (`playback-position`, `cinema-lesson-view`);
- `usePersistPlaybackPosition` / `useResumeOnFirstPlay`, which read
  `player.currentTime` and call `player.seekTo()` through a handle
  (`playback-position`);
- `buildVideoPlayerTranslations`, which supplies every Default Layout control
  name for `en` / `es` / `pt` (`lesson-page`).

Any solution that puts a YouTube video on screen *outside* that tree forks all
three. Vidstack's YouTube provider does not: it drives a YouTube iframe through
the IFrame Player API and exposes it behind the same `MediaPlayerInstance` API,
so `currentTime`, `seekTo`, `play`, `pause` and the media events keep working
and the overlay keeps mounting where it already mounts.

## Goals / Non-Goals

**Goals:**

- A lesson whose `source` is a YouTube link plays, with the same chrome,
  the same localization, the same resume overlay and the same position
  persistence as a self-hosted MP4 lesson.
- Source recognition is a pure function with its own tests, not a conditional
  buried in JSX.
- Zero behavior change for every existing lesson.
- No new dependency.

**Non-Goals:**

- A raw `<iframe>` player (see D1).
- Authoring: the manifest and seed generator do not learn about YouTube here,
  and `resolveLessonRow`'s `BlobStore.url` prefixing is left alone.
- YouTube captions, chapters, quality menus, playlists.
- Changing `VideoLesson`'s schema.

## Decisions

### D1 — Vidstack's YouTube provider, not a hand-rolled `<iframe>`

**Chosen:** `src="youtube/<videoId>"` on the existing `<MediaPlayer>`.

**Alternative considered — a literal `<iframe src="…/embed/<id>?start=<n>">`.**
Simpler to write and it does place the video at a given second. It fails on the
half of the feature that is not visible: an embed URL is *write-only* for
position. `start=` tells the video where to begin; nothing tells the page where
the learner stopped. A YouTube lesson would keep offering the same stale resume
point forever, and `usePersistPlaybackPosition` would have nothing to persist.
It also drops the localized chrome — the learner would see YouTube's own English
controls inside a Spanish page, contradicting the `lesson-page` requirement that
control names come from `next-intl` for every locale.

**Alternative considered — a raw `<iframe>` plus `enablejsapi=1` and the YouTube
IFrame Player API.** This recovers `currentTime`, so persistence could survive.
But it means owning the API script load, the ready handshake, the event
translation and a second overlay host — a reimplementation of exactly what the
Vidstack provider already is. More code, more surface, same iframe underneath.

**Consequence:** "start at minute N" is delivered by the *existing* seek path,
not by a URL parameter. Nothing new is built for it; it is what the resume
capability already does, now reaching a YouTube lesson.

### D2 — The parser lives in `src/lib/youtube-source/`, not in the domain

`VideoLesson.source` is an opaque URL to the domain. *Which player provider
serves that URL* is a rendering concern of the delivery layer — the same lesson
entity would render in a native mobile shell with a different provider entirely.
Putting a `youtube` concept in `src/domain/**` would make the domain know about
a video vendor to satisfy a component.

`src/lib/youtube-source/youtube-source.ts`, per the folder-per-entity rule, with
`youtube-source.test.ts` colocated.

**Shape:** one exported function returning the id or `undefined`.

```ts
export function youtubeVideoIdFrom(source: string): string | undefined;
```

`undefined`, not `null`, and not a thrown error: a non-YouTube URL is the
overwhelmingly normal case, not a failure. The `Result<T, DomainError>`
convention governs use cases; this is a pure string classifier at the delivery
edge and a discriminated union would be ceremony without a caller for the error
arm.

**Parsing uses `new URL()`, not a regex over the raw string.** Host matching has
to be exact — `https://cdn.example.com/youtube.com/watch?v=x.mp4` must NOT be
treated as YouTube, and a regex looking for `youtube.com` anywhere in the string
says it is. `URL` also hands us `searchParams` and a normalized pathname for
free. A malformed `source` makes the constructor throw; that is caught and
reported as "not YouTube", so a bad URL degrades to the existing direct-source
path rather than crashing the lesson page.

Recognized: hosts `youtube.com`, `youtu.be`, `youtube-nocookie.com`, each with
an optional `www.` or `m.` prefix. Paths `/embed/<id>`, `/watch?v=<id>`,
`/shorts/<id>`, and `youtu.be/<id>`. Every other query parameter is discarded —
`si`, `list`, `t` are the provider's business, and the start position is ours
(D1).

### D3 — Deriving `src`, and what happens to `poster`

The component asks the parser once and branches on the answer:

```
const youtubeVideoId = youtubeVideoIdFrom(source);
src = youtubeVideoId ? `youtube/${youtubeVideoId}` : { src: source, type: "video/mp4" }
```

The MP4 branch is byte-for-byte today's behavior.

`poster` needs a second thought. Today the component renders a `<Poster>` when
`poster !== undefined`, because the Default Layout draws none and a poster-less
lesson shows a black frame. The YouTube provider discovers its own WebP
thumbnail, so a YouTube lesson never shows that black frame. An explicit
`poster` still wins when the lesson has one — the project's own thumbnail is the
more deliberate choice — but its *absence* no longer means "nothing to show".

That distinction is what the `cinema-lesson-view` delta captures: the gold title
cover's condition stops being "the lesson has no `poster`" and becomes "the
player shows no thumbnail of its own". `LessonView` currently computes it inline
as `lesson.poster === undefined && !playbackStarted`. It becomes a named
predicate over the same two inputs plus the parse result, so the reason for the
condition is readable at the call site instead of implied by a field check.

### D4 — One player component, no `YouTubeLessonPlayer`

Rejected outright: a sibling component would duplicate the ref forwarding, the
lifecycle prop passthrough, the translations, the theme and the `smallLayoutWhen`
override, and would force `PlaybackPositionedVideoPlayer` to branch on source
kind — pushing a vendor concept up through a component whose whole purpose is
that it knows nothing about the player library. The branch stays where the
knowledge already is: the `src` prop of the one player.

### D5 — Third-party frame at runtime

`next.config.ts` sets no CSP, so no `frame-src` blocks the embed. Vidstack
defaults to `youtube-nocookie.com` and lazy-loads the iframe, so an unplayed
lesson sets no YouTube cookies and costs no eager network. No consent surface is
introduced by this change; if one is ever needed it is needed for the vendor,
not for this decision.

## Risks / Trade-offs

- **jsdom cannot prove playback.** Component tests can assert the `src` the
  player receives and can deliver synthetic media events, but no provider loads,
  so no seek or play is observable. → The `src` derivation and the cover
  condition are asserted at the component layer; the *behavior* of resume on a
  YouTube source is verified by hand in the browser (Playwright MCP) against the
  demo seed, and the seek mechanism itself is already covered by the existing
  `lesson-playback-resume` e2e on the MP4 path — it is the same code.
- **The YouTube lesson is not reachable from the e2e suite.**
  `playwright.config.ts` boots the webServer with `USE_COURSE_CONTENT_SEED=1`,
  which serves the generated content seed; the demo lesson lives in `seed.ts`.
  Adding a YouTube lecture to the generated seed is not an option — that file is
  autogenerated and hand-edits are overwritten on the next generator run. →
  Accepted: no e2e for this change. Recorded as a known gap; the follow-up
  ingestion change (a manifest-declared YouTube lesson) is what makes an e2e
  possible, and should add one.
- **Vendor availability.** A YouTube lesson stops working if the video is
  deleted, made private, or region-blocked, in a way a self-hosted MP4 does not.
  → Out of this change's control; worth knowing before moving existing content
  to YouTube. Vidstack surfaces a provider error the layout can render, which is
  already how a failed MP4 load behaves.
- **YouTube's own branding and end-cards.** The provider hides recommendation
  popups by default, but the watermark and the pause overlay remain YouTube's.
  → Accepted; it is the cost of not hosting the file.
- **`durationSeconds` is author-supplied and can disagree with the real video.**
  The resume thresholds (30s from start, 10s from end) use it. → Same exposure
  MP4 lessons already have; not new.

## Testing strategy

| Behavior | Layer | Where / mirrors |
| --- | --- | --- |
| URL recognition: `embed`, `watch`, `youtu.be`, `shorts`, `www.`/`m.`/`nocookie` hosts, extra params discarded, non-YouTube URLs rejected, path-lookalike hosts rejected, malformed URL degrades | **Vitest unit** | New `src/lib/youtube-source/youtube-source.test.ts`, mirroring `src/lib/format-duration/format-duration.test.ts` — pure in/out table, `@faker-js/faker` for the incidental parts (ids are hardcoded: the exact form is the behavior) |
| The player receives `youtube/<id>` for a YouTube source and `{ src, type: "video/mp4" }` otherwise | **Vitest component + RTL** | `lesson-video-player.test.tsx`, extending the existing suite; reads the `src` off the player found via `findPlayerIn` from `src/test-setup/stubs/vidstack-player.ts` |
| No `<Poster>` is rendered from an absent `poster` on a YouTube lesson; an explicit `poster` still renders | **Vitest component + RTL** | same file |
| The gold title cover does not render for a YouTube lesson without a `poster`, and still renders for a self-hosted poster-less lesson | **Vitest component + RTL** | `lesson-view.test.tsx`, mirroring its existing cover assertions |
| The resume overlay still mounts inside the player and the play handler still fires for a YouTube source | **Vitest component + RTL** | `playback-positioned-video-player.test.tsx`, using `emitPlayerEvent` exactly as the MP4 cases do |
| Visual: a YouTube lecture renders with the app's chrome, in `en` / `es` / `pt` | **Storybook + Playwright MCP** | New `YouTubeSource` story on `lesson-video-player.stories.tsx`; verified in the browser, not handed back to the user |
| End-to-end playback + resume on a YouTube source | **not covered** | Blocked by the seed the e2e webServer boots (see Risks). Verified manually via Playwright MCP against `pnpm dev`; an automated e2e lands with the ingestion follow-up |

Every task follows Red → Green → Refactor: the failing test named in this table
is written before the production code it describes.

## Open Questions

None blocking. One deferred: whether a YouTube lesson should be able to declare
its own `poster` to override the provider's thumbnail for catalog cards. The
entity already allows it and D3 honors it; nothing in the current content needs
it, so no requirement is written for the catalog side.
