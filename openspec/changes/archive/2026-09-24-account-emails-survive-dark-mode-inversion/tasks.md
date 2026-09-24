## 1. Palette in one place

- [x] 1.1 Refactor the shell's colour literals into one `CINEMA` palette constant that the inline styles read from, the ones that mirror a `globals.css` token still commented with it (TDD: existing `account-email.test.tsx` stays green before and after — pure refactor, no new behaviour)

## 2. Solid fills survive image-sparing inversion

- [x] 2.1 Both letterbox bars carry `linear-gradient(#000000,#000000)` next to their `background-color` (TDD: test → impl)
- [x] 2.2 The rule becomes a borderless 1px block painted `#26262f` by colour and one-colour gradient (TDD: test → impl)
- [x] 2.3 Neither call to action carries a one-colour gradient, so each inverts as a unit (TDD: test → impl) — revised after 6.2: the gold gradient came out with the multiply layers

## 3. Gmail blend layers

- [x] 3.1 The head carries a stylesheet with the `u + .body` screen / difference (on black) rules, and the body carries the `body` class (TDD: test → impl)
- [x] 3.2 Wordmark letters, heading, body and both fine-print lines sit inside a `gmail-screen` > `gmail-difference` pair; the link and the gold dot do not (TDD: test → impl)
- [x] 3.3 The blend layers are blocks, inline only inside the wordmark; neither button label sits in a layer (TDD: test → impl) — revised after 6.2: the Gmail simulation showed hairlines at fractional edges, and the multiply pair for the gold label drew them on the fill

## 4. Outlook overrides

- [x] 4.1 The stylesheet carries `[data-ogsc]` rules restoring the text colours and `[data-ogsb]` rules restoring the ground, bar, rule and routine-button fills, reading from `CINEMA` (TDD: test → impl)

## 5. Spec wording in tests and docs

- [x] 5.1 Rename the `color-scheme` test to match the corrected requirement (declares the scheme, no longer claims it stops inversion) and fix the head comment in `account-email.tsx` that says it stops Gmail re-mapping
- [x] 5.2 Update the shell's JSDoc to say how it defends against inverting clients

## 6. Verification

- [x] 6.1 Run `pnpm test:run` for `src/emails` and then `pnpm verify`; all green
- [x] 6.2 Render the verify-email and delete-account templates to HTML and open them in a browser via Playwright MCP to confirm the non-inverting look is unchanged, and under a simulated Gmail iOS inversion that the text reads
