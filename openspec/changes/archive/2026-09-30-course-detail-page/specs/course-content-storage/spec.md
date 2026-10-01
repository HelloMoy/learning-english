## ADDED Requirements

### Requirement: A manifest may declare what its course teaches

The manifest schema SHALL accept, on a course, an optional `outcomes`, a list of non-empty sentences stating what a learner can do
after the course, and an optional `sounds`, an object with `vowels` and `consonants`, each a list of non-empty IPA
symbols. Neither is required. A manifest that declares neither SHALL parse unchanged, and its course
SHALL carry no outcomes and no sounds. An empty string in either list SHALL fail the parse, naming the
course.

The `Course` entity SHALL carry both fields as declared, so every surface reads them from the catalog
rather than from the manifest file.

#### Scenario: Declared outcomes reach the course
- **WHEN** `basic-course.json` declares five outcomes
- **THEN** the served `basic-course` course carries those five sentences in the declared order

#### Scenario: A manifest without them still parses
- **WHEN** a manifest declares neither `outcomes` nor `sounds`
- **THEN** it parses, and its course carries neither

#### Scenario: An empty outcome fails the parse
- **WHEN** a manifest declares `"outcomes": [""]`
- **THEN** `parseCourseManifests` throws `InvalidCourseManifestError` naming that course

### Requirement: A course's description and outcomes are shown in the learner's language

The manifest schema SHALL accept, on a course, an optional `translations` object keyed by ISO 639-1
language code, each entry declaring an optional `description` (non-empty) and optional `outcomes`
(non-empty sentences). The `Course` entity SHALL carry the translations as declared. A translation
key that is not two lower-case letters, or an empty string in an entry, SHALL fail the parse, naming the
course.

`courseCopy(course, locale)` SHALL return the course's description and outcomes in that locale: each
field from the locale's translation when it declares that field, otherwise the manifest's own. Every
surface that shows a course's description or outcomes SHALL read them through it for the active
locale: the course page, the home's levels table, the onboarding's first-course step, the course
route's metadata description, its share image headline and its schema.org `Course` description.
Course, lesson and video titles SHALL NOT be translated.

The tracked manifests SHALL translate every course's description and outcomes into every supported
locale other than the manifest's own, with as many outcomes as the manifest declares.

#### Scenario: A translated course reads in Spanish
- **WHEN** the Basic Course's page renders under `/es`
- **THEN** its description and What you'll learn are the Spanish ones its manifest declares, and its title is unchanged

#### Scenario: A locale without a translation falls back
- **WHEN** `courseCopy` is asked for a locale the course declares no translation for
- **THEN** it returns the manifest's own description and outcomes

#### Scenario: A translation may cover one field
- **WHEN** a course's `pt` translation declares a description and no outcomes
- **THEN** `courseCopy(course, "pt")` returns the Portuguese description and the manifest's outcomes

#### Scenario: Every tracked course is translated
- **WHEN** the tracked manifests are parsed
- **THEN** each course declares `es` and `pt` translations with a description and as many outcomes as its own

#### Scenario: The share surfaces follow the locale
- **WHEN** `/pt/courses/basic-course` is shared
- **THEN** the metadata description, the share image headline and the structured data describe the course in Portuguese
