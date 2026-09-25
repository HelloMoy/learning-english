import type { Decorator } from "@storybook/nextjs-vite";

import { CinemaBackground } from "../src/components/cinema-background/cinema-background";

/**
 * Decorator that renders a story over the app's own `CinemaBackground`, so a
 * component is reviewed on the surface it sits on in the app. The backdrop reads
 * the theme tokens, so it follows the toolbar's light/dark switch.
 *
 * Only in story view: on a docs page every story is one inline block, and a
 * fixed, full-viewport backdrop per block would stack behind the whole page.
 */
export const withCinemaBackdrop: Decorator = (Story, context) => {
  if (context.viewMode !== "story") return <Story />;

  return (
    <>
      <CinemaBackground />
      <Story />
    </>
  );
};
