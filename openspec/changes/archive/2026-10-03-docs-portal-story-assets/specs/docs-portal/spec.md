## ADDED Requirements

### Requirement: Media addressed by stories loads on the published Storybook

The published site SHALL serve, at its root, the public asset folders that
stories address with root-relative paths — `videos/`, `thumbnails/`
and `local-filesystem-lesson/` — copied from the Storybook build
by the last step of `pnpm portal:build`, which SHALL fail when one of them is
missing from that build. Every root-relative public asset path that a story
file names SHALL start with one of the mirrored folders, and a test MUST fail
otherwise.

#### Scenario: A lesson story on the published site
- **WHEN** `LessonView/LessonView › No Resources` is opened on https://docs.english-course.online/storybook/
- **THEN** `/thumbnails/vowels.jpg` and `/videos/vowels.mp4` load with a 200

#### Scenario: The assembled site carries the media
- **WHEN** `pnpm portal:build` has run
- **THEN** `docs-portal/dist/videos/`, `docs-portal/dist/thumbnails/` and `docs-portal/dist/local-filesystem-lesson/` hold the same files as their copies under `docs-portal/dist/storybook/`

#### Scenario: A story addresses a folder that is not mirrored
- **WHEN** a story names `/audio/intro.mp3`
- **THEN** the story-asset test fails naming the story file and the path
