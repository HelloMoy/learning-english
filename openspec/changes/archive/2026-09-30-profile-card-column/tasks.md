## 1. Copy

- [x] 1.1 Add `Profile.title`, `Profile.account.passwordLabel`, `Profile.account.change`, `Profile.account.close`, and rename `Profile.sections.identity` and `Profile.account.heading` in `en`, `es` and `pt` (TDD: covered by the component tests in 2–5 failing first on the new strings)

## 2. Learner card progress bar

- [x] 2.1 `LearnerCard` renders no bar by default and a bar at the completed share with `showProgressBar` (TDD: test → impl)
- [x] 2.2 Add a `WithProgressBar` story to `learner-card.stories.tsx` and JSDoc for the new prop

## 3. Card column

- [x] 3.1 `ProfileCardBand` drops the ring panel, passes `showProgressBar`, and renders the tickets and prizes stubs with their zero state before hydration (TDD: test → impl)
- [x] 3.2 Update `profile-card-band.stories.tsx` and JSDoc
- [x] 3.3 Each stub is a link to `/achievements` named by its count and label (TDD: test → impl), plus an e2e click-through in `profile-layout.spec.ts`

## 4. Account rows

- [x] 4.1 New `AccountRow`: collapsed by default with `aria-expanded`, Change/Close toggles a mounted region hidden with `hidden`, typed input survives a close (TDD: test → impl)
- [x] 4.2 `AccountRow` stories (closed, open) and JSDoc
- [x] 4.3 `AccountSection` renders the address and password rows wrapping the two forms for a password account, and a plain address row plus the Google note for a Google-only account (TDD: test → impl)
- [x] 4.4 Update `account-section.stories.tsx`

## 5. Profile page layout

- [x] 5.1 `ProfileView`: `h1` is `Profile.title` and does not follow name edits; section order Your card, Sign-in and security, Preferences, Delete account (TDD: test → impl)
- [x] 5.2 `ProfileView`: two-column grid at `lg` with the sticky card column holding the card band and the save bar; skeleton shell matches the new shape (TDD: test for single save bar inside the card column → impl)
- [x] 5.3 `ProfileSaveBar`: docked below `lg`, static in the column at `lg`; still one bar (TDD: test → impl)
- [x] 5.4 Delete section drawn as the danger panel
- [x] 5.5 Update `profile-view.stories.tsx` (Default, EditingTheAvatar, InSpanish, OnAPhone) and play functions for the new headings

## 6. End to end

- [x] 6.1 `account-identity.spec.ts` opens the password/address row before filling the form (TDD: update spec → red against old UI is not possible; run green against new UI)
- [x] 6.2 `account-deletion.spec.ts` proves the card outlived the link by the card's name, not the `h1`
- [x] 6.3 Add a profile layout e2e: at a wide viewport the save bar sits in the card column and is not fixed; at a phone viewport it is docked to the bottom (TDD: test → impl already in 5.3)

## 7. Verification

- [x] 7.1 Visual check with Playwright MCP of the Profile stories in light and dark, desktop and phone
- [x] 7.2 Run `pnpm verify` and `pnpm test:e2e` for the profile, account-identity and account-deletion specs
