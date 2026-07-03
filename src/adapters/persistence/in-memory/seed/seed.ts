import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";

/**
 * Production seed: the only course available in v0.
 *
 * Identity is locked here so driving adapters (Storybook, Next.js Page)
 * and unit tests share the same fixture. To add a course, define it here
 * and pass it to both adapters.
 */
export const SEED_COURSE_ID = "11111111-1111-4111-8111-111111111111";

export const seedCourse = Course.parse({
  id: SEED_COURSE_ID,
  slug: "english-a1-greetings",
  title: "Basic — Foundational Pronunciation",
  description:
    "Pronunciation fundamentals for English A1 learners: vowels, consonant clusters, and word stress.",
  language: "en",
  lessonCount: 3,
});

export const seedLessons = [
  Lesson.parse({
    kind: "reading",
    id: "22222222-2222-4222-8222-222222222221",
    courseId: SEED_COURSE_ID,
    sequence: 1,
    title: "Vowels: short vs. long",
    body: "In English, vowel length distinguishes meaning: 'ship' vs. 'sheep', 'bit' vs. 'beat'. This lesson introduces short and long vowel pairs and drills minimal contrasts.",
  }),
  Lesson.parse({
    kind: "reading",
    id: "22222222-2222-4222-8222-222222222222",
    courseId: SEED_COURSE_ID,
    sequence: 2,
    title: "Consonant clusters in English",
    body: "Common clusters include str- (strong, street), thr- (three, throw), spr- (spring, sprout), and spl- (splash, split). Practice producing them without inserting vowels.",
  }),
  Lesson.parse({
    kind: "reading",
    id: "22222222-2222-4222-8222-222222222223",
    courseId: SEED_COURSE_ID,
    sequence: 3,
    title: "Word stress patterns",
    body: "Two-syllable nouns usually stress the first syllable (PResent, REcord); two-syllable verbs usually stress the second (preSENT, reCORD). Three-syllable words follow predictable patterns.",
  }),
];
