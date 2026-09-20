/**
 * Storybook stand-in for `src/app/[locale]/learner-actions.ts`.
 *
 * The real module is a `"use server"` file: Next turns its imports into RPC
 * stubs, but Vite would bundle it — Drizzle, Better Auth and `server-only`
 * included — into the preview, which cannot run them. Stories exercise the
 * client's optimistic writes, so every action here simply accepts.
 */
export const markLessonCompleteAction = async () => ({ data: { completed: true } });
export const unmarkLessonCompleteAction = async () => ({ data: { unmarked: true } });
export const recordPlaybackPositionAction = async () => ({ data: { recorded: true } });
export const recordContinueWatchingAction = async () => ({ data: { recorded: true } });
export const saveLearnerProfileAction = async () => ({ data: { saved: true } });
export const earnTicketsAction = async () => ({ data: { earned: true } });
export const claimPrizeAction = async () => ({ data: { claimed: true } });
