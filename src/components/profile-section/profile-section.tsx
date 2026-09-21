import { cn } from "@/lib/utils/utils";

import { useId, type ReactNode } from "react";

/**
 * Props for {@link ProfileSection}.
 */
export type ProfileSectionProps = {
  /** The section's title, rendered as its level-2 heading. */
  title: string;
  /** One line under the heading saying what the section is for. */
  note?: string;
  /** The section's content. */
  children: ReactNode;
  /** Extra classes for the section, e.g. the quieter framing of a risky one. */
  className?: string;
};

/**
 * One named section of the Profile page: a heading, an optional supporting
 * line, and whatever the section holds.
 *
 * @remarks
 * The page reads as an outline — one `h1` naming the learner and one `h2` per
 * section — so the heading lives here rather than in each section's own
 * component. Sections that were written with their own heading (the account
 * settings, the delete-account section) render inside this one and keep only
 * their content.
 *
 * The `<section>` is labelled by its heading, so assistive technology names
 * the region the same way the page does.
 *
 * The heading crosses the page's column while the content stays at a form's
 * width: the account settings hold password and email fields, and a field as
 * wide as the page is a field nobody can aim at.
 *
 * @example
 * ```tsx
 * <ProfileSection title={t("sections.identity")} note={t("sections.identityNote")}>
 *   <NameField />
 * </ProfileSection>
 * ```
 *
 * @category Components
 */
export function ProfileSection({ title, note, children, className }: ProfileSectionProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-5 border-t border-border pt-8", className)}
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id={headingId}
          className="text-lg font-bold text-foreground"
        >
          {title}
        </h2>
        {note ? (
          <p
            data-testid="profile-section-note"
            className="text-sm text-muted-foreground"
          >
            {note}
          </p>
        ) : null}
      </div>
      <div className="flex max-w-3xl flex-col gap-5">{children}</div>
    </section>
  );
}
