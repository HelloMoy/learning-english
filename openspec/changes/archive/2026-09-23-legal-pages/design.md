## Context

Production runs `main`, which predates authentication entirely: no sign-in, no database, no `server-env`, and a `build` script that is plain `next build`. Every feature since — Better Auth, Turso, Resend, Turnstile, Sentry — sits on `develop`, thirty commits ahead and not yet merged.

The app has a `SiteHeader` mounted in `src/app/[locale]/layout.tsx` and no footer. Legal prose is the first long-form UI copy the project has had: every other string is a short label in `src/messages/<locale>.json`, guarded by `src/messages/messages.test.ts`, while long-form *content* — lesson notes — takes a different path entirely, markdown on disk rendered with `react-markdown`. This change has to pick which of those two shapes legal text belongs to, which is one of the two reasons this document exists. The other is the branch choice.

The immediate consumer is not a learner but Google's OAuth console, which requires a privacy-policy URL on the authorized domain before the consent screen can leave Testing.

## Goals / Non-Goals

**Goals:**

- Two public, session-free routes per locale, reachable by URL alone, live in production ahead of the authentication release.
- Legal copy a reader can check against the running system, kept in the same translation pipeline as the rest of the UI.
- A footer that makes both reachable from anywhere, without becoming a navigation surface.
- A change that merges into `develop` cleanly, since `develop` is where the product continues.

**Non-Goals:**

- A markdown authoring pipeline for UI copy.
- Sitemap entries (deferred to `develop`), cookie-consent machinery, a subprocessor page, or subject-access tooling.
- Any change to the database, the domain, or an adapter.

## Decisions

### Build on `main`, not on `develop`

**Chosen:** branch from `main`, merge to `main`, deploy on its own.

**Alternative rejected:** build on `develop` and let the pages ship with the authentication release.

The rejected option has a circular dependency that only shows up at launch. Google cannot publish the consent screen until it can fetch the privacy URL; the URL is not live until the release deploys; and the release is precisely what puts a Google sign-in button in front of visitors. Ship them together and there is a window — however short — in which a real visitor meets a button that fails, because the screen is still in Testing. Shipping from `main` first removes the window rather than shortening it: the URL goes live on a deployment where no login exists at all, the screen is published against a quiet site, and the auth release later lands on a domain Google has already approved.

The cost is one branch's worth of divergence, and it is smaller than it looks. `main` has `messages.test.ts`, `@/i18n/navigation`, `routing` and the same component conventions, so nothing has to be built twice. The footer's insertion point — `<div className="flex-1">{children}</div>` inside the locale layout — is byte-identical on both branches, so `layout.tsx` merges without a conflict. The message files gain a new top-level namespace rather than editing an existing one.

### `sitemap.ts` stays untouched

It is the one file that differs structurally rather than incidentally: on `main` it walks the catalog and emits an entry per course, module and lesson; on `develop` it emits the home and nothing else, because those routes now require a session. Adding legal paths on `main` would produce a real conflict when `main` merges into `develop`, and Google requires nothing from the sitemap. The entries follow as their own small change on `develop`, where the `search-discoverability` requirement they modify reads the way a delta would need to describe it.

### The text describes the service as the next release runs it

The privacy policy names Turso, Resend, Turnstile and Sentry — none of which the deployment carrying this page actually uses, because `main` has no authentication.

This is deliberate. The alternative is to publish a policy saying the service collects nothing, then rewrite it days later at the exact moment learners start creating accounts, which is the worst possible time to be editing a privacy policy and leaves two versions in the wild. Describing the imminent service instead over-discloses for a few days: during that window nobody can create an account, so no data of the kind described is collected. Over-disclosure is the safe direction of error, and the last-updated date tells a reader which version they are reading.

### Legal text lives in `src/messages/<locale>.json`, not in markdown files

**Chosen:** a `Legal` namespace with a fixed, statically-known set of section keys per document — `Legal.privacy.sections.accounts.heading` / `.body`, and so on.

**Alternative rejected:** per-locale markdown files rendered with `react-markdown`, already a dependency and already rendering lesson notes.

Markdown is tempting because legal prose is long and JSON strings are an awkward place for paragraphs. It is wrong here for three reasons. First, AGENTS.md makes next-intl non-negotiable for UI strings, and this is UI copy, not course content — the markdown path exists for assets under the content tree, which these are not. Second, `messages.test.ts` guarantees the three locales stay in step; a directory of markdown files has no such guard, and the realistic failure is a privacy policy that silently stays English in `pt`. Third, Storybook's locale toolbar drives `NextIntlClientProvider`, so a markdown-backed page could not be reviewed in three locales the way every other component is.

The cost is real and accepted: the message files grow substantially, and editing a paragraph means editing JSON.

### One presentational component, two thin routes

`src/components/legal-document/legal-document.tsx` takes a title, a last-updated date and an ordered list of `{ heading, body }` sections, and renders the document shell. The two `page.tsx` files resolve their own namespace and metadata and hand the sections over.

The alternative — two self-contained pages — duplicates the same heading hierarchy, prose width and spacing, and the duplication would drift. Keeping the route files thin also keeps them inside the AGENTS.md exemption for plain `src/app/` pages that need no JSDoc, while the shared component carries the stories, tests and JSDoc a reusable component owes.

