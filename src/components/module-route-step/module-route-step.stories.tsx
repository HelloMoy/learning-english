import {
  vowelsCourse,
  vowelsLessons,
  vowelsModule,
} from "@/components/module-route/module-route.fixtures";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { lessonPath } from "@/i18n/lesson-routes";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ModuleRouteStep } from "./module-route-step";

const lesson = vowelsLessons[5]!;

const meta = {
  title: "Components/ModuleRouteStep",
  component: ModuleRouteStep,
  decorators: [
    (Story) => (
      <ol className="max-w-3xl p-6">
        <li>
          <Story />
        </li>
      </ol>
    ),
  ],
  args: {
    lesson,
    href: lessonPath(vowelsCourse, vowelsModule, lesson),
    state: "upcoming",
    watchedFraction: 0,
  },
  argTypes: {
    state: { control: { type: "select" }, options: ["finished", "current", "upcoming"] },
    watchedFraction: { control: { type: "range", min: 0, max: 1, step: 0.05 } },
  },
} satisfies Meta<typeof ModuleRouteStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A lesson still ahead: thumbnail, ordinal and minutes, and "Watch video". */
export const Upcoming: Story = {};

/** A finished lesson recedes: no thumbnail, muted title, "Watch again". */
export const Finished: Story = {
  args: { state: "finished", watchedFraction: 1 },
};

/** The featured card for a lesson watched to 40%: bar, minutes left, "Continue". */
export const CurrentPartlyWatched: Story = {
  args: { state: "current", watchedFraction: 0.4 },
};

/** The featured card for a lesson not started yet: no bar, "Start video". */
export const CurrentNotStarted: Story = {
  args: { state: "current", watchedFraction: 0 },
};

/** A lesson without artwork keeps the gradient tile with its play affordance. */
export const UpcomingWithoutPoster: Story = {
  args: { lesson: Lesson.parse({ ...lesson, poster: undefined }) },
};
