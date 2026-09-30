import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { CourseSection } from "./course-section";

/** A section with its sample copy in the toolbar's locale. */
function SampleSection({ headingKey }: { headingKey: "heading" | "longHeading" }) {
  const t = useTranslations("Stories.CourseSection");
  return (
    <CourseSection
      eyebrow={t("eyebrow")}
      heading={t(headingKey)}
    >
      <p className="max-w-prose text-muted-foreground">{t("content")}</p>
    </CourseSection>
  );
}

const meta = {
  title: "Components/CourseSection",
  component: CourseSection,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CourseSection>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An eyebrow, a heading and the section's content. */
export const Default: Story = {
  args: { eyebrow: "", heading: "", children: null },
  render: () => <SampleSection headingKey="heading" />,
};

/** A heading long enough to wrap, balanced across lines. */
export const LongHeading: Story = {
  args: { eyebrow: "", heading: "", children: null },
  render: () => <SampleSection headingKey="longHeading" />,
};
