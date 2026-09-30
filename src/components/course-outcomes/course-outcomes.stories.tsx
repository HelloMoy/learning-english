import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
} from "../../../.storybook/fixtures/course-views";
import { CourseOutcomes } from "./course-outcomes";

const meta = {
  title: "Components/CourseOutcomes",
  component: CourseOutcomes,
  parameters: { layout: "padded" },
  args: { outcomes: BASIC_COURSE_VIEW.course.outcomes ?? [] },
} satisfies Meta<typeof CourseOutcomes>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course's five outcomes. */
export const BasicCourse: Story = {};

/** The Advanced Intermediate Course: six outcomes, so the grid ends on a full row. */
export const AdvancedCourse: Story = {
  args: { outcomes: ADVANCED_COURSE_VIEW.course.outcomes ?? [] },
};

/** The Atlas of American Sounds. */
export const ReferenceCourse: Story = {
  args: { outcomes: ATLAS_COURSE_VIEW.course.outcomes ?? [] },
};

/** Spanish headings; the outcomes stay as the manifest declares them. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
