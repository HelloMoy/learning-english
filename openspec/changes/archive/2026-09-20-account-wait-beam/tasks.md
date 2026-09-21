## 1. Motion and tokens

- [x] 1.1 Add the `@keyframes` and the `.account-wait-beam` / `.spinner-arc` classes to `src/app/globals.css`, following the convention the guide and prize animations already use: a comment saying why the animation exists, the gold/amber/glow tokens rather than literals, and the classes registered in the trailing `@media (prefers-reduced-motion: reduce)` block that sets `animation: none`. The beam sweeps in 1400ms `linear` over `-100%` → `238%`, which is exactly where a light 42% of the rail leaves the card; the arc turns in 720ms `linear`. (No test: pure CSS, verified in Storybook at 4.2 and 4.3.)
- [x] 1.2 Clear Turbopack's stale CSS cache after 1.1 — `rm -rf .next` and restart the dev server — before looking at anything in the browser.

## 2. Copy

- [x] 2.1 Add each surface's waiting sentence alongside its existing pending label: `Account.signIn.waiting`, `Account.signUp.waiting`, `Account.forgotPassword.waiting`, `Account.resetPassword.waiting` and `Profile.deleteAccount.waiting`, in all three locales. Each names the work being waited on, never the progress. One key per surface and no shared one — the same string feeds both the live region and the visible line.

## 3. The three components

- [x] 3.1 Create `src/components/spinner-arc/spinner-arc.tsx` (TDD: test → impl). Test: it renders, carries `.spinner-arc`, and exposes no accessible name — `aria-hidden`, no text, no role.
- [x] 3.2 Write `SpinnerArc`'s JSDoc: what it is, that it is decorative and always paired with a visible label, and an example.
- [x] 3.3 Create `src/components/pending-button/pending-button.tsx` wrapping `Button` (TDD: test → impl). Test: idle renders `label` and no arc; `isPending` renders `pendingLabel` with the arc and the button disabled; the button's accessible name is the pending label alone. Cover the `type`, `variant` and `onClick` passthrough that `DeleteAccountSection` needs at task 6.
- [x] 3.4 Write `PendingButton`'s JSDoc, naming it as the single definition of the in-flight button and listing its two callers.
- [x] 3.5 Create `src/components/account-wait/account-wait.tsx` — the root, holding `busy` in a context, rendering the beam while busy and nothing extra while idle (TDD: test → impl). Test: idle renders its children with no beam; busy renders the beam with `.account-wait-beam` and `aria-hidden`.
- [x] 3.6 Add `AccountWait.Paused` (TDD: test → impl). Test: idle renders children plain; busy carries `inert` and the dimming class, and the children are still in the document — assert the values of a rendered input survive the toggle, since not unmounting is the point.
- [x] 3.7 Add `AccountWait.Status`, with its live region mounted at rest so it is announced reliably when filled (TDD: test → impl). Test: idle renders exactly one `role="status"`, empty and `sr-only`; busy fills it with the caller's sentence and adds the visible line carrying `aria-hidden`; a re-render while still busy does not change the text.
- [x] 3.8 Assert the whole busy tree has exactly one `role="status"` across root, `.Paused` and `.Status` together (TDD: test → impl).
- [x] 3.9 Verify the sentence reaches both the live region and the visible line from one caller-supplied string (TDD: test → impl). `AccountWait` calls no `useTranslations` — locale resolution of each surface's `waiting` key is covered where it lives, in the form tests at 5.x.
- [x] 3.10 Write `AccountWait`'s JSDoc: the compound API, which part goes where, why the button stays outside `.Paused`, and an example.

## 4. Stories, reviewed before anything is wired

- [x] 4.1 Write `spinner-arc.stories.tsx`, `pending-button.stories.tsx` (idle and pending) and `account-wait.stories.tsx` (idle and busy, the busy one composed the way a real form composes it). Titles under `Components/`, no `next-intl` mock, a story per other locale where copy shows.
- [x] 4.2 Review the stories in the browser with Playwright MCP in `en`, `es` and `pt`, and in both themes. Check what design.md's first risk calls out: whether the arc and the beam read as one wait or as two competing indicators, and whether a status line overflows its card in the longest locale.
- [x] 4.3 Review the busy story with reduced motion emulated. The dimming, the pending label, the status line and the live region must all still be there with nothing moving.

