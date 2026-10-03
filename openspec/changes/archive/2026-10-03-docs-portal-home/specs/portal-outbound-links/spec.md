## ADDED Requirements

### Requirement: One rule decides which links leave Starlight

The portal SHALL decide in one shared function whether a link leaves the
pages Starlight renders. A link leaves Starlight when it is an absolute URL
(`http:`, `https:`, `mailto:`), when its path is inside a site the portal
hosts but does not render (`/storybook/`, `/api/`), or when its path names a
file (its last segment has an extension, such as `/architecture/layers.svg`).
Any other root-relative or relative path is a Starlight page. In-page anchors
(`#…`) stay in Starlight.

#### Scenario: References and files leave Starlight
- **WHEN** the rule is asked about `/storybook/`, `/api/modules.html`, `/architecture/layers.svg` and `https://github.com/HelloMoy/learning-english`
- **THEN** it answers that each leaves Starlight

#### Scenario: Portal pages stay
- **WHEN** the rule is asked about `/`, `/emails/`, `/changelog/` and `#v050`
- **THEN** it answers that none leaves Starlight

### Requirement: Links that leave Starlight open in a new tab

Every portal link that leaves Starlight SHALL open in a new tab
(`target="_blank"`) with `rel="noopener noreferrer"`. This SHALL hold for the
sidebar, the home page's cards, links written as HTML in a page, and links
written in Markdown (including the generated changelog). Cards and sidebar
entries that open a new tab SHALL show an outward arrow, and cards SHALL tell
screen readers "opens in a new tab". A test MUST fail when a page under
`docs-portal/src/` links outside Starlight in HTML without opening a new tab.

Previous/next page links SHALL never leave Starlight: Starlight builds them
from the sidebar, so a page beside Storybook or the API reference would
otherwise offer it as its "previous page".

#### Scenario: Pagination stays in the portal
- **WHEN** a reader reaches the bottom of `/emails/`, whose sidebar neighbour above is the API reference
- **THEN** it offers no previous link, and its next link is `/architecture/`

#### Scenario: A commit link in the changelog
- **WHEN** a reader follows a commit hash in `/changelog/`
- **THEN** GitHub opens in a new tab

#### Scenario: The raw architecture graph
- **WHEN** a reader follows the graph on `/architecture/`
- **THEN** `/architecture/layers.svg` opens in a new tab

#### Scenario: A new page forgets the rule
- **WHEN** a page adds `<a href="/api/">` without `target="_blank"`
- **THEN** the portal's link test fails naming the file and the link
