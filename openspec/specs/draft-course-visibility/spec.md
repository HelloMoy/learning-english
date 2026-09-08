# draft-course-visibility Specification

## Purpose

A course may be declared but not yet ready for learners. This capability lets a course
manifest mark itself a draft and lets the environment decide whether drafts are served,
so an unfinished course can be worked on in development while staying invisible in
production.

Temporary by design: it exists so the Advanced Intermediate Course can ship later, and it
is shaped to be removed in two independent steps once every course is published.

## Requirements

### Requirement: A course manifest declares whether it is a draft

`CourseManifest` SHALL accept an optional `draft` boolean. A manifest that omits it
SHALL be treated as `draft: false`, so every course declared before this capability
existed keeps its current meaning without being edited.

Which courses are drafts SHALL be declared in the manifests and nowhere else. No module,
constant or environment variable SHALL name a specific course slug: the wiring knows only
that some courses are drafts, never which.

The field SHALL be validated with the rest of the manifest. A `draft` that is not a
boolean SHALL fail the manifest parse loudly, naming the course, exactly as any other
malformed field does.

`draft` SHALL be a property of a whole course. Modules, lessons and resources SHALL NOT
carry it.

#### Scenario: A manifest without `draft` is published

- **WHEN** a course manifest declares no `draft` field
- **THEN** it parses successfully and the course is served in every environment

#### Scenario: A manifest declares itself a draft

- **WHEN** `src/content/advanced-intermediate-course.json` declares `"draft": true`
- **THEN** the parsed manifest carries `draft: true`, and no other manifest file changes

#### Scenario: A non-boolean `draft` fails the parse

- **WHEN** a manifest declares `"draft": "yes"`
- **THEN** `parseCourseManifests` throws `InvalidCourseManifestError` naming that course,
  and the application does not boot with a partially-understood manifest

#### Scenario: No code names the hidden course

- **WHEN** a developer searches `src/` outside `src/content/` for the slug
  `advanced-intermediate-course`
- **THEN** no module that filters or wires the catalog contains it

### Requirement: Draft courses are withheld from the catalog at a single point

When drafts are hidden, the catalog the application assembles SHALL be built from the
non-draft manifests alone. The filter SHALL be applied once, to the parsed manifests,
before they are flattened — in
`src/adapters/persistence/content-manifest/content-manifest.ts`.

Filtering before the flatten means a hidden course contributes no `Course`, no `Module`,
no lesson row, no resource row and no notes key. Every surface that reads the catalog is
therefore consistent by construction rather than by each remembering to filter:

- the home ladder renders only visible courses;
- `findContinueWatching` on a stored location inside a hidden course fails with
  `course-not-found`, and the home shows no panel;
- the course overview, module overview and lesson routes for a hidden course resolve no
  course and render their existing not-found state.

No use case, page, component or repository SHALL gain knowledge of drafts. The domain
SHALL NOT learn the concept: `Course` gains no field, `CourseRepository` gains no method,
and no use case takes a visibility argument.

#### Scenario: A hidden course is absent from the home ladder

- **WHEN** the catalog declares two courses, one of them a draft, and drafts are hidden
- **THEN** the home renders one course card, and the `Available courses` count reads one

#### Scenario: A hidden course's direct URL renders the not-found state

- **WHEN** drafts are hidden and a visitor requests
  `/en/courses/<draft-course-slug>` or a lesson URL beneath it
- **THEN** the course is not found and the page renders its not-found state, rather than
  serving the course to anyone holding the link

#### Scenario: A stored position inside a hidden course resolves to nothing

- **WHEN** a browser holds a continue-watching record pointing at a lesson of a course
  that is now hidden
- **THEN** `findContinueWatching` fails with `course-not-found` and the home renders no
  continue-watching panel, rather than a card that links into a dead page

#### Scenario: A hidden course contributes no rows

- **WHEN** drafts are hidden
- **THEN** the flattened catalog contains no module, lesson row, resource row or notes key
  belonging to the hidden course

#### Scenario: Showing drafts restores the whole catalog

