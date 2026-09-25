## 1. Component

- [x] 1.1 Production builds use the `interaction-only` appearance (TDD: test → impl). In
      `turnstile-challenge.test.tsx`, stub `NODE_ENV="production"` and assert
      `options.appearance` is `"interaction-only"`. Watch it fail, then pass it in
      `turnstile-challenge.tsx`.
- [x] 1.2 The development server keeps the `always` appearance (TDD: test → impl). Stub
      `NODE_ENV="development"` and assert `options.appearance` is `"always"`.
- [x] 1.3 Space is reserved only on the development server (TDD: test → impl). Assert the
      labelled group has `min-h-[65px]` under `"development"` and not under `"production"`.
      Then make the class conditional.
- [x] 1.4 Update the component's JSDoc `@remarks` and the story's description to say the
      widget is hidden outside the development server unless interaction is needed.

## 2. Docs

- [x] 2.1 `DEPLOYMENT.md` step 4: keep "Managed mode, not Invisible". Replace the "reserves
      visible space" reason with the real one: the app already hides the widget with the
      `interaction-only` appearance, and Invisible would remove the checkbox fallback and
      require the privacy addendum.

## 3. Verification

- [x] 3.1 Run `pnpm verify`.
- [x] 3.2 Run `pnpm test:e2e e2e/learner-account.spec.ts --project=chromium`, using
      `PLAYWRIGHT_BASE_URL` as noted for this machine.
- [x] 3.3 Playwright MCP: on a production build (`pnpm build && pnpm start`), the sign-in
      form shows no Turnstile box and no gap, and signing in still works. On `pnpm dev` the
      box is visible.

## 4. Move the challenge to the end of each form (added after review)

- [x] 4.1 The hidden widget takes no space (TDD: test → impl). In production the group is
      `absolute`. It returns to the flow on `onBeforeInteractive`, `onError` or
      `onUnsupported`. On the development server it's never `absolute`.
- [x] 4.2 `AccountChallenge` (TDD: test → impl): new component in
      `src/components/account-challenge/`. The token reaches `submission.onToken`, a new
      `challengeKey` remounts it, and it sits in `AccountWait.Paused` with `contents`.
      Add a story and JSDoc.
- [x] 4.3 `AccountSubmitArea` drops the challenge and `challenged` (TDD: update tests →
      impl), along with its stories and JSDoc.
- [x] 4.4 `SignInForm` and `SignUpForm` place `AccountChallenge` after "Continue with
      Google" (TDD: order test → impl).
- [x] 4.5 `ForgotPasswordForm` places `AccountChallenge` after the submit button (TDD:
      order test → impl).
- [x] 4.6 Re-run the verification: `pnpm verify`, the `learner-account` e2e on a production
      build, and the Playwright MCP check (no gap in production, box under Google on dev).
