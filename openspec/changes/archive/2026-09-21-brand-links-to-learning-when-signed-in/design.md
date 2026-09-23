## Context

`Brand` (`src/components/brand/brand.tsx`) already takes an `href` prop that defaults to `"/"` and
renders through the locale-aware `Link` from `@/i18n/navigation`, so the locale prefix is handled for
it. The only caller, `SiteHeader`, renders `<Brand />` bare and therefore always gets the locale
home.

`SiteHeader` already receives `signedIn: boolean`, decided on the server by the locale layout from
the request's session, and uses it to choose between the **Sign in** link and the learner's menu.
That flag is the one piece of state this change needs; nothing new has to be plumbed.

There is a second, weaker signal in the header: `useLearnerProfile()`, the device-stored learner
card. It resolves after hydration and can be `absent` for a learner who signed in but never made a
card — `SessionControl` handles exactly that case with a bare Sign out.

## Goals / Non-Goals

**Goals:**

- The wordmark lands a signed-in learner on `/[locale]/learning` and a visitor on `/[locale]`.
- The destination is right on the server's first paint, with no post-hydration swap.
- The locale prefix keeps coming from `@/i18n/navigation`, not from string concatenation.

**Non-Goals:**

- Redirecting the home route itself for a signed-in learner.
- Touching the avatar menu, the hero's primary action, or the sign-out destination.
- Making `Brand` session-aware on its own.

## Decisions

**The destination follows `signedIn`, not the learner profile.**

`signedIn` is server-decided and present in the first HTML, so the wordmark's `href` is correct
before hydration and never changes under the learner's cursor. `useLearnerProfile()` would be wrong
twice: it is `unknown` during SSR, which would make the wordmark point home and then silently
re-point, and it is `absent` for a signed-in learner with no card — who does have a My learning page
to go to. Using the same flag as `SessionControl` also means the wordmark and the account control
can never disagree about whether there is a session, which is what the spec now requires.

*Alternative considered:* have `Brand` read the session itself (`authClient.useSession()`). Rejected
— it turns a presentational component into a client data-fetcher, gives it a loading state it has no
way to render, and duplicates a decision the layout has already made on the server.

**`Brand` keeps its `"/"` default and stays presentational.**

`SiteHeader` passes the destination down. `Brand` is already used with a custom `href` in its own
tests, and keeping the default means no other caller has to change. The JSDoc on `Brand` says "Links
home (locale-aware)" — that sentence becomes wrong for the header's use and is updated to say the
destination is the caller's choice, defaulting to the locale home.

*Alternative considered:* a `signedIn` prop on `Brand` that picks the destination internally.
Rejected — it puts a session concept in a wordmark and gives the component two ways to say the same
thing (`href` and `signedIn`) that can contradict each other.

**The `href` is the literal `"/learning"`, resolved by the navigation wrapper.**

`Link` from `@/i18n/navigation` prefixes the active locale, so `"/learning"` renders as `/es/learning`
under `es`. `Brand` currently casts `href as never` to satisfy next-intl's typed-route signature;
that cast is the existing shape and is left alone rather than widened as a drive-by.

## Testing strategy

| Behavior | Layer | Where |
| --- | --- | --- |
| Wordmark href is `/learning` with a session | Vitest + RTL component | `src/components/site-header/site-header.test.tsx` |
| Wordmark href is `/` without a session | Vitest + RTL component | `src/components/site-header/site-header.test.tsx` |
| Wordmark href is `/learning` with a session but no learner card | Vitest + RTL component | `src/components/site-header/site-header.test.tsx` |
| `Brand` honours a passed `href`, defaults to `/` | Vitest + RTL component (already covered) | `src/components/brand/brand.test.tsx` |

The header test file already mocks `@/i18n/navigation`'s `Link` as a plain `<a>` that keeps its
`href`, and already renders `<SiteHeader signedIn />` and `<SiteHeader />` in separate blocks — the
new tests mirror that setup and assert on
`screen.getByRole("link", { name: /english.*course/i })`, the same query `brand.test.tsx` uses.

No Playwright test is added: the locale prefix is the only part a browser would prove that RTL
cannot, and it comes from `@/i18n/navigation`, which is covered where it is defined. The existing
`SignedOut` and `SignedInWithoutCard` stories already render both states for visual review, so no new
story is needed.

## Risks / Trade-offs

- **A learner signs in on the home page and the wordmark silently changes destination under them** →
  That is the intended behaviour, and the page re-renders from the server on sign-in anyway, so the
  change arrives with the rest of the signed-in chrome rather than on its own.
- **A signed-in learner who wants the marketing home has no header link to it** → Accepted; the home
  is still reachable by URL, and it holds nothing a signed-in learner needs. The proposal's non-goals
  record this deliberately.
- **`signedIn` is optimistic in the proxy but authoritative in the layout** → The layout's flag is
  the verified one, and a wrong guess costs at most one redirect from `/learning` back to sign-in,
  which is the existing behaviour of every personal route.
