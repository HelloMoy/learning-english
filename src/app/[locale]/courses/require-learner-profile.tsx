"use client";

import { useRequireLearnerProfile } from "@/hooks/use-require-learner-profile/use-require-learner-profile";

/**
 * The course routes' gate: sends a device without a learner card to the
 * onboarding. Renders nothing, so the server-rendered course stays intact.
 */
export function RequireLearnerProfile() {
  useRequireLearnerProfile();
  return null;
}
