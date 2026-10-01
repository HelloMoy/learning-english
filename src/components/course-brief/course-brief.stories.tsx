import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
} from "../../../.storybook/fixtures/course-views";
import { CourseBrief } from "./course-brief";

const meta = {
  title: "Components/CourseBrief",
  component: CourseBrief,
  parameters: { layout: "padded" },
  args: { course: BASIC_COURSE_VIEW.course },
} satisfies Meta<typeof CourseBrief>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course's audience and three highlights. */
export const BasicCourse: Story = {};

/** The Advanced Intermediate Course. */
export const AdvancedCourse: Story = {
  args: { course: ADVANCED_COURSE_VIEW.course },
};

/** The Atlas of American Sounds, reference material for any level. */
export const ReferenceCourse: Story = {
  args: { course: ATLAS_COURSE_VIEW.course },
};

/** Labels and copy from the manifest's Spanish translation. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
