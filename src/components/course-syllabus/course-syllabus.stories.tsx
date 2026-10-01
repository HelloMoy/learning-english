import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  BASIC_COURSE_VIEW,
} from "../../../.storybook/fixtures/course-views";
import { CourseSyllabus } from "./course-syllabus";

const meta = {
  title: "Components/CourseSyllabus",
  component: CourseSyllabus,
  parameters: { layout: "padded" },
  args: { view: BASIC_COURSE_VIEW },
} satisfies Meta<typeof CourseSyllabus>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course: five lessons, every row closed. Open Vowels to see its 17 videos. */
export const BasicCourse: Story = {};

/** The Advanced Intermediate Course: ten lessons, one of them with 31 videos. */
export const AdvancedCourse: Story = {
  args: { view: ADVANCED_COURSE_VIEW },
};

/** The Atlas of American Sounds: twelve short lessons. */
export const ReferenceCourse: Story = {
  args: { view: ATLAS_COURSE_VIEW },
};

/** Spanish ordinals and counts; titles stay as the manifest declares them. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
