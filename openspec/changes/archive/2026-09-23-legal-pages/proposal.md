## Why

Google Cloud refuses to publish the OAuth client — to move it from "Testing" to production — until the consent screen names a public privacy policy on the authorized domain. The app has no legal pages at all: no `/privacy`, no `/terms`, no footer, not one message key. Until those exist, the consent screen stays in Testing, where only accounts added by hand can sign in.

The timing is what makes this its own change rather than part of the auth release. The authentication work sits on `develop`, thirty commits ahead of the deployed `main`. If the legal pages rode along with it, the privacy URL would only go live at the moment the sign-in button also goes live — leaving a window in which a real visitor meets a Google button that cannot work, because the consent screen is still in Testing and can only be published once Google can fetch the URL. Shipping the pages from `main` first breaks that circle: the URL goes live on a deployment that has no login at all, the consent screen is published while nobody can sign in yet, and the auth release later lands on a domain where Google is already waiting.

The deeper reason is the one Google is enforcing anyway: the service creates accounts, stores an address, a display name and a learning history, and hands data to four third parties, and none of it is written down where a learner can read it.

## What Changes

- Two new public routes under `[locale]`: `/privacy` and `/terms`, rendered in `en`, `es` and `pt`.
- A site footer, linking both, added once in the locale layout so every page carries it.
- The privacy text describes the service as the upcoming release runs it, not as the current deployment does: Better Auth accounts (email and password with verification before first sign-in, Google with account linking by verified address), progress and rewards rows in Turso, transactional mail through Resend's relay, Cloudflare Turnstile on the three form endpoints, and Sentry error reports with addresses and message bodies stripped. See the design for why the text describes a release that has not shipped.
- Built on `main` and merged to `main`, so it deploys on its own ahead of the authentication release.

## Capabilities

### New Capabilities

- `legal-pages`: the public privacy and terms routes, the subjects their text is required to cover, their metadata, and the footer that makes them reachable from every page.

### Modified Capabilities

None. Listing the two routes in the sitemap is deliberately **not** part of this change: `src/app/sitemap.ts` is the one file whose implementation differs structurally between `main` and `develop` — `main` walks the catalog and lists every lesson, `develop` lists only the home — so editing it here would guarantee a merge conflict for no benefit Google requires. The sitemap entries follow as their own change on `develop`, where the `search-discoverability` requirement they modify actually reads the way the delta would describe.

## Impact

- **New**: `src/app/[locale]/privacy/page.tsx`, `src/app/[locale]/terms/page.tsx`, `src/components/legal-document/legal-document.tsx`, `src/components/site-footer/site-footer.tsx` (+ stories, tests, JSDoc per AGENTS.md).
- **Modified**: `src/app/[locale]/layout.tsx` (mount the footer — the insertion point is byte-identical on both branches, so the later merge is clean), `src/messages/{en,es,pt}.json` (new `Legal` and `Components.SiteFooter` namespaces).
- **Untouched**: `src/app/sitemap.ts`, the database, the domain, every adapter. `main` has no `server-env` and no `vercel-build`, so this deploy needs no environment variable and runs no migration.
- **Unblocks**: publishing the Google OAuth consent screen, which in turn unblocks Google sign-in for every learner who is not the project owner.

## Non-goals

- **Legal review.** The text is drafted from what the code demonstrably does and is not legal advice. It needs a human — ideally one who knows the obligations that apply to the audience — to read it before launch. This change delivers accurate, specific prose and the pages that carry it, not a vetted legal instrument.
- **Listing the routes in the sitemap.** Deferred to `develop`, for the reason given above.
- **A cookie consent banner.** The app sets one functional cookie (`NEXT_LOCALE`) and, after the auth release, a session cookie, and runs no analytics or advertising trackers. Nothing here adds consent machinery.
- **A DPA, subprocessor page, or data-export and deletion tooling.** Account deletion ships with the auth release; documenting a formal subject-access process does not.
- **Retrofitting the footer with navigation, social links or a newsletter.** It carries the two legal links and nothing else.
