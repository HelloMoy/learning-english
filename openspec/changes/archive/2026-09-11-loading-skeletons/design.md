## Context

The app has no loading vocabulary at all: no `loading.tsx`, no `Suspense` boundary, no
skeleton primitive. Two measurements on an iPhone 14 throttled to 400 kbps, against the
running dev server, established what the learner actually sees.

**Route transitions.** Tapping a lesson from a module page left the browser on the module
page for 12 s — `location.pathname` unchanged, no outline, no breadcrumb, no video frame —
and then the entire lesson page appeared in one step. In production the same mechanism
costs a few seconds rather than twelve, which is what the learner reported. There is no
partial render to soften it: with no `loading.tsx`, Next has no shell to swap in, so it
holds the previous route until the RSC payload for the new one is complete. The documents
are not small — 166 KB for the course overview, 103 KB for a lesson.

**The video frame.** A cold load reaches its final layout at 2.4 s with the 16:9 box
already sized (`aspect-ratio: 16/9` resolves server-side, so the box itself never shifts).
The problem is what is inside it. The server-rendered player markup is:

```html
<div class="aspect-video w-full bg-black align-bottom">
  <iframe class="vds-youtube"></iframe>          <!-- no src -->
  <div class="vds-blocker"></div>
  <img class="vds-poster"/>                      <!-- no src -->
  <div class="vds-video-layout dark" data-size="sm"></div>   <!-- empty -->
</div>
```

Three things follow. Vidstack's `<Poster>` sets its `src` client-side only, so the
lesson's real `thumbnail.jpeg` — which the course page already serves through
`next/image` — never reaches the first paint. The layout element is empty, so there is no
play control and no control bar. And `data-size="sm"` shows the server always guesses the
phone chrome, which hydration then corrects on desktop.

Meanwhile `lesson-view.tsx:127` suppresses the gold title cover whenever
`playerShowsOwnThumbnail(lesson)` is true — a poster exists, or the lesson is a YouTube
lesson, which covers essentially the whole catalog. The bet is that the player paints its
own carátula. It does, eventually; during the slowest window of the load the frame is
therefore flat black with nothing over it.

## Goals / Non-Goals

**Goals:**

- A navigation that has started must look like it has started, within one frame.
- The video frame must read as *loading*, never as *broken* or *absent*.
- A placeholder must trace the shape of what replaces it, so the swap is a fill-in and not
  a re-layout.
- No placeholder may assert something about the learner's progress that the app does not
  yet know.

**Non-Goals:**

- Making anything faster. Every number above stays the same; only the wait becomes legible.
- Per-row progress marks, poster blur placeholders, and the player library itself — see
  the proposal's `## Non-goals`.

## Decisions

### The `Skeleton` primitive comes from shadcn, unmodified

`pnpm dlx shadcn@latest add skeleton`, then moved into
`src/components/ui/skeleton/skeleton.tsx` per the folder-per-component rule, and given the
stories, tests and JSDoc the project requires of every reusable component. It is a `div`
with `animate-pulse rounded-md bg-accent` and nothing else — every shape in this change is
composed from it rather than from bespoke shimmer CSS.

*Alternative considered:* hand-rolling a shimmer. Rejected — the project's convention is
that shadcn primitives come from the CLI and are not reinvented, and `Skeleton` is the
smallest primitive shadcn ships.

### Placeholders are shape-accurate, not generic blocks

Each shell is built from `Skeleton` rectangles laid out with the **same container classes
as the real component** — same grid, same gaps, same aspect ratios, same max-widths. The
lesson shell reproduces the outline row, the breadcrumb, the 16:9 frame, the title, the
tabs row and the close card; the home shell reproduces the hero block and the ladder grid;
the course shell the module grid; the module shell the lesson list.

This is the whole point of the change. A centred spinner tells the learner something is
happening but not what, and the arriving content still re-lays the page out. A shell that
matches means the real content fills shapes that are already in the right place.

