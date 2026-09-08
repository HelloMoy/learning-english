## Why

The Advanced Intermediate Course is not ready to be seen by learners, but it is the
course every e2e spec drives and the one used for day-to-day development. Today the
catalog has no way to say "declared, but not yet published": the manifests under
`src/content/` are the whole catalog, so a course that exists is a course that ships.
The only ways to keep it out of production are to delete its manifest — which breaks
six e2e specs and local work — or to not deploy at all.

We need a flag that shows the course in development and hides it in production, and we
need it to be cheap to remove: the course is expected to go public soon, and at that
point the flag should disappear without archaeology.

## What Changes

- **A course manifest can declare itself a draft.** `CourseManifest` gains an optional
  `draft` boolean, defaulting to `false`. `src/content/advanced-intermediate-course.json`
  sets it to `true`. Which course is hidden is therefore data, not code — nothing in the
  wiring knows the slug `advanced-intermediate-course`.
- **Draft courses are filtered out of the catalog when drafts are hidden.** One new
  module sits between `parseCourseManifests` and `flattenCourseManifests` in
  `src/adapters/persistence/content-manifest/content-manifest.ts`. Because it filters
  the manifests rather than the rendered catalog, a hidden course contributes no course,
  no modules, no lesson rows and no resource rows — so it is absent from the home ladder,
  absent from continue-watching, and its direct URLs render the app's existing
  "We couldn't find this course" state through the unchanged `course-not-found`
  paths. There is one filter point, not one per surface.
- **Visibility is decided by `SHOW_DRAFT_COURSES`, defaulting to the environment.**
  Unset means `NODE_ENV !== "production"` — drafts show in `pnpm dev`, `pnpm test` and
  Storybook with zero configuration, and hide in a production build. Setting it to
  `1`/`true` or `0`/`false` overrides that, so a production build or a staging deploy can
  be made to show the course when it needs to be reviewed or driven by e2e. An
  unrecognized value fails loudly rather than being guessed at.
- **`.env.example` documents the variable**, including that leaving it unset is the
  intended default.
- **Removal is one line of data, then one folder.** Deleting `"draft": true` from the
  manifest publishes the course everywhere, in every environment, with the machinery
  still in place. Deleting the machinery afterwards is: delete the new module folder,
  unwrap one call in `content-manifest.ts`, drop the `draft` field from the schema, drop
  the `.env.example` entry, and revert this change's spec delta. `design.md` records this
  as an explicit removal recipe.

## Capabilities

### New Capabilities

- `draft-course-visibility`: a course manifest may declare itself a draft, and draft
  courses are absent from the served catalog unless the environment says to show them.
  The capability is deliberately self-contained so that publishing the Advanced course
  for good means deleting one spec file rather than untangling requirements from several.

### Modified Capabilities

- `course-content-storage`: the requirement *The declared catalog is the whole catalog*
  currently forbids "configuration that selects between catalog sources". That still
  holds — there remains exactly one source — but it must be amended to say that a
  declared course may be withheld by its own `draft` flag, and that this is a visibility
  filter over the single source rather than a second source.

## Non-goals

- **No per-course access control, entitlements, or preview links.** A draft course is
  hidden from everyone in an environment that hides drafts, and visible to everyone in
  one that shows them. There is no signed preview URL and no notion of a user who may
  see drafts.
- **No draft granularity below a course.** A module or a lesson cannot be marked draft;
  only a whole course can.
- **No UI for the flag.** Nothing renders a "draft" badge, and no page tells the visitor
  that a hidden course exists. Hidden means absent, not greyed out.
- **No change to how the catalog is sourced, parsed or flattened.** The manifests stay
  the single source of truth, statically imported and validated exactly as today.
- **No change to the e2e suite's target course.** The specs keep driving the Advanced
  course; they run against a dev server, where drafts show by default.
