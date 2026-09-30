"use client";

import { AccountSection } from "@/components/account-section/account-section";
import { AvatarPicker } from "@/components/avatar-picker/avatar-picker";
import { DeleteAccountSection } from "@/components/delete-account-section/delete-account-section";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import type { LearnerCardLevel } from "@/components/learner-card/learner-card";
import { LocaleSwitcher } from "@/components/locale-switcher/locale-switcher";
import { ProfileCardBand } from "@/components/profile-card-band/profile-card-band";
import {
  ProfileSaveBar,
  type ProfileSaveState,
} from "@/components/profile-save-bar/profile-save-bar";
import { ProfileSection } from "@/components/profile-section/profile-section";
import { ThemeToggle } from "@/components/theme-toggle/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import {
  LEARNER_NAME_MAX_LENGTH,
  type LearnerAvatar,
  type LearnerProfile,
} from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import {
  useLearnerProfile,
  type LearnerProfileHandle,
} from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import type { LearnerAccountIdentity } from "@/lib/account-identity/account-identity";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";

import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

/**
 * The Profile page: the learner's card and progress in a column of their own,
 * beside the sections that edit the card, hold the sign-in and security
 * settings, set the preferences, and delete the account.
 *
 * @remarks
 * Edits are drafts until **Save**: the card follows every keystroke and every
 * pick, and storage only changes when the learner commits from
 * {@link ProfileSaveBar}, which exists only while there is something to save.
 *
 * On a wide screen the card column stays in view while the sections scroll, so
 * the live preview is beside whatever is being edited, and the save bar sits
 * in that column under the card. On a narrow screen the card comes first and
 * the bar docks to the bottom of the viewport.
 *
 * The page's `h1` is its localized title, not the learner's name: the name
 * already reads on the card and in the field, and a heading that repeated it
 * would be the third copy on one screen.
 *
 * The page edits an existing card, so a device without one is sent to the
 * onboarding to make it.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 * @param level - The level the card names
 * @param lessonRuntimes - The level's lessons, for the card's progress line
 * @param levels - Every catalog course, for the tickets and prizes counts
 * @param account - Who the learner is to their account; `null` leaves the
 *   settings out, which is what a session that ended mid-render looks like
 */
export function ProfileView({
  profiles,
  level,
  lessonRuntimes,
  levels,
  account,
}: {
  profiles?: LearnerProfileRepository;
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  levels: ReadonlyArray<AchievementLevel>;
  account: LearnerAccountIdentity | null;
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
      levels={levels}
      account={account}
    />
  );
}

/** The card column and the sections: side by side on a wide screen, stacked on a narrow one. */
const PROFILE_COLUMNS =
  "grid grid-cols-1 gap-8 lg:grid-cols-[22.5rem_minmax(0,1fr)] lg:items-start lg:gap-12";

/** The delete section, set apart from the rest as a danger zone. */
const DANGER_PANEL =
  "mt-8 rounded-[1.125rem] border border-destructive/40 bg-destructive/5 p-5 sm:p-6";

const isSameAvatar = (left: LearnerAvatar, right: LearnerAvatar): boolean =>
  left.kind === "initials"
    ? right.kind === "initials"
    : right.kind === "illustration" && left.id === right.id;

function ProfileEditor({
  profile,
  save,
  level,
  lessonRuntimes,
  levels,
  account,
}: {
  profile: LearnerProfile;
  save: LearnerProfileHandle["save"];
  level: LearnerCardLevel;
  lessonRuntimes: ReadonlyArray<LessonProgressSlice>;
  levels: ReadonlyArray<AchievementLevel>;
  account: LearnerAccountIdentity | null;
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
    setIsSaved(false);
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10">
      <div className="flex flex-col gap-2">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-sans text-[1.875rem] leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-[2.625rem]">
          {t("title")}
        </h1>
        <p className="text-[0.9375rem] text-muted-foreground">{t("intro")}</p>
      </div>

      <div className={PROFILE_COLUMNS}>
        <div
          data-testid="profile-card-column"
          className="flex flex-col gap-4 lg:sticky lg:top-24"
        >
          <ProfileCardBand
            name={name}
            avatar={avatar}
            level={level}
            lessonRuntimes={lessonRuntimes}
            levels={levels}
          />
          <ProfileSaveBar
            state={saveState({ isDirty, isSaving, isSaved })}
            canSave={hasName}
            onSave={handleSave}
            onDiscard={discard}
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <ProfileSection
            title={t("sections.identity")}
            note={t("sections.identityNote")}
            className="border-t-0 pt-0"
          >
            <label className="flex max-w-xl flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted-foreground">
                {t("nameLabel")}
              </span>
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
                className="sm:grid-cols-5 xl:grid-cols-9"
              />
            </div>
          </ProfileSection>

          {account ? (
            <ProfileSection title={t("account.heading")}>
              <AccountSection account={account} />
            </ProfileSection>
          ) : null}

          <ProfileSection title={t("sections.preferences")}>
            <div className="flex flex-col">
              <PreferenceRow label={t("preferences.languageLabel")}>
                <LocaleSwitcher />
              </PreferenceRow>
              <PreferenceRow label={t("preferences.themeLabel")}>
                <ThemeToggle />
              </PreferenceRow>
            </div>
          </ProfileSection>

          <ProfileSection
            title={t("deleteAccount.heading")}
            note={t("deleteAccount.description")}
            className={DANGER_PANEL}
          >
            <DeleteAccountSection />
          </ProfileSection>
        </div>
      </div>
    </div>
  );
}

/** What the save bar draws, from where the edited card stands. */
function saveState({
  isDirty,
  isSaving,
  isSaved,
}: {
  isDirty: boolean;
  isSaving: boolean;
  isSaved: boolean;
}): ProfileSaveState {
  if (isSaving) return "saving";
  if (isDirty) return "unsaved";
  return isSaved ? "saved" : "clean";
}

/** One preference: what it changes on the left, the control on the right. */
function PreferenceRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-border/60 py-2 last:border-b-0">
      <span className="text-[0.9375rem] font-semibold text-foreground">{label}</span>
      {children}
    </div>
  );
}

/** The page's shape while storage has not said whose card this is. */
function ProfileShell() {
  return (
    <div
      data-testid="profile-shell"
      aria-hidden="true"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8 sm:gap-10"
    >
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-full max-w-sm" />
      </div>
      <div className={PROFILE_COLUMNS}>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 w-full rounded-[1.25rem]" />
          <Skeleton className="h-14 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-14 w-full max-w-xl rounded-xl" />
          <Skeleton className="h-40 w-full rounded-[1.125rem]" />
        </div>
      </div>
    </div>
  );
}
