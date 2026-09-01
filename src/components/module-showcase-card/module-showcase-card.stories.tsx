import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  LeadingLesson,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleShowcaseCard } from "./module-showcase-card";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "advanced-intermediate-course",
  title: "Advanced Intermediate Course",
  description: "107 lessons across 10 modules.",
  language: "en",
  lessonCount: 107,
  moduleCount: 10,
  sequence: 1,
});

const module3 = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "3-contractions-reductions",
  title: "Contractions Reductions",
  sequence: 3,
});

/**
 * Real titles and real poster paths from module 3 of the seed, so the preview
 * shows the artwork that actually ships. Only the front card of the deck
 * shows its title, but the rest still drive the card's data, and keeping the
 * real ones here means the fixtures stay honest.
 */
const MODULE_3: ReadonlyArray<[string, string]> = [
  [
    "Intro",
    "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/1-intro/04ecdb-ec4d-8fea-d3f-dc020da6ec80-snapshot-554507553.jpeg",
  ],
  [
    "Why Contractions & Reductions are important",
    "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/2-why-contractions-reductions-are-important/c8c56c4-2856-b77f-c377-dd676611f6-snapshot-554507603.jpeg",
  ],
  [
    "I’m, you’re, he’s, she’s, it’s, we’re, they’re",
    "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/3-i-m-you-re-he-s-she-s-it-s-we-re-they-re/e770a1e-6f71-ad77-7d17-fca708ba6532-snapshot-554507557.jpeg",
  ],
  [
    "I’ll, you’ll, he’ll, she’ll, it’ll, we’ll, they’ll",
    "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/4-i-ll-you-ll-he-ll-she-ll-it-ll-we-ll-they-ll/68e2a6d-60bf-fb1-8060-c5dee60cd6d-snapshot-554507716.jpeg",
  ],
  [
    "I’ve, You’ve, We’ve, They’ve, He’s, She’s, It’s",
    "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/5-i-ve-you-ve-we-ve-they-ve-he-s-she-s-it-s/63ce46f-4f7c-171-2f12-82dcb75e3ca5-snapshot-554507730.jpeg",
  ],
  [
    "I’d, you’d, we’d — all the WOULD contractions",
    "/local-filesystem-lesson/advanced-intermediate-course/3-contractions-reductions/6-i-d-you-d-we-d-all-the-would-contractions/fda7534-56a0-3bd8-5c74-eb2334b12602-snapshot-554507747.jpeg",
  ],
];

const leading = (entries: ReadonlyArray<[string, string | undefined]>): LeadingLesson[] =>
  entries.map(([title, poster], index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    title,
    // Real seed runtimes, so the front card's clock reads plausibly.
    durationSeconds: 344 + index * 61,
    ...(poster === undefined ? {} : { poster }),
  }));

const summary = (overrides: Partial<ModuleSummary>): ModuleSummary => ({
  moduleId: module3.id,
  lessonCount: 6,
  totalDurationSeconds: 3600,
  leadingLessons: leading(MODULE_3),
  ...overrides,
});

const meta: Meta<typeof ModuleShowcaseCard> = {
  title: "Components/ModuleShowcaseCard",
  component: ModuleShowcaseCard,
  args: {
    course,
    module: module3,
    summary: summary({}),
  },
};

export default meta;

type Story = StoryObj<typeof ModuleShowcaseCard>;

/**
 * Module 3 of the real course: six lessons, one hour, a full deck and no
 * remainder. The reference case the fan geometry is tuned for.
 */
export const Typical: Story = {};

/**
 * Module 4 holds exactly one lesson: a deck of one, still tilted and still
 * labelled. It renders through the same layout with no special casing — a
 * deliberate decision, since a module that really does contain a single video
 * has nothing to disambiguate.
 */
export const SingleLesson: Story = {
  args: {
    module: Module.parse({
      ...module3,
      slug: "4-key-sound-patterns-and-features",
      title: "Key Sound Patterns And Features",
      sequence: 4,
    }),
    summary: summary({
      lessonCount: 1,
      totalDurationSeconds: 2160,
      leadingLessons: leading([["Weak Strong Forms", MODULE_3[0]?.[1]]]),
    }),
  },
};

/**
 * Module 7 holds 31 lessons, so the deck shows six and discloses the other
 * 25. Check the remainder line reads "+25 more" and that the fan still fits
 * its stage at a full six cards — the last one is the most rotated and the
 * first to be clipped if the sweep allowance is ever wrong.
 */
export const Overflowing: Story = {
  args: {
    module: Module.parse({
      ...module3,
      slug: "7-everyday-english-phrases-part-1-master-them",
      title: "Everyday English Phrases Part 1 Master Them",
      sequence: 7,
    }),
    summary: summary({
      lessonCount: 31,
      totalDurationSeconds: 9660,
      leadingLessons: leading(
        MODULE_3.map(([, poster], index) => [`Common English Expressions ${index + 1}`, poster]),
      ),
    }),
  },
};

/**
 * Module 10 runs 635 minutes. Rendered as a minute count that is accurate
 * and unreadable, which is why the count line switches to hours.
 */
export const LongDuration: Story = {
  args: {
    module: Module.parse({
      ...module3,
      slug: "10-the-practice-zone-sharpen-your-skills",
      title: "The Practice Zone Sharpen Your Skills",
      sequence: 10,
    }),
    summary: summary({
      lessonCount: 16,
      totalDurationSeconds: 38100,
      leadingLessons: leading(
        MODULE_3.map(([, poster], index) => [
          `Exercise ${index + 1} Pronunciation Step By Step Lesson`,
          poster,
        ]),
      ),
    }),
  },
};

/**
 * The gradient fallback. Every one of the 107 lessons in the real course has
 * a poster, so this story is the only place a card without artwork — and the
 * glow it falls back to — is reviewable.
 */
export const MissingPoster: Story = {
  args: {
    summary: summary({
      leadingLessons: leading(
        MODULE_3.map(([title, poster], index) => [title, index % 2 === 0 ? poster : undefined]),
      ),
    }),
  },
};