### Every placeholder shows on every viewport

Nothing here is gated on screen size. The trigger is connection speed, not viewport: a
desktop on café wifi or a tethered phone hits the same dead tap and the same black frame
as a phone on 3G, and hiding the placeholder from them would leave the worst case
uncovered on the wider screen. On a fast connection the placeholders are retired inside
one or two frames on both, so they cost nothing when they are not needed.

What *is* viewport-specific is each placeholder's **shape**. The shells reproduce their
page's responsive layout at every breakpoint — the lesson shell stacks with an outline row
below `lg` and becomes `260px 1fr 280px` above it, the ladder shell follows the same
`grid-cols-1 md:grid-cols-2 xl:grid-cols-3` rule the real ladder derives from the catalog
size. A shell that is correct on one breakpoint and wrong on another reintroduces exactly
the re-layout this change removes.

### The video placeholder is a sibling of the player, gated on `canPlay`

`PlaybackPositionedVideoPlayer` already owns the `MediaPlayerInstance` ref. It renders a
new `LessonVideoSkeleton` as a **sibling** of `LessonVideoPlayer`, absolutely positioned
over the frame (the wrapper in `lesson-view.tsx` is already `relative`), and removes it
when the player reports readiness:

```tsx
const canPlay = useMediaState("canPlay", playerRef);
```

`useMediaState` is typed in the installed `@vidstack/react@1.15.6`
(`MediaState.canPlay: boolean`) and accepts a player ref when called outside the
`<MediaPlayer>` subtree, which is exactly this case.

Three reasons for this shape:

- **It is in the server HTML.** `PlaybackPositionedVideoPlayer` is a client component, but
  client components are still server-rendered, so the placeholder ships with the document.
  A placeholder rendered from the player's `children` slot would not — `children` only
  mount once the player itself does, which is the window we are covering.
- **`canPlay` is the honest retirement signal.** Hydration is not readiness: React can
  finish hydrating several seconds before the YouTube embed has anything to show. Removing
  the placeholder on hydration would just restore the black box.
- **No hydration mismatch.** `canPlay` is `false` on the server and `false` again on the
  client's hydration render (the ref is null), so the first client render matches the
  server byte for byte, and the placeholder disappears on a later render.

*Alternative considered:* rendering the placeholder from `lesson-view.tsx` as a sibling of
the whole player wrapper. Rejected — `lesson-view.tsx` has no access to the player ref, so
it could only gate on hydration, which is the wrong signal.

### The video placeholder shows the real thumbnail when there is one

`lesson.poster` is a path the app already serves. The placeholder renders it through
`next/image` with `priority`, under a scrim, with the play-control and control-bar
silhouette over it. A lesson with no poster gets the silhouette over a `Skeleton` fill.

This is the one placeholder that is better than a shimmer: the learner sees the actual
frame of the actual lesson while the player boots. It also means the gold title cover's
gate in `lesson-view.tsx` no longer has to be the page's only carátula during loading, so
that logic is left exactly as it is.

### Reserved slots are opened only when there is something to reserve for

`ContinueWatching` and `CourseLadder` both read `localStorage` and then await a Server
Action round-trip. The placeholder is shown **only when the local read returned a stored
location** — the cheap, synchronous half of the answer — and never when there is no
record.

This is a deliberate narrowing of two existing requirements, and the narrowing matters.
`continue-watching` says the section appears only once the client has read the record;
`cinema-home` says every card renders the not-started state until then, "the honest one".
Both were written against a world where the only two answers were "nothing" and "the
panel". The record's existence is a third fact, known earlier and cheaply, and reserving
on it asserts only "there is something here, still resolving" — which is true. A learner
with no record still sees exactly what they see today: nothing, with no gap where the
panel would be.

### The completion control gains an unknown state

