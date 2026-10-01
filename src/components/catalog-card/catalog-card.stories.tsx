import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import {
  ADVANCED_COURSE_VIEW,
  ATLAS_COURSE_VIEW,
  CATALOG_VIEWS,
} from "../../../.storybook/fixtures/course-views";
import { CatalogCard } from "./catalog-card";

const meta = {
  title: "Components/CatalogCard",
  component: CatalogCard,
  parameters: { layout: "padded" },
  args: { courseCount: CATALOG_VIEWS.length, notJoinedCount: 2, teaser: ADVANCED_COURSE_VIEW },
  decorators: [
    (Story) => (
      <div className="grid max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CatalogCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Enrolled in the Basic Course: the Advanced course is the next one to try. */
export const TeasesALevel: Story = {};

/** Only the reference course is left to join. */
export const TeasesTheReference: Story = {
  args: { notJoinedCount: 1, teaser: ATLAS_COURSE_VIEW },
};

/** Enrolled in every course: no teaser, the card still opens the catalog. */
export const EnrolledInAll: Story = {
  args: { notJoinedCount: 0, teaser: undefined },
};

/** Spanish copy. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
};
