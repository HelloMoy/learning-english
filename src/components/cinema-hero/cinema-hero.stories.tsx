import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { CinemaHero } from "./cinema-hero";

/**
 * Every string the reviewer reads comes from `Stories.CinemaHero`, so the
 * locale toolbar re-renders the hero in en / es / pt without editing this
 * file. Spanish and Portuguese run noticeably longer than English here —
 * that is the point: the headline must not reflow badly when it does.
 */
function HeroStory() {
  const t = useTranslations("Stories.CinemaHero");
  return (
    <CinemaHero
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
    />
  );
}

/**
 * Typed against the component rather than `typeof meta`: the story supplies
 * its props through `render`, because the copy has to be read from the
 * translation context at render time.
 */
const meta: Meta<typeof CinemaHero> = {
  title: "Cinema/CinemaHero",
  component: CinemaHero,
};

export default meta;
type Story = StoryObj<typeof CinemaHero>;

/** The hero as the home page renders it, above the continue-watching panel. */
export const Default: Story = {
  render: () => <HeroStory />,
};
