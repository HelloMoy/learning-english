## 1. Domain

- [x] 1.1 `LearnerProfile` entity (name 1–40 trimmed, avatar union with the eight illustration ids) and `learnerInitials` (TDD: entity unit tests → impl)
- [x] 1.2 `LearnerProfileRepository` port and a stub in `src/test-setup/stubs` (TDD: type-level use in the use-case tests below)
- [x] 1.3 `findLearnerProfile` and `saveLearnerProfile` use cases returning `ResultAsync`, `invalid-learner-profile` error (TDD: unit tests → impl); the client hook is their composition root, since no server code reads the profile

## 2. Adapter and client store

- [x] 2.1 `BrowserLocalStorageLearnerProfileRepository` — round trip, missing/invalid JSON reads as null, quota errors swallowed (TDD: adapter tests → impl)
- [x] 2.2 `useLearnerProfile` — unknown → absent/present after hydration, `save` notifies every mounted reader, storage event from other tabs (TDD: hook tests → impl)
- [x] 2.3 Rename `useHomeLearnerState` to `useResolvedContinueWatching` with its type, and move its tests (TDD: tests renamed first, red on import → rename)

## 3. Learner components

- [x] 3.1 Illustrations and `LearnerAvatar` (initials or illustration, accessible name) (TDD: RTL → impl)
- [x] 3.2 `LearnerCard` (brand, Learner tag, avatar, name or placeholder, level line, progress label) (TDD: RTL → impl)
- [x] 3.3 `AvatarPicker` radio group with arrow keys and 44px targets (TDD: RTL + user-event → impl)
- [x] 3.4 Messages for `Components.LearnerAvatar`, `Components.LearnerCard`, `Components.AvatarPicker` in en/es/pt (TDD: parity test stays green)
- [x] 3.5 Stories and JSDoc for 3.1–3.3

## 4. Home

- [x] 4.1 `StartCourseLink` — `/start` before the profile is known and when absent, `/learning` when present (TDD: RTL with injected repository → impl)
- [x] 4.2 `HomeView` always renders the landing; hero and closing band use `StartCourseLink` with the course/video note; remove the resolving/returning branches (TDD: update `home-view.test.tsx` first → impl)
- [x] 4.3 Update `HomePage.newVisitor` messages (Start course, note) and remove `HomePage.returning` keys (TDD: parity test)

## 5. Onboarding

- [x] 5.1 `Onboarding` messages in en/es/pt (step label, headings, field, placeholder, Continue)
- [x] 5.2 `OnboardingNameStep` — live card, Continue disabled without a name, saves initials profile and navigates to step 2 (TDD: RTL with injected repository and router → impl)
- [x] 5.3 `OnboardingAvatarStep` — card with saved name, picker, saves avatar and navigates to My learning (TDD: RTL → impl)
- [x] 5.4 Guards for both steps and shells while the profile is unknown (TDD: RTL → impl)
- [x] 5.5 Routes `start/page.tsx`, `start/avatar/page.tsx` with `generateMetadata` (noindex) and loading shells (TDD: metadata unit test → impl)
- [x] 5.6 Stories and JSDoc for 5.2–5.3

## 6. My learning

- [x] 6.1 Extract `ResumePanel` from `ReturningHero` unchanged, add `StartPanel` (TDD: move `ReturningHero` panel tests → impl)
- [x] 6.2 `CourseProgressList` rows become disclosure controls with one open row, initial open row, videos-left detail and module overview link (TDD: RTL → impl)
- [x] 6.3 `MyLearningView` — guard, greeting, resolving/resume/start panel, progress for continued or first course, courses table (TDD: RTL with injected hooks → impl)
- [x] 6.4 `MyLearning` messages in en/es/pt
- [x] 6.5 Route `learning/page.tsx` (catalog like the home) with `generateMetadata` (noindex) and loading shell (TDD: metadata unit test → impl)
- [x] 6.6 Delete `ReturningHero`, `KeepGoingBand`, `HeroSkeleton` once unused; stories and JSDoc for new components

## 7. Profile

