import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { RouteLink } from "./route-link";

/**
 * Stories for `<RouteLink />`, the `Link` every page imports from
 * `@/i18n/navigation`.
 *
 * It looks like any other link: what it adds is invisible here. On a real
 * navigation it tags the route change with a transition chosen from the page
 * it is on and the page it points at, and Storybook has neither a router nor
 * React's `<ViewTransition>`. These stories are for checking that it renders,
 * keeps the caller's styling, and prefixes the locale from the toolbar.
 */
const meta = {
  title: "Components/RouteLink",
  component: RouteLink,
  args: {
    href: "/courses",
    children: "Courses",
    className: "text-sm font-semibold text-gold underline-offset-4 hover:underline",
  },
} satisfies Meta<typeof RouteLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A link whose motion comes from its route pair. */
export const Default: Story = {};

/** A call site that knows better names the motion itself. */
export const WithExplicitTransition: Story = {
  args: {
    href: "/courses/basic-course/modules/vowels/lessons/video-5",
    transitionTypes: ["route-slide-back"],
    children: "Previous lesson",
  },
};

/** Locked to Spanish: the anchor's `href` carries `/es`. */
export const InSpanish: Story = {
  parameters: { locale: "es" },
  args: { children: "Cursos" },
};
