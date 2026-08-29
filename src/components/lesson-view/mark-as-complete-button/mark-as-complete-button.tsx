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
 *
 * `markComplete` is injected rather than imported so the component stays
 * testable without a server. Its type is written structurally — the
 * `{ data }` envelope is what `next-safe-action` resolves to, but naming
 * that library's types here would drag a server concern into the view. A
 * result without `data` means validation rejected the input, so the button
 * stays in its incomplete state.
 */
export function MarkAsCompleteButton({
  lessonId,
  markComplete,
}: {
  lessonId: LessonId;
  markComplete: (input: {
    lessonId: LessonId;
  }) => Promise<{ data?: { completed: boolean } } | undefined>;
}) {
  const t = useTranslations("Components.MarkAsCompleteButton");
  const [completed, setCompleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await markComplete({ lessonId });
      if (result?.data?.completed === true) {
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
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold tracking-wide text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
      >
        <span aria-hidden="true">✓</span>
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
