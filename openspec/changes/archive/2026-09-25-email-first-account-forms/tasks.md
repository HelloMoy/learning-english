## 1. Sign-in form

- [x] 1.1 Add a test to `sign-in-form.test.tsx` asserting the "Sign in" button precedes "Continue with Google" in document order; watch it fail (TDD: test → impl)
- [x] 1.2 Move the divider and Google button after the `<form>` in `sign-in-form.tsx` (divider first), keeping the "password updated" status at the top; watch the test pass (TDD: test → impl)

## 2. Sign-up form

- [x] 2.1 Add a test to `sign-up-form.test.tsx` asserting the "Create account" button precedes "Continue with Google" in document order; watch it fail (TDD: test → impl)
- [x] 2.2 Move the divider and Google button after the `<form>` in `sign-up-form.tsx` (divider first); watch the test pass (TDD: test → impl)

## 3. Verification

- [x] 3.1 Run `pnpm verify` (typecheck, format, lint, `pnpm test:run`)
- [x] 3.2 Screenshot `/en/sign-in` and `/en/sign-up` with Playwright MCP to confirm the new order
- [x] 3.3 Run `pnpm test:e2e e2e/learner-account.spec.ts` to confirm the Google hand-off still works. Google hand-off passes; 7 credential/email tests fail with "Something went wrong" against the shared 3001 dev server, and fail identically with the original forms restored (A/B checked), so they are environmental
