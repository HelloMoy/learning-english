import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { refreshEarnedTickets } from "@/hooks/use-earned-tickets/use-earned-tickets";
import { refreshPrizeClaims } from "@/hooks/use-prize-claims/use-prize-claims";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

/**
 * Story fixtures for the module route: the Basic Course's Vowels module with
 * its real titles, runtimes and posters, so stories match the page a learner
 * sees rather than an invented list.
 *
 * @internal
 */
const VOWEL_LESSONS: ReadonlyArray<{ slug: string; title: string; durationSeconds: number }> = [
  {
    slug: "1-the-vowel-sound-schwa",
    title: "The Vowel Sound: /ə/ (El más importante)",
    durationSeconds: 663,
  },
  { slug: "2-the-vowel-sound-ih", title: "The Vowel Sound /ɪ/ (e corta)", durationSeconds: 535 },
  { slug: "3-the-vowel-sound-uu", title: "The Vowel Sound /ʊ/ (o corta)", durationSeconds: 444 },
  { slug: "4-schwa-or-strut", title: "Schwa /ə/ or Strut /ʌ/ ?", durationSeconds: 555 },
  { slug: "5-the-weak-vowel-merger", title: "The weak-vowel merger", durationSeconds: 1200 },
  { slug: "6-the-vowel-sound-ae", title: "The vowel sound /æ/ (a ligada)", durationSeconds: 660 },
  { slug: "7-the-vowel-sound-ah", title: "The vowel sound /ɑ/", durationSeconds: 420 },
  { slug: "8-the-vowel-sound-aw", title: "The Vowel sound /ɔ/", durationSeconds: 420 },
  { slug: "9-the-cot-caught-merger", title: "The cot–caught merger!", durationSeconds: 600 },
  { slug: "10-the-vowel-sound-eh", title: "The Vowel Sound /ɛ/", durationSeconds: 540 },
  { slug: "11-the-vowel-sound-u", title: "The Vowel Sound /u/", durationSeconds: 540 },
  { slug: "12-the-vowel-sound-i", title: "The vowel sound /i/", durationSeconds: 540 },
  { slug: "13-diphthong-sound-ai", title: "Diphthong Sound /aɪ/", durationSeconds: 420 },
  { slug: "14-diphthong-sound-au", title: "Diphthong Sound /aʊ/", durationSeconds: 780 },
  { slug: "15-diphthong-sound-oi", title: "Diphthong Sound /ɔɪ/", durationSeconds: 480 },
  { slug: "16-diphthong-sound-ei", title: "Diphthong Sound /eɪ/", durationSeconds: 360 },
  { slug: "17-diphthong-sound-ou", title: "Diphthong Sound /ɔʊ/", durationSeconds: 300 },
];

const STORY_LESSON_ID_PREFIX = "00000000-0000-4000-8000-";

export const vowelsCourse = Course.parse({
  id: CourseId.parse("00000000-0000-4000-8000-00000000c001"),
  slug: "basic-course",
  title: "Basic Course",
  description: "Pronunciation foundations.",
  language: "en",
  lessonCount: VOWEL_LESSONS.length,
  moduleCount: 5,
  sequence: 1,
});

export const vowelsModule = Module.parse({
  id: ModuleId.parse("00000000-0000-4000-8000-000000000002"),
  courseId: vowelsCourse.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 2,
});

export const vowelsLessons: Lesson[] = VOWEL_LESSONS.map(
  ({ slug, title, durationSeconds }, index) =>
    Lesson.parse({
      kind: "video",
      id: LessonId.parse(`${STORY_LESSON_ID_PREFIX}${String(index + 1).padStart(12, "0")}`),
      courseId: vowelsCourse.id,
      moduleId: vowelsModule.id,
      sequence: index + 1,
      title,
      description: title,
      source: "https://www.youtube.com/embed/27WXXMFimvE",
      durationSeconds,
      poster: `/local-filesystem-lesson/basic-course/2-vowels/${slug}/thumbnail.jpeg`,
    }),
);

const COMPLETED_KEY_PREFIX = "learning-english:completed:";
const PLAYBACK_KEY_PREFIX = "learning-english:playback:";
const TICKET_KEY_PREFIX = "learning-english:ticket-earned:";
const PRIZE_CLAIM_KEY = `learning-english:prize-claimed:${vowelsModule.slug}`;

function announceStorageChange(): void {
  refreshSavedPlaybackPositions();
  refreshEarnedTickets();
  refreshPrizeClaims();
  window.dispatchEvent(new StorageEvent("storage", { key: null }));
}

/**
 * Seeds the browser with a learner who finished the first `finishedCount`
 * videos and is `currentFraction` of the way through the next one.
 *
 * Opening the route records the tickets of finished videos, so the cleanup
 * removes those tickets too — otherwise one story's prize would leak into the
 * next.
 *
 * @returns A cleanup that removes the seeded progress and its tickets again
 */
export function seedVowelsProgress(finishedCount: number, currentFraction: number): () => void {
  const finished = vowelsLessons.slice(0, finishedCount);
  const current = vowelsLessons[finishedCount];
  for (const lesson of finished)
    window.localStorage.setItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`, "1");
  if (current?.kind === "video" && currentFraction > 0) {
    window.localStorage.setItem(
      `${PLAYBACK_KEY_PREFIX}${current.id}`,
      String(current.durationSeconds * currentFraction),
    );
  }
  announceStorageChange();

  return () => {
    for (const lesson of vowelsLessons) {
      window.localStorage.removeItem(`${COMPLETED_KEY_PREFIX}${lesson.id}`);
      window.localStorage.removeItem(`${PLAYBACK_KEY_PREFIX}${lesson.id}`);
      window.localStorage.removeItem(`${TICKET_KEY_PREFIX}${lesson.id}`);
    }
    announceStorageChange();
  };
}

/**
 * Seeds a learner who finished every Vowels video and claimed its prize on the
 * counter.
 *
 * @returns A cleanup that removes the progress, the tickets and the claim again
 */
export function seedVowelsPrizeClaimed(): () => void {
  const clearProgress = seedVowelsProgress(vowelsLessons.length, 0);
  window.localStorage.setItem(PRIZE_CLAIM_KEY, "1");
  announceStorageChange();

  return () => {
    window.localStorage.removeItem(PRIZE_CLAIM_KEY);
    clearProgress();
  };
}
