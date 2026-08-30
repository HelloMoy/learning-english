> **Revised during implementation** (see design.md §D2): the regression guard moved
> from Vitest/RTL to Playwright. next-intl's `Link` does not apply the locale prefix
> under jsdom — the prefix comes from the server render — so a component test for this
> defect passes identically before and after the fix. Group 1 is now the e2e case.

## 1. Pin the regression (e2e — the only layer that can go red)

- [x] 1.1 (TDD: test → test) In `e2e/lesson-page.spec.ts`, add a failing case: on the `/en/…` route for the existing `PRIMARY_LESSON` fixture, the link named after `PRIMARY_RESOURCE.title` has an `href` **exactly equal** to `PRIMARY_RESOURCE.url`. Derive the fixture from `seedContentResources` the way the file's existing cases do — no hardcoded paths — and follow its `WHEN … THEN` test naming.
- [x] 1.2 (TDD: test → test) In the same case, assert the link actually resolves: `page.request.get(href)` returns `200`. This is the assertion that encodes what the user reported; the href-equality assertion above only explains why it failed.
- [x] 1.3 (TDD: test → test) Extend the case to the "Lesson notes (source)" card, whose `readme.md` link flows through the same `ResourceItem`, and to one non-default locale (`/es/…`) so the fix is shown to be locale-independent.
- [x] 1.4 Run `pnpm test:e2e e2e/lesson-page.spec.ts --project=chromium` and confirm the new case **fails**, with the received `href` prefixed by `/en/` (and a `404` from the request assertion). Record the observed failure output. Do not proceed until red is confirmed — per `AGENTS.md`, no production code before a failing test.

## 2. Fix the anchor

- [x] 2.1 (TDD: test → impl) In `src/components/lesson-view/resource-item/resource-item.tsx`, replace the `Link` element with a plain `<a>` and delete the now-unused `import { Link } from "@/i18n/navigation"`. Keep `href={resource.url}`, `target="_blank"`, `rel="noopener noreferrer"`, the `className` string, the `Icon`, the title `<span>`, and the `sr-only` kind label byte-for-byte — this task changes the element and the import, nothing else.
- [x] 2.2 (TDD: test → impl) Add a short comment above the anchor recording why it is not the locale-aware `Link`: a `Resource.url` addresses content (an absolute URL, or a `public/` asset path that Next.js serves from the origin root), never an in-app route, so a `localePrefix: "always"` segment would 404. Match the file's existing JSDoc/comment voice.
- [x] 2.3 Re-run `pnpm test:e2e e2e/lesson-page.spec.ts --project=chromium` and confirm the new case is green — both the href equality and the `200`.

## 3. Component-layer coverage (explicitly not the regression guard)

- [x] 3.1 In `src/components/lesson-view/resource-item/resource-item.test.tsx`, add a case asserting a site-relative `public/` path reaches `href` unmodified — the branch of `urlOrRelativePath()` the existing `faker.internet.url()` fixture never exercises. Reuse `fixtureResource()` (override only `url`) and the file's existing `vi.mock("next-intl")` setup.
- [x] 3.2 Name the case for what it actually asserts (pass-through), **not** for locale behavior, and add a comment stating that jsdom cannot reproduce the locale prefix and naming the e2e case as the real guard — so no future reader mistakes it for one.
- [x] 3.3 Run `pnpm test:run src/components/lesson-view/resource-item` and confirm green.

## 4. Verify against the running app

- [x] 4.1 With the dev server running, fetch the "Fast /i/" lesson page (`/en/courses/advanced-intermediate-course/modules/2-advanced-vowel-pronunciation-in-american-english/lessons/a75c097f-9c0d-50ca-bc82-a6a11d023af7`) and confirm the markup contains `href="/local-filesystem-lesson/…fast-i-vowel-pronunciation-practice-see-sound.pdf"` and **no** occurrence of `href="/en/local-filesystem-lesson/`.
- [x] 4.2 `curl -o /dev/null -w '%{http_code}'` that exact rendered `href` against the dev server and confirm `200` (it returned `404` before the fix).

## 5. Full verification

- [x] 5.1 Run `pnpm test:run` and confirm the whole unit/component suite is green — in particular `resource-list`, `lesson-view`, and `module-overview`, which render `ResourceItem` transitively.
- [x] 5.2 Run `pnpm typecheck` and `pnpm lint` and confirm both pass — notably that no unused-import lint error remains from the removed `Link`.
- [x] 5.3 Run `pnpm format:check`, formatting the touched files with `pnpm format` if it reports drift. — no drift reported.
- [x] 5.4 Run the full `pnpm test:e2e e2e/lesson-page.spec.ts` (all three browser projects) and confirm no pre-existing case regressed.
