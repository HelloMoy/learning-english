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
    <button
      type="button"
      onClick={onClick}
      disabled={completed || isPending}
      aria-pressed={completed}
      className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      {completed ? t("markedComplete") : t("markComplete")}
    </button>
  );
}
