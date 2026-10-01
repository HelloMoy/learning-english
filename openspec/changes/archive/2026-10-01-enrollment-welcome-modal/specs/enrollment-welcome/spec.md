## ADDED Requirements

### Requirement: Enrolling from the course page opens a welcome dialog

Activating **Enroll** on the course page (`course-detail-page`) SHALL open a welcome dialog at once,
without waiting for the server, from any of the page's enroll actions — the hero, the enroll card
and the narrow-viewport bottom bar — and on both routes that render the course page.

The welcome SHALL NOT open:

- when a page loads for a learner already enrolled in the course;
- when a learner is enrolled by opening a lesson (`course-enrollment`);
- when a learner is enrolled by the onboarding's first-course step.

#### Scenario: Enrolling welcomes the learner
- **WHEN** a learner not enrolled in `advanced-intermediate-course` activates **Enroll** on its course page
- **THEN** a dialog named **You’re in!** opens before the server answers

#### Scenario: Any enroll action welcomes
- **WHEN** the learner activates **Enroll** in the bottom bar on a narrow viewport
- **THEN** the same dialog opens

#### Scenario: An enrolled learner's visit is silent
- **WHEN** a learner already enrolled in a course opens its course page
- **THEN** no welcome dialog opens

#### Scenario: Opening a lesson enrolls without a welcome
- **WHEN** a learner with no enrollment opens a lesson of a course
- **THEN** they are enrolled and no welcome dialog opens

### Requirement: The welcome names the course and the video it starts with

The dialog SHALL show an **Enrolled** mark, the title **You’re in!** as its accessible name, and a
description naming the course by its title and stating that it is now in My learning.

When the course has a video to open — the video the page's enrolled action opens
(`continue-target`) — the dialog SHALL show that video's poster as decoration, hidden from assistive
technology, and the description SHALL name that video by its title and its duration as `mm:ss`. A
video without a poster SHALL render no poster. A course with no videos SHALL render no poster and
name no video.

Titles SHALL render as the manifest declares them.

#### Scenario: The first video is named
- **WHEN** a learner with nothing watched enrolls in the Advanced Intermediate Course
- **THEN** the dialog shows the poster of `Welcome`, and reads that `Advanced Intermediate Course` is now in My learning and to start with `Welcome` (`03:15`)

#### Scenario: A course with no videos
- **WHEN** a learner enrolls in a course that holds no video
- **THEN** the dialog names the course, shows no poster and names no video

### Requirement: The welcome offers to start the course or to keep exploring

The dialog's primary action SHALL be the same link the course page's enroll actions show once the
learner is enrolled (`course-detail-page`): the same label — **Start course**, **Continue where you
left off** or **Watch again** — and the same destination. Activating it SHALL close the dialog and
open that video. A course with no videos SHALL offer no such link.

The dialog SHALL offer **Keep exploring**, which closes it and leaves the learner on the course
page in its enrolled state. The dialog SHALL also close on `Escape`, on its close control and on a
press outside it.

Closing without starting the course SHALL return focus to the enroll action the learner activated,
which by then reads **Start course**.

#### Scenario: Start course opens the first video
- **WHEN** the learner activates **Start course** in the dialog
- **THEN** the dialog closes and the lesson page of the course's first video opens

#### Scenario: Keep exploring stays on the page
- **WHEN** the learner activates **Keep exploring**
- **THEN** the dialog closes, the course page stays in its enrolled state, and focus is on the action that reads **Start course**

#### Scenario: Escape closes the welcome
- **WHEN** the learner presses `Escape`
- **THEN** the dialog closes and the course page stays in its enrolled state

#### Scenario: The dialog and the page agree
- **WHEN** the dialog is open
- **THEN** its primary action has the label and the destination of the page's enroll actions

### Requirement: The welcome is celebrated with the lesson-completion confetti

Opening the welcome SHALL fire the confetti burst that celebrates completing a lesson
(`lesson-completion-celebration`), once, from the same shared code, so the two celebrations cannot
drift apart. The burst SHALL keep that capability's rules: it SHALL NOT animate for a viewer who
asks for reduced motion, the library SHALL be loaded on demand rather than in the course page's
bundle, and a failure to load or to draw SHALL NOT break the enrollment, the dialog or the page.

#### Scenario: Enrolling fires the burst
- **WHEN** the learner activates **Enroll** on the course page
- **THEN** the confetti burst is fired once

#### Scenario: A reduced-motion learner enrolls
- **WHEN** a learner whose system reports `prefers-reduced-motion: reduce` enrolls
- **THEN** no confetti animation plays and the dialog opens as it does otherwise

#### Scenario: A failed burst does not break the welcome
- **WHEN** the confetti library fails to load
- **THEN** the learner is still enrolled and the dialog still opens

### Requirement: A refused enrollment withdraws the welcome

The dialog SHALL close on its own when the server refuses the enrollment and the client withdraws
it (`course-enrollment`). The course page SHALL then offer **Enroll** again, as it does today.

#### Scenario: The server refuses
- **WHEN** the learner activates **Enroll** and `enrollInCourseAction` answers with a server error
- **THEN** the dialog closes without the learner acting and every enroll action reads **Enroll** again

### Requirement: The welcome is localized

Every string the dialog renders that is not course content SHALL come from the `Components.*`
namespaces in `en`, `es` and `pt`.

#### Scenario: Spanish welcome
- **WHEN** a learner enrolls in the Advanced Intermediate Course under `/es`
- **THEN** the dialog is named **¡Ya estás dentro!**, its mark reads **Inscrito**, and its actions read **Empezar el curso** and **Seguir explorando**

#### Scenario: Portuguese welcome
- **WHEN** a learner enrolls under `/pt`
- **THEN** the dialog's actions read **Começar o curso** and **Continuar explorando**
