## MODIFIED Requirements

### Requirement: Personal learner routes are kept out of search

The onboarding, My learning, Achievements and Profile routes SHALL declare `robots` metadata that asks
search engines not to index them while still following their links, in every locale and on every
deployment. The sitemap SHALL NOT list them.

#### Scenario: My learning is not indexable
- **WHEN** the metadata for `/en/learning` is generated
- **THEN** it declares `index: false` and `follow: true`

#### Scenario: Achievements is not indexable
- **WHEN** the metadata for `/en/achievements` is generated
- **THEN** it declares `index: false` and `follow: true`

#### Scenario: The sitemap omits personal routes
- **WHEN** the sitemap is requested
- **THEN** no entry's URL ends in `/start`, `/start/avatar`, `/learning`, `/achievements` or `/profile`
