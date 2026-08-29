import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { CinemaHero } from "./cinema-hero";

/**
 * Every string the reviewer reads comes from `Stories.CinemaHero`, so the
 * locale toolbar re-renders the hero in en / es / pt without editing this
 * file. Spanish and Portuguese run noticeably longer than English here —
 * that is the point: the headline must not reflow badly when it does.
 */
function HeroStory({ openHref }: { openHref?: string }) {
  const t = useTranslations("Stories.CinemaHero");
  return (
    <CinemaHero
      eyebrow={t("eyebrow")}
      title={t("title")}
      subtitle={t("subtitle")}
      openLabel={t("openLabel")}
      openHref={openHref}
      myListLabel={t("myListLabel")}
    />
  );
}

/**
 * Typed against the component rather than `typeof meta`: every story supplies
 * its props through `render`, because the copy has to be read from the
 * translation context at render time. Binding to `meta` would demand a
 * duplicate literal `args` block that nothing ever uses.
 */
const meta: Meta<typeof CinemaHero> = {
  title: "Cinema/CinemaHero",
  component: CinemaHero,
};

export default meta;
type Story = StoryObj<typeof CinemaHero>;

/** The hero as the home page renders it, linking to a course. */
export const Default: Story = {
  render: () => <HeroStory openHref="/en/courses/advanced-intermediate-course" />,
};

/**
 * No `openHref`. The primary CTA has nowhere to go yet — the state the home
 * page falls back to before course routes resolve.
 */
export const WithoutCourseLink: Story = {
  render: () => <HeroStory />,
};
