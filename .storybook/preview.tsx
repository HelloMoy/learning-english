import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";

import { withCinemaBackdrop } from "./cinema-backdrop";
import { CinemaDocsContainer } from "./cinema-docs-container";
import { withNextIntl } from "./i18n.tsx";
import { withNuqs } from "./nuqs.tsx";
import { canvasThemes, globalTypes, initialGlobals } from "./toolbar";

import "../src/app/globals.css";

const preview: Preview = {
  // Order matters: `withThemeByClassName` must wrap the story first so
  // `withNextIntl` (which renders the actual component) sees the `.dark`
  // class applied to its ancestor — shadcn's `@custom-variant dark` reads
  // it via `&:is(.dark *)`.
  decorators: [
    withThemeByClassName(canvasThemes),
    withCinemaBackdrop,
    withNextIntl,
    // Innermost: the closest provider to the component that reads URL state.
    withNuqs,
  ],
  globalTypes,
  initialGlobals,
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    docs: {
      // Picks the docs theme and locale from the toolbar, page by page.
      container: CinemaDocsContainer,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // "todo" surfaces violations in the addon panel but doesn't fail the
      // build. Switch to "error" in CI if you want hard enforcement.
      test: "todo",
    },
    options: {
      storySort: {
        order: ["Docs", ["Welcome", "Color tokens", "Typography"], "*"],
      },
    },
  },
};

export default preview;
