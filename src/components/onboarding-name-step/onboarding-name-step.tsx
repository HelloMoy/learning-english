"use client";

import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import { OnboardingProgress } from "@/components/onboarding-progress/onboarding-progress";
import { OnboardingShell } from "@/components/onboarding-shell/onboarding-shell";
import {
  LEARNER_NAME_MAX_LENGTH,
  type LearnerAvatar,
} from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { useRouter } from "@/i18n/navigation";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

const INITIALS: LearnerAvatar = { kind: "initials" };

/**
 * Onboarding step 1: the learner types their name into a live learner card.
 *
 * @remarks
 * Continue saves a profile with the name and the initials avatar — a complete
 * profile, so a learner who leaves before step 2 still has a card — and opens
 * step 2.
 *
 * A device that already holds a profile is forwarded to My learning. Saving
 * creates exactly such a profile, so the forward stands down once the learner
 * has submitted.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 * @param level - The level line the card shows
 * @param videoCount - How many videos that course holds, for the card's progress line
 */
export function OnboardingNameStep({
  profiles,
  level,
  videoCount,
}: {
  profiles?: LearnerProfileRepository;
  level: LearnerCardLevel;
  videoCount: number;
}) {
  const t = useTranslations("Onboarding");
  const learner = useLearnerProfile(profiles);
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  useLearnerRedirect(isSaving ? "unknown" : learner.status, { when: "present", to: "/learning" });

  if (learner.status === "unknown" || (learner.status === "present" && !isSaving)) {
    return <OnboardingShell />;
  }

  const hasName = name.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasName) return;
    setIsSaving(true);
    const isSaved = await learner.save({ name, avatar: INITIALS });
    if (isSaved) router.push("/start/avatar");
    else setIsSaving(false);
  };

  return (
    <section className="mx-auto flex w-full max-w-[47.5rem] flex-col items-center gap-6 text-center sm:gap-7">
      <OnboardingProgress step={1} />
      <h1 className="font-sans text-[2rem] leading-[1.05] font-extrabold tracking-tight text-balance text-foreground sm:text-[2.875rem]">
        {t("name.heading")}
      </h1>
      <LearnerCard
        name={name}
        avatar={INITIALS}
        level={level}
        progress={{ completed: 0, total: videoCount }}
      />
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-[27.5rem] flex-col gap-3"
      >
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-label={t("name.fieldLabel")}
          placeholder={t("name.placeholder")}
          autoComplete="name"
          maxLength={LEARNER_NAME_MAX_LENGTH}
          className="min-h-14 w-full rounded-xl border border-border bg-card px-[1.125rem] text-lg text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        />
        <button
          type="submit"
          disabled={!hasName || isSaving}
          className="inline-flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center gap-2 rounded-[0.625rem] bg-primary px-7 text-[0.9375rem] font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
        >
          {t("name.continue")}
          <ArrowRight
            aria-hidden="true"
            className="size-4"
          />
        </button>
      </form>
    </section>
  );
}
