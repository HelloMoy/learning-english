import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { LessonPageError, LessonView } from "@/components/lesson-view";
import { LessonId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";

import { notFound } from "next/navigation";

import { markLessonCompleteAction } from "./actions";

type Props = {
  params: Promise<{
    courseSlug: string;
    moduleSlug: string;
    lessonId: string;
  }>;
};

/**
 * Server Component that renders the Lesson Page. Resolves the route
 * params through `findLessonForView` and renders `<LessonView>`. On any
 * failure:
 *   - `course-not-found` → Next.js `notFound()` (URL becomes `/404`).
 *     The segment's `not-found.tsx` renders the localized message.
 *   - `module-not-in-course` or `lesson-not-in-module` → inline
 *     `<LessonPageError>` with a kind-specific localized message.
 *   - `internal-error` → inline error (treated as a transient failure).
 *   - Invalid URL params → inline error (`invalid-params` kind).
 *
 * Spec: lesson-page § Requirement: "The page handles domain errors with
 * a user-facing error state".
 */
export default async function LessonPage({ params }: Props) {
  const { courseSlug, moduleSlug, lessonId } = await params;

  // Validate URL params at the boundary. Invalid input (bad UUID, bad
  // slug) routes to the same inline error state as a domain miss so the
  // page never throws from a Zod parse.
  const courseSlugResult = Slug.safeParse(courseSlug);
  const moduleSlugResult = Slug.safeParse(moduleSlug);
  const lessonIdResult = LessonId.safeParse(lessonId);
  if (!courseSlugResult.success || !moduleSlugResult.success || !lessonIdResult.success) {
    return <LessonPageError kind="invalid-params" />;
  }

  const deps = getCoursePlatformDeps();
  const result = await deps.useCases.findLessonForView({
    courseSlug: courseSlugResult.data,
    moduleSlug: moduleSlugResult.data,
    lessonId: lessonIdResult.data,
  });

  if (result.isErr()) {
    // The course is the route's outer scope; per task 6.2 we delegate to
    // Next.js's 404 handling. Other misses are scoped to the resolved
    // course, so they keep an inline error affordance.
    if (result.error.kind === "course-not-found") {
      notFound();
    }
    const kind =
      result.error.kind === "module-not-in-course"
        ? "module-not-in-course"
        : "lesson-not-in-module";
    return <LessonPageError kind={kind} />;
  }

  const view: LessonViewData = result.value;
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <LessonView
        view={view}
        markComplete={markLessonCompleteAction}
      />
    </main>
  );
}
