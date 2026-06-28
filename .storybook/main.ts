import path from "node:path";

import { defineMain } from "@storybook/nextjs-vite/node";

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
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
    "@storybook/addon-vitest",
  ],
  typescript: {
    reactDocgen: "react-docgen-typescript",
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(process.cwd(), "src"),
    };
    return config;
  },
});
