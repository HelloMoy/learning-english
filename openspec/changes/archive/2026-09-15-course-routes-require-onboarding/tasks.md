## 1. Return path (pure logic)

- [x] 1.1 `isCourseReturnPath` in `src/lib/onboarding-return-path/onboarding-return-path.ts`: accepts `/courses/...`; rejects external URLs, `//`, `\`, `:`, `..` segments, non-course paths and empty values (TDD: test → impl)
- [x] 1.2 `withReturnPath(path, returnPath)` appends an encoded `?next=` only for a valid return path (TDD: test → impl)
- [x] 1.3 JSDoc on both exports; apply the `clean-code` checklist

## 2. Hooks

- [x] 2.1 `useOnboardingDestinations` in `src/hooks/use-onboarding-destinations/` returns `nameStep`, `avatarStep` and `afterOnboarding` from `?next=` via `nuqs` (parser at module scope); tests use `withNuqsTestingAdapter` (TDD: test → impl)
- [x] 2.2 `useRequireLearnerProfile` in `src/hooks/use-require-learner-profile/` replaces an `absent` device with `/start?next=<pathname>`, stays on `present`, decides nothing on `unknown` (TDD: test → impl, mirroring `use-learner-redirect.test.ts`)

## 3. Onboarding steps (components)

- [x] 3.1 `OnboardingNameStep`: Continue opens `avatarStep`; an onboarded device is forwarded to `afterOnboarding` (TDD: RTL test → impl)
- [x] 3.2 `OnboardingAvatarStep`: Continue opens `afterOnboarding`; a device without a profile is sent to `nameStep` (TDD: RTL test → impl)
- [x] 3.3 Update JSDoc on both steps and check their stories still render (wrap with nuqs adapter if needed)

## 4. Course route gate

- [x] 4.1 Route-local client component `src/app/[locale]/courses/require-learner-profile.tsx` calling `useRequireLearnerProfile` and rendering nothing (TDD: RTL test that it renders nothing and invokes the redirect → impl)
- [x] 4.2 `src/app/[locale]/courses/layout.tsx` rendering the gate beside `children`

## 5. End-to-end

- [x] 5.1 Add `e2e/learner-profile-fixture.ts` that seeds a valid profile under `learning-english:learner-profile` via `addInitScript`
- [x] 5.2 Seed the profile in every existing spec that opens a course, module or lesson route on a clean device (run each affected spec to confirm it still passes) — 9 failures reproduce on a baseline worktree at HEAD without this change (course-catalog ×2, outline-drawer leftover param, mobile module overview ×3, not-found ×2, watch-progress "watched to its end"); one-click "Watch video" only passes before hydration on the baseline too; outline-drawer ×2 and video-player "oversized" were flaky and pass on re-run
- [x] 5.3 New `e2e/course-onboarding-gate.spec.ts` (TDD: spec fails first): clean device on a lesson URL → `/start?next=…` → complete both steps → back on the lesson; profile device opens the lesson directly; landing course card → onboarding; `?next=https://…` finishes at My learning
- [x] 5.4 Verify in the browser with Playwright MCP on `http://localhost:3000` (3200 serves another worktree) (landing card → onboarding → lesson)

## 6. Verification

- [x] 6.1 `pnpm verify` (typecheck, format, lint, `pnpm test:run`)
- [x] 6.2 `pnpm test:e2e` for the touched specs with `PLAYWRIGHT_BASE_URL` set (`--workers=1` to separate flakes from regressions)
