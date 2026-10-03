## ADDED Requirements

### Requirement: The README opens with the product and its three environments

The repository README SHALL open with a banner that names English Course and
states what it teaches, followed by three link buttons, in this order: the live
app (`https://www.english-course.online`), the develop preview
(`https://develop.english-course.online`) and the docs portal
(`https://docs.english-course.online`). Each button SHALL be an image wrapped in
a link to its address. The README MUST NOT contain the `create-next-app`
boilerplate.

#### Scenario: A visitor opens the repository
- **WHEN** a visitor opens the repository's front page
- **THEN** the README shows the banner, then the Live app, Develop preview and Docs portal buttons, each linking to its address

#### Scenario: The scaffold text is gone
- **WHEN** the README is searched for `create-next-app`
- **THEN** nothing is found

### Requirement: Every environment address is also copyable text

The README SHALL list the three environments in a table whose rows give, for
each one, its address as a text link, the branch it is built from, and a note.
The develop row MUST say that the preview sits behind Vercel sign-in, so a
visitor without access knows why the link asks them to log in.

#### Scenario: Copying an address
- **WHEN** a reader wants the docs portal address as text
- **THEN** the Environments table shows `docs.english-course.online` as a link they can select and copy

#### Scenario: Develop is marked as restricted
- **WHEN** a reader looks at the Develop row
- **THEN** it says the preview is behind Vercel sign-in

### Requirement: Every image the README shows exists and is described

Every image the README references by a repository path SHALL exist at that path
and SHALL carry non-empty alternative text. Each link button's image SHALL
paint the host of the address its link opens, and its alternative text SHALL
name that host, so the picture, the description and the link cannot disagree.

#### Scenario: A button's address changes
- **WHEN** a button's link is changed to another host but its image still paints the old one
- **THEN** the README guard test fails and names the button

#### Scenario: An image is removed
- **WHEN** an image the README references is deleted or renamed
- **THEN** the README guard test fails and names the missing path

### Requirement: The README only names scripts and files that exist

Every `pnpm` script the README tells a reader to run SHALL exist in
`package.json`, and every repository file it links to SHALL exist. A test MUST
fail when either stops being true.

#### Scenario: A script is renamed
- **WHEN** a script the README names is renamed or removed in `package.json`
- **THEN** the README guard test fails and names the script

#### Scenario: A linked document is moved
- **WHEN** a document the README links to by a relative path is moved or deleted
- **THEN** the README guard test fails and names the link

### Requirement: The README says how to run the project locally

The README SHALL give the commands that take a fresh clone to a running app —
installing dependencies, creating `.env.local` from `.env.example`, starting the
local database and mail inbox, migrating, seeding, and starting the dev server —
and SHALL state the Node, pnpm and Docker prerequisites.

#### Scenario: A new contributor clones the repository
- **WHEN** they follow the "Run it locally" commands in order
- **THEN** each command exists in the repository as written
