## Context

The home (`HomeView`) currently switches between a new-visitor landing and a returning-learner
state through `useHomeLearnerState`. The chosen canvas flow ("Final flow") replaces that with a
fixed landing, an onboarding (name, avatar) built around a live *learner card*, a My learning page
(design L1) and a Profile page (design P3 in learner-card style). All device-bound state
(continue-watching, playback positions, completion marks) already lives in `localStorage` behind
domain ports; the learner profile follows the same pattern. The app is dark-first Immersion Cinema,
next-intl `en`/`es`/`pt`, hexagonal boundaries enforced by ESLint.

## Goals / Non-Goals

**Goals:**
- One fixed landing; a first-time **Start course** routes through onboarding, later ones straight to
  My learning.
- A validated, per-device learner profile with initials or one of eight illustrations.
- My learning and Profile as ordinary locale routes reusing the existing progress rules.

**Non-Goals:**
- Accounts, sync, photo uploads, profile deletion (see proposal).

## Decisions

### D1 · LearnerProfile is a domain value with a closed avatar union

`LearnerProfile = { name: string (trimmed, 1–40 chars); avatar: { kind: "initials" } | { kind:
"illustration"; id: LearnerIllustrationId } }` with `LearnerIllustrationId` a zod enum of
`sun | wave | leaf | plum | ember | echo | night | schwa`. `learnerInitials(name)` is a pure domain
function: first letter of the first word plus first letter of the last word, upper-cased with the
locale-independent `toUpperCase`, `?` for a blank name. `learnerFirstName(name)` returns the first word
for the greeting.

- *Why a union, not a URL:* the illustrations are shipped assets; storing an id keeps stored data
  valid if an asset path changes and lets zod reject anything else.

### D2 · Port, adapter and use cases mirror continue-watching

`LearnerProfileRepository { get(): Promise<LearnerProfile | null>; set(profile): Promise<void> }`.
`BrowserLocalStorageLearnerProfileRepository` stores JSON under `learning-english:learner-profile`,
parses with the entity schema on read (invalid → `null`), and swallows quota errors like its
siblings. Use cases `findLearnerProfile` and `saveLearnerProfile` return `ResultAsync`; save
validates through the schema and fails with `invalid-learner-profile` rather than throwing. The
use cases are composed in `useLearnerProfile` (the client's composition root for the profile), not in
`getCoursePlatformDeps`: no server code reads a per-device profile.

### D3 · `useLearnerProfile` is a subscribed client store

The hook exposes `{ status: "unknown" | "absent" | "present"; profile; save(profile) }`. It reads
after hydration (`unknown` on the server and the hydration pass) and subscribes with
`useSyncExternalStore` to a module-level listener set plus the `storage` event, so saving on the
Profile page updates the header in the same tab and in other tabs. Tests inject a repository.

- *Why not zustand:* the source of truth is `localStorage`; a second store would need syncing.

### D4 · Routes and guards

| Route | Renders | Guard (after hydration) |
| --- | --- | --- |
| `/[locale]` | landing only | — |
| `/[locale]/start` | name step | profile present → replace with `/learning` |
| `/[locale]/start/avatar` | avatar step | profile absent → replace with `/start` |
| `/[locale]/learning` | My learning | profile absent → replace with `/start` |
| `/[locale]/profile` | Profile | profile absent → replace with `/start` |

Guards run client-side with `useRouter().replace` from `@/i18n/navigation`. While `status` is
`unknown` each page renders its shell (skeleton) so nothing flashes.

Step 1 **Continue** saves `{ name, avatar: { kind: "initials" } }` and navigates to step 2; step 2
**Continue** saves the chosen avatar and navigates to `/learning`. Leaving after step 1 leaves a
valid initials profile — initials are a legitimate final choice.

### D5 · Start course resolves its destination from the profile

`StartCourseLink` renders **Start course** to `/start` on the server and during hydration, and
**Continue** to `/learning` once the hook reports a present profile; with a profile the closing band
becomes `ContinueBand` (greeting and learner card). The hero and closing band both use it; the first-lesson link and its
runtime note are removed from the landing's primary action (the note becomes the course name + total
videos). Row links in the levels table stay course-overview links.

### D6 · My learning composes existing pieces

Server page resolves the catalog exactly like the home (levels + first lesson) and renders the client
`MyLearningView`, which:
- greets with `LearnerAvatar` + "Welcome back, {firstName}." (first word of the name);
- resolves continue-watching with the renamed hook `useResolvedContinueWatching` (was
  `useHomeLearnerState`): `resolving` → panel skeleton, `returning` → `ResumePanel` (extracted from
  `ReturningHero` unchanged), nothing → `StartPanel` linking the first lesson;
