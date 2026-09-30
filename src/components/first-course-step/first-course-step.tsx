"use client";

import { OnboardingProgress } from "@/components/onboarding-progress/onboarding-progress";
import { OnboardingShell } from "@/components/onboarding-shell/onboarding-shell";
import type { LevelStanding } from "@/domain/entities/course-standing/course-standing";
import { learnerFirstName } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { enrollInCourse } from "@/hooks/use-enrolled-courses/use-enrolled-courses";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { useRuntimeLabel } from "@/hooks/use-runtime-label/use-runtime-label";
import { lessonPath } from "@/i18n/lesson-routes";
import { Link, useRouter } from "@/i18n/navigation";
import { courseFacts } from "@/lib/course-shelf/course-shelf";

import { LayoutGrid, Play, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { parseAsStringLiteral, useQueryState } from "nuqs";

/** The course this step recommends: always a level, never reference material. */
type FirstLevelCourse = CourseForView & { standing: LevelStanding };

const NAME_STEP_PATH = "/start";

/** `from=learning` marks a learner sent here by My learning, not mid-onboarding. */
const fromParser = parseAsStringLiteral(["learning"]);

/** Props for {@link FirstCourseStep}. */
export type FirstCourseStepProps = {
  /** The first level course, the one every new learner is recommended. */
  course: FirstLevelCourse;
  /** Overrides the profile storage adapter; tests inject a stub. */
  profiles?: LearnerProfileRepository;
};

/**
 * Onboarding step 3: the one course every new learner is recommended, with a
 * way to start it and a way to see every course.
 *
 * @remarks
 * There is no choice between courses and no "not now": **Start the {course}**
 * enrolls the learner and opens the course's first video; **See all courses**
 * opens Available courses without enrolling. My learning sends a learner who
 * is enrolled in nothing here with `from=learning`, and the step then hides its
 * "Step 3 of 3" indicator — they are not in the middle of onboarding. Like
 * step 2, it needs a profile, so a device without one goes back to step 1.
 *
 * @example
 * ```tsx
 * <FirstCourseStep course={courses[0]} />
 * ```
 */
export function FirstCourseStep({ course, profiles }: FirstCourseStepProps) {
  const learner = useLearnerProfile(profiles);
  useLearnerRedirect(learner.status, { when: "absent", to: NAME_STEP_PATH });

  if (learner.status !== "present") return <OnboardingShell />;
  return (
    <Recommendation
      course={course}
      firstName={learnerFirstName(learner.profile.name)}
    />
  );
}

function Recommendation({ course, firstName }: { course: FirstLevelCourse; firstName: string }) {
  const t = useTranslations("Components.FirstCourseStep");
  const router = useRouter();
  const [from] = useQueryState("from", fromParser);
  const firstVideo = firstVideoOf(course);

  const startCourse = () => {
    if (!firstVideo) return;
    enrollInCourse(course.course.slug);
    router.push(lessonPath(course.course, firstVideo.module, firstVideo.lesson));
  };

  return (
    <section className="mx-auto flex w-full max-w-[57.5rem] flex-col items-center gap-5 text-center sm:gap-6">
      {from === "learning" ? null : <OnboardingProgress step={3} />}
      <div className="flex flex-col gap-3">
        <h1 className="font-sans text-[2rem] leading-[1.05] font-black tracking-tight text-balance text-foreground sm:text-[2.875rem]">
          {t("heading", { name: firstName })}
        </h1>
        <p className="text-[0.9375rem] text-muted-foreground">{t("intro")}</p>
      </div>
      <div className="grid w-full grid-cols-1 gap-4 text-left lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]">
        <CourseHero course={course} />
        <Syllabus course={course} />
      </div>
      <div className="flex w-full max-w-[27.5rem] flex-col gap-2.5">
        <button
          type="button"
          onClick={startCourse}
          disabled={!firstVideo}
          className="inline-flex min-h-[3.25rem] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-primary px-7 text-base font-extrabold text-primary-foreground shadow-[0_12px_40px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)] transition-[filter] hover:brightness-105 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play
            aria-hidden="true"
            className="size-4"
            fill="currentColor"
          />
          {t("start", { course: course.course.title })}
        </button>
        <Link
          href="/courses"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-foreground/5 px-5 text-[0.9375rem] font-bold text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <LayoutGrid
            aria-hidden="true"
            className="size-4"
          />
          {t("seeAll")}
        </Link>
      </div>
      <p className="max-w-[44ch] text-[0.8125rem] text-muted-foreground">{t("note")}</p>
    </section>
  );
}

function CourseHero({ course }: { course: FirstLevelCourse }) {
  const t = useTranslations("Components.FirstCourseStep");
  const facts = courseFacts(course);
  const poster = firstVideoOf(course)?.lesson.poster;

  return (
    <article className="relative isolate flex min-h-80 flex-col justify-end gap-2.5 overflow-hidden rounded-[22px] border border-border bg-background p-6 lg:min-h-[22rem] lg:rounded-[26px] lg:p-8">
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10"
      >
        {poster ? (
          <Image
            src={poster}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover"
          />
        ) : null}
        <span className="absolute inset-0 bg-linear-to-r from-background/90 via-background/45 to-transparent" />
        <span className="absolute inset-0 bg-linear-to-t from-background from-15% via-background/55 to-transparent" />
      </span>
      <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground lg:top-5 lg:left-5">
        <Star
          aria-hidden="true"
          className="size-3"
          fill="currentColor"
        />
        {t("recommended")}
      </span>
      <span className="text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
        {t("facts", {
          level: course.standing.number,
          modules: facts.moduleCount,
          videos: facts.videoCount,
        })}
      </span>
      <h2 className="text-[2rem] leading-none font-black tracking-[-0.035em] text-balance text-foreground lg:text-[2.75rem]">
        {course.course.title}
      </h2>
      <p className="max-w-[48ch] text-[0.9375rem] text-foreground/80">
        {course.course.description}
      </p>
    </article>
  );
}

function Syllabus({ course }: { course: CourseForView }) {
  const t = useTranslations("Components.FirstCourseStep");
  const runtimeLabel = useRuntimeLabel();
  const facts = courseFacts(course);
  const prizeCount = course.moduleSummaries.filter((summary) => summary.lessons.length > 0).length;

  return (
    <section className="flex flex-col gap-4 rounded-[22px] border border-border bg-card p-6 lg:rounded-[26px]">
      <h3 className="text-center text-[0.6875rem] font-bold tracking-[0.3em] text-gold uppercase">
        {t("syllabusHeading")}
      </h3>
      <ol className="flex flex-col">
        {course.modules.map((courseModule) => (
          <li
            key={courseModule.id}
            data-testid="first-course-module"
            className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-2.5 border-t border-border py-2 text-sm leading-tight font-bold text-foreground first:border-t-0"
          >
            <span className="text-[1.625rem] leading-none font-black text-transparent [-webkit-text-stroke:1.2px_var(--gold)]">
              {String(courseModule.sequence).padStart(2, "0")}
            </span>
            {courseModule.title}
          </li>
        ))}
      </ol>
      <p className="mt-auto border-t border-border pt-4 text-center font-mono text-xs text-muted-foreground tabular-nums">
        {t("syllabusFacts", {
          videos: facts.videoCount,
          runtime: runtimeLabel(facts.runtimeSeconds),
          prizes: prizeCount,
        })}
      </p>
    </section>
  );
}

function firstVideoOf({ modules, moduleSummaries }: CourseForView) {
  for (const courseModule of modules) {
    const lesson = moduleSummaries.find((summary) => summary.moduleId === courseModule.id)
      ?.lessons[0];
    if (lesson) return { module: courseModule, lesson };
  }
  return null;
}
