## Context

Every learner table cascades from `user` (`learner-progress-in-database` and
`learner-achievements-in-database`), and Better Auth's `session` and `account` tables cascade too.
Deleting the user row is therefore the whole data deletion. What this change adds is the
learner-facing flow around it, and the guarantee that it cannot happen by accident or be triggered
by someone else.

## Goals / Non-Goals

**Goals:** a deliberate, email-confirmed deletion that works for both password and Google accounts,
and that is provably complete.

**Non-Goals:** a grace period, data export, and admin tooling.

## Decisions

### D1 — Email confirmation instead of re-authentication

Better Auth's `user.deleteUser` supports either a fresh session / password check or
`sendDeleteAccountVerification`. The email route is the only one that treats Google-only accounts
the same as password accounts, since those have no password to re-enter, and it proves control of
the address. Better Auth requires the link to be opened in a session for that same account, which
closes the "someone forwarded my email" hole.

`deleteUser` is called from the client as `authClient.deleteUser({ callbackURL: "/<locale>/account-deleted" })`.
`sendDeleteAccountVerification` composes the `delete-account` email through `composeAccountEmail`,
which gains a `"delete-account"` kind. The locale is read from `callbackURL`, as for the other
emails.

*Alternative:* a password prompt in the dialog. Rejected, because Google-only learners have none.

### D2 — Completeness is the cascade, proven by a test

No `beforeDelete` cleanup code. An integration test builds a user with a row in every learner table
and in `session` and `account`, deletes through `auth.api`, and asserts every table is empty for
that id. A future table that forgets the cascade fails this test. Keeping the list of learner
tables in one exported constant makes the test enumerate them rather than repeat them.

### D3 — UI

`DeleteAccountSection` is a client component at the end of `ProfileView`. It owns the status
(`idle` → `sent` | `error`), shown in a `role="status"` region. `DeleteAccountModal` (NiceModal +
shadcn `Dialog`, `src/components/modals/delete-account-modal/`) resolves `true` or `false`, with
initial focus on Cancel (`onOpenAutoFocus`). The destructive button uses the existing `Button`
`variant="destructive"`.

`/[locale]/account-deleted` lives in the `(account)` route group. It is public and `noindex`, and a
small client effect removes the `learning-english:prize-announce` key through a function exported
by `use-pending-prize-announcement`, not by writing the key name at the call site.

## Testing strategy

| Behavior | Layer | Mirrors |
|---|---|---|
| Deleting a user empties every learner table, `session` and `account`; the link without the account's session deletes nothing | Vitest integration + testcontainers (libSQL + Mailpit), through `auth.api` | change-1 auth integration suite |
| `delete-account` template copy and link per locale | Vitest unit | `verify-email` template test |
| `DeleteAccountModal`: focus on Cancel, resolves `false` or `true`, copy | Vitest + RTL | `unmark-lesson-modal.test.tsx` |
| `DeleteAccountSection`: calls `deleteUser` with the locale callback, announces sent or error | Vitest + RTL (auth client mocked) | `profile-view.test.tsx` |
| Account-deleted page clears the pending-prize record, `noindex` | Vitest + RTL / unit | — |
| Full flow: Profile → dialog → Mailpit link → `/en/account-deleted` → old credentials fail | Playwright | `learner-account.spec.ts` |

## Risks / Trade-offs

- **An unused link lingers in the inbox.** The Better Auth verification token expires, and the link
  also requires the account's session.
- **Irreversible.** That is intended. The dialog, the email and the session requirement are three
  separate confirmations of intent.

## Migration Plan

No schema change. Deploying the change enables the flow. Rollback: revert, and the Profile page loses
the section.

## Open Questions

- None.
