## 1. Course model: audience and highlights

- [x] 1.1 (TDD: test → impl) `Course` and `CourseTranslation` accept optional `audience` (non-empty) and `highlights` (non-empty points); `CourseManifest` parses them and rejects empty values naming the course; `flattenCourseManifests` passes them through
- [x] 1.2 (TDD: test → impl) `courseCopy` returns `audience` and `highlights` from the locale's translation, falling back to the manifest's own, and none/empty when undeclared
- [x] 1.3 (TDD: test → impl) The tracked manifests declare an audience and three highlights for every course, translated to es and pt with as many highlights as their own (content test first, then `src/content/*.json`)

## 2. Lobby ordering

- [x] 2.1 (TDD: test → impl) `courseLobby` in `src/lib/course-lobby/` returns the featured course, the other enrolled courses, then every not-joined course (recommended merged back) in `sequence` order

## 3. Components

- [x] 3.1 (TDD: test → impl) `CourseBrief`: For + You'll learn from `courseCopy` for the active locale; renders nothing without either; messages in en/es/pt; story; JSDoc
- [x] 3.2 (TDD: test → impl) `CoursePoster` enrolled body: artwork, Level/Reference + Enrolled/Completed chips, ring, Resume at / Next up line, title, brief, progress line, Continue/Start/Watch again + View course, progress edge; messages; story; JSDoc
- [x] 3.3 (TDD: test → impl) `CoursePoster` joinable body: artwork, Level/Reference chip, facts, title, brief, prizes to win, Enroll (optimistic) + Preview course
- [x] 3.4 (TDD: test → impl) `NextUpBar`: thumbnail, "Next up · course", first video title, "Module NN · 0 of V videos · T left", 0 % ring, Start course + View course; messages; story; JSDoc
- [x] 3.5 (TDD: test → impl) `AvailableCoursesView`: next-up bar above the heading only with no enrollment, one poster per catalog course in lobby order, poster-shaped placeholders while pending; update its story and messages
- [x] 3.6 Remove `CourseCinemaHero`, `EnrolledCourseCard`, `CourseShelfCard` with their stories, tests and message namespaces in en/es/pt

## 4. End-to-end

- [x] 4.1 (TDD: test → impl) Update `available-courses.spec.ts` to the poster lobby (enroll persists, reference poster, last watched leads) and add the new-learner bar scenario; move `course-detail-page.spec.ts`'s Preview step to the poster
- [x] 4.2 Visual check of `/es/courses` with and without enrollments, desktop and phone, light and dark, with Playwright MCP

## 5. Verification

- [x] 5.1 Run `pnpm verify` and `pnpm test:e2e` for the touched specs (`available-courses`, `course-detail-page`); all green

## 6. Secondary action copy

- [x] 6.1 (TDD: test → impl) An enrolled poster's secondary action reads **View progress** (es "Ver avance", pt "Ver progresso"); a joinable poster's reads **View details** (es "Ver detalles", pt "Ver detalhes"); e2e follows the new name
- [x] 6.2 Run the poster and view tests, `pnpm verify`, and the `available-courses` / `course-detail-page` e2e specs

## 7. Course page address from develop

- [x] 7.1 (TDD: test → impl) **View details** on a joinable poster and **View course** on the next-up bar open `courseDetailPath` (`/courses/<slug>/about`); **View progress** keeps `courseOverviewPath`
- [x] 7.2 Run the touched tests, `pnpm verify`, and the `available-courses` / `course-detail-page` e2e specs
