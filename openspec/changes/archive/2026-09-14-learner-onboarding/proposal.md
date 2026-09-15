## Why

The home currently changes its whole lead depending on whether the device holds a
continue-watching record, so the same URL is a landing page for one visitor and a
dashboard for another. That confuses returning learners who want the landing, and it gives
a learner no place of their own. The chosen "Final flow" in the design canvas separates the
two: the home is always the landing, and pressing **Start course** leads into a short
learner-card onboarding (name, then avatar) and on to a dedicated **My learning** page,
with a **Profile** page to change name and avatar later.

## What Changes

- **BREAKING (UI):** the locale home no longer switches to a returning-learner state. It always
  renders the editorial landing. Its primary action becomes **Start course**, which opens the
  onboarding when the device has no learner profile and **My learning** when it has one; the
  closing band repeats the same action.
- New **learner profile** stored per device: a name and an avatar that is either the initials
  derived from the name or one of eight preloaded illustrations. It sits behind a domain port
  with a `localStorage` adapter, like continue-watching and playback position.
- New **onboarding** at `/[locale]/start` (step 1, name) and `/[locale]/start/avatar` (step 2,
  avatar). Both steps edit a live **learner card**. Finishing step 2 opens My learning.
- New **My learning** page at `/[locale]/learning`: greeting with the learner's avatar; a
  resume panel for the last lesson (or a start panel when nothing has been watched); per-lesson
  progress as lesson cards, the continued lesson's card first with Continue; and the courses table with the continued course marked. It
  takes over what the home's returning state showed.
- New **Profile** page at `/[locale]/profile`: edit name and avatar with the learner card as a
  live preview, Discard and Save, and a confirmation.
- The **site header** shows the learner's avatar once a profile exists, opening a menu with
  My learning and Profile; its section eyebrow covers the new routes.
- The personal routes are excluded from the sitemap and ask search engines not to index them.
- Components only used by the removed home state (`ReturningHero`, `KeepGoingBand`,
  `HeroSkeleton`) are removed; `useHomeLearnerState` is renamed to describe what it resolves.

## Capabilities

### New Capabilities
- `learner-profile`: the learner profile value, its validation, initials derivation, the
  illustration set, the repository port and `localStorage` adapter, the client hook, and the
  avatar and learner-card components.
- `learner-onboarding`: the two onboarding routes, their live learner card, step guards and
  completion.
- `my-learning`: the My learning route — guard, greeting, resume/start panel, per-lesson
  progress cards and courses table.
- `profile-page`: the Profile route — guard, live preview, editing, Discard/Save, confirmation.

### Modified Capabilities
- `cinema-home`: the hero's primary action and the closing band become **Start course**
  (onboarding or My learning); the header gains the learner avatar menu and new section labels.
- `returning-learner-home`: retired — the home no longer has a returning state and the behaviour
  moves to `my-learning`. Every requirement goes, so the capability's spec is deleted outright
  rather than left empty (OpenSpec rejects a spec with no requirements).
- `continue-watching`: "The home offers to continue the last lesson" moves to My learning.
- `site-metadata`: personal routes reuse the home sharing image instead of rendering their own.
- `search-discoverability`: personal routes are kept out of the sitemap and marked `noindex`.

## Impact

- **Routes:** new `src/app/[locale]/start/page.tsx`, `start/avatar/page.tsx`, `learning/page.tsx`,
  `profile/page.tsx` (+ loading shells); `src/app/[locale]/page.tsx` loses the returning state.
- **Domain:** new `LearnerProfile` entity, `LearnerProfileRepository` port, find/save use cases.
- **Adapters:** new `BrowserLocalStorageLearnerProfileRepository`.
- **Components/hooks:** `LearnerAvatar`, `LearnerCard`, `AvatarPicker`, `StartCourseLink`,
  onboarding steps, `MyLearningView`, `ProfileView`, `ResumePanel` extracted, header avatar menu;
  `useLearnerProfile`; `CourseProgressList` becomes lesson cards; `ProgressRing` is shared by it and `LearnerCard`.
- **i18n:** new `Onboarding`, `MyLearning`, `Profile`, `Components.*` keys in en/es/pt; retired keys
  removed.
- **Tests:** Vitest + RTL for every new unit; e2e rewritten for home, onboarding, My learning and
  Profile.
- **Metadata/SEO:** `generateMetadata` for the new routes; sitemap unchanged in code but covered by
  a new assertion.

## Non-goals

- Accounts, sign-in, or syncing the profile across devices — the profile stays per device.
- Uploading a photo or drawing a custom avatar; only the eight illustrations and initials.
- A light-theme redesign of the new pages beyond what the existing tokens already provide.
- Changing course, module or lesson pages, the vowel-length card, or the landing's copy other than
  the primary action.
- Deleting a profile or resetting progress.
