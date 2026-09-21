# storybook-preview-integrity Specification

## Purpose

The `storybook-preview-integrity` capability covers what the Storybook preview guarantees for every story before anyone judges what it shows: that the story mounts instead of showing Storybook's error display, that server-only application modules are substituted rather than bundled into a browser that cannot run them, that the context providers a component needs are mounted above it, and that the media fixtures stories reference exist on disk and are playable.

It exists because a story that cannot render is worse than no story at all — it is a review surface that silently lies about the component's state. Storybook is this project's stated place for isolated component development, visual review and accessibility checks, so a red error screen or a video frame that answers `416 Range Not Satisfiable` is not a cosmetic defect; it removes the component from review while leaving the impression that it was reviewed.

Nothing here changes the app's runtime. It is confined to the preview's module graph, the preview's providers, and the fixtures under `public/` that only stories read.

## Requirements
### Requirement: The preview never bundles Node-only modules

The Storybook preview SHALL resolve server-only application modules to
browser-safe stand-ins rather than bundling them. A story MUST NOT fail because
the preview reached a Node built-in such as `node:fs`.

`src/app/[locale]/actions.ts` is a `"use server"` module. Next turns its imports
into RPC stubs, but Vite would bundle its transitive graph —
`use-case-dependencies` → `create-content-blob-store` → `content-locations` →
`node:fs` — into the preview, which cannot run it.

The substitution MUST key on the **resolved module path**, not on the import
specifier. A `resolve.alias` entry matches only the text a module was imported
with, and `actions.ts` is imported as `"./actions"` by the module beside it, so
a specifier alias never fires for its only real importer.

#### Scenario: A story that reaches a server action mounts

- **WHEN** a story renders a component whose import graph reaches
  `src/app/[locale]/actions.ts` — for example through
  `useResolvedContinueWatching` → `resolve-continue-watching.ts`
- **THEN** the story mounts and renders its component
- **AND** Storybook does not show its error display
- **AND** no `Module "node:fs" has been externalized for browser compatibility`
  error reaches the console

#### Scenario: The server module is substituted, not bundled

- **WHEN** the Storybook Vite config is resolved
- **THEN** it carries a resolver that runs before Vite's own
- **AND** a specifier that resolves to `src/app/[locale]/actions.ts` is
  redirected to a browser-safe stub in `.storybook/`
- **AND** the stub exports every binding the preview's import graph reads from
  the real module

#### Scenario: The substitution catches every spelling of the same module

- **WHEN** a module imports the server module relatively, as `"./actions"`
- **THEN** it is redirected to the stub just as `@/app/[locale]/actions` is

#### Scenario: The stub keeps pace with the real module

- **WHEN** the real `src/app/[locale]/actions.ts` exports a binding that a
  component imports as a value
- **THEN** a test fails if the stub does not export that binding

### Requirement: The preview supplies the providers components require

The Storybook preview SHALL wrap every story in the context providers that
components depend on, so a component can render in isolation exactly as it does
inside the app shell. A component MUST NOT fail in Storybook for want of a
provider that `src/components/global-providers.tsx` supplies in the app.

URL search-param state is one such provider: `nuqs` throws
`nuqs requires an adapter to work with your framework` when no adapter is
mounted above a `useQueryState` call.

#### Scenario: A component reading URL state renders

- **WHEN** a story renders a component that calls `useQueryState`
- **THEN** the story mounts and renders its component
- **AND** no `nuqs requires an adapter` error reaches the console

#### Scenario: URL state survives an interaction within a story

- **WHEN** a story's interaction writes a new value through `useQueryState`
- **THEN** the component reads that new value back
- **AND** the change does not navigate the preview iframe

### Requirement: Media fixtures that stories reference exist and are playable

Every video source and poster referenced by a story SHALL exist under `public/`
and SHALL be non-empty, so a player story can decode a frame instead of
answering `404` or `416 Range Not Satisfiable`.

A fixture deliberately referencing a missing file to demonstrate a failure state
is exempt, and the story MUST make that intent explicit in its name or source.

#### Scenario: A player story loads a real frame

- **WHEN** a story renders a video player against a fixture under `public/videos/`
- **THEN** the request for that file succeeds
- **AND** the response is not `416 Range Not Satisfiable`

#### Scenario: A fixture is not an empty placeholder

- **WHEN** the repository's story media fixtures are checked
- **THEN** every referenced file under `public/videos/` and `public/thumbnails/`
  is larger than zero bytes

#### Scenario: A story referencing a missing fixture is caught

- **WHEN** a story references a video source or poster path that no file backs
- **AND** the story is not a declared failure-state story
- **THEN** a test fails naming the story and the missing path

#### Scenario: A failure-state story keeps its missing fixture

- **WHEN** a story exists to demonstrate a video that never loads — such as
  `VideoBufferingIndicator/Buffering` pointing at
  `/videos/a-lesson-that-never-arrives.mp4`
- **THEN** the missing fixture is left missing
- **AND** the fixture check does not report it
