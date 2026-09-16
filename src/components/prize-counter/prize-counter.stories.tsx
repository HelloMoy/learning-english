import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  CourseAchievements,
  ModuleAchievements,
  PrizeState,
} from "@/lib/learner-achievements/learner-achievements";
import { prizeForModule } from "@/lib/module-prizes/module-prizes";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { PrizeCounter } from "./prize-counter";

/** Stable ids per fixture, so items keep their keys between renders. */
let nextFixtureId = 0;
const fixtureId = (): string =>
  `00000000-0000-4000-8000-${String((nextFixtureId += 1)).padStart(12, "0")}`;

const course = (title: string, sequence: number) =>
  Course.parse({
    id: CourseId.parse(fixtureId()),
    slug: `course-${sequence}`,
    title,
    description: title,
    language: "en",
    lessonCount: 0,
    moduleCount: 0,
    sequence,
  });

const moduleOf = (
  owner: Course,
  sequence: number,
  slug: string,
  title: string,
  lessonCount: number,
  earned: number,
  prizeState: PrizeState = earned === lessonCount ? "ready" : earned > 0 ? "collecting" : "locked",
): ModuleAchievements => ({
  module: Module.parse({
    id: ModuleId.parse(fixtureId()),
    courseId: owner.id,
    slug,
    title,
    sequence,
  }),
  prize: prizeForModule(slug),
  prizeState,
  ticketsEarned: earned,
  tickets: Array.from({ length: lessonCount }, (_, index) => ({
    lessonId: LessonId.parse(fixtureId()),
    title: `Lesson ${index + 1}`,
    symbol: String(index + 1),
    isEarned: index < earned,
  })),
});

const basic = course("Basic Course", 1);
const advanced = course("Advanced Intermediate Course", 2);

const midway: CourseAchievements[] = [
  {
    course: basic,
    modules: [
      moduleOf(basic, 1, "1-introduction", "Introduction", 1, 1, "claimed"),
      moduleOf(basic, 2, "2-vowels", "Vowels", 17, 17, "ready"),
      moduleOf(basic, 3, "3-consonants", "Consonants", 25, 8),
      moduleOf(
        basic,
        4,
        "4-ejercicios-para-dominar-el-ritmo-en-ingles",
        "Ejercicios para dominar el ritmo en inglés",
        4,
        0,
      ),
      moduleOf(basic, 5, "5-fluidez-y-velocidad", "Fluidez y velocidad", 1, 0),
    ],
  },
  {
    course: advanced,
    modules: [
      moduleOf(
        advanced,
        1,
        "1-advanced-pronunciation-course",
        "Advanced Pronunciation Course",
        4,
        0,
      ),
      moduleOf(
        advanced,
        2,
        "2-advanced-vowel-pronunciation-in-american-english",
        "Advanced Vowel Pronunciation In American English",
        13,
        0,
      ),
      moduleOf(advanced, 3, "3-contractions-reductions", "Contractions Reductions", 6, 0),
      moduleOf(
        advanced,
        4,
        "4-key-sound-patterns-and-features",
        "Key Sound Patterns And Features",
        1,
        0,
      ),
      moduleOf(
        advanced,
        5,
        "5-sound-natural-american-intonation-essentials",
        "Sound Natural American Intonation Essentials",
        6,
        0,
      ),
      moduleOf(
        advanced,
        6,
        "6-rules-for-speaking-fast-natural-in-english",
        "Rules For Speaking Fast Natural In English",
        10,
        0,
      ),
      moduleOf(
        advanced,
        7,
        "7-everyday-english-phrases-part-1-master-them",
        "Everyday English Phrases Part 1 Master Them",
        31,
        0,
      ),
      moduleOf(
        advanced,
        8,
        "8-everyday-english-phrases-part-2-master-them",
        "Everyday English Phrases Part 2 Master Them",
        7,
        0,
      ),
      moduleOf(
        advanced,
        9,
        "9-speak-with-confidence-in-30-days",
        "Speak With Confidence In 30 Days",
        13,
        0,
      ),
      moduleOf(
        advanced,
        10,
        "10-the-practice-zone-sharpen-your-skills",
        "The Practice Zone Sharpen Your Skills",
        16,
        0,
      ),
    ],
  },
];

const meta = {
  title: "Components/PrizeCounter",
  component: PrizeCounter,
  args: { courses: midway, onClaim: fn() },
} satisfies Meta<typeof PrizeCounter>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whistle claimed, the harmonica waiting to be claimed, everything else hidden. */
export const Midway: Story = {};

/** Spanish shelf notes, tags and claim control. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese shelf notes, tags and claim control. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