`LessonCompletionToggle` today renders "Mark as complete" before `localStorage` can be
read, which is a false statement to a learner who already finished the lesson. It gains a
third state — a `Skeleton` of the control's own dimensions — shown until completion is
known, gated on `useIsHydrated`. The existing two states are untouched.

*Alternative considered:* leaving it alone, on the grounds that it self-corrects. Rejected
for consistency: every other progress-bearing component in this codebase already refuses
to assert a state it cannot justify, and this one is the loudest of them — it is the
lesson's closing call to action.

### `loading.tsx` shells stay server components with one client island

The shells are Server Components made of shapes, marked `aria-hidden`. `loading.tsx`
receives no `params`, so it cannot call `setRequestLocale`, which the project's convention
requires before `useTranslations` in a Server Component. A single shared
`LoadingStatus` **client** component carries the `role="status"` live region and its
localized text: client components read messages from the `NextIntlClientProvider` already
mounted in `[locale]/layout.tsx`, with no locale plumbing.

*Alternative considered:* `async` shells calling `getTranslations()` with no locale.
Rejected — it resolves the locale from request headers, which is both a dynamic-rendering
hazard and a dependency on middleware internals, for one string.

## Risks / Trade-offs

- **A shell that drifts from its page becomes a flash of the wrong layout** → The shells
  reuse the real containers' class strings, and each shell has a component test asserting
  its landmark shapes. Drift is caught by review, not by tooling; this is the accepted
  cost of shape accuracy.
- **`canPlay` may never fire** (blocked embed, dead source, offline) **and the placeholder
  becomes permanent** → That is the correct failure mode: a placeholder is a better
  standing state than a black rectangle, and the player's own error UI surfaces above it.
  No timeout is added — a timeout would swap a truthful "still loading" for a black box.
- **Reserving the `Continue watching` slot shows a shape to a learner whose record turns
  out to be dead** (the lesson was removed) → The slot collapses when the Server Action
  answers `null`. That is a reserved-then-collapsed shift, but it is rare, it is smaller
  than today's absent-then-inserted shift, and it only affects learners who have a record.
- **Four more route files to keep in sync with four pages** → Accepted. The alternative is
  one generic shell, which reintroduces the re-layout this change exists to remove.
- **Storybook/vitest coupling to Vidstack internals** → Only `useMediaState` is used, a
  documented public hook; tests mock it the way `outline-drawer.test.tsx` already mocks
  `useIsHydrated`.

## Testing strategy

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| `Skeleton` renders, merges `className`, is decorative | Vitest + RTL (`skeleton.test.tsx`) | `src/components/ui/button/button.test.tsx` |
| `LessonVideoSkeleton` shows the poster when given one, the shimmer when not | Vitest + RTL | `poster-card.test.tsx` |
| The video placeholder is present while `canPlay` is false and gone once true | Vitest + RTL, mocking `useMediaState` | `outline-drawer.test.tsx`'s `useIsHydrated` mock |
| `ContinueWatching` reserves a slot with a record, renders nothing without one | Vitest + RTL, injecting the fake repository and resolver the component already accepts | `home-view.test.tsx` |
| `CourseLadder` reserves the badge with a record, renders not-started without one | Vitest + RTL, same injection | `course-ladder.test.tsx` |
| `LessonCompletionToggle` shows the unknown state before hydration | Vitest + RTL, mocking `useIsHydrated` | `lesson-completion-toggle.test.tsx` |
| Each route shell renders its landmark shapes and one `role="status"` | Vitest + RTL, one test per `loading.tsx` | — |
| Shells and placeholders in `en`/`es`/`pt` | Storybook stories per component, locale toolbar | `storybook-story-writing` skill |
| Navigating to a lesson paints the video placeholder before the player is ready | Playwright e2e (`e2e/`), delaying the Vidstack chunk with `page.route` | `e2e/` existing specs, `--workers=1` |

Unit coverage is the primary layer; the single e2e spec exists because the placeholder's
retirement depends on a real player booting, which RTL cannot produce.
