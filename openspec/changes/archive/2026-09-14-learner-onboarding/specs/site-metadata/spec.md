## MODIFIED Requirements

### Requirement: Every route renders its own sharing image

The application SHALL generate a 1200×630 sharing image per catalog route — the home, each course, each module and each lesson — from that route's own catalog data and in the locale it is served in, rather than serving one static image for the whole site.

The personal routes — onboarding, My learning and Profile — describe no catalog content and are not meant to be shared. They SHALL NOT render their own sharing image and SHALL publish the home's sharing image for their locale.

The image SHALL carry the application's visual identity: the Immersion Cinema ground, its radial gold glow, the letterbox scrim, and the `ENGLISH·COURSE` wordmark, so that a card is recognisable as this product before any text is read.

All four catalog route kinds SHALL render through one shared card component. Four independent layouts would drift, and no reviewer sees a sharing image unless they deliberately look for it.

#### Scenario: A course card leads with what the course teaches
- **WHEN** the sharing image for a course whose description begins `American pronunciation from the ground up: …` is generated
- **THEN** the headline reads `American pronunciation from the ground up`, and the catalog name `Basic Course` appears only in the supporting line — a catalog name identifies a row, it does not tell a reader what they would learn

#### Scenario: A lesson card names its place in the course
- **WHEN** the sharing image for a lesson is generated
- **THEN** it shows the lesson's title, the course and module it belongs to, and, for a Lecture, its runtime

#### Scenario: The card follows the locale
- **WHEN** the same course's image is requested under `en` and under `es`
- **THEN** the localized chrome — counts, ordinals, labels — renders in each locale, using that locale's plural forms

#### Scenario: A personal route shares the home card
- **WHEN** the metadata for `/es/learning` is generated
- **THEN** its Open Graph image is the `es` home sharing image and no route-specific image file exists for it
