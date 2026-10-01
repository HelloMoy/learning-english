## Context

`src/app/[locale]/not-found.tsx` renders the localized Page Not Found for every unknown path under a supported locale. The catch-all `[...notFound]/page.tsx` calls `notFound()` to reach it, and `missingPage` in the proxy decides the 404 status before streaming. The page is a synchronous Server Component that reads the `PageNotFound` namespace through `useTranslations`.

Its markup predates the Immersion Cinema theme: a centred `max-w-3xl` card with `slate-*` borders and text and an outline link. The chosen design ("Sobria", from the 404 variants exploration) keeps the same three pieces of copy and re-dresses them with the site's tokens, adds an eyebrow, names the requested path, and adds a second action.

Constraints that shape the design:

- A Server Component cannot read the requested pathname. `usePathname` is a client hook.
- `/courses` is a personal route: `sessionGate` redirects a visitor without a session to sign-in, with the return path preserved.
- `currentLearnerSnapshot()` is not memoized per request; the layout already calls it once.
- The page sits inside the locale layout, which renders `SkipLink` (target `#main`), `CinemaBackground` and `SiteHeader` around it.

## Goals / Non-Goals

**Goals:**

- The page reads as part of the site in both theme variants, on desktop and phone.
- A learner sees which address failed.
- Two ways out: home (primary) and the course lobby (secondary), both in the active locale.
- The page stays static: no session read, no data fetching.

**Non-Goals:**

- Restyling the lesson route's not-found.
- Session-aware actions or a "next up" bar.
- Suggesting a nearby route.
- Extracting a shared primary/secondary link-button primitive (see Decisions).

## Decisions

### The page stays a Server Component; only the path line is a client leaf

The requested path needs `usePathname`, so something must be a Client Component. Making the whole page one would work, but the page is otherwise static markup and the rest of the tree follows server-by-default. The path line becomes a small client component and the page stays as it is.

It lives at `src/app/[locale]/missing-path.tsx`, next to the page that is its only caller — the precedent is `courses/require-learner-profile.tsx`, a route-private client component colocated with its route and tested there. It is not a reusable component, so it does not go under `src/components/` and gets no story; it does get a colocated test and JSDoc.

*Alternative considered:* pass the path from the server via `headers()`. Rejected: it relies on a header the proxy would have to set, and makes the page dynamic for one line of text.

### The path is built from the active locale and the locale-less pathname

`usePathname` from `@/i18n/navigation` returns the path without the locale prefix; `useLocale` gives the prefix. The line shows `/${locale}${pathname}`, which is the address in the browser. Both hooks resolve the same on the server and the client — the proxy's 404 is a rewrite to the same URL — so there is nothing to mismatch at hydration.

### The path is shown encoded, and clamped

The path is rendered as React text, so markup in it is inert. It is deliberately not passed through `decodeURIComponent`: a 404 page that echoes decoded text lets anyone craft a link that prints a readable sentence on the site. Encoded, the same link reads as `%20`-studded noise. The cost is that an accented path shows its escapes; that is the lesser problem.

Length is handled in CSS (`break-all` + `line-clamp-2`), not by truncating the string, so there is no truncation logic to test and no arbitrary character budget.

### The sentence is one rich message, not a prefix plus a path

`PageNotFound.missingPath` is `"There's nothing at <requested>{path}</requested>"`, rendered with `t.rich`. Word order around the path differs by language, so concatenating a translated prefix with the path would bake English order into the markup. The tag is not named `path` because the tag and the argument share one values object.

### "View courses" is offered to everyone and reads no session

The link goes to `/courses`. A signed-out visitor is sent through sign-in and back, exactly as with every other personal link.

*Alternative considered:* show it only with a session. That needs either a second `currentLearnerSnapshot()` call (a duplicate auth lookup and database read on every 404) or a session prop threaded from the layout, which `not-found.tsx` cannot receive. Rejected as disproportionate for a secondary link; the home link already serves signed-out visitors with the catalog.

### Action styles are written in place

The filled and outlined link styles match the ones `CoursePoster` and `NextUpBar` already carry as local constants. Those two were left duplicated by their own changes; this page is a third user. Extracting a shared primitive is a refactor across three features with its own stories and tests, so it is left for a change of its own rather than smuggled into a restyle. The classes here follow `CoursePoster`'s `PRIMARY_ACTION` / `SECONDARY_ACTION`, with `NextUpBar`'s `px-5` and without `flex-1` above the phone breakpoint.

### Layout and type follow existing pages

- `main` takes the home page's container: `mx-auto w-full max-w-7xl px-4 py-12 sm:px-11 sm:py-20`, with `id="main"`. The home's `flex-1` is left out: this `main` has no flex parent for it to act on.
- The eyebrow is the existing `Eyebrow` component.
- The heading uses the site's page-title treatment (`AvailableCoursesView`): `text-[2rem] leading-[1.02] font-black tracking-[-0.035em] text-balance sm:text-5xl`.
- The description is `text-muted-foreground`, capped near 34rem.
- The path line is `font-mono text-[0.8125rem] text-muted-foreground`, with the path itself in `text-foreground`.
- On a phone both actions share the row's width; from `sm` up they hug their labels.

The `section role="alert"` keeps wrapping the whole state, as today.

## Testing strategy

| Behaviour | Layer | Where |
| --- | --- | --- |
| Eyebrow, heading, description, home link `/`, courses link `/courses`, `main` has id `main`, `alert` region, no `slate-` classes | Vitest component + RTL | `src/app/[locale]/not-found.test.tsx` (extends the existing file; keeps its `useTranslations` mock pattern) |
| New keys exist and read sensibly in en/es/pt | Vitest component + RTL | same file, the existing `test.each` over the real catalogues |
| Path line = locale + pathname; encoded path stays encoded; reads the `PageNotFound` namespace | Vitest component + RTL | `src/app/[locale]/missing-path.test.tsx` (new; mocks `usePathname` the way `site-header.test.tsx` does) |
| The real URL is named on the page and stays encoded; a very long path on a phone neither widens the page nor buries the actions; "Ver cursos" lands on `/es/courses`; home link unchanged | Playwright e2e | `e2e/not-found-routes.spec.ts` (extends the existing describe) |
| Light/dark, desktop/phone, long-path wrap, no hydration warning | Manual visual check with Playwright MCP | recorded in tasks |

The page test replaces `MissingPath` with a stub. The file already mocks `useTranslations` to return keys, which has no `rich` and no locale context, so the real child cannot render there; its own test runs it against the real catalogues, and the e2e test covers the two together.

## Risks / Trade-offs

- [A signed-out visitor who clicks "View courses" meets the sign-in page] → Accepted and documented above; they are returned to the lobby after signing in, and the primary action serves them directly.
- [An accented path shows percent-escapes] → Accepted in exchange for not echoing attacker-chosen text.
- [Duplicated link-button classes, now in three places] → Called out as a follow-up refactor rather than done here.
- [`usePathname` under the proxy's 404 rewrite could differ between server and client] → The rewrite targets the same URL; the e2e test asserts the rendered path and the visual check watches the console for hydration warnings.
