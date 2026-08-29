import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SiteHeader } from "./site-header";

/**
 * The header's eyebrow reads the active pathname, so each story pins one via
 * `parameters.nextjs.navigation`. That is the whole point of the set: the
 * four section labels are the only thing that varies, and they are the only
 * part a route change can break.
 *
 * All copy resolves from the production `SiteHeader` namespace, so the locale
 * toolbar switches it for real.
 */
const meta = {
  title: "Components/SiteHeader",
  component: SiteHeader,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Home — the fallback section when the path matches no deeper route. */
export const Home: Story = {
  parameters: { nextjs: { navigation: { pathname: "/" } } },
};

/** Course overview. */
export const Course: Story = {
  parameters: { nextjs: { navigation: { pathname: "/courses/advanced-intermediate-course" } } },
};

/** Module overview. */
export const ModuleSection: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course",
      },
    },
  },
};

/** Lesson page — the deepest route, checked first by `sectionKey`. */
export const LessonSection: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname:
          "/courses/advanced-intermediate-course/modules/1-advanced-pronunciation-course/lessons/abc",
      },
    },
  },
};
