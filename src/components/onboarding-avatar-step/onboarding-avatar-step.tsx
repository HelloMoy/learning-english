"use client";

import { AvatarPicker } from "@/components/avatar-picker/avatar-picker";
import { LearnerCardNameField } from "@/components/learner-card-name-field/learner-card-name-field";
import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import { OnboardingProgress } from "@/components/onboarding-progress/onboarding-progress";
import { OnboardingShell } from "@/components/onboarding-shell/onboarding-shell";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import {
  useLearnerProfile,
  type LearnerProfileHandle,
} from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { useOnboardingDestinations } from "@/hooks/use-onboarding-destinations/use-onboarding-destinations";
import { useRouter } from "@/i18n/navigation";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Onboarding step 2: the learner picks an avatar on the same learner card.
 *
 * @remarks
 * Choosing updates the card at once and saves nothing; Continue saves the
 * choice and opens where the onboarding ends: the course route named in
 * `next`, or My learning. The step needs the name from step 1, so a device
 * without a profile is sent back there, keeping the same `next`.
 *
 * The name stays editable on the card, with the same field step 1 uses: the
 * card is in front of the learner, so a typo they only notice now is fixed
 * here rather than by going back. Typing changes the card and saves nothing;
 * Continue saves the name and the avatar together.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 * @param level - The level line the card shows
 * @param videoCount - How many videos that course holds, for the card's progress line
 */
export function OnboardingAvatarStep({
  profiles,
  level,
  videoCount,
}: {
  profiles?: LearnerProfileRepository;
  level: LearnerCardLevel;
  videoCount: number;
}) {
  const learner = useLearnerProfile(profiles);
  const { nameStep } = useOnboardingDestinations();
  useLearnerRedirect(learner.status, { when: "absent", to: nameStep });

  if (learner.status !== "present") {
    return <OnboardingShell />;
  }
  return (
    <AvatarChoice
      profile={learner.profile}
      save={learner.save}
      level={level}
      videoCount={videoCount}
    />
  );
}

function AvatarChoice({
  profile,
  save,
  level,
  videoCount,
}: {
  profile: LearnerProfile;
  save: LearnerProfileHandle["save"];
  level: LearnerCardLevel;
  videoCount: number;
}) {
  const t = useTranslations("Onboarding");
  const router = useRouter();
  const { afterOnboarding } = useOnboardingDestinations();
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [isSaving, setIsSaving] = useState(false);

  const hasName = name.trim().length > 0;

  const handleContinue = async () => {
    setIsSaving(true);
    const isSaved = await save({ name, avatar });
    if (isSaved) router.push(afterOnboarding);
    else setIsSaving(false);
  };

  return (
    <section className="mx-auto flex w-full max-w-[47.5rem] flex-col items-center gap-5 text-center sm:gap-6">
      <OnboardingProgress step={2} />
      <div className="flex flex-col gap-3">
        <h1 className="font-sans text-[2rem] leading-[1.05] font-extrabold tracking-tight text-balance text-foreground sm:text-[2.875rem]">
          {t("avatar.heading")}
        </h1>
        <p className="text-[0.9375rem] text-muted-foreground">{t("avatar.intro")}</p>
      </div>
      <LearnerCard
        name={name}
        avatar={avatar}
        level={level}
        progress={{ completed: 0, total: videoCount }}
        nameField={
          <LearnerCardNameField
            label={t("name.fieldLabel")}
            placeholder={t("name.placeholder")}
            value={name}
            onChange={setName}
          />
        }
      />
      <AvatarPicker
        name={name}
        value={avatar}
        onChange={setAvatar}
      />
      <button
        type="button"
        onClick={handleContinue}
        disabled={!hasName || isSaving}
        className="inline-flex min-h-[3.25rem] w-full max-w-[27.5rem] cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] bg-primary px-7 text-[0.9375rem] font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t("avatar.continue")}
        <ArrowRight
          aria-hidden="true"
          className="size-4"
        />
      </button>
    </section>
  );
}
