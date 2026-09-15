"use client";

import { AvatarPicker } from "@/components/avatar-picker/avatar-picker";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { LearnerCard, type LearnerCardLevel } from "@/components/learner-card/learner-card";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import {
  LEARNER_NAME_MAX_LENGTH,
  type LearnerAvatar,
  type LearnerProfile,
} from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useCourseWatchProgress } from "@/hooks/use-course-watch-progress/use-course-watch-progress";
import { useIsHydrated } from "@/hooks/use-is-hydrated/use-is-hydrated";
import {
  useLearnerProfile,
  type LearnerProfileHandle,
} from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * The Profile page: edit the name and avatar on the learner card, with the card
 * itself as a live preview.
 *
 * @remarks
 * Edits are drafts until **Save**: the preview follows every keystroke and
 * every pick, and storage only changes when the learner commits. Save waits for
 * a real change and a non-blank name; **Discard** returns the form to the
 * stored card.
 *
 * The page edits an existing card, so a device without one is sent to the
 * onboarding to make it.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 * @param level - The level line the card shows
 * @param lessonRuntimes - The level's lessons, for the card's progress line
 */
export function ProfileView({
  profiles,
  level,
  lessonRuntimes,
}: {
  profiles?: LearnerProfileRepository;
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
}) {
  const learner = useLearnerProfile(profiles);
  useLearnerRedirect(learner.status, { when: "absent", to: "/start" });

  if (learner.status !== "present") {
    return <ProfileShell />;
  }
  return (
    <ProfileEditor
      profile={learner.profile}
      save={learner.save}
      level={level}
      lessonRuntimes={lessonRuntimes}
    />
  );
}

const isSameAvatar = (left: LearnerAvatar, right: LearnerAvatar): boolean =>
  left.kind === "initials"
    ? right.kind === "initials"
    : right.kind === "illustration" && left.id === right.id;

function ProfileEditor({
  profile,
  save,
  level,
  lessonRuntimes,
}: {
  profile: LearnerProfile;
  save: LearnerProfileHandle["save"];
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
}) {
  const t = useTranslations("Profile");
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const hasName = name.trim().length > 0;
  const isDirty = name.trim() !== profile.name || !isSameAvatar(avatar, profile.avatar);

  const editName = (next: string) => {
    setName(next);
    setIsSaved(false);
  };
  const editAvatar = (next: LearnerAvatar) => {
    setAvatar(next);
    setIsSaved(false);
  };
  const discard = () => {
    setName(profile.name);
    setAvatar(profile.avatar);
  };
  const handleSave = async () => {
    setIsSaving(true);
    const hasSaved = await save({ name, avatar });
    setIsSaving(false);
    if (!hasSaved) return;
    setName(name.trim());
    setIsSaved(true);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-12 lg:gap-14">
      <div className="flex flex-col gap-6 lg:col-span-7">
        <div className="flex flex-col gap-2">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <h1 className="font-sans text-[1.875rem] leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-[2.625rem]">
            {t("heading")}
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground">{t("intro")}</p>
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted-foreground">{t("nameLabel")}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => editName(event.target.value)}
            autoComplete="name"
            maxLength={LEARNER_NAME_MAX_LENGTH}
            className="min-h-14 w-full rounded-xl border border-border bg-card px-[1.125rem] text-lg text-foreground focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          />
        </label>
        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold text-muted-foreground">
            {t("avatarLabel")}
          </span>
          <AvatarPicker
            name={name}
            value={avatar}
            onChange={editAvatar}
            className="sm:grid-cols-5"
          />
        </div>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={discard}
            disabled={!isDirty}
            className="inline-flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-[0.625rem] border border-border bg-foreground/5 px-[1.375rem] text-[0.9375rem] font-bold text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("discard")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || !hasName || isSaving}
            className="inline-flex min-h-[3.25rem] cursor-pointer items-center justify-center rounded-[0.625rem] bg-primary px-[1.625rem] text-[0.9375rem] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-secondary disabled:text-muted-foreground"
          >
            {t("save")}
          </button>
        </div>
        {isSaved ? (
          <p
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-gold/45 bg-card px-4 py-3 text-sm font-semibold text-foreground motion-safe:animate-in motion-safe:fade-in-0"
          >
            <Check
              aria-hidden="true"
              className="size-4 text-gold"
              strokeWidth={2.75}
            />
            {t("saved")}
          </p>
        ) : null}
      </div>
      <CardPreview
        name={name}
        avatar={avatar}
        level={level}
        lessonRuntimes={lessonRuntimes}
      />
    </div>
  );
}

function CardPreview({
  name,
  avatar,
  level,
  lessonRuntimes,
}: {
  name: string;
  avatar: LearnerAvatar;
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
}) {
  const t = useTranslations("Profile");
  const isHydrated = useIsHydrated();
  const progress = useCourseWatchProgress(lessonRuntimes);

  return (
    <div className="order-first flex flex-col gap-3.5 lg:sticky lg:top-24 lg:order-none lg:col-span-5 lg:pt-8">
      <p className="text-[11px] font-bold tracking-[0.3em] text-muted-foreground uppercase">
        {t("previewLabel")}
      </p>
      <LearnerCard
        name={name}
        avatar={avatar}
        level={level}
        size="large"
        progress={{
          completed: isHydrated ? progress.completedCount : 0,
          total: progress.lessonCount,
        }}
      />
      <p className="text-[13px] text-muted-foreground">{t("previewNote")}</p>
    </div>
  );
}

/** The page's shape while storage has not said whose card this is. */
function ProfileShell() {
  return (
    <div
      data-testid="profile-shell"
      aria-hidden="true"
      className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-14"
    >
      <div className="flex flex-col gap-6 lg:col-span-7">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-[1.125rem]" />
      </div>
      <Skeleton className="order-first h-56 w-full rounded-[1.25rem] lg:order-none lg:col-span-5" />
    </div>
  );
}
