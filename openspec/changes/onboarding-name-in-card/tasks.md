## 1. The card can carry the name field

- [x] 1.1 `LearnerCard` takes an optional `nameField`, rendered in the name's place; without it the card renders exactly what it renders today (TDD: RTL test for both → impl; JSDoc)
- [x] 1.2 Story of the card carrying a name field, in `en`, `es` and `pt`

## 2. Step one types in the card

- [x] 2.1 `OnboardingNameStep` passes its input to the card and drops the field below it: the field is inside the card, the step has no second name field, and the card fills as the learner types (TDD: RTL test → impl)
- [x] 2.2 The field keeps its accessible name, placeholder, `autocomplete` and maximum length, and Enter still submits (TDD: RTL test → impl)
- [x] 2.3 The field reads as a field inside the card: resting underline, caret, visible focus ring (TDD: RTL test on the classes → impl)

## 3. End-to-end and review

- [x] 3.1 `e2e/home.spec.ts`: the onboarding types the name into the card and finishes on My learning (TDD: spec red → green)
- [x] 3.2 Visual review with Playwright MCP at both themes and at phone width — empty, filled, focused — and at 320px
- [x] 3.3 Run `pnpm verify` and `pnpm test:e2e e2e/home.spec.ts` (Chromium) and fix every failure
