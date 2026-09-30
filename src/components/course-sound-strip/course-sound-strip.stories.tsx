import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ATLAS_COURSE_VIEW, BASIC_COURSE_VIEW } from "../../../.storybook/fixtures/course-views";
import { CourseSoundStrip } from "./course-sound-strip";

const NO_SOUNDS = { vowels: [], consonants: [] };

const meta = {
  title: "Components/CourseSoundStrip",
  component: CourseSoundStrip,
  parameters: { layout: "padded" },
  args: { sounds: BASIC_COURSE_VIEW.course.sounds ?? NO_SOUNDS },
} satisfies Meta<typeof CourseSoundStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The Basic Course: 15 vowels and diphthongs, then 26 consonants. */
export const BasicCourse: Story = {};

/** The Atlas of American Sounds: r-colored vowels and the flap and glottal T as well. */
export const ReferenceCourse: Story = {
  args: { sounds: ATLAS_COURSE_VIEW.course.sounds ?? NO_SOUNDS },
};

/** Spanish headings and group names. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
