## Context

The catalog is declared in `src/content/<slug>.json`, one manifest per course, listed in
`src/content/courses.ts`. Each lesson of the two courses:

- streams from a YouTube embed;
- declares its `durationSeconds`;
- points at a locally stored `thumbnail.jpeg` poster and a trilingual `readme.md`, both tracked under
  `public/local-filesystem-lesson/<course>/`.

IDs are UUIDv5 over `course:`, `module:`, `lesson:` and `resource:` names (`scripts/uuid.ts`).

`sync:manifest` cannot generate this course: it treats a lesson folder without an `.mp4` as a reading
lesson. The manifest is the hand-owned source of truth anyway.

`Course.sequence` does two jobs. It orders the catalog, and it is printed as "Level N" in about a
dozen places:

- the levels table and the home view;
- `catalog-levels.ts` and `home-first-lesson.ts`;
- course shelf and `use-course-shelf`;
- first-course step, cinema hero, enrolled card, shelf card;
- the course sharing image;
- learner achievements.

Several of those places also take `entries[0]` as "the first course". The learner's distinction is
gold when every course holding lessons is complete, and it is computed live, never stored.

The user chose to keep the new course **outside the levels**: a reference course, not a rung.

## Goals / Non-Goals

**Goals:**

- Ship the Atlas of American Sounds (12 modules, 63 lessons) the same way the other two courses
  ship. That means YouTube sources, local posters, trilingual notes, tracked text assets and
  UUIDv5 IDs.
- Give courses a `track` (`level` | `reference`), and let every "Level N" and "first course" surface
  read it, so a reference course never pretends to be a rung.
- Keep today's two courses rendering exactly as now: Level 1 and Level 2, the same recommendation,
  the same distinction.

**Non-Goals:** see the proposal. In short: no hotlinked posters, no change to the Basic Course, and no
sound search.

## Decisions

### D1. Posters are downloaded, not hotlinked from `i.ytimg.com`

All 63 videos expose `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` at 1280×720. That was checked
for every ID: 63 × HTTP 200, about 2.9 MB in total. It is the same size and format as the existing
posters. Each one is saved as `<lesson>/thumbnail.jpeg`, and the manifest's `poster` is the content key.

*Alternative considered: hotlink.* The manifest schema already accepts an absolute URL for `poster`.
The app would still refuse it, for three reasons:

- `next/image` refuses hosts outside `images.remotePatterns`, which `next.config.ts` derives only from
  the stores in `content-locations.json`;
- `i.ytimg.com` is not a store, so allowing it means a hand-added host and a special case in a config
  whose whole promise is "derived from the location manifest";
- the `course-content-storage` spec says an external URL affects `source` only, and posters keep
  content keys.

Hotlinking also makes every catalog render depend on YouTube's image CDN, including in e2e and offline
dev. And `maxresdefault` is not guaranteed for every future video. Downloading costs 3 MB of tracked
JPEGs and one `.gitignore` line. The one thing it loses is automatic pickup if the channel changes a
thumbnail, which is acceptable for a reference course.

### D2. `track` on the course, standing derived in the domain

- `Course` gains `track: z.enum(["level", "reference"])`, required in the domain.
- The manifest schema declares `track` with `.default("level")`, the same pattern as `draft`. The
  existing manifests stay untouched.
- `sequence` keeps its current job, and only that job: it orders the whole catalog and stays unique.

The level number is **derived** by a pure domain function over the listed courses:
`courseStandings(courses) → Map<CourseId, Standing>`, where
`Standing = { kind: "level"; number } | { kind: "reference" }`. `findCourseCatalog` attaches the
standing to each entry. Everything downstream (course views, home levels, shelf, cards, sharing
image, achievements) reads `standing` instead of `course.sequence`.

Alternatives considered:

- **Keep "Level N" = `sequence` and give the Atlas sequence 3.** This is cheapest, but the next level
  course would have to take sequence 4 and would print "Level 4". Order and number are coupled again.
- **Declare `level: n` in the manifest.** Two fields would then carry the same fact for every level
  course, and they can drift.
