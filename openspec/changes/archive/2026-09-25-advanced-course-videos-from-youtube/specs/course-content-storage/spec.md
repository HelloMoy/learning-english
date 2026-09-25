## MODIFIED Requirements

### Requirement: A lesson's video source may be declared as an external URL

The manifest SHALL support declaring a lesson's `source` as an absolute `http(s)`
URL rather than a content key, for lessons whose video is served by someone else
— the lectures of both the Basic Course and the Advanced Intermediate Course
stream from YouTube.

A value that is neither an absolute `http(s)` URL nor a well-formed content key
SHALL be rejected.

A declared external source SHALL affect `source` only. `poster`,
`Resource.url` and lesson notes keep their content keys and their existing
resolution, so a lesson served from YouTube still carries a locally-stored
thumbnail and locally-stored resources.

A lesson whose `source` is an external URL SHALL NOT require a local video file
to exist. Its `durationSeconds` is declared in the manifest like every other
lesson's, so the local `.mp4` may be deleted without changing what the
application serves. This replaces the previous rule, under which the on-disk
`.mp4` remained the source of `durationSeconds` via `ffprobe` and therefore could
not be removed.

#### Scenario: A declared lesson serves its external URL

- **WHEN** the manifest declares lesson `2-vowels/1-the-vowel-sound-schwa` with
  `source` `https://www.youtube.com/embed/27WXXMFimvE`
- **THEN** that lesson is served with exactly that `source`, and its `poster` is
  still the content key resolved through `BlobStore`

#### Scenario: An Advanced Intermediate lesson serves its external URL

- **WHEN** the manifest declares lesson
  `1-advanced-pronunciation-course/1-welcome` with `source`
  `https://www.youtube.com/embed/QawqoylmKVc`
- **THEN** that lesson is served with exactly that `source`, and its `poster`,
  notes and resources still resolve through `BlobStore`

#### Scenario: A lesson keeping a content key is unaffected

- **WHEN** a lesson declares a `source` that is a content key rather than a URL
- **THEN** the key resolves through `BlobStore` exactly as it does today

#### Scenario: Deleting a hosted lesson's local video changes nothing

- **WHEN** every `.mp4` under the Basic Course and the Advanced Intermediate
  Course is deleted and the app is restarted
- **THEN** all 48 Basic Course lessons and all 107 Advanced Intermediate lessons
  still serve their YouTube `source`, their declared duration and their
  locally-stored poster

#### Scenario: A value that is neither a URL nor a valid key is rejected

- **WHEN** the manifest declares a `source` that is an empty string or a
  site-relative path such as `/videos/x.mp4`
- **THEN** validation fails with a message naming the offending lesson

### Requirement: Video bytes are never tracked by git

The repository SHALL refuse to track video files under the content root,
whichever course they belong to. This SHALL hold independently of which parts of
the content tree are tracked, so that un-ignoring a course's text assets cannot
pull gigabytes of video into the repository.

The non-video assets of every course whose lectures stream from YouTube — lesson
notes, posters, PDFs and the other files its manifest references — SHALL be
tracked, because they are the part of its content tree that cannot be
regenerated and are small enough to version. Today that is the Basic Course and
the Advanced Intermediate Course.

#### Scenario: A video file under a tracked course is still ignored

- **WHEN** a `.mp4` sits inside the Basic Course's or the Advanced Intermediate
  Course's tracked content folder and a developer runs `git status`
- **THEN** the video is not listed as addable content

#### Scenario: The Basic Course's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** the Basic Course's `readme.md`, `thumbnail.jpeg` and PDF files are
  present, and its video files are not

#### Scenario: The Advanced Intermediate Course's text assets are tracked

- **WHEN** a developer clones the repository
- **THEN** every poster, notes file and resource the Advanced Intermediate
  Course's manifest references is present, and none of its video files are

## ADDED Requirements

### Requirement: Every catalog video lesson streams from YouTube

Every lesson of kind `video` declared under `src/content/` SHALL carry a `source`
of the form `https://www.youtube.com/embed/<videoId>`. No lesson in the catalog
SHALL depend on a video file under the content root, so a deployment — which
never carries video bytes — serves every lesson it lists.

A lesson's YouTube video SHALL be unique across the catalog: two lessons SHALL
NOT declare the same embed URL, which is how a copy-paste slip in the mapping
would show up.

#### Scenario: A lesson sourcing a content key is caught

- **WHEN** a manifest under `src/content/` declares a video lesson whose `source`
  is a content key such as `advanced-intermediate-course/3-contractions-reductions/1-intro/video.mp4`
- **THEN** the catalog test fails, naming that lesson

#### Scenario: Two lessons sharing one video are caught

- **WHEN** two lessons in the catalog declare the same YouTube embed URL
- **THEN** the catalog test fails, naming both lessons
