"use client";

import { LearnerAvatar } from "@/components/learner-avatar/learner-avatar";
import { ProgressRing } from "@/components/progress-ring/progress-ring";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip/tooltip";
import type { LearnerAvatar as LearnerAvatarValue } from "@/domain/entities/learner-profile/learner-profile";
import { cn } from "@/lib/utils/utils";

import { useTranslations } from "next-intl";
import { useRef, useState, type MouseEvent, type ReactNode } from "react";

/** The course level a learner card names. */
export type LearnerCardLevel = {
  number: number;
  courseTitle: string;
};

/** How many of the level's videos the learner has completed, out of all of them. */
export type LearnerCardProgress = {
  completed: number;
  total: number;
};

/** The completed share in `[0, 1]`; a course with no videos has nothing done. */
const completedShare = ({ completed, total }: LearnerCardProgress): number =>
  total > 0 ? Math.min(completed / total, 1) : 0;

/**
 * The learner card: who is learning on this device, drawn like a membership
 * card — wordmark, `Learner` tag, avatar, name, level, and progress.
 *
 * @remarks
 * The onboarding and the Profile page both edit the card live, so it renders
 * whatever it is given, including a name still being typed: a blank name shows
 * a placeholder rather than an empty line.
 *
 * The wordmark here is decoration, not the header's home link, so it is a
 * plain text mark hidden from assistive technology.
 *
 * The progress line names completed videos out of the total; hovering or
 * focusing it opens a tooltip below it — so it never covers the learner's name
 * — with a progress ring at the completed percentage, the count, and how many
 * videos are left in the course, or that the course is complete. A phone has
 * no hover, so a tap on the label toggles the tooltip too, and its hit area
 * reaches 44px tall without moving the footer.
 *
 * @param name - The learner's name, as typed so far
 * @param avatar - Initials or an illustration
 * @param level - The level and course line
 * @param progress - Completed and total videos of the level's course
 * @param size - `large` widens the card and its type for the Profile preview
 */
export function LearnerCard({
  name,
  avatar,
  level,
  progress,
  size = "default",
}: {
  name: string;
  avatar: LearnerAvatarValue;
  level: LearnerCardLevel;
  progress: LearnerCardProgress;
  size?: "default" | "large";
}) {
  const t = useTranslations("Components.LearnerCard");
  const trimmedName = name.trim();
  const isLarge = size === "large";
  const share = completedShare(progress);
  const isComplete = progress.total > 0 && progress.completed >= progress.total;

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-[1.125rem] rounded-[1.25rem] border border-gold/45 bg-[radial-gradient(90%_120%_at_0%_0%,color-mix(in_oklab,var(--glow)_30%,var(--card)),var(--card)_60%)] p-5 text-left shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] sm:p-[1.625rem]",
        isLarge ? "max-w-full" : "max-w-[27.5rem]",
      )}
    >
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="font-sans text-[13px] leading-none font-extrabold tracking-[0.18em] text-foreground uppercase"
        >
          ENGLISH<span className="px-[0.15em] text-gold">·</span>COURSE
        </span>
        <span className="text-[10px] font-bold tracking-[0.3em] text-gold uppercase">
          {t("tag")}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <LearnerAvatar
          name={trimmedName}
          avatar={avatar}
          size={isLarge ? "xl" : "lg"}
        />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p
            className={cn(
              "truncate leading-[1.05] font-extrabold tracking-tight",
              isLarge ? "text-2xl sm:text-[2.125rem]" : "text-2xl sm:text-3xl",
              trimmedName ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {trimmedName || t("namePlaceholder")}
          </p>
          <p className="text-[13px] text-muted-foreground">
            {t("level", { number: level.number, course: level.courseTitle })}
          </p>
        </div>
      </div>
      <div className="border-t border-dashed border-border" />
      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{t("subject")}</span>
        <ProgressTooltip label={t("progress", progress)}>
          <ProgressRing
            share={share}
            label={t("progressPercent", { percent: share })}
            labelClassName="text-popover-foreground"
          />
          <span className="flex flex-col gap-0.5 text-left">
            <span className="text-[13px] font-bold">{t("progress", progress)}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {isComplete
                ? t("progressComplete", { course: level.courseTitle })
                : t("progressRemaining", {
                    count: Math.max(progress.total - progress.completed, 0),
                    course: level.courseTitle,
                  })}
            </span>
          </span>
        </ProgressTooltip>
      </div>
    </div>
  );
}

/**
 * The progress label and its tooltip, openable by hover, focus and tap.
 *
 * Radix opens tooltips on hover and keyboard focus only, so on a touch screen
 * the tooltip is held open here and the label's click toggles it. A press on
 * the label itself is not treated as a press outside the tooltip — otherwise
 * the second tap would dismiss the tooltip and then reopen it at once.
 */
function ProgressTooltip({ label, children }: { label: string; children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenAtPressRef = useRef(false);

  // Radix closes an open tooltip on the trigger's pointerdown, before the click
  // arrives, so the click decides from what was showing when the press began.
  const rememberOpenState = () => {
    wasOpenAtPressRef.current = isOpen;
  };
  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    // Radix also closes a tooltip on trigger click; the toggle replaces that.
    event.preventDefault();
    const isKeyboardClick = event.detail === 0;
    setIsOpen((open) => !(isKeyboardClick ? open : wasOpenAtPressRef.current));
  };
  const keepOpenForTriggerPress = (event: Event) => {
    if (triggerRef.current?.contains(event.target as Node)) event.preventDefault();
  };

  return (
    <Tooltip
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <TooltipTrigger
        ref={triggerRef}
        onPointerDown={rememberOpenState}
        onClick={toggle}
        className="relative cursor-help rounded-sm underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 transition-colors after:absolute after:-inset-x-2 after:-inset-y-3.5 after:content-[''] hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {label}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
        alignOffset={-10}
        onPointerDownOutside={keepOpenForTriggerPress}
        className="flex items-center gap-3 rounded-[0.875rem] py-3 pr-4 pl-3"
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
