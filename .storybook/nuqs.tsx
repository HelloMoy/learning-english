import type { Decorator } from "@storybook/nextjs-vite";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";

/**
 * Decorator that gives every story a `nuqs` adapter.
 *
 * @remarks
 * `useQueryState` throws `nuqs requires an adapter to work with your framework`
 * unless an adapter sits above it. The app mounts `NuqsAdapter` from
 * `nuqs/adapters/next/app` in `src/components/global-providers.tsx`, but that
 * adapter needs Next's router, which the preview iframe has no real instance
 * of — a story that wrote a query param would try to navigate the iframe.
 *
 * The testing adapter keeps the state in memory instead. `hasMemory` makes it
 * build on its own updates, so a story that writes a param reads it back and
 * interactive stories behave as they do in the app, minus the URL bar.
 *
 * @see `.storybook/i18n.tsx` — the same pattern for `NextIntlClientProvider`
 */
export const withNuqs: Decorator = (Story) => (
  <NuqsTestingAdapter hasMemory>
    <Story />
  </NuqsTestingAdapter>
);
