"use client";

import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { Link } from "@/i18n/navigation";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";

/** Where a learner starts: the onboarding the first time, their own page after. */
const ONBOARDING_PATH = "/start";
const MY_LEARNING_PATH = "/learning";

/**
 * The landing's primary action: **Start course** for a new visitor,
 * **Continue** for a learner who already has a card.
 *
 * @remarks
 * A device with a learner profile is invited to continue, straight to My
 * learning; any other device starts the course through the onboarding. Until
 * the client has read storage the link reads Start course and points at the
 * onboarding, which is what the server rendered — and the onboarding forwards
 * a learner who turns out to have a profile.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 */
export function StartCourseLink({ profiles }: { profiles?: LearnerProfileRepository }) {
  const t = useTranslations("Components.StartCourseLink");
  const learner = useLearnerProfile(profiles);
  const isOnboarded = learner.status === "present";

  return (
    <Link
      href={isOnboarded ? MY_LEARNING_PATH : ONBOARDING_PATH}
      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-7 text-[0.9375rem] font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <Play
        aria-hidden="true"
        className="size-4"
        fill="currentColor"
      />
      {isOnboarded ? t("continueLabel") : t("label")}
    </Link>
  );
}
