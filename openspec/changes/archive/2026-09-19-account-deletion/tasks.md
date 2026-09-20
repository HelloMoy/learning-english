## 1. Email and auth

- [x] 1.1 `Emails.DeleteAccount.*` messages in `en`, `es` and `pt`, and the `delete-account` React Email template with `PreviewProps`. Test the copy, the button and the text link (TDD: test → impl)
- [x] 1.2 Add the `"delete-account"` kind to `composeAccountEmail` (TDD: test → impl)
- [x] 1.3 Enable `user.deleteUser` with `sendDeleteAccountVerification` in `getAuth()`, and export the learner-tables constant. Integration test: request → email; the link without a session deletes nothing; the link with the session deletes the user and empties every learner table, `session` and `account` (TDD: test → impl)

## 2. UI

- [x] 2.1 `Profile.deleteAccount.*` and `Account.accountDeleted.*` messages in three locales (content, covered by component tests)
- [x] 2.2 `DeleteAccountModal` with story, test and JSDoc: focus on Cancel, resolves the answer (TDD: test → impl)
- [x] 2.3 `DeleteAccountSection` with story, test and JSDoc: opens the modal, calls `authClient.deleteUser` with the locale `callbackURL`, and announces sent or error (TDD: test → impl)
- [x] 2.4 Render the section at the end of the Profile page (TDD: test → impl on `profile-view`)
- [x] 2.5 Reuse the already exported `clearPendingPrize()` from `use-pending-prize-announcement`. Add the `/[locale]/account-deleted` page (public, `noindex`, clears the record, links home) (TDD: test → impl)

## 3. End-to-end

- [x] 3.1 `e2e/account-deletion.spec.ts`: Profile → dialog → Mailpit link → `/en/account-deleted`, then signing in with the old credentials fails (TDD: spec first)

## 4. Verification

- [x] 4.1 Run `pnpm verify` with Docker up, and `pnpm test:e2e --project=chromium` for the account specs. Check the Profile section and the dialog in the browser with Playwright MCP
