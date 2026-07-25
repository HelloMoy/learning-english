"use client";

import type { LessonId } from "@/domain/entities/ids/ids";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * The "Mark as complete" affordance below the Player. Manual, ephemeral:
 * the click toggles local state and calls the `markLessonComplete` Server
 * Action, but no persistence happens until Progress lands.
 *
 * The button is a Client Component because it owns local state and runs the
 * Server Action via a transition.
 */
export function MarkAsCompleteButton({
  lessonId,
  markComplete,
}: {
  lessonId: LessonId;
  markComplete: (input: { lessonId: LessonId }) => Promise<{ completed: boolean }>;
}) {
  const t = useTranslations("Components.MarkAsCompleteButton");
  const [completed, setCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await markComplete({ lessonId });
      if (result.completed) {
        setCompleted(true);
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={completed || isPending}
        aria-pressed={completed}
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-card-foreground hover:bg-slate-50 focus-visible:ring-3 focus-visible:ring-practice-blue/40 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-slate-800"
      >
        {completed ? t("markedComplete") : t("markComplete")}
      </button>
      <p
        aria-live="polite"
        className="text-sm text-muted-foreground"
        data-testid="mark-as-complete-status"
      >
        {completed ? t("markedComplete") : isPending ? t("markComplete") : ""}
      </p>
    </div>
  );
}