- **Make `Course` itself a discriminated union by track.** Every `Course` consumer would have to
  narrow, including those that never print a level: lesson pages, enrollment, JSON-LD. Putting the
  standing on the catalog entry confines the change to the places that talk about levels.

`findCourseForView` carries the standing too, because the course overview's
sharing image and the Available courses cards are built from `CourseForView`, not from
catalog entries. A single course cannot be numbered alone, so the use case also calls
`listAvailable()` and derives the standing through `standingInCatalog`, which places the
course among the catalog by its `sequence` even if the catalog omits it. The extra read is
one in-memory call. The "no extra repository call" guarantee applies to `findCourseCatalog`
only, which still derives every standing from the list it already loaded.

Removing the `sequence` reads is safe to do mechanically: after the change, `rg "course\.sequence"`
outside sorting code SHALL find nothing. Sorting stays on `sequence`.

### D3. "The first course" means the first level course

`catalog-levels.ts` (`firstLearnerLevel`), `home-view` (the hero note), `home-first-lesson.ts`, the
first-course page and `course-shelf.ts` (the no-enrollment recommendation) all stop taking
`entries[0]`. They pick the entry whose standing is level 1, through one shared helper so that the
rule lives in one place.

With today's data the result is identical: Basic is both `entries[0]` and level 1.

### D4. Home: two tables, one row design

The levels table keeps its component and renders level entries only. Its heading counts level
courses.

Reference entries render after it through the same row design, under a new localized heading
(e.g. "Reference · for any level"). The row's ordinal cell shows **Reference**. The row takes the
standing and renders `Level {number}` or `Reference` itself, so both tables share one row and cannot
drift apart.

The loading shell (`src/app/[locale]/loading.tsx`) adds one reference-row shape under its two
level-row shapes, and its comment is updated.

### D5. Available courses and cards

- `CourseCinemaHero`, `EnrolledCourseCard` and `CourseShelfCard` receive the standing, and print
  `Level {n}` or `Reference`.
- `use-course-shelf`'s `highestEnrolledLevel` takes the max over enrolled **level** standings, and is
  `null` when there are none, which already renders "Start here".
- The recommended course when nothing is enrolled goes through the D3 helper.

### D6. Distinction

`distinctionFor` weighs **level** courses for gold. It still counts any complete course, reference
included, for bronze. The Atlas's tickets and prizes are otherwise ordinary.

The rewards guide's gold line becomes "Complete every level to turn it gold" in `en`, `es` and `pt`.

Each of the Atlas's 12 modules gets its own prize (D10).

### D7. The manifest is written by a throwaway generator, not by `sync:manifest`

A one-off script in the session scratchpad reads the lesson plan below, derives every ID with
`scripts/uuid.ts`, and writes `src/content/atlas-of-american-sounds.json`. The script is not
committed; the manifest is the artifact, and its diff is the review. The same script downloads the
63 thumbnails.

`sync:manifest` is not taught about YouTube-only folders: that is a tooling change with its own
blast radius, and adding a course is rare.

Each lesson has:

- `kind: "video"`;
- `source` set to the embed URL;
- `durationSeconds` taken from the playlist;
- `poster` and `notesKey` set to content keys;
- one notes resource, `{ title: "<lesson title> Notes", kind: "other" }`, like the existing lessons;
- `description`: one sentence written per lesson, never the "Resource below" placeholder.

### D8. Notes are grounded in each video and checked mechanically

Each `readme.md` opens with `# <lesson title>`, followed by the three mirrored sections in the Basic
Course's shape: how it's made, where you hear it, the typical mistake and "by the end you'll be able
to".

To stay within what each video teaches, notes are written from the video's own YouTube description
and captions where they can be fetched. Where they cannot, the notes keep to the sound's articulation
and example words, which every single-sound video covers.

Two specific requirements: each section states the typical mistake for its own readers (Spanish vs.
Portuguese), and the Vowel Chart notes say the video's chart is no longer interactive. Every notes
file credits Sounds American.

