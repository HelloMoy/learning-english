import {
  learnerInitials,
  type LearnerAvatar as LearnerAvatarValue,
} from "@/domain/entities/learner-profile/learner-profile";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";

import { LearnerIllustration } from "./learner-illustration";

/** How large an avatar renders, from the header chip up to the profile card. */
export type LearnerAvatarSize = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<LearnerAvatarSize, string> = {
  sm: "size-9 text-[13px]",
  md: "size-14 text-xl sm:size-[4.5rem] sm:text-[1.625rem]",
  lg: "size-[4.5rem] text-[1.625rem] sm:size-[5.25rem] sm:text-3xl",
  xl: "size-[4.5rem] text-[1.625rem] sm:size-24 sm:text-4xl",
};

/**
 * The learner's avatar: a circle showing their chosen illustration, or the
 * initials of their name on the gold accent.
 *
 * @remarks
 * Anatomy follows shadcn's Avatar — a clipped circle with an image or a text
 * fallback — without its image-loading state, because every illustration is
 * inline SVG and never fails to load.
 *
 * The circle is one `img` named after the learner, so the picture and the
 * initials never announce themselves separately.
 *
 * A blank name — a card still being filled in — shows `?` and is announced
 * simply as an avatar.
 *
 * @param name - The learner's name; initials are derived from it
 * @param avatar - Initials or an illustration
 * @param size - Render size; defaults to `md`
 * @param className - Extra classes for the circle
 *
 * @example
 * ```tsx
 * <LearnerAvatar name="Ana García" avatar={{ kind: "illustration", id: "wave" }} size="sm" />
 * ```
 */
export function LearnerAvatar({
  name,
  avatar,
  size = "md",
  className,
}: {
  name: string;
  avatar: LearnerAvatarValue;
  size?: LearnerAvatarSize;
  className?: string;
}) {
  const t = useTranslations("Components.LearnerAvatar");
  const trimmedName = name.trim();

  return (
    <span
      role="img"
      aria-label={trimmedName ? t("label", { name: trimmedName }) : t("labelUnnamed")}
      className={cn(
        "flex shrink-0 overflow-hidden rounded-full bg-secondary",
        SIZE_CLASSES[size],
        className,
      )}
    >
      {avatar.kind === "illustration" ? (
        <LearnerIllustration id={avatar.id} />
      ) : (
        <span className="flex size-full items-center justify-center bg-primary font-extrabold tracking-tight text-primary-foreground">
          {learnerInitials(name)}
        </span>
      )}
    </span>
  );
}
