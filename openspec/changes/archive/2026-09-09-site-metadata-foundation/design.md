## Context

Four `generateMetadata` functions exist today — in `src/app/[locale]/layout.tsx`
and the course, module and lesson pages. Each returns `{ title }`, and the
layout adds a `description`. All four already resolve their data through the
domain use cases (`findCourseForView`, `findModuleForView`,
`findLessonForView`), each wrapped in React `cache` so `generateMetadata` and the
page body share one invocation. That plumbing is correct and stays; what changes
is the shape of the object those functions return.

Two existing pieces do more work than they look like they do:

- `src/messages/messages.test.ts` already asserts an **identical key set across
  every locale** for the whole catalogue, by flattening it to dot paths. A new
  `Metadata.*` namespace inherits that guard for free — a key added to `en.json`
  and forgotten in `pt.json` fails an existing test with no new code.
- `getPathname` is already exported from `src/i18n/navigation.ts`. It resolves a
  locale plus an href to a prefixed pathname straight from the routing config,
  which is exactly what `alternates.languages` needs.

The site has no brand assets: `public/` holds five unused `create-next-app`
SVGs and `src/app/favicon.ico` is the framework default.

## Goals / Non-Goals

**Goals:**

- One resolved origin, used everywhere an absolute URL is published, that is
  correct in production, in a Vercel preview, and locally.
- Every route kind — home, course, module, lesson — publishes metadata that
  describes *that* route, in the locale it is served in.
- All sharing copy exists in `en`, `es` and `pt` from the first commit.
- An icon set that reads as the brand at 16px and at 512px.
- No head tag that points at something which does not exist.

**Non-Goals:**

- The `next/og` images (`social-share-images`), `robots.ts`, `sitemap.ts` and
  JSON-LD (`search-discoverability`), a service worker, per-locale manifests,
  and Search Console tokens. Each is listed with its reason in the proposal.

## Decisions

### D1 — `siteUrl()` is a lib function with a Zod schema, not an inline constant

