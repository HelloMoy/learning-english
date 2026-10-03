## Why

On the published Storybook (https://docs.english-course.online/storybook/),
stories that show media render broken images and videos — for example
`LessonView/LessonView › No Resources` requests `/thumbnails/vowels.jpg` and
`/videos/vowels.mp4` and gets 404s. Stories name the app's public assets with
root-relative paths (`/videos/…`, `/thumbnails/…`, `/local-filesystem-lesson/…`),
which is right for the app and for Storybook run locally, both served at a
domain's root. On the portal, Storybook is served at `/storybook/`: the files
are in its build at `/storybook/videos/…`, but the browser asks the domain
root, where nothing is.

Making the paths relative is not an option — `next/image` rejects a `src`
that does not start with `/` — and GitHub Pages cannot rewrite URLs.

## What Changes

- The portal build mirrors the public asset folders that stories address —
  `videos/`, `thumbnails/` and `local-filesystem-lesson/` — from the Storybook
  build to the root of the site, so the paths stories use resolve on the
  published site exactly as they do locally.
- A script does it as the last step of `pnpm portal:build`, and fails when a
  folder it should mirror is missing from the Storybook build.
- A test fails when a story addresses a root-relative public path outside the
  mirrored folders, so a new kind of asset cannot break silently again.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `docs-portal`: adds the requirement that media addressed by stories loads
  on the published Storybook.

## Non-goals

- Changing any story, fixture or component. The paths stay as they are.
- Media that is missing in `public/` itself (a story pointing at a file that
  was never tracked). `story-media-fixtures.test.ts` already guards `videos/`
  and `thumbnails/`; the gallery of missing files is not this change.
- Serving the app's other public files (`emails/`, icons, `sw.js`) at the
  portal root. `emails/` would collide with the portal's Emails page.
- Moving Storybook to its own domain.

## Impact

- **New script:** `scripts/mirror-story-assets/` with its tests.
- **`portal:build`:** one more step after Storybook and TypeDoc.
- **Published site:** about 50 MB larger (the mirrored folders), well under
  the 1 GB Pages limit.
