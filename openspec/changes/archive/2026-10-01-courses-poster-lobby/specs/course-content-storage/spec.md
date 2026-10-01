## ADDED Requirements

### Requirement: A manifest may declare who its course is for and its highlights

The manifest schema SHALL accept, on a course, an optional `audience`, one non-empty sentence naming who the course is for, and an optional `highlights`, a list of non-empty short points summarising what it teaches. Neither is required. A manifest that declares neither SHALL parse unchanged, and its course SHALL carry neither. An empty `audience` or an empty string in `highlights` SHALL fail the parse, naming the course.

The `Course` entity SHALL carry both fields as declared. The tracked manifests SHALL declare an audience and three highlights for every course.

#### Scenario: Declared highlights reach the course
- **WHEN** `basic-course.json` declares an audience and three highlights
- **THEN** the served `basic-course` course carries that audience and those three points in the declared order

#### Scenario: A manifest without them still parses
- **WHEN** a manifest declares neither `audience` nor `highlights`
- **THEN** it parses, and its course carries neither

#### Scenario: An empty audience fails the parse
- **WHEN** a manifest declares `"audience": ""`
- **THEN** `parseCourseManifests` throws `InvalidCourseManifestError` naming that course

## MODIFIED Requirements

### Requirement: A course's description and outcomes are shown in the learner's language

The manifest schema SHALL accept, on a course, an optional `translations` object keyed by ISO 639-1
language code, each entry declaring an optional `description` (non-empty), optional `outcomes`
(non-empty sentences), optional `audience` (non-empty) and optional `highlights` (non-empty points).
The `Course` entity SHALL carry the translations as declared. A translation key that is not two
lower-case letters, or an empty string in an entry, SHALL fail the parse, naming the course.

`courseCopy(course, locale)` SHALL return the course's description, outcomes, audience and
highlights in that locale: each field from the locale's translation when it declares that field,
otherwise the manifest's own. Every surface that shows a course's description, outcomes, audience or
highlights SHALL read them through it for the active locale: the course page, the home's levels
table, the onboarding's first-course step, Available courses' posters, the course route's metadata
description, its share image headline and its schema.org `Course` description. Course, lesson and
video titles SHALL NOT be translated.

The tracked manifests SHALL translate every course's description, outcomes, audience and highlights
into every supported locale other than the manifest's own, with as many outcomes and highlights as
the manifest declares.

#### Scenario: A translated course reads in Spanish
- **WHEN** the Basic Course's page renders under `/es`
- **THEN** its description and What you'll learn are the Spanish ones its manifest declares, and its title is unchanged

#### Scenario: A locale without a translation falls back
- **WHEN** `courseCopy` is asked for a locale the course declares no translation for
- **THEN** it returns the manifest's own description, outcomes, audience and highlights

#### Scenario: A translation may cover one field
- **WHEN** a course's `pt` translation declares a description and no outcomes
- **THEN** `courseCopy(course, "pt")` returns the Portuguese description and the manifest's outcomes

#### Scenario: A course without a brief reads none
- **WHEN** a course declares no audience and no highlights
- **THEN** `courseCopy` returns no audience and an empty list of highlights

#### Scenario: Every tracked course is translated
- **WHEN** the tracked manifests are parsed
- **THEN** each course declares `es` and `pt` translations with a description, an audience, as many outcomes as its own and as many highlights as its own

#### Scenario: The share surfaces follow the locale
- **WHEN** `/pt/courses/basic-course` is shared
- **THEN** the metadata description, the share image headline and the structured data describe the course in Portuguese
