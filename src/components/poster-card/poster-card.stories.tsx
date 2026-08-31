import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { PosterCard } from "./poster-card";

const meta: Meta<typeof PosterCard> = {
  title: "Cinema/PosterCard",
  component: PosterCard,
  parameters: { backgrounds: { default: "dark" } },
  args: {
    title: "Contractions Reductions",
    number: "03",
    href: "/courses/x/modules/y",
    showPlay: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PosterCard>;

export const Numbered: Story = {};

export const WithBadge: Story = {
  args: { badge: <span className="text-[11px] text-gold">6 videos</span> },
};

export const Feature: Story = {
  args: {
    number: undefined,
    eyebrow: "Feature",
    headline: "WELCOME",
    framed: false,
    showMeta: false,
    title: "Advanced Intermediate Course",
  },
};

export const GlowOnly: Story = {
  args: { posterUrl: null },
};
