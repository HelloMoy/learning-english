"use client";

import { LEARNER_NAME_MAX_LENGTH } from "@/domain/entities/learner-profile/learner-profile";

/**
 * Props for {@link LearnerCardNameField}.
 */
export type LearnerCardNameFieldProps = {
  /** The field's accessible name, already translated. */
  label: string;
  /** What stands where the name goes while it is empty, already translated. */
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  /** Whether the field takes focus on mount; the first onboarding step does. */
  autoFocus?: boolean;
};

/**
 * The learner card's name, written in place.
 *
 * @remarks
 * Goes in `LearnerCard`'s `nameField` slot, where it replaces the name the
 * card would otherwise print. It is styled to read as a field rather than as
 * the card's own text — a resting dashed line, a caret, and a solid gold line
 * on focus — because a card that only previewed the name sent learners
 * clicking at text that could not answer.
 *
 * Both onboarding steps use it, so the card's name can be written on step 1
 * and corrected on step 2 without leaving the card.
 *
 * @example
 * ```tsx
 * <LearnerCard
 *   name={name}
 *   avatar={avatar}
 *   level={level}
 *   nameField={
 *     <LearnerCardNameField
 *       label={t("name.fieldLabel")}
 *       placeholder={t("name.placeholder")}
 *       value={name}
 *       onChange={setName}
 *     />
 *   }
 * />
 * ```
 *
 * @category Components
 */
export function LearnerCardNameField({
  label,
  placeholder,
  value,
  onChange,
  autoFocus,
}: LearnerCardNameFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
      placeholder={placeholder}
      autoComplete="name"
      autoFocus={autoFocus}
      maxLength={LEARNER_NAME_MAX_LENGTH}
      className="w-full min-w-0 truncate border-b border-dashed border-muted-foreground/50 bg-transparent pb-1 text-2xl leading-[1.05] font-extrabold tracking-tight text-foreground caret-gold transition-colors placeholder:font-extrabold placeholder:text-muted-foreground/60 focus-visible:border-solid focus-visible:border-gold focus-visible:outline-none sm:text-3xl"
    />
  );
}
