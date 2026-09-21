## 1. The action kind

- [x] 1.1 Add `AccountEmailAction` (`"routine" | "destructive"`) and the optional `action` prop to
      `AccountEmailProps` in `src/emails/_shared/account-email.tsx`, defaulting to `"routine"`, with
      JSDoc on both. (TDD: test → impl — the first test in 2.1 is what drives the type in.)

## 2. The shared shell

- [x] 2.1 Write `src/emails/_shared/account-email.test.tsx` covering the ground and the frame: the
      `#08080b` `background-color` present outside the gradient, both radial layers, the two black
      letterbox bars, the centred content, and the `ENGLISH·COURSE` wordmark with its `#e7b64c`
      dot. Node environment, `render()` from `react-email`, mirroring
      `verify-email/verify-email.test.tsx`. (TDD: test → impl)
- [x] 2.2 Redraw the `styles` object and the JSX to make 2.1 pass: dark palette, gradient over a
      solid ground, full-bleed bars outside the `Container`, wordmark above the heading. Each
      literal carries the `globals.css` token it came from. (TDD: impl for 2.1)
- [x] 2.3 Extend the shell test with the two call-to-action treatments: gold `#e7b64c` on
      `#1a1200` for `routine`; the `#b3402f` tinted fill, border and `#ef9d8c` label for
      `destructive`, and no gold button anywhere in that render. (TDD: test → impl)
- [x] 2.4 Style the button from the `action` prop to make 2.3 pass. (TDD: impl for 2.3)
- [x] 2.5 Extend the shell test for the declared colour scheme, then add the `color-scheme` and
      `supported-color-schemes` meta tags to `<Head>`. (TDD: test → impl)

## 3. The three templates

- [x] 3.1 Add a case to `src/emails/delete-account/delete-account.test.tsx` asserting the rendered
      email carries the destructive treatment, then pass `action="destructive"` from
      `DeleteAccount`. (TDD: test → impl)
- [x] 3.2 Add a case to each of `verify-email/verify-email.test.tsx` and
      `reset-password/reset-password.test.tsx` asserting the gold primary, then confirm both pass
      on the default — no production change expected. (TDD: test → impl)

## 4. Documentation

- [x] 4.1 Update the JSDoc on `AccountEmail` and `AccountEmailProps` so it describes the letterbox
      composition and the action prop, per the project's TypeDoc rules.

## 5. Verification

- [x] 5.1 Render the three templates with `pnpm email:dev` and review them in the browser at
      `localhost:3030` — the frame, the glow, the wordmark and both button treatments.
- [x] 5.2 Run `pnpm verify` (typecheck, format:check, lint, `pnpm test:run`) and fix every failure.
      No Playwright run applies: this change touches no browser flow.
