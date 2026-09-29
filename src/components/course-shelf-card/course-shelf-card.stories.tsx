import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ADVANCED_COURSE_VIEW, BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CourseShelfCard } from "./course-shelf-card";

const meta = {
  title: "Components/CourseShelfCard",
  component: CourseShelfCard,
  parameters: { layout: "padded" },
  args: { view: ADVANCED_COURSE_VIEW },
} satisfies Meta<typeof CourseShelfCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Advanced course: ten modules, so the strip counts the six it does not show. */
export const AdvancedCourse: Story = {};

/** The Basic course: five modules, four shown and one counted. */
export const BasicCourse: Story = {
  args: { view: BASIC_COURSE_VIEW },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
