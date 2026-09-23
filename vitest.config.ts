import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * The rejection `@vidstack/react` raises for each of its own pending promises
 * when a provider is destroyed — which, under jsdom, is every unmount of a
 * player whose provider never finished loading, because there is no media
 * pipeline for it to load into. The component tests that mount the real
 * `MediaPlayer` log `MediaPlayer Media Error` for the same reason.
 *
 * It carries no stack: Vidstack creates it inside a deferred promise, so there
 * is no call site to attribute it to and nothing an author can act on. It is a
 * property of running a media player in an environment that has no media.
 *
 * Only this exact message is ignored, and it is logged before being ignored, so
 * a different rejection — including a real leak from application code — still
 * fails the run. One such leak was found and fixed while diagnosing this: see
 * `fire-and-forget`.
 */
const VIDSTACK_TEARDOWN = "provider destroyed";

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
    // Vitest reports an unhandled rejection as "Unknown Error: <message>" with
    // no stack, which is unactionable when it only happens on CI's slower,
    // two-core timing. This adds the stack and the rejection's own type without
    // suppressing anything: returning nothing lets Vitest fail the run as before.
    //
    // It exists because `provider destroyed` — @vidstack/react rejecting every
    // pending promise when a provider is destroyed — failed every CI run with
    // no way to tell which call site leaked it.
    onUnhandledError(error) {
      // Logged either way, so nothing is ever silently dropped.
      console.error(
        `\n[unhandled ${error.type}] ${error.message}\n${error.stack ?? "(no stack)"}\n`,
      );
      return error.message === VIDSTACK_TEARDOWN ? false : undefined;
    },
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