- **WHEN** drafts are shown
- **THEN** the catalog is byte-for-byte the catalog the manifests declare, in `sequence`
  order, as though the flag did not exist

### Requirement: Draft visibility is decided by `SHOW_DRAFT_COURSES`, defaulting to the environment

Whether drafts are shown SHALL be read from the `SHOW_DRAFT_COURSES` environment
variable, with the default derived from `NODE_ENV`:

- unset or empty → drafts are shown when `NODE_ENV !== "production"`, hidden otherwise;
- `1` or `true` (case-insensitive) → drafts are shown;
- `0` or `false` (case-insensitive) → drafts are hidden;
- any other value → the read SHALL throw, naming the variable and the value.

The default is what makes the flag free to live with: `pnpm dev`, `pnpm test:run`,
Storybook and the Playwright suite driving a dev server all show drafts without anyone
configuring anything, while a production build hides them. The explicit values exist so a
production build or a staging deploy can be made to show a draft course for review.

An unrecognized value SHALL NOT be treated as `false`. `SHOW_DRAFT_COURSES=treu` silently
hiding a course in development is the failure this rule prevents.

The variable SHALL be read on the server only. It SHALL NOT be prefixed `NEXT_PUBLIC_`,
and the decision SHALL NOT reach the client: the pages that read the catalog are Server
Components, which send only what they rendered.

`.env.example` SHALL document the variable, its accepted values, and that unset is the
intended default.

#### Scenario: Development shows drafts with no configuration

- **WHEN** `SHOW_DRAFT_COURSES` is unset and `NODE_ENV` is `development`
- **THEN** drafts are shown

#### Scenario: Production hides drafts with no configuration

- **WHEN** `SHOW_DRAFT_COURSES` is unset and `NODE_ENV` is `production`
- **THEN** drafts are hidden

#### Scenario: An explicit value overrides the environment

- **WHEN** `NODE_ENV` is `production` and `SHOW_DRAFT_COURSES` is `1`
- **THEN** drafts are shown, so a production build can be reviewed before the course is
  published

#### Scenario: An explicit value can hide drafts in development

- **WHEN** `NODE_ENV` is `development` and `SHOW_DRAFT_COURSES` is `false`
- **THEN** drafts are hidden, so the production catalog can be checked locally

#### Scenario: A misspelled value fails loudly

- **WHEN** `SHOW_DRAFT_COURSES` is `treu`
- **THEN** reading the flag throws an error naming `SHOW_DRAFT_COURSES` and the offending
  value, rather than defaulting to hidden

#### Scenario: The flag is documented

- **WHEN** a developer reads `.env.example`
- **THEN** `SHOW_DRAFT_COURSES` is listed with its accepted values and its default

### Requirement: The flag is removable in two independent steps

This capability is temporary: the draft course is expected to be published. Its
implementation SHALL be shaped so that removal never requires reading unrelated code.

Publishing a course SHALL be a one-line data edit. Deleting `"draft": true` from a
manifest SHALL make that course visible in every environment, with the flag machinery
still in place and no code touched.

Removing the machinery SHALL be a bounded, mechanical edit, and `design.md` SHALL record
it as an explicit recipe: delete the one module folder that owns the filter and the
environment read, unwrap the single call in `content-manifest.ts`, drop `draft` from
`CourseManifest`, drop the `.env.example` entry, and archive this spec.

The filter and the environment read SHALL live in exactly one folder under
`src/adapters/persistence/content-manifest/`, imported from exactly one place. No second
module SHALL import them, so no caller is orphaned by the deletion.

#### Scenario: Publishing a course needs no code change

- **WHEN** `"draft": true` is deleted from a manifest and nothing else changes
- **THEN** that course is served in production, and `git diff` touches one JSON file

#### Scenario: The flag has exactly one consumer

- **WHEN** a developer searches `src/` for imports of the draft-visibility module
- **THEN** exactly one module imports it, and it is
  `src/adapters/persistence/content-manifest/content-manifest.ts`

#### Scenario: The removal recipe is written down

- **WHEN** a developer opens this change's `design.md`
- **THEN** it lists every file to touch to remove the flag, in order, with nothing left
  to discover
