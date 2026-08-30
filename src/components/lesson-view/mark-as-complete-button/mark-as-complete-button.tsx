"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import {
  markLessonComplete,
  useLessonCompletion,
} from "@/hooks/use-lesson-completion/use-lesson-completion";

import { useTranslations } from "next-intl";
import { useTransition } from "react";

/**
 * The "Mark as complete" affordance below the Player.
 *
 * @remarks
 * Its state is read from the durable browser store, not from local state
 * seeded to `false` — a lesson completed last week shows as completed on
 * arrival, and a mark survives a reload and a server restart.
 *
 * **The click writes to two places, on purpose.** It records the lesson in
 * the browser `ProgressTracker`, which is what the outline and episode-list
 * indicators read, and it still calls the `markLessonComplete` Server
 * Action against the server's in-memory tracker. The Server Action is not
 * dead code: it is the path per-user progress will take when auth lands, so
 * that migration becomes a change of caller rather than a rewrite. Until
 * then the server write is ephemeral and nothing reads it back.
 *
 * The button is a Client Component because it owns a transition and reads
 * browser storage.
 *
 * `markComplete` is injected rather than imported so the component stays
 * testable without a server. Its type is written structurally — the
 * `{ data }` envelope is what `next-safe-action` resolves to, but naming
 * that library's types here would drag a server concern into the view. A
 * result without `data` means validation rejected the input, so the button
 * stays in its incomplete state and nothing is recorded.
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
  const completed = useLessonCompletion(lessonId);
  const [isPending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      const result = await markComplete({ lessonId });
      if (result?.data?.completed === true) {
        await markLessonComplete(lessonId);
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
