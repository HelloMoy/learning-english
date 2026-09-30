import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { BASIC_COURSE_VIEW, videoOf } from "../../../.storybook/fixtures/course-views";
import { CinemaHeroArtwork } from "./cinema-hero-artwork";

const meta = {
  title: "Components/CinemaHeroArtwork",
  component: CinemaHeroArtwork,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative isolate aspect-[21/9] w-full overflow-hidden rounded-[26px] border border-border">
        <Story />
      </div>
    ),
  ],
  args: { poster: videoOf(BASIC_COURSE_VIEW, 1, 0).poster },
} satisfies Meta<typeof CinemaHeroArtwork>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A video poster fading into the page background. Switch themes to see both fades. */
export const WithPoster: Story = {};

/** No poster: the accent glow stands in. */
export const WithoutPoster: Story = {
  args: { poster: undefined },
};
