## Context

`ProfileView` renders a header (eyebrow, the stored name as `h1`, intro), then `ProfileCardBand`
(the large `LearnerCard` beside a panel with a `ProgressRing`, the video count, a bar and two stat
tiles), then four `ProfileSection`s in one column, then `ProfileSaveBar` fixed to the viewport.
`AccountSection` lists the address and sign-in methods and, for a password account, renders
`ChangePasswordSection` and `ChangeEmailSection` fully open. The recommended layout from the design
study keeps every one of these components and their behavior; it rearranges them.

## Goals / Non-Goals

**Goals:**

- Show the name once on the card and the progress once, and keep the card in view while editing.
- Put Save next to the card it saves on wide viewports; keep the docked bar on phones.
- Fold the two account forms behind rows so the page is short by default.
- Mark the delete section as a danger zone.

**Non-Goals:**

- Any change to the theme control, the save/password/email/deletion logic, or server calls.
- Any visual change to `LearnerCard` outside the Profile page.

## Decisions

### Two-column grid at `lg`, sticky card column

`ProfileEditor` becomes a header followed by a grid: `lg:grid-cols-[22.5rem_minmax(0,1fr)]`. The left
`<aside>` holds the card, the stubs and the save bar and is `lg:sticky` with a top offset that clears the
sticky site header (`top-24`). Below `lg` it is a plain block that comes first. `lg` (1024px) rather than
`md` because the right column needs ~36rem for the avatar picker and the account rows to breathe.

### One save bar, repositioned by breakpoint

`ProfileSaveBar` stays one component rendered once, now inside the card column. Its outer wrapper is
`fixed inset-x-0 bottom-0` below `lg` (today's behavior) and `lg:static` with no gradient or padding at
`lg`, so it flows under the stubs. Rendering two bars and hiding one with CSS was rejected: jsdom does
not apply Tailwind, so tests would see duplicate Save buttons, and assistive technology can too if the
hiding ever fails. A fixed element inside a sticky parent still resolves against the viewport as long as
no ancestor sets `transform`/`filter`, which the column does not.

### The progress bar is opt-in on `LearnerCard`

`LearnerCard` gains `showProgressBar?: boolean` (default `false`). When set, the footer's count is
followed by a bar at the completed share (same bronze→gold gradient the removed panel used). Onboarding,
the home continue band and Achievements do not pass it, so they render exactly as today.
`ProfileCardBand` becomes the card column body: the card with the bar, then two `TicketStub`s. Its
`ProgressRing` panel and `Stat` tiles are deleted.

### Ticket stubs

A small local component in `profile-card-band.tsx` (used only there, so no folder of its own): a
`--ticket`/`--ticket-ink` stub for tickets and a glow-to-bronze stub for prizes, each with notched sides
drawn with a radial-gradient `mask`. They keep the `data-testid`s `tickets-earned` and `prizes-claimed`
so existing tests and e2e keep finding the counts.

Each stub is a `Link` from `@/i18n/navigation` to `/achievements`, so the locale is kept. Both go to
the same page: tickets are spent and prizes claimed there, and the page has no separate anchor for
each. The link's accessible name is its visible text ("12 Tickets earned"). Hover lifts the stub's
brightness and focus draws the app's ring, so it reads as something to press.

### `AccountRow`: a disclosure, not `<details>`

New component `src/components/account-row/account-row.tsx`: a row with a label, a value, and a
"Change" button carrying `aria-expanded`/`aria-controls`; the region below is always mounted and toggled
with the `hidden` attribute, so closing a row keeps what was typed (a spec requirement) and the email
form's "sent" confirmation survives a close. Native `<details>` was rejected because its open state is
awkward to assert in RTL and the summary cannot hold a separate labelled button. The forms keep their
own `h3` and description; the row only adds the label and current value above them.

`AccountSection` then renders: for a password account, an address `AccountRow` wrapping
`ChangeEmailSection` and a password `AccountRow` (value `••••••••`) wrapping `ChangePasswordSection`;
for a Google-only account, a plain address row plus the `googleManaged` note. The sign-in methods chips
stay as the last row.

### Headings and copy

- `Profile.title` → "Your profile" / "Tu perfil" / "Seu perfil" becomes the `h1`; the eyebrow and intro
  stay.
- `Profile.sections.identity` → "Your card" / "Tu tarjeta" / "Seu cartão".
- `Profile.account.heading` → "Sign-in and security" / "Acceso y seguridad" / "Acesso e segurança".
- New `Profile.account.passwordLabel` ("Password" / "Contraseña" / "Senha").
- `AccountRow` is a reusable component, so its button copy lives in `Components.AccountRow.change`
  ("Change" / "Cambiar" / "Alterar") and `Components.AccountRow.close` ("Close" / "Cerrar" /
  "Fechar"). The button's accessible name adds the row's label ("Change Password") so the two rows'
  buttons are told apart by assistive technology.
- `Profile.progress.heading`, `videos` and `percent` are removed with the panel that used them.

### Danger panel

The delete `ProfileSection` gets a className that draws a rounded border in
`destructive/40` over a `destructive/5` ground with inner padding, replacing the current
`[&>div>h2]:text-base` quietening. `DeleteAccountSection` and its dialog are untouched.

## Risks / Trade-offs

- [The `h1` no longer proves whose card it is] → the account-deletion e2e now checks the card's name
  instead of the heading.
- [Sticky column taller than the viewport on short laptop screens] → the column holds only the card,
  two stubs and the save bar (~560px); at `lg` heights under that it simply scrolls with the page because
  sticky never pins content taller than its scrollport.
- [Forms hidden behind a click] → rows show the current value and a clear "Change" control; e2e opens
  them the way a learner would.

## Testing strategy

- **Vitest + RTL (component)**, colocated, mirroring the existing files:
  - `account-row/account-row.test.tsx` (new): starts collapsed with `aria-expanded="false"` and the
    region hidden; clicking Change expands; closing keeps typed input; label/value render.
  - `account-section/account-section.test.tsx`: password account renders two collapsed rows with the
    address and masked password; forms appear after opening; Google-only renders no row buttons and
    no forms.
  - `learner-card/learner-card.test.tsx`: no bar by default; `showProgressBar` renders a bar at the
    completed share.
  - `profile-card-band/profile-card-band.test.tsx`: no ring; card bar present; stubs keep zero state
    before hydration and show counts after.
  - `profile-save-bar/profile-save-bar.test.tsx`: unchanged behavior; asserts it is a single bar
    (one Save button) — placement classes are CSS and covered in e2e.
  - `profile-view/profile-view.test.tsx`: `h1` is "Your profile" and stays while the name is edited;
    level-2 headings order; card previews edits.
- **Playwright (e2e)**: update `account-identity.spec.ts` to open the password/address row before
  filling; update `account-deletion.spec.ts` to assert the card's name instead of the `h1`; add one
  wide-viewport check that the save bar sits in the card column (not `position: fixed`) and one
  narrow-viewport check that it is docked.
- **Storybook**: update `ProfileView`, `ProfileCardBand`, `AccountSection`, `LearnerCard` stories and
  add `AccountRow` stories; verify visually with Playwright MCP in light and dark, desktop and phone.
