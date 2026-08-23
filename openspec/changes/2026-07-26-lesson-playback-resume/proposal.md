## Why

The current video player (`NativeVideoPlayer`) is a bare `<video controls>` — no
resume logic. A learner has no way to know at which second they left off the last
time they watched a lesson. Several lessons in the content seed already exceed
5 minutes and others reach 30+ minutes, so the cost of "re-watching the whole
thing from the start" starts to hurt.

The industry-standard practice (YouTube, Netflix, Coursera, Disney+) is to
**persist the exact second at which the learner paused or left** and, on returning
to a lesson, offer to resume. This change introduces that capability with two
explicit commitments:

1. Primary storage is **the browser's `localStorage`** (no auth, no server). It is
   the only viable option before auth + DB exist.
2. The architecture is designed so that swapping to a database later is an
   **adapter swap** — not a rewrite. The precedent is
   `LessonNotesRepository` → `LocalFilesystemLessonNotesRepository`
   (filesystem today, DB tomorrow).

## What Changes

- **A new domain port** `PlaybackPositionRepository`, independent of the existing
  `ProgressTracker`:
  `getPosition(lessonId) → Promise<number | null>` and
  `setPosition(lessonId, seconds) → Promise<void>`. Lives in
  `src/domain/ports/playback-position-repository/`.
- **Two new domain use cases:**
  - `recordPlaybackPosition({ lessonId, seconds })` — validates that the lesson
    exists and writes via the port.
  - `getPlaybackPosition({ lessonId })` — returns the persisted position or
    `null`.

  Both return `ResultAsync<T, DomainError>` like every other use case. Errors in
  `<use-case>.errors.ts` files as closed discriminated unions.
- **v1 driven adapter** `BrowserLocalStoragePlaybackPositionRepository` under
  `src/adapters/persistence/browser-local-storage/`. Nominal implementation of
  the port, namespace-prefixed key `learning-english:playback:{lessonId}` to
  avoid DevTools collisions. Guards against `window.localStorage` being
  `undefined` (SSR).
- **Server-side action** `recordPlaybackPositionAction` wrapped with
  `next-safe-action` + Zod (the convention from `AGENTS.md` §"Server Actions").
  We also migrate `markLessonCompleteAction` to the same wrapper in this change
  so the two actions share a shape and don't drift.
- **Client component** `PlaybackPositionedVideoPlayer` that wraps
  `NativeVideoPlayer`:
  - On mount, reads the position via the adapter and applies `currentTime` if it
    passes the thresholds; otherwise leaves it at `0`.
  - Subscribes to `timeupdate` with `useDebouncedCallback` at 1500ms.
  - Flushes immediately on `pause` / `seeking` / `ended` / `beforeunload` and on
    cleanup at unmount.
  - If the position sits within the last 10s of the video or is < 30s from the
    start, treats it as zero (no resume, no overlay).
- **Resume overlay** `LessonVideoResume` over the `<video>`, Netflix/YouTube
  style: "Resume from 12:34 · Restart from beginning". Primary CTA "Resume",
  secondary "Restart". Dismiss on Escape / click-outside / play. Localized under
  `Components.LessonVideoResume.*` (en/es/pt).
- New i18n keys and the equivalent Storybook messages.
- Unit + component tests (Vitest + RTL) and two e2e scenarios (Playwright)
  covering the cycle "watch 30s → reload → overlay → click Resume → continues".
- `getCoursePlatformDeps` adds the two new use cases to the `useCases` bag. The
  existing adapters (`InMemoryProgressTracker`,
  `LocalFilesystemLessonNotesRepository`, etc.) are **not touched**.

## Capabilities

### New Capabilities

- `playback-position`: domain port `PlaybackPositionRepository`, use cases
  `recordPlaybackPosition` and `getPlaybackPosition`, player behavior
  (debounce + resume thresholds), and "Resume/Restart" overlay.

### Modified Capabilities

- `course-platform-domain`: a light extension that declares the two new use cases
  as part of the set enumerated in
  `openspec/specs/course-platform-domain/spec.md`, and registers the new port
  alongside `ProgressTracker`. The `ProgressTracker` port contract is **kept
  intact** — it is not merged with position (decision D1).

## Impact

- **Domain (new code):**
  - `src/domain/ports/playback-position-repository/`.
  - `src/domain/use-cases/record-playback-position/`.
  - `src/domain/use-cases/get-playback-position/`.
  - `src/test-setup/stubs/domain-repos.ts` — `makeStubPlaybackPositionRepository`.
- **Adapter (new):**
  - `src/adapters/persistence/browser-local-storage/`.
- **Dependency injection:**
  - `src/adapters/persistence/in-memory/use-case-dependencies/` — extends
    `CoursePlatformDeps` with an optional `positions: PlaybackPositionRepository`
    slot and registers the two use cases.
  - A new server-side `InMemoryPlaybackPositionRepository` acts as the default
    for SSR/tests (mirrors the `InMemoryProgressTracker` precedent). The
    `BrowserLocalStorage*` is only injected from client components.
- **UI (new + light):**
  - `src/components/lesson-view/playback-positioned-video-player/`.
  - `src/components/lesson-view/lesson-video-resume/`.
  - `src/components/lesson-view/lesson-view/lesson-view.tsx` — additional
    `initialPlaybackPositionSeconds` prop, swaps `NativeVideoPlayer` for
    `PlaybackPositionedVideoPlayer` when `lesson.kind === "video"`.
  - `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/page.tsx`
    — the initial position is read by a small client component
    `InitialPlaybackPositionReader` so the browser adapter is never imported in
    the server bundle.
  - `src/app/[locale]/courses/[courseSlug]/modules/[moduleSlug]/lessons/[lessonId]/actions.ts`
    — `recordPlaybackPositionAction` (new) + migration of
    `markLessonCompleteAction` to `next-safe-action`.
- **Hook (new):**
  - `src/hooks/use-playback-position/`.
- **i18n:**
  - `src/messages/{en,es,pt}.json` — namespaces
    `Components.LessonVideoResume.*` and any messages needed by the player
    component.
- **Spec:**
  - `openspec/specs/course-platform-domain/spec.md` — extends "The set of use
    cases SHALL include..." with the two new entries, and the ports list with
    `PlaybackPositionRepository`.
- **Tests:** Vitest unit + component for the new files; Playwright e2e for the
  resume cycle.
- **Breaking:** none in routes or data. The existing "Mark as complete"
  behavior stays intact.

## Non-goals

- No `StudentId` or auth is introduced — that capability ships in its own
  change.
- The `ProgressTracker` contract is **not** changed (`completed` remains
  orthogonal to `lastPosition`). There is **no** auto-mark-complete at 95%; the
  learner decides manually via the "Mark as complete" button.
- No HLS streaming or custom player. `NativeVideoPlayer` keeps its native
  controls — the wrapper only adds persistence behavior.
- No cross-tab position sync (listening for `storage` events), no
  cross-device sync. Explicit v1 limitation, documented in
  `design.md § Known limitations`.
- No visible progress indicator on the lesson list (a "% watched" or progress
  ring). A separate feature if requested later.
- `markLessonCompleteAction` and `recordPlaybackPositionAction` are not merged
  into a single progress API — the two concepts stay separated in the domain.
