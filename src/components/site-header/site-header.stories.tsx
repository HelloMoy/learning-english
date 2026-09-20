import { Course as CourseEntity } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import { seedLearnerStore } from "@/lib/learner-store/learner-store";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { SiteHeader } from "./site-header";

const COURSE_ID = CourseId.parse("11111111-1111-4111-8111-111111111111");
const MODULE_ID = ModuleId.parse("22222222-2222-4222-8222-222222222222");

const VOWELS = Module.parse({
  id: MODULE_ID,
  courseId: COURSE_ID,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 1,
});

const LESSONS: LessonProgressSlice[] = [
  "33333333-3333-4333-8333-333333333333",
  "44444444-4444-4444-8444-444444444444",
].map((id, index) => ({
  id: LessonId.parse(id),
  moduleId: MODULE_ID,
  durationSeconds: 600,
  title: `Lesson ${index + 1}`,
  sequence: index + 1,
}));

const LEVELS: AchievementLevel[] = [
  {
    course: CourseEntity.parse({
      id: COURSE_ID,
      slug: "basic-course",
      title: "Basic Course",
      description: "The first course of the catalog.",
      language: "en",
      lessonCount: LESSONS.length,
      moduleCount: 1,
      sequence: 1,
    }),
    modules: [VOWELS],
    lessonRuntimes: LESSONS,
  },
];

type HeaderState = { learner?: boolean; prizesReady?: boolean };

/**
 * Gives the header a learner card and, where a story asks for one, a prize
 * waiting to be claimed (every ticket of the module earned) — through the
 * learner store, as the server's snapshot would. Seeding replaces the whole
 * store, so every story starts from what it asks for.
 */
function seedHeader({ learner = false, prizesReady = false }: HeaderState) {
  seedLearnerStore({
    ...EMPTY_LEARNER_SNAPSHOT,
    profile: learner ? { name: "Ana García", avatar: { kind: "initials" } } : null,
    earnedTicketLessonIds: prizesReady ? LESSONS.map((lesson) => lesson.id) : [],
  });
}

/**
 * The header's eyebrow reads the active pathname, so each story pins one via
 * `parameters.nextjs.navigation`. That is the whole point of the set: the
 * four section labels are the only thing that varies, and they are the only
 * part a route change can break.
 *
 * The later stories pin `parameters.header` instead, which is what the seeding
 * decorator reads: an unclaimed prize is a fact about this device's storage, so
 * the mark cannot be shown by passing a prop.
 *
 * All copy resolves from the production `SiteHeader` namespace, so the locale
 * toolbar switches it for real.
 */
const meta = {
  title: "Components/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story, context) => {
      seedHeader((context.parameters.header ?? {}) as HeaderState);
      return <Story />;
    },
  ],
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Home — the fallback section when the path matches no deeper route. */
export const Home: Story = {
  parameters: { nextjs: { navigation: { pathname: "/" } } },
};

/** Course overview. */
export const Course: Story = {
  parameters: { nextjs: { navigation: { pathname: "/courses/advanced-intermediate-course" } } },
};

/** Module overview. */
export const ModuleSection: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course",
      },
    },
  },
};

/** Lesson page — the deepest route, checked first by `sectionKey`. */
export const LessonSection: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname:
          "/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course/lessons/abc",
      },
    },
  },
};

/**
 * The narrowest supported viewport. Below `sm` the wordmark steps down a type
 * scale, the section eyebrow drops, the locale control shows its ISO code, and
 * the theme toggle goes icon-only — together they fit the 288px of usable width
 * a 320px screen leaves. Anything wider than that and the whole document
 * scrolls sideways, which is what this set exists to catch.
 */
export const NarrowPhone: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};

/** The same header in Spanish, whose longer labels are the worst case for width. */
export const NarrowPhoneSpanish: Story = {
  parameters: {
    locale: "es",
    nextjs: { navigation: { pathname: "/" } },
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};

/** iPhone-class width — the common case, one step up from the floor. */
export const Phone390: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    viewport: {
      options: { phone390: { name: "390px", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "phone390" } },
};

/** A learner with nothing waiting: the avatar carries no mark. */
export const WithLearner: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    header: { learner: true },
  },
  args: { levels: LEVELS, signedIn: true },
};

/** A prize waiting on the counter: the avatar carries how many. */
export const WithPrizeReady: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    header: { learner: true, prizesReady: true },
  },
  args: { levels: LEVELS, signedIn: true },
};

/**
 * The menu open, where the Achievements item carries the mark too — the item
 * being what the mark on the avatar is pointing at.
 */
export const WithPrizeReadyMenuOpen: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    header: { learner: true, prizesReady: true },
  },
  args: { levels: LEVELS, signedIn: true },
  play: async () => {
    const body = within(document.body);
    await userEvent.click(await body.findByRole("button", { name: /Ana García/ }));

    const achievements = await body.findByRole("menuitem", { name: /Achievements/ });
    await expect(within(achievements).getByTestId("prize-mark-item")).toHaveTextContent("1");
  },
};

/** The waiting prize in Spanish, whose sentence is the longest of the three. */
export const WithPrizeReadyInSpanish: Story = {
  parameters: {
    locale: "es",
    nextjs: { navigation: { pathname: "/" } },
    header: { learner: true, prizesReady: true },
  },
  args: { levels: LEVELS, signedIn: true },
};

/** The mark at iPhone width, where the avatar sits closest to the screen edge. */
export const WithPrizeReadyOnPhone: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    header: { learner: true, prizesReady: true },
    viewport: {
      options: { phone390: { name: "390px", styles: { width: "390px", height: "844px" } } },
    },
  },
  args: { levels: LEVELS, signedIn: true },
  globals: { viewport: { value: "phone390" } },
};

/** A visitor without a session: Sign in takes the place of the learner's menu. */
export const SignedOut: Story = {
  args: { signedIn: false },
};

/** Signed in before making a learner card: a plain Sign out, since there is no avatar yet. */
export const SignedInWithoutCard: Story = {
  args: { signedIn: true },
};