`scripts/verify-notes-shape` tests switch from importing the two course JSONs to `courseManifests`, so
the Atlas, and any future course, is checked automatically.

Notes are written module by module. Nothing is committed until all 63 pass and the user has
reviewed them. The manifest never carries `draft`, because `draft-course-visibility` requires that no
tracked manifest be a draft.

### D9. Slugs and titles

Module slugs are `<n>-<family>` (`2-front-vowels`, …). None collides with the 15 existing module
slugs, which matters because prize claims are keyed by module slug.

Lesson slugs are `<n>-<ascii-name>-as-in-<word>`, using the ASCII names the Basic Course already uses
(`schwa`, `ih`, `ae`, `uu`, `dzh`, …). Contrasts use their pair (`6-sheep-or-ship`).

Titles use IPA and typographic quotes, e.g. `/æ/ as in “cat”`.

### D10. Twelve new prizes, drawn like the existing sixteen

`module-prizes.test.ts` already fails when any shipped module falls back to the gift box. The Atlas
therefore needs 12 catalogued prizes, and they ship in this change.

**Wiring.** `PRIZE_IDS` gains, in module order:

- `compass`, `xylophone`, `maracas`, `trumpet`;
- `boomerang`, `skate`, `popper`, `pinwheel`;
- `jackbox`, `bell`, `duck`, `kite`.

`gift` stays last. `PRIZE_BY_MODULE_SLUG` gains the 12 Atlas slugs. `PrizeIcon.names` gains one name
per prize in each locale:

| id | en | es | pt |
| --- | --- | --- | --- |
| compass | Compass | Brújula | Bússola |
| xylophone | Xylophone | Xilófono | Xilofone |
| maracas | Maracas | Maracas | Maracas |
| trumpet | Trumpet | Trompeta | Trompete |
| boomerang | Boomerang | Bumerán | Bumerangue |
| skate | Roller skate | Patín | Patins |
| popper | Party popper | Lanzaconfeti | Lança-confete |
| pinwheel | Pinwheel | Rehilete | Cata-vento |
| jackbox | Jack-in-the-box | Caja sorpresa | Caixa surpresa |
| bell | Bell | Campana | Sino |
| duck | Rubber duck | Patito de hule | Patinho de borracha |
| kite | Kite | Papalote | Pipa |

