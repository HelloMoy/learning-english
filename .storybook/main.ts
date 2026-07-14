import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineMain } from "@storybook/nextjs-vite/node";

const storybookDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybook main configuration.
 *
 * - Framework: `@storybook/nextjs-vite` — Vite-based, recommended over webpack
 *   for all Next.js projects (faster, better testing support).
 * - Stories: colocated with components (`Component.tsx` → `Component.stories.tsx`)
 *   inside `src/`.
 * - The `@` path alias is mirrored here because Vite resolves it independently
 *   from tsconfig.
 */
export default defineMain({
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-themes"],
  // Storybook 10 ships the Component tests UI in core. The project's
  // `test-storybook` script is a stub ("requires vitest project setup"),
  // and no Vitest project is wired in `vitest.config.ts`, so the test
  // panel throws `customEqualityTesters` and breaks every story's
  // preview iframe. Removing the bundled addon hides the panel and lets
  // the preview render. Re-add `@storybook/addon-vitest` here (and the
  // corresponding project in `vitest.config.ts`) to bring the panel
  // back.
  removeAddon: ["@storybook/addon-test"],
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
      // See `.storybook/vitest-stub.js` for the full rationale. The short
      // version: aliasing `vitest` to an empty module stops Vite from
      // pre-bundling the real package and clobbering the Storybook
      // preview runtime's matcher initialisation.
      vitest: path.resolve(storybookDir, "vitest-stub.js"),
    };
    return config;
  },
});
