import { StartCourseLink } from "@/components/start-course-link/start-course-link";
import { VowelLengthCard } from "@/components/vowel-length-card/vowel-length-card";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { NewVisitorHero } from "./new-visitor-hero";

const meta = {
  title: "Components/NewVisitorHero",
  component: NewVisitorHero,
  args: {
    firstCourseTitle: "Basic Course",
    firstCourseVideoCount: 48,
    action: <StartCourseLink />,
    aside: <VowelLengthCard variant="hear-the-difference" />,
  },
} satisfies Meta<typeof NewVisitorHero>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The landing's hero, with Start course and the vowel-length card beside it. */
export const Default: Story = {};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};

/** Portuguese copy. */
export const InPortuguese: Story = {
  parameters: { locale: "pt" },
};

/** Phone width: the card stacks under the primary action. */
export const OnAPhone: Story = {
  globals: { viewport: { value: "mobile2" } },
};
