## MODIFIED Requirements

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

No tracked manifest is currently a draft: the Advanced Intermediate Course, the course
this capability was built for, is published. The capability stays in place until its
machinery is removed by its own change.

#### Scenario: A manifest without `draft` is published

- **WHEN** a course manifest declares no `draft` field
- **THEN** it parses successfully and the course is served in every environment

#### Scenario: A manifest declares itself a draft

- **WHEN** a course manifest declares `"draft": true`
- **THEN** the parsed manifest carries `draft: true`, and no other manifest file changes

#### Scenario: The Advanced Intermediate Course is published

- **WHEN** `src/content/advanced-intermediate-course.json` is parsed
- **THEN** it carries no `draft` field, and the course is served in production with no
  `SHOW_DRAFT_COURSES` configured

#### Scenario: A non-boolean `draft` fails the parse

- **WHEN** a manifest declares `"draft": "yes"`
- **THEN** `parseCourseManifests` throws `InvalidCourseManifestError` naming that course,
  and the application does not boot with a partially-understood manifest

#### Scenario: No code names the hidden course

- **WHEN** a developer searches `src/` outside `src/content/` for the slug of any course
- **THEN** no module that filters or wires the catalog contains it
