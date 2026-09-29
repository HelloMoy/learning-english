"use client";

import {
  isCourseReturnPath,
  withReturnPath,
} from "@/lib/onboarding-return-path/onboarding-return-path";

import { parseAsString, useQueryState } from "nuqs";

const NAME_STEP_PATH = "/start";
const AVATAR_STEP_PATH = "/start/avatar";
const FIRST_COURSE_STEP_PATH = "/start/first-course";
const MY_LEARNING_PATH = "/learning";

const returnPathParser = parseAsString;

/** Where each onboarding step sends the learner, all locale-less. */
export type OnboardingDestinations = {
  /** Step 1, carrying the course route to return to. */
  nameStep: string;
  /** Step 2, carrying the course route to return to. */
  avatarStep: string;
  /** Where step 2 continues: step 3, or the course route to return to. */
  afterAvatarStep: string;
  /** Where an already onboarded learner lands. */
  afterOnboarding: string;
};

/**
 * Resolves the onboarding's destinations from the `next` query parameter.
 *
 * @remarks
 * A course route that sent the learner to the onboarding names itself in
 * `next`. When that value is a safe course path, both steps carry it forward
 * and the onboarding ends there; otherwise it is ignored: step 2 continues to
 * the first-course step, and an already onboarded learner lands on My
 * learning, exactly as when opened from the landing.
 *
 * @returns The hrefs for step 1, step 2, what follows step 2, and the end of the onboarding
 *
 * @example
 * ```ts
 * const { avatarStep, afterOnboarding } = useOnboardingDestinations();
 * router.push(avatarStep);
 * ```
 */
export function useOnboardingDestinations(): OnboardingDestinations {
  const [next] = useQueryState("next", returnPathParser);
  const returnPath = next ?? undefined;
  const hasReturnPath = returnPath !== undefined && isCourseReturnPath(returnPath);

  return {
    nameStep: withReturnPath(NAME_STEP_PATH, returnPath),
    avatarStep: withReturnPath(AVATAR_STEP_PATH, returnPath),
    afterAvatarStep: hasReturnPath ? returnPath : FIRST_COURSE_STEP_PATH,
    afterOnboarding: hasReturnPath ? returnPath : MY_LEARNING_PATH,
  };
}
