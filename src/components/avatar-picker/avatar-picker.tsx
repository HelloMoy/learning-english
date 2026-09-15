"use client";

import { LearnerIllustration } from "@/components/learner-avatar/learner-illustration";
import {
  LEARNER_ILLUSTRATION_IDS,
  learnerInitials,
  type LearnerAvatar,
} from "@/domain/entities/learner-profile/learner-profile";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import { useRef, type KeyboardEvent } from "react";

/** Every choice, initials first — the avatar a learner has before choosing. */
const OPTIONS: ReadonlyArray<LearnerAvatar> = [
  { kind: "initials" },
  ...LEARNER_ILLUSTRATION_IDS.map((id) => ({ kind: "illustration" as const, id })),
];

const NEXT_KEYS = new Set(["ArrowRight", "ArrowDown"]);
const PREVIOUS_KEYS = new Set(["ArrowLeft", "ArrowUp"]);

const optionKey = (avatar: LearnerAvatar): string =>
  avatar.kind === "initials" ? "initials" : avatar.id;

/**
 * Picks the learner's avatar: their initials or one of eight illustrations.
 *
 * @remarks
 * A single-choice group with radio semantics. Only the checked option is a tab
 * stop; the arrow keys move the choice and the focus together, wrapping at
 * either end, as a native radio group does.
 *
 * The initials option previews the learner's own initials, so it updates as
 * the name above it is typed.
 *
 * Controlled: the picker never stores a choice, it reports one.
 *
 * @param name - The learner's name, for the initials preview
 * @param value - The avatar currently chosen
 * @param onChange - Called with the avatar the learner picks
 * @param className - Extra classes for the grid, e.g. its column count
 */
export function AvatarPicker({
  name,
  value,
  onChange,
  className,
}: {
  name: string;
  value: LearnerAvatar;
  onChange: (avatar: LearnerAvatar) => void;
  className?: string;
}) {
  const t = useTranslations("Components.AvatarPicker");
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const checkedIndex = OPTIONS.findIndex((option) => optionKey(option) === optionKey(value));

  const choose = (index: number) => {
    const wrapped = (index + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[wrapped]!);
    optionRefs.current[wrapped]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (NEXT_KEYS.has(event.key)) choose(checkedIndex + 1);
    else if (PREVIOUS_KEYS.has(event.key)) choose(checkedIndex - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      onKeyDown={handleKeyDown}
      className={cn(
        "grid w-full grid-cols-3 justify-items-center gap-x-2.5 gap-y-4 rounded-[1.125rem] border border-border bg-card/60 p-4 sm:grid-cols-9 sm:gap-x-3.5 sm:gap-y-[1.125rem] sm:p-5",
        className,
      )}
    >
      {OPTIONS.map((option, index) => {
        const isChecked = index === checkedIndex;
        return (
          <button
            key={optionKey(option)}
            ref={(element) => {
              optionRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={isChecked ? 0 : -1}
            onClick={() => onChange(option)}
            className="group flex min-w-11 cursor-pointer flex-col items-center gap-2 rounded-2xl focus-visible:outline-none"
          >
            <span
              className={cn(
                "block size-[4.5rem] overflow-hidden rounded-2xl transition-[box-shadow,transform] duration-150 group-focus-visible:ring-3 group-focus-visible:ring-ring/50 motion-reduce:transition-none sm:size-16",
                isChecked
                  ? "scale-[1.04] shadow-[0_0_0_3px_var(--background),0_0_0_6px_var(--primary)]"
                  : "shadow-[0_0_0_1px_var(--border)]",
              )}
            >
              {option.kind === "illustration" ? (
                <LearnerIllustration id={option.id} />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-full items-center justify-center bg-primary text-2xl font-extrabold text-primary-foreground"
                >
                  {learnerInitials(name)}
                </span>
              )}
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                isChecked ? "text-amber" : "text-muted-foreground",
              )}
            >
              {option.kind === "illustration" ? t(`illustrations.${option.id}`) : t("initials")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
