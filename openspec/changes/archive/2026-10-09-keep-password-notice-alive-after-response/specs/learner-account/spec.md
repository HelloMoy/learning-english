## MODIFIED Requirements

### Requirement: A completed password change notifies the account

Whenever an account's password is actually replaced, the application SHALL email the address the
account is registered with to say so, in the locale the learner acted in. Both routes that replace a
password SHALL notify: the change-password form on the Profile page, and a reset completed through
the emailed link.

The notice SHALL state that the password changed and that the account's other sessions were signed
out. It SHALL NOT carry a reset token, a password, or any part of one. Its one link SHALL open
`/[locale]/forgot-password`, so a learner who did not make the change asks for a reset themselves
from a page that proves they hold the address — a notice carrying a ready-made key would hand the
account to whoever is reading the inbox, which is the very person it warns about.

A request that was refused SHALL send nothing. Sending is decided on the outcome, not on the
attempt, so a wrong current password, a spent reset token or a rate-limited burst notifies nobody.
Better Auth runs its `after` hooks even for a request that answered with an error, so the check is
explicit rather than implied.

The notice SHALL NOT block the response: a learner who changed their password waits for the change,
not for the mail server.

The notice SHALL outlive the response. Not waiting for it is not the same as abandoning it: on a
serverless platform an invocation is suspended once its response is out, and a send that nobody
registered is cut off mid-connection. The send SHALL therefore be handed to the platform's
after-response mechanism, which keeps the invocation alive until the mail server has answered. It
SHALL NOT be started as a bare unawaited promise.

#### Scenario: Changing the password from the Profile page notifies the learner
- **WHEN** a signed-in learner completes the change-password form on `/es/profile`
- **THEN** Mailpit holds one Spanish notice for their address, saying the password changed and the other devices were signed out

#### Scenario: A reset through the emailed link notifies too
- **WHEN** a learner sets a new password through the link from `/en/forgot-password`
- **THEN** Mailpit holds a notice for their address, in addition to the reset email that started the flow

#### Scenario: A wrong current password notifies nobody
- **WHEN** the change-password form is submitted with the wrong current password
- **THEN** the request is refused and no notice is sent

#### Scenario: A spent reset link notifies nobody
- **WHEN** a reset link is opened and submitted a second time
- **THEN** the request is refused and no second notice is sent

#### Scenario: The notice is handed to the platform rather than left running
- **WHEN** a password is replaced, by either route
- **THEN** the response is returned without the notice having been sent, and exactly one piece of after-response work is registered, which sends the notice when the platform runs it

#### Scenario: A refused attempt registers no work
- **WHEN** a password change or a reset is refused
- **THEN** no after-response work is registered
