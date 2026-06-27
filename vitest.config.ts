import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

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
    exclude: ["node_modules/**", "e2e/**", ".next/**"],
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
