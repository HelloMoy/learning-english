## MODIFIED Requirements

### Requirement: Every route declares its canonical URL and its locale alternates

Every rendered route SHALL declare a canonical URL for the locale it is being served in, and an alternate for each supported locale (`en`, `es`, `pt`) plus an `x-default` pointing at the default locale's equivalent path.

The locale set and the default locale SHALL be read from the routing configuration, so that adding or removing a locale changes every page's alternates with no per-page edit.

The shape of the locale prefix SHALL be asserted by a test rather than assumed. `getPathname` from the navigation wrappers cannot serve this purpose: outside a Next request it resolves to its client build and returns `/` for every input, which would make the one function every canonical depends on untestable.

#### Scenario: A course page declares all three locales
- **WHEN** `/es/courses/basic-course/progress` renders
- **THEN** its canonical is the `es` URL, and it declares alternates for the `en`, `es` and `pt` equivalents of the same course, plus `x-default` pointing at the `en` one

#### Scenario: Alternates follow the routing config
- **WHEN** a locale is added to or removed from the routing configuration
- **THEN** the alternates a page declares change with it, without any per-page edit

#### Scenario: A change to the prefix mode fails a test
- **WHEN** `localePrefix` is changed from `always` to any other mode
- **THEN** a test fails, rather than the site silently publishing canonicals that no longer match its own URLs
