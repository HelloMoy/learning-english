"use server";

import { getLearnerDependencies } from "@/adapters/persistence/turso/learner-dependencies/learner-dependencies";
import { learnerActionClient } from "@/lib/safe-action/safe-action";

import { LEARNER_ACTION_SCHEMAS } from "./learner-action-schemas";

/**
 * Records a lesson as complete for the signed-in learner.
 *
 * @returns `{ completed: false }` when the lesson does not exist
 */
export const markLessonCompleteAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.lessonCompletion)
  .action(async ({ parsedInput, ctx }) => {
    const { useCases } = getLearnerDependencies(ctx.learnerId);
    const result = await useCases.markLessonComplete(parsedInput);
    return { completed: result.isOk() };
  });

/**
 * Clears a lesson's completion for the signed-in learner — their own undo.
 *
 * @returns `{ unmarked: false }` when the lesson does not exist
 */
export const unmarkLessonCompleteAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.lessonCompletion)
  .action(async ({ parsedInput, ctx }) => {
    const { useCases } = getLearnerDependencies(ctx.learnerId);
    const result = await useCases.unmarkLessonComplete(parsedInput);
    return { unmarked: result.isOk() };
  });

/**
 * Saves the signed-in learner's playback position for a lesson.
 *
 * @returns `{ recorded: false }` when the lesson does not exist
 */
export const recordPlaybackPositionAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.playbackPosition)
  .action(async ({ parsedInput, ctx }) => {
    const { useCases } = getLearnerDependencies(ctx.learnerId);
    const result = await useCases.recordPlaybackPosition(parsedInput);
    return { recorded: result.isOk() };
  });

/** Records the lesson the signed-in learner opened last. */
export const recordContinueWatchingAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.continueWatching)
  .action(async ({ parsedInput, ctx }) => {
    await getLearnerDependencies(ctx.learnerId).repositories.continueWatching.set(parsedInput);
    return { recorded: true };
  });

/**
 * Saves the signed-in learner's card. An invalid card is refused by the input
 * schema, so the envelope carries `validationErrors` and nothing is written.
 */
export const saveLearnerProfileAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.learnerProfile)
  .action(async ({ parsedInput, ctx }) => {
    const { useCases } = getLearnerDependencies(ctx.learnerId);
    const result = await useCases.saveLearnerProfile(parsedInput);
    return { saved: result.isOk() };
  });

/**
 * Records the tickets of lessons that count as complete for the signed-in
 * learner; lessons already holding one are skipped.
 */
export const earnTicketsAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.earnedTickets)
  .action(async ({ parsedInput, ctx }) => {
    await getLearnerDependencies(ctx.learnerId).repositories.tickets.earn(parsedInput.lessonIds);
    return { earned: true };
  });

/** Records the claim of a module's prize for the signed-in learner. */
export const claimPrizeAction = learnerActionClient
  .inputSchema(LEARNER_ACTION_SCHEMAS.prizeClaim)
  .action(async ({ parsedInput, ctx }) => {
    await getLearnerDependencies(ctx.learnerId).repositories.prizeClaims.claim(
      parsedInput.moduleSlug,
    );
    return { claimed: true };
  });
