import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  LearnerAchievements as LearnerAchievementsValue,
  ModuleAchievements,
  PrizeState,
} from "@/lib/learner-achievements/learner-achievements";
import { prizeForModule } from "@/lib/module-prizes/module-prizes";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { LearnerAchievements } from "./learner-achievements";

/** Stable ids per fixture, so items keep their keys between renders. */
let nextFixtureId = 0;
const fixtureId = (): string =>
  `00000000-0000-4000-8000-${String((nextFixtureId += 1)).padStart(12, "0")}`;

const basicCourse = Course.parse({
  id: CourseId.parse(fixtureId()),
  slug: "basic-course",
  title: "Basic Course",
  description: "Pronunciation foundations.",
  language: "en",
  lessonCount: 48,
  moduleCount: 5,
  sequence: 1,
});

const moduleOf = (
  sequence: number,
  slug: string,
  title: string,
  lessonCount: number,
  earned: number,
  prizeState: PrizeState = earned === lessonCount ? "ready" : earned > 0 ? "collecting" : "locked",
): ModuleAchievements => ({
  module: Module.parse({
    id: ModuleId.parse(fixtureId()),
    courseId: basicCourse.id,
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

const learnerMidway: LearnerAchievementsValue = {
  courses: [
    {
      course: basicCourse,
      modules: [
        moduleOf(1, "1-introduction", "Introduction", 1, 1, "claimed"),
        moduleOf(2, "2-vowels", "Vowels", 17, 17, "ready"),
        moduleOf(3, "3-consonants", "Consonants", 25, 8),
        moduleOf(
          4,
          "4-ejercicios-para-dominar-el-ritmo-en-ingles",
          "Ejercicios para dominar el ritmo en inglés",
          4,
          0,
        ),
        moduleOf(5, "5-fluidez-y-velocidad", "Fluidez y velocidad", 1, 0),
      ],
    },
  ],
  ticketsEarned: 26,
  ticketCount: 48,
  prizesRedeemed: 1,
  prizeCount: 5,
  distinction: "student",
};

const meta = {
  title: "Components/LearnerAchievements",
  component: LearnerAchievements,
  args: { achievements: learnerMidway, onClaim: fn() },
} satisfies Meta<typeof LearnerAchievements>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The whistle claimed, the harmonica waiting to be claimed, the rest still hidden. */
export const Midway: Story = {};

/** Spanish counts, shelf notes and claim control. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese counts, shelf notes and claim control. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};
