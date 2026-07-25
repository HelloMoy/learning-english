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

const loadLessonNotes = cache(async (lessonId: ReturnType<typeof LessonId.parse>) => {
  const deps = getCoursePlatformDeps();
  return deps.useCases.findLessonNotes({ lessonId });
});

/**
 * Per-page metadata. Sets `<title>` to the resolved lesson's title on
 * success, or to a localized fallback (`HomePage.notFound`) on any error
 * or invalid params.
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

export default async function LessonPage({ params }: Props) {
  const { courseSlug, moduleSlug, lessonId } = await params;

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
    const kind =
      result.error.kind === "course-not-found"
        ? "course-not-found"
        : result.error.kind === "module-not-in-course"
          ? "module-not-in-course"
          : "lesson-not-in-module";
    return <LessonPageError kind={kind} />;
  }

  const view: LessonViewData = result.value;
  const notesResult = await loadLessonNotes(view.lesson.id);
  const notes = notesResult.isOk() ? notesResult.value : null;
  const notesMarkdown = notes?.markdown ?? null;
  // Always keep the original Markdown resource link in the Resources
  // region so the learner can open the source file. When the notes are
  // rendered inline, the resource also anchors the `Notes` heading.
  const notesResource = notes?.resource ?? null;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <LessonView
        view={view}
        notes={notesMarkdown}
        notesResource={notesResource}
        markComplete={markLessonCompleteAction}
      />
    </main>
  );
}
