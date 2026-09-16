## Context

Step 1 renders `LearnerCard` with the name typed so far, and a separate `<input>` below it. With the
name empty the card shows `Components.LearnerCard.namePlaceholder` — `Tu nombre` — in muted type, in the
place and at the size the real name will have. That is exactly what an empty field looks like, so
learners click the card and nothing happens; the field that answers is somewhere else on the page.

## Goals / Non-Goals

**Goals:**

- One place to type the name, and it is the place where the name will live.
- Inside the card, the field reads as a field — the failure mode of in-place editing is the opposite
  one, where nothing looks editable and no one types at all.
- The card stays a card everywhere else it is used.

**Non-Goals:**

- Editing the name in the card outside the onboarding (the Profile keeps its form), the avatar step, or
  anything about how profiles are stored.

## Decisions

### D1 — `LearnerCard` takes an optional name field instead of growing a mode

`LearnerCard` gains one optional prop — the name field to render in place of the name, supplied by the
caller. Given none, the card renders exactly what it renders today, so the Profile and the Achievements
page are untouched and their tests keep passing unchanged.

- *Alternative:* an `isEditable` flag with the input built inside the card. That would push the field's
  value, change handler, label and validation into a component whose job is presentation, and every
  caller would carry props it never uses.

### D2 — A real `<input>`, not `contenteditable`

The field keeps being an `<input type="text">`: it comes with selection, undo, `autocomplete="name"`,
`maxLength`, mobile keyboards and form submission for free. `contenteditable` would look tidier in the
markup and lose all of that.

The input is styled to sit in the card at the name's size and weight, with a resting underline, a caret
and a focus ring. The placeholder keeps saying `Tu nombre`, which now tells the truth: it is a field.

### D3 — The old field is removed, not hidden

Two fields asking for one thing is the bug. Step 1 keeps the form — it still submits on Enter and
**Continue** still guards the empty name — but the form's only control above the button is the card.

### D4 — The card's own label moves with the field

The accessible name (`Onboarding.name.fieldLabel`) and the placeholder (`Onboarding.name.placeholder`)
move into the card with the input, so nothing about what assistive technology hears changes. The card's
`namePlaceholder` message stays for every other caller, where it is still a placeholder for text.

## Risks / Trade-offs

- [A field that looks like card text is worse than the problem it replaces] → the resting underline,
  caret and focus ring are part of the requirement, checked in the visual review at both themes.
- [The name is long] → the card already truncates the name; the input keeps `maxLength` and the same
  truncation rules, checked with the longest name the field accepts.
- [The card is used in three places] → the prop is optional and the default path is unchanged, which the
  existing `LearnerCard`, Profile and Achievements tests already assert.

## Migration Plan

None. The step saves the same profile it saves today.

## Open Questions

None blocking.

## Testing strategy

- **Vitest + RTL** — `learner-card`: given a field it renders it in the name's place, given none it
  renders today's name line; `onboarding-name-step`: the field lives inside the card, there is no second
  name field, typing updates the card, Continue stays disabled while blank and saves what was typed.
- **Storybook** — a story of the card with the field, in `en`, `es` and `pt`.
- **Playwright e2e** — `e2e/home.spec.ts`: the onboarding types into the card and lands on My learning.
- **Visual review** — Playwright MCP at both themes and at phone width: the field reads as a field,
  empty and filled, focused and unfocused.