- shows `CourseProgressList` for the continued course, or the first course when nothing is continued,
  as **lesson cards** (design L4, chosen on the canvas over the first expandable rows, whose detail
  only restated the counts): every card links to its module overview; the continued module's card comes
  first, spans the width, names the last watched video (`panel.lessonTitle`) and is the only one with
  **Continue** to `panel.lessonHref`, so no lesson titles are added to the catalog projection. Each card
  shows a `ProgressRing`, extracted from the learner card's tooltip so both draw the same ring;
- shows the levels table with the continued course marked.

`ReturningHero`, `KeepGoingBand` and `HeroSkeleton` lose their last caller and are deleted.

### D7 · Learner card, avatar and picker are shared components

- `LearnerAvatar({ profile | name+avatar, size })` — circle; illustration SVG or initials on gold;
  accessible name "Avatar: {name}". Built by hand with shadcn Avatar anatomy (no new dependency).
- `LearnerCard({ name, avatar, level, progress })` — the canvas card (brand, LEARNER tag, avatar, name
  or placeholder, level line, dashed divider, footer). It formats the progress label from
  `{ completed, total }` and opens a tooltip (design T2: `ProgressRing`, count, videos left) on hover,
  focus and tap.
- `AvatarPicker({ value, name, onChange })` — radio-group semantics (`role="radiogroup"`, each option
  `role="radio"` with `aria-checked`), initials first, 44px minimum targets, arrow-key navigation.
- Illustrations are inline SVG React components in `learner-avatar/learner-illustration.tsx`, colours
  from the canvas.

### D8 · Header menu

When `status === "present"`, `SiteHeader` renders an avatar trigger (existing `DropdownMenu`
primitive) with items My learning and Profile; otherwise nothing new renders, so the header keeps its
current width rules. `sectionKey` gains `sectionStart`, `sectionLearning`, `sectionProfile`.

Measured at 320px, the wordmark (153px) plus locale (62px), theme (44px) and avatar (44px) controls
need ~340px against 288px of content width, clipping the wordmark. Decision (confirmed with the
user): below `sm`, with a profile, the theme toggle is hidden from the row (`hidden sm:inline-flex`
wrapper) and the avatar menu gains a theme item (`sm:hidden`) that toggles light/dark. From `sm` up
nothing moves. The theme control is an animated switch (`useThemeChoice` shows the new theme at once
and applies it after the 260ms slide, at once under reduced motion); the menu item prevents the
menu from closing so the slide is seen, and stacks both theme names in one grid cell so the menu
keeps its width.

### D9 · Metadata and indexing

Each new route has `generateMetadata` through `shareMetadata` with localized title/description,
canonical + alternates as every route, and `robots: { index: false, follow: true }`. They add no
`opengraph-image`; Next serves the `[locale]` home card for them. The sitemap builder already lists
only home/course/module/lesson; a test asserts the personal routes stay out.

## Risks / Trade-offs

- [Client guards flash for a frame] → pages render their skeleton while `unknown`; replace happens
  before any content.
- [Profile lost when storage is cleared] → accepted per device scope; onboarding runs again.
- [Two tabs editing the profile] → last save wins; the subscription refreshes both.
- [Removing the home returning state breaks bookmarks expectations] → My learning is one tap away
  through Start course and the header menu.

## Migration Plan

No stored data changes shape; new key only. Existing learners with a continue-watching record but no
profile go through onboarding once when they press Start course. Rollback: revert the change set.

## Testing strategy

| Behaviour | Layer | Mirrors |
| --- | --- | --- |
| `LearnerProfile` schema, `learnerInitials` | Vitest unit | `continue-watching-location.test.ts` |
| `findLearnerProfile` / `saveLearnerProfile` | Vitest unit with stub repo | `find-continue-watching.test.ts` |
| localStorage adapter (round trip, invalid JSON, quota) | Vitest unit | continue-watching adapter test |
| `useLearnerProfile` (unknown → absent/present, save notifies) | Vitest hook test | `use-continue-watching.test.ts` |
| `useResolvedContinueWatching` rename | existing hook test moved | — |
| `LearnerAvatar`, `LearnerCard`, `AvatarPicker` | Vitest + RTL + user-event | `vowel-length-card.test.tsx` |
| `StartCourseLink` href per profile state | Vitest + RTL | — |
| Name step, avatar step, guards and navigation | Vitest + RTL with injected repo and router mock | `home-view.test.tsx` |
| `MyLearningView` states and lesson cards, `ProgressRing` | Vitest + RTL | `home-view.test.tsx` |
| `ProfileView` edit, discard, save, confirmation | Vitest + RTL | — |
| Header avatar menu present/absent | Vitest + RTL | `site-header.test.tsx` |
| Metadata noindex, sitemap exclusion | Vitest unit | `sitemap.test.ts`, metadata guard test |
| Message parity | Vitest | `messages.test.ts` |
| Home → Start course → name → avatar → My learning; Profile save updates header; returning resume on My learning | Playwright | `e2e/home.spec.ts` |
