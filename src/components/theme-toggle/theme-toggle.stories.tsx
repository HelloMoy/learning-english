/**
 * Storybook stories for the `<ThemeToggle />` component.
 *
 * The story wraps itself in a `ThemeProvider` because `next-themes`'s
 * `useTheme()` hook needs the provider context to read/write the persisted
 * theme from `localStorage`. Wrapping locally (rather than via the global
 * preview decorator) keeps the dependency scoped to stories that actually
 * use it.
 *
 * Every provider here mirrors the app's own configuration in
 * `src/app/[locale]/layout.tsx` — `enableSystem={false}` with the two themes
 * named explicitly. A story that mounted the provider differently would be
 * exercising a setup production does not run.
 */
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "next-themes";

import { ThemeToggle } from "./theme-toggle";

/** next-themes' default storage key. */
const THEME_STORAGE_KEY = "theme";

const Provider = ({
  defaultTheme,
  children,
}: {
  defaultTheme: string;
  children: React.ReactNode;
}) => (
  <ThemeProvider
    attribute="class"
    defaultTheme={defaultTheme}
    enableSystem={false}
    themes={["dark", "light"]}
    disableTransitionOnChange
  >
    {children}
  </ThemeProvider>
);

/**
 * Default story configuration for the `ThemeToggle`.
 *
 * One press swaps between `dark` and `light`; there is no third state. Use the
 * Storybook locale toolbar to see the labels translated.
 */
const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  decorators: [
    (Story) => {
      localStorage.removeItem(THEME_STORAGE_KEY);
      return (
        <Provider defaultTheme="dark">
          <Story />
        </Provider>
      );
    },
  ],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Default state — dark, the theme a visitor with no stored preference gets. */
export const Default: Story = {};

/** The alternate. One press from here returns to dark. */
export const InLightMode: Story = {
  decorators: [
    (Story) => {
      localStorage.removeItem(THEME_STORAGE_KEY);
      return (
        <Provider defaultTheme="light">
          <Story />
        </Provider>
      );
    },
  ],
};

/**
 * A returning learner whose storage still holds `system` from the build that
 * offered it. The value is in neither theme list; the toggle resolves it to
 * dark — the new default — so they land somewhere it can name and move out of,
 * rather than on a state with no label.
 */
export const MigratingFromSystem: Story = {
  decorators: [
    (Story) => {
      localStorage.setItem(THEME_STORAGE_KEY, "system");
      return (
        <Provider defaultTheme="dark">
          <Story />
        </Provider>
      );
    },
  ],
};

/**
 * The phone variant: below `sm` the theme name is hidden and only the `◐` icon
 * remains, in a 44×44 hit area. The button keeps its full `Theme: <name>`
 * accessible name, so what a screen reader announces does not change with the
 * viewport.
 */
export const NarrowPhone: Story = {
  parameters: {
    viewport: {
      options: { phone320: { name: "320px", styles: { width: "320px", height: "720px" } } },
    },
  },
  globals: { viewport: { value: "phone320" } },
};
