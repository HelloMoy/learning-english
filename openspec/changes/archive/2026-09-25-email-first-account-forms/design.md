## Context

`SignInForm` and `SignUpForm` both render, inside `AccountWait`, a `Paused` block holding `GoogleSignInButton` and the "or" divider, followed by the `<form>` (fields in a `Paused` block, then `AccountSubmitArea` with Turnstile and submit). On sign-in, the "password updated" status sits in the same leading `Paused` block as Google.

## Goals / Non-Goals

**Goals:**
- Email and password first, Google second, on both pages.

**Non-Goals:**
- New copy, new styling, or a shared "alternative sign-in" component.

## Decisions

- **Move the Google `Paused` block after the `<form>`, and put the divider above the button.** The block keeps its `AccountWait.Paused` wrapper, so a submission still pauses Google exactly as before. The alternative, moving Google inside the `<form>`, would put a non-submit button inside the form for no benefit.
- **The sign-in "password updated" status stays first.** It confirms the step the learner just finished, so it belongs above the fields. It gets its own leading `Paused` block, or it stays as the first child and only the Google block moves.
- **No extracted component.** The divider plus Google pair repeats in two forms. Pulling it into a component is outside this change and not needed to reorder it.

## Risks / Trade-offs

- [Google users have to scroll a little further on small screens] → Accepted. That is the point of the change.
- [`AccountWait.Status` placement relative to the moved block] → The status stays as the last child of `AccountWait`, unchanged.

## Testing strategy

- **Vitest component + RTL** (`sign-in-form.test.tsx`, `sign-up-form.test.tsx`, same `render` + `screen.getByRole` patterns already there): assert that the submit button precedes "Continue with Google" in document order (`compareDocumentPosition` / `Node.DOCUMENT_POSITION_FOLLOWING`). Write these first. They fail against the current order.
- **Playwright e2e**: no new spec. `e2e/learner-account.spec.ts` already clicks Google by role, and ordering is covered at the component layer.
- **Visual check**: Playwright MCP screenshots of `/en/sign-in` and `/en/sign-up` on the dev server.
