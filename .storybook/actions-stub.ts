/**
 * Storybook stand-in for `src/app/[locale]/actions.ts`.
 *
 * The real module is a `"use server"` file: Next turns its imports into RPC
 * stubs, but Vite would bundle its whole graph into the preview —
 * `use-case-dependencies` → `create-content-blob-store` → `content-locations`,
 * which imports `node:fs`. The browser cannot run that, and every story whose
 * component reaches this module dies on Storybook's error display instead of
 * rendering.
 *
 * Components reach it without ever calling it: `useResolvedContinueWatching`
 * takes its resolver as a **default parameter**
 * (`resolve = resolveContinueWatchingPanel`), so the import is evaluated even
 * when a story passes its own resolver — and all of them do.
 *
 * @see `.storybook/learner-actions-stub.ts` — the same seam, for the same reason
 */

/** Re-exported from the real module; types are erased, so this costs no import. */
export type { ContinueWatchingPanel } from "../src/app/[locale]/actions";

/**
 * Answers "there is nothing to resume".
 *
 * `null` is what the real action returns for a learner with nothing stored, and
 * what `resolveContinueWatchingPanel` collapses every failure to. A stub must
 * not invent a resumable lesson a story did not ask for.
 */
export const findContinueWatchingAction = async () => ({ data: null });