## 5. The four forms

- [x] 5.1 Swap `AccountSubmitArea`'s bare `Button` for `PendingButton` (TDD: test → impl). Test in the existing `account-submit-area.test.tsx`: every label-swap assertion already there still passes, and the arc is present while pending and absent otherwise.
- [x] 5.2 Give `AccountShell`'s card `relative overflow-hidden` so it is the beam's positioning context and clips it (TDD: test → impl). Test in the existing shell test: the classes are on the card element. It stays a server component with no new prop.
- [x] 5.3 Wire `SignInForm` — `AccountWait` around the body, `AccountWait.Paused` around the notice, the Google button, the divider and the fields, `AccountWait.Status` with `signIn.waiting` (TDD: test → impl). Test in the existing `sign-in-form.test.tsx`: submitting leaves the fields mounted, dimmed and inert, and the surface has one `role="status"` even when the `passwordUpdated` notice was showing.
- [x] 5.4 Hold `SignInForm`'s wait from the response until the navigation with an `isLeaving` flag (TDD: test → impl). Test: after the credentials resolve the fields do not become live again, and `router.replace` / `router.refresh` are still called with today's arguments.
- [x] 5.5 Bring `SignInForm` back on a refusal with the typed values and the error intact (TDD: test → impl). Test: a rejected `signIn.email` leaves the fields live, holding what was typed, with the refusal's message shown.
- [x] 5.6 Wire `SignUpForm` the same way with `signUp.waiting`, giving way to the existing confirmation when the request resolves (TDD: test → impl). Test in the existing `sign-up-form.test.tsx`: the three beats — covered, confirmation on success, fields restored with their values on refusal.
- [x] 5.7 Wire `ForgotPasswordForm` with `forgotPassword.waiting` (TDD: test → impl). Same three beats in the existing test, ending in its confirmation.
- [x] 5.8 Wire `ResetPasswordForm` with `resetPassword.waiting` (TDD: test → impl). Same three beats in the existing test, ending in `router.replace("/sign-in?reset=done")`. Leave the invalid-token branch untouched — it renders before any request exists.

## 6. The deletion section

- [x] 6.1 Replace `DeleteAccountSection`'s hand-rolled label swap with `PendingButton`, driven by `status === "sending"` (TDD: test → impl). Test in the existing `delete-account-section.test.tsx`: confirming the modal shows the pending label with the arc on a disabled destructive button, and the existing assertions about the modal and the request are unchanged.
- [x] 6.2 Wrap the section in `AccountWait` with `Profile.deleteAccount.waiting`, and give its `<section>` `relative overflow-hidden` for the beam (TDD: test → impl). Test: while sending, the beam is present and the section has exactly one `role="status"`. There is no `.Paused` — the section has no fields.
- [x] 6.3 Confirm the terminal states are untouched (TDD: test → impl). Test: the `sent` state still shows its existing status with the button disabled, and `error` still shows its existing alert with the button live — and neither renders the beam.

## 7. End to end

- [x] 7.1 Extend `e2e/learner-account.spec.ts` with the scenario jsdom cannot observe (TDD: test → impl): with the credentials request held back through the existing `learner-account-fixture.ts`, the beam and the arc are painted, the email field cannot be focused or typed into, exactly one `role="status"` is present, and the learner still lands on `/en/learning`.

## 8. Verification

- [x] 8.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`) and fix every failure at its root — no `@ts-ignore`, no `eslint-disable`, no loosened config.
- [x] 8.2 Run `pnpm test:e2e` for the account specs against a running server, with `PLAYWRIGHT_BASE_URL` set (port 3000 is taken on this machine) and `--workers=1` to tell flakes from regressions.
- [x] 8.3 Walk the five surfaces in the browser with Playwright MCP in one locale and both themes, with the requests slowed, and confirm each one waits the same way.
