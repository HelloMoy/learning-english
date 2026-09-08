## MODIFIED Requirements

### Requirement: The declared catalog is the whole catalog

`src/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies.ts` SHALL
build the catalog from the course manifests alone. There SHALL be no hand-written course
seed and no configuration that selects between catalog sources: the courses the manifests
declare are the courses the application serves.

A course MAY withhold itself from being served by declaring `draft: true` in its own
manifest, in which case it is excluded when the environment hides drafts — see the
`draft-course-visibility` capability. That is a visibility filter over the one source, not
a second source: there is still exactly one place courses are declared, the filter reads
only the manifests' own `draft` field, and no configuration can introduce a course the
manifests do not declare. A course that declares no `draft` field is served in every
environment.

The lesson and resource ports SHALL bind directly to `LocalFilesystemLessonRepository` and
`LocalFilesystemResourceRepository`. No composite adapter SHALL sit between a port and its
single source — an indirection that fans one read out over one delegate hides the wiring
without buying anything back. Should a second content source return, the composite is a
change to make then, not machinery to keep unused now.

Catalog order SHALL come from `Course.sequence`, which each course declares in its own
manifest. The ladder therefore has exactly as many rungs as there are manifests it serves,
and moving a course between rungs is a one-line manifest edit. Withholding a draft course
SHALL leave the remaining courses in ascending `sequence` order with no renumbering: the
ladder's ordinals come from the data, so a gap in `sequence` values is not a gap in the
rendered ladder.

Booting without the content root SHALL fail visibly through the assets it cannot serve,
never by silently substituting different courses. A developer who has not obtained the
content sees the declared courses with unresolvable media, which names the real problem.
Lessons whose `source` is an external URL play regardless, because they need nothing from
the content root.

#### Scenario: The catalog holds exactly the declared courses

- **WHEN** the app boots with drafts shown, as it does in development
- **THEN** it serves exactly the courses the manifests under `src/content/` declare, in
  `sequence` order, with no placeholder or fallback course

#### Scenario: A draft course is withheld without a second source appearing

- **WHEN** the app boots with drafts hidden and one manifest declares `draft: true`
- **THEN** it serves exactly the remaining declared courses, in `sequence` order, and no
  course is served that the manifests do not declare

#### Scenario: A clone without the content root still serves the catalog

- **WHEN** a developer clones the repository and starts the app without the content root
- **THEN** every served course, module and lesson renders, locally-stored assets 404, and
  lessons served by an external URL still play
