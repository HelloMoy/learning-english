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

/**
 * The narrowest supported viewport. Below `sm` the wordmark steps down a type
 * scale, the section eyebrow drops, the locale control shows its ISO code, and
 * the theme toggle goes icon-only — together they fit the 288px of usable width
 * a 320px screen leaves. Anything wider than that and the whole document
 * scrolls sideways, which is what this set exists to catch.
 */
export const NarrowPhone: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};

/** The same header in Spanish, whose longer labels are the worst case for width. */
export const NarrowPhoneSpanish: Story = {
  parameters: {
    locale: "es",
    nextjs: { navigation: { pathname: "/" } },
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};

/** iPhone-class width — the common case, one step up from the floor. */
export const Phone390: Story = {
  parameters: {
    nextjs: { navigation: { pathname: "/" } },
    viewport: {
      options: { phone390: { name: "390px", styles: { width: "390px", height: "844px" } } },
    },
  },
  globals: { viewport: { value: "phone390" } },
};
