import { courseCardModel, courseShelf } from "@/lib/course-shelf/course-shelf";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { NextUpBar } from "./next-up-bar";

/** The Basic Course as Available courses recommends it to a learner enrolled in nothing. */
const recommendedBasic = (() => {
  const shelf = courseShelf({
    courses: [BASIC_COURSE_VIEW],
    enrolledSlugs: new Set(),
    records: [],
    completedIds: new Set(),
    positions: new Map(),
  });
  return courseCardModel(shelf.recommended!, { positions: new Map(), claimedPrizes: new Set() });
})();

const meta = {
  title: "Components/NextUpBar",
  component: NextUpBar,
  parameters: { layout: "padded" },
  args: { model: recommendedBasic },
} satisfies Meta<typeof NextUpBar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A new learner's first step: the Basic Course's first video. */
export const NewLearner: Story = {};

/** The same bar in Spanish. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