Sections are declared as a literal tuple at module scope rather than derived at runtime, so a missing key is a type error and not an empty `<section>`.

Those tuples, the `LegalSection` shape and the small builder that resolves them live in `src/lib/legal-sections/`, not in the component: three call sites need them — both routes and the story — and putting the data model in `lib` keeps the component depending on a type rather than the other way round. `messages.test.ts` reads the same tuples, so a key with no translation fails a test instead of rendering an empty passage.

### The footer is a server component mounted once in the locale layout

It renders after the `flex-1` wrapper around `children`, so the existing `flex min-h-full flex-col` on `<body>` pushes it to the bottom on short pages with no extra CSS. It is a `<footer>` element — the `contentinfo` landmark — and sits outside `main`, so screen-reader users can skip to it rather than land in it.

No `"use client"`: it renders two links and a line of text. `SiteHeader` is a client component only because it reads the pathname. Links come from `@/i18n/navigation`, never `next/link`; the locale prefix depends on it.

### The last-updated date is a constant, not `new Date()`

A single exported `LEGAL_LAST_UPDATED` ISO date, formatted through next-intl's `format.dateTime`. AGENTS.md forbids `new Date()` in Server Components because it breaks static rendering, and the correct value here is *when the text changed*, which is editorial and belongs in the source anyway. Updating the prose means updating the constant, and a test asserts the date renders through the formatter rather than as an interpolated string.

## Risks / Trade-offs

- **The prose is drafted from reading the code, not by a lawyer** → The spec constrains it to describe only processing the code performs, which keeps it accurate; accurate is not the same as sufficient. Flagged as a non-goal and surfaced to the project owner before launch.
- **The policy describes processing the deployment carrying it does not perform** → Over-disclosure for a few days, during which no account can be created. Justified above; the alternative is rewriting the policy on launch day.
- **Three locales of legal text is three times the surface for drift** → `messages.test.ts` already fails on key mismatch, catching a missing section. It cannot catch a stale translation of an updated paragraph; `LEGAL_LAST_UPDATED` at least makes a stale document visible to a reader.
- **`main` and `develop` diverge further while this is in flight** → Confined to new files plus one line in `layout.tsx` at an insertion point that is identical on both branches. Verified, not assumed.
- **Google may demand fields beyond these two pages** → The branding form also wants an app homepage, which already exists. If the console asks for more after these ship, that is a console setting, not more app work.

## Migration Plan

No data migration, no schema change, no new environment variable — `main` has neither `server-env` nor `vercel-build`, so the deploy is a plain `next build`. The routes are additive: before the deploy they 404 through the existing `[...notFound]` catch-all; after it they render. Rollback is an ordinary Vercel Instant Rollback.

Order matters across the wider rollout, and only in one direction: **publish the Google consent screen after this deploy is live**, because Google must be able to fetch the URL. Everything else — the auth release, the remaining service configuration — follows independently.

After this merges to `main`, merge `main` into `develop` so the two do not drift, then add the sitemap entries there as their own change.

## Testing strategy

Red before green on every task, per AGENTS.md.

| Behavior | Layer | Mirrors |
| --- | --- | --- |
| Footer renders both links and both labels per locale, as `contentinfo` | Vitest + RTL component | `src/components/site-header/site-header.test.ts`, `src/components/brand/brand.test.tsx` |
| Footer links carry the locale **prefix** | Playwright e2e | next-intl resolves the prefix from the router context, which jsdom has no equivalent of — every locale-aware `Link` renders its bare href under Vitest, as `Brand` asserting `/` already showed. Only a real browser can check this. |
| `LegalDocument` renders every section, correct heading levels, date through the formatter | Vitest + RTL component | an existing component test with translated copy |
| The three locale files carry identical `Legal.*` keys | Vitest unit | `src/messages/messages.test.ts` — verify whether it walks the tree generically; extend only if it allowlists namespaces |
| Both routes render signed out, in every locale; footer navigation reaches them | Playwright e2e | `e2e/not-found-routes.spec.ts`, `e2e/one-click-navigation.spec.ts` |
| Story renders in `en`, `es`, `pt` via the toolbar | Storybook | per `storybook-story-writing`; never mock `next-intl` |

Component behavior is Vitest + RTL, not Playwright. The e2e suite covers only what needs a real browser and a real server: that an anonymous request to `/es/privacy` returns the page, which is exactly the property Google's fetcher depends on.

## Constraints discovered while implementing

`generate-metadata-locale-guard.test.ts` discovers every route under `[locale]` that exports `generateMetadata` **from disk**, so both new routes were covered the moment they existed — and both failed it until they called `requireSupportedLocale(locale)`. Without that call a request to `/manifest.json`, which the proxy matcher excludes, reaches the metadata builder with `manifest.json` as its locale. Any route added here inherits the same obligation.

## Open Questions

- **Does `messages.test.ts` enforce parity structurally or against a fixed namespace list?** Determines whether the locale-parity guard is free or needs extending. Resolve by reading it in the first task, before writing any message keys.
- **Does the terms text need a governing-law and jurisdiction clause to be worth publishing?** A terms page with no jurisdiction is close to decorative. The owner decides; the page ships either way, since Google's blocker is the privacy URL.
