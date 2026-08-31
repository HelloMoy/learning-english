import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";

/**
 * Production seed: the only course available in v1, with two modules and
 * a video lesson + a reading lesson + a resource.
 *
 * Identity is locked here so driving adapters (Storybook, Next.js Page)
 * and unit tests share the same fixture. To add a course, define it here
 * and pass it to both adapters.
 */
export const SEED_COURSE_ID = "11111111-1111-4111-8111-111111111111";
export const SEED_MODULE_A_ID = "33333333-3333-4333-8333-333333333331";
export const SEED_MODULE_B_ID = "33333333-3333-4333-8333-333333333332";
export const SEED_LESSON_VIDEO_ID = "22222222-2222-4222-8222-222222222220";
export const SEED_LESSON_READING_A_ID = "22222222-2222-4222-8222-222222222221";
export const SEED_LESSON_READING_B_ID = "22222222-2222-4222-8222-222222222222";
export const SEED_RESOURCE_PDF_ID = "44444444-4444-4444-8444-444444444441";
export const SEED_RESOURCE_SLIDES_ID = "44444444-4444-4444-8444-444444444442";
export const SEED_RESOURCE_CODE_ID = "44444444-4444-4444-8444-444444444443";

export const seedCourse = Course.parse({
  id: SEED_COURSE_ID,
  slug: "english-a1-pronunciation",
  title: "Basic — Foundational Pronunciation",
  description:
    "Pronunciation fundamentals for English A1 learners: vowels, consonant clusters, and word stress.",
  language: "en",
  lessonCount: 3,
  moduleCount: 2,
  // The entry level of the ladder. The filesystem-backed course generated
  // into `seed-content.ts` sits above it at 2.
  sequence: 1,
});

export const seedModules = [
  Module.parse({
    id: SEED_MODULE_A_ID,
    courseId: SEED_COURSE_ID,
    slug: "vowels-and-video-intro",
    title: "Vowels and video intro",
    sequence: 1,
  }),
  Module.parse({
    id: SEED_MODULE_B_ID,
    courseId: SEED_COURSE_ID,
    slug: "consonants-and-stress",
    title: "Consonants and stress",
    sequence: 2,
  }),
];

export const seedLessons = [
  // Module 1 — the video lecture, then a reading drill.
  Lesson.parse({
    kind: "video",
    id: SEED_LESSON_VIDEO_ID,
    courseId: SEED_COURSE_ID,
    moduleId: SEED_MODULE_A_ID,
    sequence: 1,
    title: "Vowels: short vs. long",
    description:
      "A 10-minute walkthrough of the five short/long vowel pairs in English, with pronunciation drills.",
    source: "/videos/vowels-short-vs-long.mp4",
    durationSeconds: 600,
    poster: "/thumbnails/vowels-short-vs-long.jpg",
  }),
  Lesson.parse({
    kind: "reading",
    id: SEED_LESSON_READING_A_ID,
    courseId: SEED_COURSE_ID,
    moduleId: SEED_MODULE_A_ID,
    sequence: 2,
    title: "Drills: minimal pairs",
    body: "Practice distinguishing short and long vowels with these minimal pairs: ship/sheep, bit/beat, full/fool, hat/hot, pool/pole.",
  }),
  // Module 2 — a reading lesson, no video in v1.
  Lesson.parse({
    kind: "reading",
    id: SEED_LESSON_READING_B_ID,
    courseId: SEED_COURSE_ID,
    moduleId: SEED_MODULE_B_ID,
    sequence: 1,
    title: "Word stress patterns",
    body: "Two-syllable nouns usually stress the first syllable (PResent, REcord); two-syllable verbs usually stress the second (preSENT, reCORD). Three-syllable words follow predictable patterns.",
  }),
];

export const seedResources = [
  Resource.parse({
    id: SEED_RESOURCE_PDF_ID,
    lessonId: SEED_LESSON_VIDEO_ID,
    title: "Vowel chart",
    url: "/handouts/vowel-chart.pdf",
    kind: "pdf",
  }),
  Resource.parse({
    id: SEED_RESOURCE_SLIDES_ID,
    lessonId: SEED_LESSON_READING_A_ID,
    title: "Minimal pairs",
    url: "/handouts/minimal-pairs.pdf",
    kind: "slides",
  }),
  Resource.parse({
    id: SEED_RESOURCE_CODE_ID,
    lessonId: SEED_LESSON_READING_A_ID,
    title: "Drill script",
    url: "/handouts/minimal-pairs.zip",
    kind: "code",
  }),
];
