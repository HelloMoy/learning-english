import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { LessonPageError, LessonView } from "@/components/lesson-view";
import { LessonId } from "@/domain/entities/ids/ids";
import { Slug } from "@/domain/entities/slug/slug";
import type { LessonView as LessonViewData } from "@/domain/use-cases/find-lesson-for-view/find-lesson-for-view";

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cache } from "react";

import { markLessonCompleteAction } from "./actions";

type Props = {
  params: Promise<{
    locale: string;
    courseSlug: string;
    moduleSlug: string;
    lessonId: string;
  }>;
};

/**
 * Cached use-case invocation. React dedupes this call within a single
 * request, so `generateMetadata` and the page body invoke
 * `findLessonForView` exactly once. The cache key is the resolved
 * (typed) input — invalid params never reach this function because the
 * callers `safeParse` before invoking.
 */
const loadLessonView = cache(
  async (
    courseSlug: ReturnType<typeof Slug.parse>,
    moduleSlug: ReturnType<typeof Slug.parse>,
    lessonId: ReturnType<typeof LessonId.parse>,
  ) => {
    const deps = getCoursePlatformDeps();
    return deps.useCases.findLessonForView({
      courseSlug,
      moduleSlug,
      lessonId,
    });
  },
);

/**
 * Per-page metadata. Sets `<title>` to the resolved lesson's title on
 * success, or to a localized fallback (`HomePage.notFound`) on any error
 * or invalid params.
 *
 * Spec: lesson-view-polish § Requirement: "The Lesson Page sets a per-page
 * <title>".
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, courseSlug, moduleSlug, lessonId } = await params;
  const t = await getTranslations({ locale, namespace: "HomePage" });
  const courseSlugResult = Slug.safeParse(courseSlug);
  const moduleSlugResult = Slug.safeParse(moduleSlug);
  const lessonIdResult = LessonId.safeParse(lessonId);
  if (!courseSlugResult.success || !moduleSlugResult.success || !lessonIdResult.success) {
    return { title: t("notFound") };
  }
  const result = await loadLessonView(
    courseSlugResult.data,
    moduleSlugResult.data,
    lessonIdResult.data,
  );
  if (result.isErr()) {
    return { title: t("notFound") };
  }
  return { title: result.value.lesson.title };
}

/**
 * Server Component that renders the Lesson Page. Resolves the route
 * params through `findLessonForView` and renders `<LessonView>`. On any
 * failure, the page renders a kind-specific inline error message
 * via `<LessonPageError>`:
 *   - `course-not-found` → "Course not found" message + home link
 *   - `module-not-in-course` → "Module not in course" message + home link
 *   - `lesson-not-in-module` → "Lesson not in module" message + home link
 *   - `internal-error` → treated as a transient failure (renders the
 *     `lesson-not-in-module` fallback)
 *   - Invalid URL params → "Lesson not in module" fallback (`invalid-params` kind)
 *
 * The `course-not-found` case used to call `next/navigation`'s
 * `notFound()` to surface a 404, but Next.js 16's `notFound()` does not
 * always throw at runtime in dev — control can fall through to the
 * next statement, leaking the wrong inline error. The inline error
 * uniform path is simpler and matches the spec scenario
 * ("An unknown course renders an error state").
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

  const result = await loadLessonView(
    courseSlugResult.data,
    moduleSlugResult.data,
    lessonIdResult.data,
  );

  if (result.isErr()) {
    // The page renders a kind-specific inline error for every error
    // case. The original design called `notFound()` for the
    // course-not-found case so the URL transitions to `/404`, but
    // Next.js 16's `notFound()` does not always throw at runtime in
    // dev — control can fall through to the next statement. Rendering
    // the inline error uniformly is simpler and matches the spec
    // scenario ("An unknown course renders an error state").
    const kind =
      result.error.kind === "course-not-found"
        ? "course-not-found"
        : result.error.kind === "module-not-in-course"
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
