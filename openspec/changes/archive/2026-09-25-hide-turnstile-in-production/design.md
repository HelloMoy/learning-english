## Context

`TurnstileChallenge` (`src/components/turnstile-challenge/turnstile-challenge.tsx`) renders
`@marsidev/react-turnstile` with `size: "flexible"` and the default appearance (`"always"`),
inside a labelled group with `min-h-[65px]` so the form doesn't jump when the widget
loads. The Cloudflare widget is in **Managed** mode (`DEPLOYMENT.md` step 4).

Cloudflare offers three appearances: `always`, `execute` and `interaction-only`. With
`interaction-only` in Managed mode, a visitor Cloudflare passes silently never sees the
widget; a flagged visitor sees the checkbox. The library already handles the sizing: for
`interaction-only` it sets the container height to `auto` instead of the flexible 65px, so
the widget collapses while hidden.

## Goals / Non-Goals

**Goals:**

- No Turnstile box and no empty gap on the account forms in production builds for visitors
  Cloudflare passes silently.
- The box stays visible, in its reserved space, on the development server.

**Non-Goals:**

- Dashboard mode changes, Invisible mode, server verification, keys (see proposal).

## Decisions

### Decide the appearance from `process.env.NODE_ENV`

`NODE_ENV === "development"` → `appearance: "always"` and keep `min-h-[65px]`. Any other
value → `appearance: "interaction-only"` and no minimum height.

Next.js inlines `NODE_ENV` into the client bundle at build time, so the check costs nothing
at runtime and can't drift between server and client render. It matches how the codebase
already tells the environments apart (`server-env.ts`, `visible-course-manifests.ts`).

Alternatives considered:

- **Detect Cloudflare's test site key** (`1x00000000000000000000AA`). This ties the
  appearance to the key rather than the environment. A developer testing a real key
  locally would lose the box, and the rule would read as a key-format trick. Rejected.
- **A `NEXT_PUBLIC_TURNSTILE_APPEARANCE` variable.** One more variable to set in three
  environments and document in `DEPLOYMENT.md`, for a choice that has only two values
  and maps exactly onto development versus not. Rejected.
- **Invisible mode in the Cloudflare dashboard.** No code change, but it leaves the 65px
  gap, removes the checkbox fallback for flagged visitors, and requires the Turnstile
  Privacy Addendum in the privacy policy. Rejected.

### Keep the labelled group in every build

The `role="group"` wrapper stays, with its name, in production too. When a flagged visitor
gets the checkbox, assistive technology still needs to name it.

### Take the hidden widget out of the layout, not just its height

A hidden widget still leaves DOM behind: Cloudflare keeps a container, two `div`s and the
token `input`, all 0px tall, so `:empty` can't hide the group. A 0px-tall element in a
flex column still costs one `gap` (measured: 16px between "Forgot your password?" and the
button). So while hidden, the group is `absolute`: it stays mounted, and Cloudflare keeps
running in it, but it's not a flex item and costs no gap anywhere.

The group comes back into the flow when Cloudflare surfaces the widget. Turnstile calls
`before-interactive-callback` before it shows the checkbox, and the widget can also show
itself to report an error or an unsupported browser, so all three callbacks put the group
back into the flow. It stays in the flow after that: a widget that has shown itself once
may show again, and a layout that moves twice is worse than one that stays put.

Alternatives considered:

- **A negative top margin equal to the parent's gap.** It couples the widget to whatever
  gap each form uses. Rejected.
- **`display: none` while hidden.** Cloudflare's docs don't promise the challenge runs in
  a container with no box. Rejected; `absolute` keeps a box.

### Move the challenge to the end of each form, in a component of its own

The user wants the challenge, when it shows, below "Continue with Google" and above the
footer links, not between "Forgot your password?" and the submit button. Today it lives
inside `AccountSubmitArea`, next to the button, so it has to leave that component:

- `AccountSubmitArea` drops the challenge and its `challenged` prop. It keeps the error and
  the button.
