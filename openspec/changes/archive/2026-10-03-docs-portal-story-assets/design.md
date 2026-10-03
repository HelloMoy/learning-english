## Context

- `@storybook/nextjs-vite` serves `public/` as Storybook's static folder, so
  the Storybook build contains `videos/`, `thumbnails/`,
  `local-filesystem-lesson/` (and the rest of `public/`).
- Stories (and the fixtures they pass) name those files root-relatively, the
  way the app does: `/videos/vowels.mp4`, `/thumbnails/vowels.jpg`,
  `/local-filesystem-lesson/…`. Some go through `next/image`, which adds
  `?w=…&q=…` and rejects a `src` without a leading `/`.
- `portal:build` writes Storybook into `docs-portal/dist/storybook/`; the site
  root holds the Starlight portal (`emails/`, `architecture/`, `changelog/`,
  `api/`, …). Measured on the live site: `LessonView › No Resources` asks for
  `https://docs.english-course.online/thumbnails/vowels.jpg` and
  `/videos/vowels.mp4` and gets 404s.

## Goals / Non-Goals

**Goals:** every story's media loads on the published site, without touching
stories, and stays that way for new stories.

**Non-Goals:** see the proposal.

## Decisions

### 1. Mirror the story media folders at the site root

`scripts/mirror-story-assets/mirror-story-assets.ts`:

- `STORY_ASSET_FOLDERS = ["videos", "thumbnails", "local-filesystem-lesson"]`.
- `mirrorStoryAssets(siteDir)` copies `siteDir/storybook/<folder>` to
  `siteDir/<folder>` for each folder (`cpSync`, recursive), and throws naming
  the folder when one is missing — a Storybook build without it means
  `public/` changed and the list needs a look.
- `main` runs it on `docs-portal/dist`. `portal:build` gains
  `&& pnpm portal:story-assets` after TypeDoc.

**Alternatives rejected:**
- *Relative paths in stories* — `next/image` refuses them, and every story
  and fixture would change.
- *Rewriting `src` at runtime in the preview* (patching `setAttribute`,
  `src`/`srcset` setters for `img`, `video`, `source`) — invisible magic over
  React and Vidstack, and it misses `srcset` and CSS URLs easily.
- *Mirroring all of `public/`* — `public/emails/` would collide with the
  portal's Emails page, and icons or `sw.js` at the docs root serve no story.
- *Storybook on its own domain* — a repository has one Pages site.

Copies, not symlinks: the Pages artifact must carry the files themselves.

### 2. The guard

`scripts/mirror-story-assets/mirror-story-assets.test.ts` also reads every
`*.stories.tsx` under `src/`, collects string literals that start with
`/<name>` where `<name>` is a top-level entry of `public/`, and fails for any
whose folder is not in `STORY_ASSET_FOLDERS`, naming the story file and the
path. Routes (`/en/learning`) are not public entries, so they never match.

## Risks / Trade-offs

- **The site grows by the mirrored folders (≈50 MB)** → well under the 1 GB
  Pages limit; the folders are the tracked course text assets and two demo
  clips.
- **A story could start using another public folder** → the guard fails until
  the folder is added to the list (or the story changes).
- **The portal root now holds three app folders** → none collides with a
  portal page; the list is explicit and tested.

## Testing strategy

- **Vitest unit (node), `scripts/mirror-story-assets/mirror-story-assets.test.ts`**
  — mirrors the colocated script tests (`scripts/email-gallery/…`):
  `mirrorStoryAssets` on a temporary site copies each folder and fails naming
  a missing one; the guard over the real story files.
- **`src/deployment/docs-portal.test.ts`** — `portal:build` ends with
  `pnpm portal:story-assets`, and the script runs the mirror.
- **Build** — `pnpm portal:build`, then the three folders exist at the root of
  `docs-portal/dist/` with the same files as under `storybook/`.
- **Visual check** — Playwright MCP on `pnpm portal:preview`:
  `LessonView › No Resources` loads its poster and video (no 404s).
- **After deploy** — the same story on the live site.