It lives at `src/lib/site-url/site-url.ts`, following the folder-per-entity rule.
It reads the four candidate variables in order and parses the winner with
`z.url()` (Zod v4's top-level form).

The failure mode this guards against is specific and silent: when `metadataBase`
is absent or wrong, Next emits `og:image` and `og:url` as **relative** paths.
Nothing throws, the page renders, the build passes, and every crawler drops the
image. So an unparseable `NEXT_PUBLIC_SITE_URL` throws with the variable name and
the offending value rather than falling through to the next candidate — falling
through would turn a typo into a production site advertising a preview origin.

*Alternative considered:* read `process.env` inline in the layout. Rejected — the
sitemap and the JSON-LD in `search-discoverability` need the same origin, and two
copies of a four-way fallback chain will drift.

### D2 — One `shareMetadata()` builder, called by all four routes

`src/lib/share-metadata/share-metadata.ts` takes the pieces a route knows — its
locale, its href, its title, its description, its image alt, and an optional
video duration — and returns a Next `Metadata` object with the canonical, the
alternates, the Open Graph block and the Twitter block already composed.

The alternative is four `generateMetadata` functions each assembling the same
eight-key object. That is where drift starts: the lesson page gains an
`og:locale:alternate` the module page never got, and nobody notices because no
page renders its own head tags visibly. Centralising it means the spec's
"every route publishes…" requirement has exactly one implementation to test.

The builder takes an options object, not six positional arguments — the project's
clean-code rule caps sensible argument counts well below that. It carries no
`siteUrl`: its URLs stay relative and Next absolutizes them against the layout's
`metadataBase`, so the origin has one home rather than one per route.

**Revised during implementation.** The plan was to build every path with
`getPathname` from `@/i18n/navigation`. It cannot be used: outside a Next
request, `next-intl/navigation` resolves to its react-client build, and
`getPathname` returns `"/"` for every input — verified in Vitest, where the raw
`createNavigation` import fails outright on a missing `next/navigation`. Relying
on it would leave the single function every canonical and every hreflang depends
on impossible to unit-test, and head tags are invisible in a running app, so an
untested builder is an unverified one.

The prefix is therefore applied directly (`/{locale}{href}`), while the locale
set and the default locale still come from `routing`. The coupling that
introduces — the rule is only correct while `localePrefix` is `"always"` — is
paid for with an explicit assertion on `routing.localePrefix` in the builder's
test, so changing that setting fails a test instead of silently shipping wrong
canonicals.

### D3 — Sharing copy lives in `Metadata.*`, deliberately apart from page copy

Page copy and share copy answer different questions. `HomePage.subtitle` is what
a learner reads on the page; the home's `og:description` is what someone who has
not clicked yet reads in a chat bubble. They can be the same sentence today and
diverge tomorrow without either being wrong, so they get separate keys.

Counts go through ICU plurals (`t.plural`), never `count + " lessons"` — the
project's i18n rule requires it, and Spanish and Portuguese need it.

The brand name is the one string that is not translated. It reads
`English Course` in all three files, matching what the wordmark renders after
`english-course-wordmark`. Duplicating it across three files rather than hard-coding
it once is deliberate: the message catalogue is where a translator looks, and a
brand name absent from it reads as an oversight rather than a decision. The
non-translation is stated in the spec so it survives review.

### D4 — `og:image` is omitted, not stubbed

The images arrive in the next change. Pointing `og:image` at a placeholder or a
not-yet-existing route means every share made in between renders a broken image
frame — worse than the text-only preview the site produces today, and cached by
the platforms for days.

`twitter:card` still declares `summary_large_image`: it describes the card shape
the site will use, costs nothing while there is no image, and avoids a second
edit next change.

### D5 — Icons are static files; the mark is the interpunct

The mark is the wordmark's gold middle dot on `#08080b`, framed by letterbox
bars. It is the only graphic element the brand already owns, and at 16px it
degrades to a gold dot on near-black — maximum contrast, no detail to lose. The
`E·C` monogram alternative was drawn and rejected: at 16px its three forms merge.

Next can generate raster icons from `icon.tsx` via `ImageResponse`, but
`favicon.ico` cannot be produced that way — it must be a real file in `src/app/`.
Since one binary is unavoidable, all of them ship as files: mixing generated and
static icons across one set makes the set harder to reason about than it is
worth. `icon.svg` is hand-authored; the rasters derive from it.

`apple-icon.png` gets an opaque background. iOS composites no transparency, and a
transparent Apple touch icon renders as a black square.

### D6 — `start_url` is `/en`, and the theme color is a `viewport` export

`localePrefix: "always"` means `/` only redirects. An installed app whose
`start_url` is `/` launches into a redirect on every cold start, so it is `/en`.

`themeColor` moved out of `metadata` in Next 14 and belongs to the separate
`viewport` export; putting it back in `metadata` is silently ignored. Two entries
are declared, keyed by `prefers-color-scheme`, because the app defaults to dark
and treats light as an opt-in.

### D7 — This is delivery-layer code, and stays out of the hexagon

`site-url` and `share-metadata` read environment variables and import from
`@/i18n/navigation`. Neither may live under `src/domain/**`, whose ESLint
boundary admits only `zod` and `neverthrow`. They sit in `src/lib/**`, are
called from the App Router, and consume the catalog through the same cached use
cases the pages already call — no adapter is added and no port changes.

## Risks / Trade-offs

- **`generateMetadata` doubles the work of a page render** → It does not: each
  route's use-case call is already wrapped in React `cache`, so metadata and body
  share one invocation. The new builder is pure string assembly over data that is
  already in hand.
- **A locale gains a key that another lacks** → Already caught by
  `messages.test.ts`'s existing key-parity assertion. No new guard is needed;
  the task list only has to avoid weakening it.
- **The 16px icon claim is asserted by eye, not by a test** → True, and not
  worth automating. It is checked once in a real browser tab at real size, and
  the decision is recorded in the spec so a future redesign has to argue with it.
- **`VERCEL_URL` gives previews their own origin, so preview shares point at the
  preview** → Intended. The alternative — previews advertising production URLs —
  makes a preview's own share previews untestable.
- **The rasters are checked-in binaries that no test can verify** → Accepted; an
  icon set is artwork. The maskable safe-zone claim is the one mechanical
  property, and it is verified visually against an 80% circular crop.

## Testing strategy

Red first on every task.

| Layer | File | Covers |
| --- | --- | --- |
| Vitest unit | `src/lib/site-url/site-url.test.ts` | Each precedence step in isolation; `PORT` honoured locally; a malformed `NEXT_PUBLIC_SITE_URL` throws naming the variable. Env is set and restored per test so the cases stay independent (F.I.R.S.T.). |
| Vitest unit | `src/lib/share-metadata/share-metadata.test.ts` | The builder is pure, so it is asserted directly: canonical for the given locale, three alternates plus `x-default`, `og:site_name` fixed to the brand, `og:locale` mapping (`en_US`/`es_ES`/`pt_BR`), `video.other` and a duration only when a duration is passed, and **no** `og:image`, `twitter:site` or `twitter:creator` keys present. Faker supplies titles and descriptions; locale codes and the brand are hardcoded, since the test is about those exact values. |
| Vitest unit | `src/messages/messages.test.ts` | Extended with an assertion that the brand name is byte-identical across the three catalogues — the existing key-parity test already covers the rest of the namespace. |
| Playwright e2e | `e2e/share-metadata.spec.ts` (new) | The real head, per route kind and per locale: canonical present and locale-correct, three `hreflang` alternates plus `x-default`, `og:title` differing between home / course / lesson, a video lesson carrying `og:type` `video.other` and its duration, the document title ending in `· English Course`, and `/manifest.webmanifest`, `/icon.svg` and `/favicon.ico` all returning 200 with the right content type. |
| Visual (Playwright) | — | The icon rendered at 16, 32, 180 and 512, and the 512 maskable under an 80% circular crop. Screenshots reviewed here, not handed back. |

`pnpm verify` must pass; e2e runs against a dev server on the port it actually
bound (3001 today), per the project's e2e notes.

## Open Questions

- **`pt_BR` or `pt_PT` for `og:locale`.** Assuming `pt_BR` from the audience the
  Spanish-language course content implies. Costs one string to change; not worth
  blocking on.