- A new `AccountChallenge` renders the challenge the way every account form needs it: in
  `AccountWait.Paused`, keyed by `submission.challengeKey`, with `submission.onToken`. Three
  forms place it, so it's a component rather than three copies.
- `SignInForm` and `SignUpForm` place it after the Google block. `ForgotPasswordForm`,
  which has no Google button, places it after `AccountSubmitArea`.

`AccountWait.Paused` wraps its children in a `div`, which would be the flex item and put
the gap back. `AccountChallenge` passes it `className="contents"`: the `div` makes no box,
so the group is the flex item. `inert` still reaches the widget, since it works on the DOM
subtree, not on boxes. The dimming does not, because opacity needs a box. Losing the
dimming on a widget that's normally hidden is acceptable.

The `role="group"` isn't on the `contents` element, so the known accessibility bugs with
`display: contents` on elements that have roles don't apply.

### The check lives in the component, not in a hook or lib

It's one comparison used in one place. Per the project's folder rule, a helper used once
stays in its caller's file.

## Risks / Trade-offs

- [A flagged visitor's form grows by ~65px when the checkbox appears] → Accepted: it
  happens only to visitors Cloudflare flags, and the alternative is a permanent gap for
  everyone.
- [A flagged visitor's checkbox appears under "Continue with Google", away from the
  disabled submit button] → Accepted by the user: the card is short, so the checkbox is
  still in view, and it only happens to visitors Cloudflare flags.
- [While the form is waiting, a visible widget isn't dimmed] → The widget is still inert.
  It's only visible on the development server or for a flagged visitor.
- [An empty labelled group sits in the accessibility tree while the widget is hidden] →
  Minor. The name "Security check" is accurate, and the group is needed for the moment the
  checkbox appears.
- [The e2e suite runs a production build, so it no longer shows the widget] → The suite
  waits for the submit button to be enabled (the token arrived), not for the widget. The
  always-pass test key never requires interaction, so the token still arrives.
- [The `develop` preview also hides the widget] → Intended: it's a production build and
  should look like production.

## Migration Plan

Ship as a normal deploy. Rollback is Vercel's instant rollback; nothing is stored.

## Testing strategy

- **Vitest component + RTL**: extend
  `src/components/turnstile-challenge/turnstile-challenge.test.tsx`. It already mocks
  `@marsidev/react-turnstile` and captures the props in `lastProps`. The new tests stub
  `NODE_ENV` with `vi.stubEnv` (mirroring the existing `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
  stub):
  - `NODE_ENV="production"` → `options.appearance` is `"interaction-only"`, and the group
    reserves no minimum height.
  - `NODE_ENV="development"` → `options.appearance` is `"always"`, and the group keeps
    `min-h-[65px]`.
- **Vitest component + RTL** for the new layout:
  - `turnstile-challenge.test.tsx`: in production the group is `absolute`, and it becomes
    a normal flex item once the mocked widget fires `onBeforeInteractive`, `onError` or
    `onUnsupported`. On the development server it's never `absolute`.
  - `account-challenge.test.tsx` (new, mirroring `account-submit-area.test.tsx`, including
    its `@/test-setup/stubs/turnstile-challenge` stub): the token reaches `submission.onToken`.
    A new `challengeKey` remounts the challenge.
  - `account-submit-area.test.tsx`: the challenge tests move out; the rest lose `challenged`.
  - `sign-in-form.test.tsx`, `sign-up-form.test.tsx`: the challenge follows "Continue with
    Google" in document order. `forgot-password-form.test.tsx`: it follows the submit button.
- **Playwright e2e**: no new spec. `e2e/learner-account.spec.ts` already signs in, signs up
  and requests a reset through the real widget on a production build. Running it proves the
  hidden widget still hands over a token.
- **Visual check**: Playwright MCP against a production build (`pnpm build && pnpm start`)
  to confirm no box and no gap, and against `pnpm dev` to confirm the box shows under
  "Continue with Google". Measure the Google → footer spacing: it must equal the card's
  gap.
