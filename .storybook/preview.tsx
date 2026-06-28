import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";

import { withNextIntl } from "./i18n.tsx";
import { globalTypes, initialGlobals } from "./toolbar";

import "../src/app/globals.css";

const preview: Preview = {
  // Order matters: `withThemeByClassName` must wrap the story first so
  // `withNextIntl` (which renders the actual component) sees the `.dark`
  // class applied to its ancestor — shadcn's `@custom-variant dark` reads
  // it via `&:is(.dark *)`.
  decorators: [
    withThemeByClassName({
      themes: { light: "", dark: "dark" },
      defaultTheme: "light",
    }),
    withNextIntl,
  ],
  globalTypes,
  initialGlobals,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0a0a0a" },
      ],
    },
    a11y: {
      // "todo" surfaces violations in the addon panel but doesn't fail the
      // build. Switch to "error" in CI if you want hard enforcement.
      test: "todo",
    },
    options: {
      storySort: {
        order: ["Docs", "*"],
      },
    },
  },
};

export default preview;
