## ADDED Requirements

### Requirement: Usage data is sent only when a project token is configured

The application SHALL start the PostHog browser client only when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set. Without it no client SHALL be initialized, no consent banner SHALL be shown and no request SHALL go to PostHog, so development, tests and CI send nothing.

#### Scenario: No token, nothing happens
- **WHEN** the application runs without `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`
- **THEN** no PostHog client is initialized, no consent banner is rendered and no analytics request is made

#### Scenario: A token starts the client
- **WHEN** the application runs in a browser with `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` set
- **THEN** the PostHog client is initialized with that token

### Requirement: Usage data is stored and processed in one named region

Usage data SHALL be delivered to PostHog's US cloud and to no other region, the same region the application's database and functions run in. The upstream hosts SHALL be fixed in the source rather than read from the environment, because the privacy policy states where the data goes and a variable could contradict it without any test noticing.

#### Scenario: The relay forwards to the US cloud
- **WHEN** the relay forwards an analytics request
- **THEN** the upstream host is one of PostHog's US hosts

### Requirement: Analytics requests go through the application's own origin

The browser SHALL send analytics requests to a path on the application's own origin, and the application SHALL relay them to PostHog. The relay SHALL forward only a fixed list of request headers that PostHog needs, and SHALL NOT forward `Cookie`, `Authorization`, `Referer` or any header the hosting platform adds: the browser attaches the session cookie to every same-origin request, and for such a request the referer is the full page address, query string included. The list SHALL include the visitor's IP address and user agent, which PostHog needs to count visitors who rejected storage. It SHALL run before the session gate and locale handling, so an analytics request is never redirected to sign-in or prefixed with a locale.

#### Scenario: The session cookie does not reach PostHog
- **WHEN** a signed-in learner's browser sends an analytics request carrying the session cookie
- **THEN** the request forwarded to PostHog has no `Cookie` header and no `Authorization` header

#### Scenario: The page address does not reach PostHog as a referer
- **WHEN** an analytics request is sent from `/en/reset-password?token=abc123`
- **THEN** the request forwarded to PostHog has no `Referer` header

#### Scenario: An analytics request is not treated as a page
- **WHEN** a request arrives on the relay path with no session cookie
- **THEN** it is forwarded to PostHog, not redirected to sign-in and not given a locale prefix

#### Scenario: Asset paths are relayed too
- **WHEN** the client requests one of PostHog's script files through the relay path
- **THEN** the request is forwarded to PostHog's US asset host

### Requirement: Nothing is stored or sent before the visitor chooses

Until the visitor has accepted or rejected, the application SHALL NOT set a PostHog cookie, SHALL NOT write PostHog data to local or session storage, and SHALL NOT send any event. A consent banner SHALL be shown while the choice is pending.

#### Scenario: A first visit before any choice
- **WHEN** a visitor opens the site for the first time and has not answered the banner
- **THEN** the banner is visible, no PostHog cookie or storage entry exists, and no event has been sent

### Requirement: The consent banner offers acceptance and rejection on equal terms

The banner SHALL present an accept action and a reject action with the same prominence, reachable by keyboard, and SHALL link to the privacy policy. Its text SHALL come from `next-intl` in every supported locale. It SHALL NOT block reading or using the page. Once the visitor has chosen, it SHALL NOT appear again until they ask to change the choice.

#### Scenario: Both actions are equally available
- **WHEN** the banner renders
- **THEN** it shows an accept button and a reject button of the same kind, and a link to the privacy policy

#### Scenario: The banner is translated
- **WHEN** the banner renders under `es` or `pt`
- **THEN** its text is in that locale

#### Scenario: A choice dismisses it
- **WHEN** the visitor accepts or rejects
- **THEN** the banner disappears and does not return on the next page or the next visit

### Requirement: Rejecting still counts the visit, anonymously

After a rejection the client SHALL run in cookieless mode: no cookie, no local or session storage, no identification and no session recording. Page views, page leaves, clicks and named events SHALL still be sent, counted by PostHog's daily server-side hash.

#### Scenario: A rejecting visitor leaves nothing in the browser
- **WHEN** a visitor rejects and then browses the site
- **THEN** no PostHog cookie exists, local and session storage hold no PostHog data beyond the remembered choice, and events are still sent

