import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { PendingCoursePage } from "./pending-course-page";

const meta = {
  title: "Components/PendingCoursePage",
  component: PendingCoursePage,
  parameters: { layout: "fullscreen" },
  args: { title: BASIC_COURSE_VIEW.course.title },
} satisfies Meta<typeof PendingCoursePage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course before the learner's state has arrived. */
export const Default: Story = {};
