## ADDED Requirements

### Requirement: Home renders the whole catalog as an ordered ladder of levels

The locale home (`/[locale]`) SHALL present a cinema hero over a `CinemaBackground` with an eyebrow, the localized title and subtitle, followed by an explicitly labelled `Available courses` section containing a numbered track and **one card per catalog course**, in `Course.sequence` order. No course SHALL be dropped, and no course SHALL be given a layout slot the others cannot have.

Each course card SHALL show: the course's localized ordinal (`Level {number}`, derived from `Course.sequence`), its title, its description, its leading modules with their ordinals, a `+N more` indicator when the course has more modules than are listed, the module and lesson counts, and one call to action linking to the course overview for the active locale.

The section heading SHALL state that these are the available courses, and SHALL report how many there are.

All copy SHALL be localized (en/es/pt) and links SHALL be locale-aware.

#### Scenario: Every catalog course gets a card
- **WHEN** the catalog resolves two courses
- **THEN** the home renders two course cards, in ascending `Course.sequence` order, each linking to its own course overview

#### Scenario: A card previews what is inside the course
- **WHEN** a course has ten modules
- **THEN** its card lists its leading modules with their ordinals and indicates that the remaining ones exist, rather than listing all ten or none

#### Scenario: The courses section announces itself
- **WHEN** the home renders with a non-empty catalog
- **THEN** an `Available courses` heading precedes the cards and the number of courses is shown

#### Scenario: Ordering is data, not arrival order
- **WHEN** the repository returns courses in an order that does not match their `sequence`
- **THEN** the home still renders them in ascending `sequence` order

#### Scenario: A single-course catalog still renders the ladder
- **WHEN** the catalog resolves exactly one course
- **THEN** the home renders one card under the same heading, with no empty slots and no placeholder for a course that does not exist

#### Scenario: Empty catalog degrades gracefully
- **WHEN** the catalog returns no entries
- **THEN** the home shows a localized empty state instead of a broken or empty ladder

#### Scenario: Home copy is localized
- **WHEN** the locale is `es`
- **THEN** the eyebrow, the section heading, the ordinals, the counts and the calls to action render from `es.json`, not hardcoded English

### Requirement: The course being continued is marked on its card

When a stored continue-watching location resolves to a lesson belonging to one of the catalog courses, that course's card SHALL be marked as in progress and its call to action SHALL invite the learner to continue rather than to start. Every other card SHALL read as not started.

Before the client has read the record, and whenever there is no record, every card SHALL render the not-started state — the honest one — rather than flashing a mark it cannot yet justify.

#### Scenario: The in-progress course is marked
- **WHEN** the stored location points at a lesson of the first course
- **THEN** that course's card shows an in-progress mark and a `Continue course` action, and the other cards show a not-started mark and a `Start course` action

#### Scenario: No record leaves every card unmarked
- **WHEN** no location is stored
- **THEN** every card shows the not-started state

#### Scenario: The mark resolves after hydration
- **WHEN** the home is server-rendered
- **THEN** the markup contains the not-started state for every card, and the mark appears only after the client has read the record

## REMOVED Requirements

### Requirement: Home renders as a streaming cover with a featured course

**Reason**: The home privileged `entries[0]` with a whole column — a featured poster, a counts pill and a `01–10` module index — and rendered nothing for any other catalog course. With more than one course in the catalog that layout states something false: that the platform is about one course. It is replaced by "Home renders the whole catalog as an ordered ladder of levels", which gives every course the same shape.

**Migration**: The hero, its eyebrow, its title and its subtitle survive; only the CTAs move out of it, since the primary action now belongs to the continue-watching section and to each course card. `FeaturedCourse` is removed from the home; the components it composed (`PosterCard`, `GoldBadge`, `Eyebrow`, `PlayButton`) are unchanged and are reused by the ladder. The `HomePage.openCourse`, `HomePage.myList`, `HomePage.featuredLabel`, `HomePage.featureLabel` and `HomePage.featureHeadline` message keys are retired from the home; the counts vocabulary (`CourseCatalog.card.moduleCount` / `lessonCount`) is kept and reused by the cards.