#### Scenario: A rejecting learner is not identified
- **WHEN** a learner who rejected signs in
- **THEN** no event carries their account ID and no recording is started

### Requirement: The choice can be changed at any time

The site footer SHALL carry a control, on every page, that reopens the consent choice. Changing from accept to reject SHALL stop recording and identification immediately and remove PostHog's cookie and storage.

#### Scenario: The footer reopens the choice
- **WHEN** a visitor who already chose activates the footer control
- **THEN** the banner is shown again with both actions

#### Scenario: Withdrawing consent takes effect at once
- **WHEN** a visitor who accepted changes their choice to reject
- **THEN** recording stops, the PostHog cookie is removed, and later events carry no account ID

### Requirement: A consenting learner is identified by account ID and nothing else

When a signed-in learner has accepted, the client SHALL identify them with their account ID. It SHALL NOT send the learner's email address or name as a person or event property. The PostHog cookie SHALL be scoped to the exact host that set it and marked secure, so it is never sent to another subdomain of `english-course.online`.

#### Scenario: Signing in identifies the learner
- **WHEN** a learner who accepted signs in
- **THEN** later events are attributed to their account ID

#### Scenario: No contact details are sent as properties
- **WHEN** a learner is identified
- **THEN** the identify call carries no email address and no name

#### Scenario: The cookie stays on its host
- **WHEN** the PostHog cookie is set on `www.english-course.online`
- **THEN** it is not sent with requests to `docs.english-course.online` or `develop.english-course.online`

### Requirement: Signing out and deleting an account end the identity on the device

When a learner signs out, or their account is deleted, the client SHALL reset its identity so that later activity on the same device is not attributed to them. The visitor's consent choice SHALL survive the reset.

#### Scenario: The next person on a shared device is not the previous learner
- **WHEN** a learner signs out and someone else browses on the same device
- **THEN** the later events carry a different, anonymous identity

#### Scenario: Signing out does not ask for consent again
- **WHEN** a learner who accepted signs out
- **THEN** the banner does not reappear

### Requirement: Page views, page leaves, clicks and heatmaps are captured

The client SHALL capture a page view on the first load and on every client-side navigation, a page leave when the visitor leaves a page, clicks on interface elements together with the text of the element, and heatmap data.

#### Scenario: A client-side navigation counts as a page view
- **WHEN** a visitor follows an in-app link from one page to another
- **THEN** a page view is captured for the destination without a full page load

#### Scenario: A click carries its label
- **WHEN** a visitor clicks a button
- **THEN** the captured event includes the button's text

### Requirement: Named events come from a typed catalogue

The application SHALL send named events only through one module that declares every event and the type of each of its properties. Properties SHALL be identifiers, enumerated values, booleans or numbers; a property SHALL NOT carry free text or anything a learner typed. No other module SHALL import the PostHog SDK.

The catalogue SHALL cover at least: a video starting to play, pausing, being sought, changing speed and reaching its end; a lesson being marked complete, and whether the learner or playback did it; a course enrollment; and a prize being claimed. An enrollment, a completion and a claim SHALL be reported only once the server has saved them. A seek SHALL be reported once per jump, however many intermediate positions the player passes through.

#### Scenario: An undeclared event does not compile
- **WHEN** code tries to send an event that the catalogue does not declare, or a property of the wrong type
- **THEN** `pnpm typecheck` fails

#### Scenario: Playing a lesson video is captured
- **WHEN** a learner starts a lesson video
- **THEN** a named event is sent carrying the lesson's identifier and the position playback started from

#### Scenario: Dragging the time slider is one seek
- **WHEN** a learner drags the time slider across the video
- **THEN** one seek event is sent, from where playback was to where it landed

#### Scenario: A refused enrollment is not reported
- **WHEN** the server refuses an enrollment
- **THEN** no enrollment event is sent

#### Scenario: The SDK is reachable from one place only
- **WHEN** a module other than the analytics module imports `posthog-js`
- **THEN** `pnpm lint` fails

### Requirement: Query strings and fragments are removed from every URL sent

Before an event is sent, the application SHALL remove the query string and the fragment from every value that is an absolute URL, at any depth of the event's properties, including the current page, the referrer and the URLs PostHog stores on first contact. The path SHALL be preserved.