- [x] 7.1 `ProfileView` — guard, form + live card, Save enabled only on change, Discard, confirmation status (TDD: RTL → impl)
- [x] 7.2 `Profile` messages in en/es/pt
- [x] 7.3 Route `profile/page.tsx` with `generateMetadata` (noindex) and loading shell (TDD: metadata unit test → impl)
- [x] 7.4 Stories and JSDoc for `ProfileView`

## 8. Header and SEO

- [x] 8.1 `sectionKey` gains start/learning/profile and messages in every locale (TDD: `site-header.test.ts` → impl)
- [x] 8.2 Header avatar menu with My learning and Profile when a profile exists (TDD: RTL → impl)
- [x] 8.3 Sitemap test asserting personal routes are absent (TDD: test → confirm green)

## 9. End-to-end

- [x] 9.1 Rewrite `e2e/home.spec.ts`: landing never shows Welcome back; Start course → name → avatar → My learning greets the learner; Start course again goes straight to My learning; opening a lesson then My learning offers Resume; Profile save updates the header avatar; guards redirect without a profile (TDD: spec first, red → green after 4–8)
- [x] 9.2 Update `e2e/one-click-navigation.spec.ts` returning-hero cases to My learning

## 11. Follow-up: Continue for onboarded learners

- [x] 11.1 `StartCourseLink` reads **Continue** (en/es/pt) when a profile exists, in the hero and the closing band (TDD: RTL + home view tests first → impl)
- [x] 11.2 Update stories and `e2e/home.spec.ts` for the Continue label, then re-run `pnpm verify` and the home e2e spec

- [x] 11.3 `ContinueBand` — greeting by first name, learner card with first-course progress, Continue; `HomeView` shows it instead of `StartHereBand` once a profile exists (TDD: RTL for the band and the home view first → impl), with stories, copy in en/es/pt, and the home e2e spec extended

- [x] 11.4 `Tooltip` shadcn primitive on `radix-ui` (no new dependency) with tests, story and JSDoc; `LearnerCard` takes `progress: { completed, total }`, formats its label and shows the percentage in a tooltip (en/es/pt); update the onboarding steps, Profile and the continue band (TDD: primitive and card tests first → impl)

- [x] 11.5 Theme control as an animated switch: `useThemeChoice` flips the shown theme at once and applies it after the slide (immediately under reduced motion); `ThemeSwitchTrack` visual with sun/moon thumb; `ThemeToggle` becomes `role="switch"` keeping its `Theme: <name>` name and 44px/phone width budget; the avatar menu's theme item uses the switch and keeps the menu open (TDD: hook, toggle and header tests first → impl), with stories

- [x] 11.6 The avatar menu's theme item reserves the width of the longer theme name (both names share one grid cell, the inactive one invisible), so the menu no longer resizes when the switch toggles (TDD: header test first → impl)

- [x] 11.7 Progress tooltip design T2 (chosen on the design canvas): ring with the percentage, completed-of-total count and videos left in the course (complete state for a finished course), on the dark panel surface, opening below the label; copy in en/es/pt; card tests and stories updated (TDD: card tests first → impl)

- [x] 11.8 The learner card's progress tooltip opens and closes on tap on touch screens, where Radix tooltips otherwise ignore touch (TDD: card touch test first → impl; verified in the browser at phone width)

- [x] 11.9 Hero copy option C4 (chosen on the design canvas): eyebrow, heading and intro in en/es/pt — "From the first sound to real English" / "Learn American English one sound at a time." (TDD: hero, home view and e2e copy assertions first → messages)

- [x] 11.10 Extract `ProgressRing` from `LearnerCard` into a shared component with tests, story and JSDoc; the card's tooltip uses it unchanged (TDD: ring test first → extract)

- [x] 11.11 Per-lesson progress design L4 (chosen on the design canvas): `CourseProgressList` renders lesson cards with ring, ordinal, title and counts, each linking to its module overview; the continued module's card leads, spans the width, names the last watched video and alone offers Continue to it; `MyLearningView` passes the continued lesson; copy in en/es/pt; stories updated (TDD: list and view tests first → impl; verified in the browser at 1440 and 390)

## 10. Verification

- [x] 10.1 Visual check with Playwright MCP in dark theme: landing, both onboarding steps, My learning, Profile at 1440px and 390px; no horizontal scroll at 320px
- [x] 10.2 Run `pnpm verify` and the touched e2e specs in Chromium and fix every failure
