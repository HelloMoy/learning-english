import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // `.claude/**` holds throwaway agent worktrees — full checkouts of this
    // repo. Without this, vitest collects their copies of every test file
    // and fails on imports that only resolved at the commit they branched
    // from. `.prettierignore` and the ESLint config skip the same folder.
    exclude: ["node_modules/**", "e2e/**", ".next/**", ".claude/**"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json"],
      exclude: [
        "node_modules/",
        ".next/",
        "coverage/",
        "**/*.config.{ts,mjs,js}",
        "**/*.d.ts",
        "**/types.ts",
        "src/app/layout.tsx",
        "src/app/page.tsx",
      ],
    },
  },
});