The password-reset link carries its token in the query string; so does any future single-use link. Removing every query string, rather than a named list of parameters, is what keeps a parameter nobody remembered from leaking.

#### Scenario: The reset token does not leave the browser
- **WHEN** a page view is captured on `/en/reset-password?token=abc123`
- **THEN** no value in the event contains `token` or `abc123`, and the current URL ends in `/en/reset-password`

#### Scenario: Nested URLs are cleaned too
- **WHEN** an event carries a URL inside a nested property
- **THEN** that URL has no query string and no fragment

#### Scenario: The path survives
- **WHEN** a page view is captured on a lesson page with a query string
- **THEN** the event's current URL keeps the full path to the lesson

#### Scenario: Values that are not URLs are untouched
- **WHEN** an event carries values that are not absolute URLs
- **THEN** those values are sent unchanged

### Requirement: The learner's email address is never sent

Every element that prints the learner's email address SHALL be excluded from click capture and from session recordings. This covers at least the account section of the profile, the change-email confirmation, the forgot-password confirmation and the sign-up confirmation.

#### Scenario: The profile's email is hidden in a recording
- **WHEN** a recorded session shows the profile page
- **THEN** the element that prints the email address is replaced by a blank block

#### Scenario: A click near the email does not carry it
- **WHEN** a learner clicks inside the element that prints their email address
- **THEN** no captured event contains the address

### Requirement: Sessions are recorded only with consent, and never on credential pages

Session recording SHALL be off when the client starts and SHALL be started by the application only while both hold: the visitor has accepted, and the current route is not a credential page. The credential pages are sign-in, sign-up, forgot-password and reset-password. Leaving such a page SHALL resume recording; entering one SHALL stop it.

The reset-password page carries its token in the address, and a recording stores the address of every page it shows.

#### Scenario: No recording without consent
- **WHEN** a visitor who has not accepted browses any page
- **THEN** no recording is started

#### Scenario: A reset link opened directly is not recorded
- **WHEN** a consenting visitor lands on `/en/reset-password?token=abc123` as the first page of a visit
- **THEN** no recording is started on that page

#### Scenario: Recording resumes after the credential page
- **WHEN** a consenting learner signs in and arrives on a learning page
- **THEN** recording starts there

### Requirement: Recordings contain no typed input, no network payloads and no console output

Recordings SHALL mask the value of every input. They SHALL NOT capture the body or the headers of any network request, and SHALL NOT capture the browser console. These SHALL be set in the client's own options, so a setting changed in the PostHog project cannot enable them.

The sign-in, sign-up and change-password requests carry the password in their body.

#### Scenario: A typed value is masked
- **WHEN** a recorded session shows a learner typing a new name on the profile page
- **THEN** the recording shows masked characters, not the name typed

#### Scenario: Request bodies are not captured
- **WHEN** the client is initialized
- **THEN** network body capture, network header capture and console capture are disabled in its options

### Requirement: Errors are not sent to PostHog

The client SHALL NOT capture exceptions. Errors are reported to Sentry, whose pipeline removes email addresses and message bodies.

#### Scenario: Exception capture is off
- **WHEN** the client is initialized
- **THEN** exception capture is disabled in its options

### Requirement: Deleting an account erases its usage data

When an account is deleted, the application SHALL ask PostHog to delete the person identified by that account ID together with their events and their session recordings. The request SHALL be made from the server with a personal API key that is never exposed to the browser. A failed request SHALL NOT prevent the account from being deleted; it SHALL be reported to Sentry so the erasure can be completed by hand.

When the project token is configured, the personal API key and the project ID SHALL be required, and a deployment missing either SHALL fail.

#### Scenario: Deletion reaches PostHog
- **WHEN** a learner confirms the deletion of their account
- **THEN** PostHog receives a request to delete that person with their events and recordings

#### Scenario: A PostHog outage does not block deletion
- **WHEN** the erasure request fails
- **THEN** the account is still deleted and one Sentry event is captured, carrying the account ID and no email address

#### Scenario: A learner who never consented
- **WHEN** an account with no PostHog person is deleted
- **THEN** the deletion completes and nothing is reported as an error

#### Scenario: Erasure cannot be left unconfigured
- **WHEN** the environment sets the project token without the personal API key or the project ID
- **THEN** the server environment fails validation, naming the missing variable