The Spanish names follow the Mexican register `es.json` already uses ("Trompo", "Carrito de
carreras").

**Drawing.** Each prize is one more entry in `PRIZE_SHAPES` (`prize-icon.tsx`), with the same
contract as the existing ones:

- a function of `{ main, detail, light }` returning a handful of `rect`, `circle`, `ellipse`, `path`
  and `polyline` shapes on the 64-unit grid;
- no gradients, no new colours and no text.

A silhouette sets all three paints to `--prize-silhouette`. The outline alone must therefore say what
the toy is, so each design is chosen for a distinctive outline first: the popper's cone and burst, the
pinwheel's four vanes on a stick, the kite's diamond and tail, the skate's boot on wheels. Interior
detail is only a bonus.

**Review loop.** The existing `prize-icon` story renders every `PRIZE_IDS` entry, so each new prize
appears automatically. Each one is checked in Storybook with Playwright MCP, in colour and as a
silhouette, beside the existing sixteen. It has to be:

- recognisable at the counter's smallest size;
- consistent in weight;
- distinct in outline from every other prize.

It is redrawn until it passes. The prize-reveal and prize-ready modals need no change: they draw
whatever `PrizeIcon` is given.

*Alternative considered: ship the gift box now and add artwork later.* Rejected: the user asked for the
prizes in this change, and the catalog test forbids gift-box fallbacks for shipped modules anyway.

### Lesson plan

Total: 63 lessons, 36,075 s (about 10 h 01 min). Durations come from the channel's playlists.

**1. The Vowel Map** (`1-the-vowel-map`, 2 lessons, 42 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-the-vowel-chart` | The Vowel Chart | `7EdRAfOMfnU` | 1791 |
| `2-long-and-short-vowels` | Long and Short Vowels | `GQa9w__GqLc` | 767 |

**2. Front Vowels** (`2-front-vowels`, 10 lessons, 66 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-i-as-in-be` | /i/ as in “be” | `PIu5WDIco0I` | 394 |
| `2-ih-as-in-it` | /ɪ/ as in “it” | `Ok_HG-0lNCA` | 379 |
| `3-ei-as-in-make` | /eɪ/ as in “make” | `0RXzfRcjk-s` | 341 |
| `4-eh-as-in-bed` | /ɛ/ as in “bed” | `OLG3cCLcNiI` | 341 |
| `5-ae-as-in-cat` | /æ/ as in “cat” | `mynucZiy-Ug` | 324 |
| `6-sheep-or-ship` | Sheep or Ship? /i/ vs /ɪ/ | `FYI6Vt3uq7s` | 411 |
| `7-did-or-dead` | Did or Dead? /ɪ/ vs /ɛ/ | `m7JQRKkY7cc` | 439 |
| `8-taste-or-test` | Taste or Test? /eɪ/ vs /ɛ/ | `29AKpIou3kM` | 479 |
| `9-made-or-mad` | Made or Mad? /eɪ/ vs /æ/ | `MKX_2yF-Fqo` | 437 |
| `10-bed-or-bad` | Bed or Bad? /ɛ/ vs /æ/ | `GnWPcvI20Uk` | 430 |

**3. Central Vowels** (`3-central-vowels`, 4 lessons, 23 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-schwa-as-in-ago` | /ə/ as in “ago” | `m1mDSUSwNls` | 332 |
| `2-uh-as-in-us` | /ʌ/ as in “us” | `X1utTZqC3AI` | 328 |
| `3-ah-as-in-got` | /ɑ/ as in “got” | `R5CY1UniS68` | 327 |
| `4-bus-or-boss` | Bus or Boss? /ʌ/ vs /ɑ/ | `MqcCCFptaJk` | 416 |

**4. Back Vowels** (`4-back-vowels`, 5 lessons, 30 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-u-as-in-blue` | /u/ as in “blue” | `lkM6CKBM2ns` | 343 |
| `2-uu-as-in-put` | /ʊ/ as in “put” | `moLTR-dLQQY` | 342 |
| `3-ou-as-in-go` | /oʊ/ as in “go” | `4kPJLHiiGdU` | 340 |
| `4-aw-as-in-on` | /ɔ/ as in “on” | `pr_KAu-_Hmo` | 350 |
| `5-low-or-law` | Low or Law? /oʊ/ vs /ɔ/ | `ZEqiQgoHgGo` | 476 |

**5. Diphthongs** (`5-diphthongs`, 3 lessons, 29 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-ai-as-in-like` | /aɪ/ as in “like” | `8uD-GuuSgyk` | 596 |
| `2-au-as-in-cloud` | /aʊ/ as in “cloud” | `-V690OA75bA` | 600 |
| `3-oi-as-in-boy` | /ɔɪ/ as in “boy” | `ZfjPBN22mK8` | 550 |

**6. R-Colored Vowels** (`6-r-colored-vowels`, 9 lessons, 90 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-r-colored-vowels-overview` | R-Colored Vowels Overview | `ZJnrTGH3aXo` | 500 |
| `2-ur-as-in-first` | /ɝ/ as in “first” | `6ppOrwjvslc` | 621 |
| `3-er-as-in-after` | /ɚ/ as in “after” | `AzNRoSGBh44` | 511 |
| `4-ir-as-in-hero` | /ɪr/ as in “hero” | `X0bkG5ZfzH4` | 591 |
| `5-air-as-in-chair` | /ɛr/ as in “chair” | `ZjurI7xtCjE` | 641 |
| `6-ar-as-in-car` | /ɑr/ as in “car” | `x6E2L2vLH78` | 608 |
| `7-or-as-in-sport` | /ɔr/ as in “sport” | `ZbDrxmP4_S4` | 676 |
| `8-ire-as-in-fire` | /aɪr/ as in “fire” | `PdV7RymsiMY` | 679 |
| `9-r-colored-vowels-exercise` | R-Colored Vowels: Advanced Exercise | `GbbBpiMVbi0` | 625 |

**7. Stop Consonants** (`7-stop-consonants`, 9 lessons, 84 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-stop-consonants-overview` | Stop Consonants Overview | `yFPbLcUCraQ` | 739 |
| `2-p-as-in-pie` | /p/ as in “pie” | `V_n_rUKQSew` | 532 |
| `3-b-as-in-boy` | /b/ as in “boy” | `LbCOXRz7Uf8` | 529 |
| `4-t-as-in-toy` | /t/ as in “toy” | `mLlotV_0dRI` | 608 |
| `5-flap-t-as-in-water` | Flap T /t̬/ as in “water” | `9b-UIkuwOdU` | 415 |
| `6-glottal-t-as-in-button` | Glottal T /ʔ/ as in “button” | `Vabg-EUHOQk` | 578 |
| `7-d-as-in-dog` | /d/ as in “dog” | `N73xPe0x79g` | 519 |
| `8-k-as-in-key` | /k/ as in “key” | `zxrveu6yu6E` | 603 |
| `9-g-as-in-gift` | /g/ as in “gift” | `vP5XKYvxe0Q` | 538 |

**8. Fricatives** (`8-fricatives`, 9 lessons, 107 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-f-as-in-fun` | /f/ as in “fun” | `05f62-73nrY` | 844 |
| `2-v-as-in-very` | /v/ as in “very” | `U5Oro6v0klg` | 864 |
| `3-voiceless-th-as-in-think` | /θ/ as in “think” | `qC0l6GQZtM4` | 470 |
| `4-voiced-th-as-in-this` | /ð/ as in “this” | `EZb_EWVCUoE` | 444 |
| `5-s-as-in-sun` | /s/ as in “sun” | `6hWPXaPXrnQ` | 802 |
| `6-z-as-in-zoo` | /z/ as in “zoo” | `ky7Jh9Bbjts` | 745 |
| `7-sh-as-in-show` | /ʃ/ as in “show” | `wINb4HFguck` | 749 |
| `8-zh-as-in-vision` | /ʒ/ as in “vision” | `k8ImSmVOSVA` | 594 |
| `9-h-as-in-home` | /h/ as in “home” | `dV6At0g4n78` | 937 |

**9. Affricates** (`9-affricates`, 2 lessons, 27 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-ch-as-in-chair` | /tʃ/ as in “chair” | `WoyI_omRpcw` | 825 |
| `2-dzh-as-in-job` | /dʒ/ as in “job” | `zJJ3hhHtjtI` | 852 |

**10. Nasals** (`10-nasals`, 4 lessons, 39 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-n-as-in-nice` | /n/ as in “nice” | `1eyr7O4TFmI` | 436 |
| `2-m-as-in-map` | /m/ as in “map” | `tkiN8BsBEfA` | 649 |
| `3-ng-as-in-thing` | /ŋ/ as in “thing” | `5xVq8T88oJw` | 731 |
| `4-thin-or-thing` | Thin or Thing? /n/ vs /ŋ/ | `8bKIm60nK80` | 545 |

**11. Liquids** (`11-liquids`, 4 lessons, 35 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-r-as-in-run` | /r/ as in “run” | `q5a2-KuHkBU` | 432 |
| `2-l-as-in-let` | /l/ as in “let” | `JamM8TgB_AA` | 435 |
| `3-dark-l-as-in-call` | Dark L as in “call” | `ZTgYjGXFAkw` | 793 |
| `4-pray-or-play` | Pray or Play? /r/ vs /l/ | `DKJfeW89lR0` | 478 |

**12. Glides** (`12-glides`, 2 lessons, 23 min)

| Lesson slug | Title | YouTube ID | s |
| --- | --- | --- | --- |
| `1-w-as-in-way` | /w/ as in “way” | `nMB5mX_PGHQ` | 741 |
| `2-y-as-in-yes` | /j/ as in “yes” | `1G8SCotE2yg` | 663 |

## Risks / Trade-offs

- **Notes might claim something the video does not teach.** → Ground them in the captions and
  description (D8), keep them to articulation and example words otherwise, and have the user review
  them before anything is committed.
- **Replacing ~12 `course.sequence` reads is a wide diff.** → The standing is attached in one place
  (the catalog use case). Each surface keeps a test pinned to today's output ("Level 1 · Basic
  Course"), so a regression in the two existing courses fails loudly.
- **The channel deletes or privatizes a video.** → The embed breaks for that lesson only, which is
  the same exposure as the existing courses. The catalog test still enforces unique, well-formed
  embeds.
- **A new prize reads as a blob in silhouette, or looks off-style beside the old ones.** → The D10
  review loop: a Storybook check in both states at counter size, next to the existing set, redrawn
  until it passes.
- **Three courses on "Available courses" / "My learning".** → Those layouts already scale to N
  courses. The e2e specs that hard-code two courses are updated to read the catalog.

## Migration Plan

- No database change. Enrollments and progress are keyed by course slug and lesson ID, and the Atlas
  starts empty for everyone.
- Deploy: the course goes out published, through the usual `develop` preview and then `main`. It
  carries no `draft` flag, which `draft-course-visibility` forbids for tracked manifests.
- Rollback: remove the line from `courses.ts`. Learners' Atlas progress stays stored and simply
  stops rendering.

## Testing strategy

- **Vitest unit:**
  - `course.test.ts` (track accepted/rejected);
  - `course-manifest-schema.test.ts` (default `level`, unknown track fails, sequence still unique
    across tracks);
  - a new `course-standings` test (levels number consecutively around a reference; today's catalog
    gives 1, 2, reference);
  - `find-course-catalog.test.ts` (entries carry standing, no extra repo call);
  - `catalog-levels.test.ts` and `home-first-lesson.test.ts` (first level course even when a
    reference sorts first);
  - `course-shelf.test.ts` and `use-course-shelf.test.ts` (highest level ignores the reference;
    only-reference enrollment gives null);
  - `learner-achievements.test.ts` (gold ignores the reference; reference alone gives bronze);
  - `module-prizes.test.ts` (each Atlas module maps to its prize; the existing "every shipped module
    has its own catalogued prize" test covers the rest);
  - `content-manifest.test.ts` (the Atlas is present with 12 modules / 63 lessons, reference track,
    unique embeds, module slugs disjoint from other courses, local posters, no "Resource below"
    description);
  - `verify-notes-shape.test.ts` over `courseManifests`.

  These mirror the existing GIVEN/WHEN/THEN style in those files and use faker for arbitrary inputs.
- **Vitest + RTL:**
  - `levels-table` (a Reference row);
  - `home-view` (level count excludes the reference; reference section renders only when present);
  - `course-cinema-hero`, `enrolled-course-card`, `course-shelf-card` and `first-course-step`
    ("Reference" vs "Level N");
  - `available-courses-view` (heading N);
  - `achievements-guide-modal` (gold line);
  - `loading.test.tsx` (the reference-row shape);
  - `prize-icon.test.tsx`, whose `test.each(PRIZE_IDS)` already covers every new prize in colour, plus
    the silhouette single-paint check.

  Stories gain a reference variant where a component renders the standing.
- **Playwright e2e:**
  - `home.spec.ts` (the levels table counts level courses; the Atlas row sits in the reference
    section and opens its overview);
  - `available-courses.spec.ts` (courses read from the catalog instead of hard-coded two; a reference
    card reads Reference);
  - `one-click-navigation.spec.ts` (level rows only).

  One smoke path opens an Atlas lesson and asserts its YouTube embed and poster.
- **Visual:** verify the home, Available courses and an Atlas lesson in the browser with Playwright
  MCP at desktop and 390 px.

## Open Questions

- The toy choices and their Spanish and Portuguese names (D10) are a proposal. The user may swap any
  of them before the drawings start.
- Should reference courses appear on the home page, or only under Available courses? This proposal
  lists them on the home in their own section.
