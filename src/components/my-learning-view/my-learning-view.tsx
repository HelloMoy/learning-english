"use client";

import { CourseProgressTile } from "@/components/course-progress-tile/course-progress-tile";
import { EnrolledCourseSummaryCard } from "@/components/enrolled-course-summary-card/enrolled-course-summary-card";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { LearnerAvatar } from "@/components/learner-avatar/learner-avatar";
import { ResumeTile } from "@/components/resume-tile/resume-tile";
import { Skeleton } from "@/components/ui/skeleton/skeleton";
import {
  learnerFirstName,
  type LearnerProfile,
} from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useCourseShelf, type CourseShelfReading } from "@/hooks/use-course-shelf/use-course-shelf";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { courseOverviewPath } from "@/i18n/lesson-routes";
import { Link } from "@/i18n/navigation";
import type { CourseCardModel } from "@/lib/course-shelf/course-shelf";

import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

const ONBOARDING_PATH = "/start";
const FIRST_COURSE_STEP_PATH = "/start/first-course?from=learning";

type ReadShelf = Extract<CourseShelfReading, { status: "read" }>;

/** Props for {@link MyLearningView}. */
export type MyLearningViewProps = {
  /** Every catalog course's view, in catalog order. */
  courses: ReadonlyArray<CourseForView>;
  /** Overrides the profile storage adapter; tests inject a stub. */
  profiles?: LearnerProfileRepository;
};

/**
 * My learning: the learner's own page — a greeting, the way back into the
 * course they watched last, and every course they are enrolled in.
 *
 * @remarks
 * The page belongs to a learner, so it waits for the profile: until storage has
 * answered it renders a shell, and a device without a profile is sent to the
 * onboarding. A learner with a profile but no enrolled course has nothing to
 * resume, so, once their state is read, they are sent to the first-course step
 * (marked `from=learning`, so it shows no onboarding step).
 *
 * Everything else comes from one reading of the catalog (see
 * {@link useCourseShelf}): the enrolled course watched most recently leads,
 * with its continue target in a {@link ResumeTile} beside that course's
 * progress panel, and **Your courses** lists every enrolled course with its
 * own next video.
 *
 * @example
 * ```tsx
 * <MyLearningView courses={await loadCourseViews()} />
 * ```
 */
export function MyLearningView({ courses, profiles }: MyLearningViewProps) {
  const learner = useLearnerProfile(profiles);
  useLearnerRedirect(learner.status, { when: "absent", to: ONBOARDING_PATH });

  if (learner.status !== "present") return <MyLearningShell />;
  return (
    <LearnerPage
      profile={learner.profile}
      courses={courses}
    />
  );
}

function LearnerPage({
  profile,
  courses,
}: {
  profile: LearnerProfile;
  courses: ReadonlyArray<CourseForView>;
}) {
  const shelf = useCourseShelf(courses);
  useLearnerRedirect(enrollmentStatusOf(shelf), { when: "absent", to: FIRST_COURSE_STEP_PATH });

  return (
    <>
      <section className="flex flex-col gap-8">
        <Greeting profile={profile} />
        {shelf.status === "read" && shelf.featured ? (
          <LeadingCourse model={shelf.featured} />
        ) : (
          <ResumeTile reading={{ status: "pending" }} />
        )}
      </section>
      {shelf.status === "read" && shelf.featured ? <YourCourses shelf={shelf} /> : null}
    </>
  );
}

// The redirect rule speaks in profile states: "absent" here means enrolled in
// nothing, and nothing is decided until the learner's state has been read.
function enrollmentStatusOf(shelf: CourseShelfReading): "unknown" | "absent" | "present" {
  if (shelf.status === "pending") return "unknown";
  return shelf.enrolledCount === 0 ? "absent" : "present";
}

function LeadingCourse({ model }: { model: CourseCardModel }) {
  const t = useTranslations("CourseCatalog.courseOverview");
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
      <div className="lg:col-span-8">
        <ResumeTile reading={{ status: "read", model }} />
      </div>
      <div className="lg:col-span-4 lg:flex lg:flex-col [&>section]:lg:flex-1">
        <CourseProgressTile
          course={model.course}
          reading={{ status: "read", tally: model.tally }}
          prizes={model.prizes}
          headingLevel={2}
          link={{ href: courseOverviewPath(model.course), label: t("viewCourse") }}
        />
      </div>
    </div>
  );
}

function YourCourses({ shelf }: { shelf: ReadShelf }) {
  const t = useTranslations("MyLearning");
  const enrolled = [shelf.featured, ...shelf.otherEnrolled].flatMap((model) =>
    model ? [model] : [],
  );
  const inCatalogOrder = [...enrolled].sort((a, b) => a.course.sequence - b.course.sequence);

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col gap-2">
          <Eyebrow>{t("coursesEyebrow")}</Eyebrow>
          <h2 className="font-sans text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            {t("coursesHeading", { count: enrolled.length })}
          </h2>
        </div>
        <Link
          href="/courses"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-bold text-gold hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {t("browseCourses")}
          <ArrowRight
            aria-hidden="true"
            className="size-4"
          />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {inCatalogOrder.map((model) => (
          <EnrolledCourseSummaryCard
            key={model.course.id}
            model={model}
            isCurrent={model === shelf.featured}
          />
        ))}
      </div>
    </section>
  );
}

function Greeting({ profile }: { profile: LearnerProfile }) {
  const t = useTranslations("MyLearning");

  return (
    <div className="flex items-center gap-3.5 sm:gap-5">
      <LearnerAvatar
        name={profile.name}
        avatar={profile.avatar}
        size="md"
      />
      <div className="flex min-w-0 flex-col gap-2">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h1 className="font-sans text-[2.5rem] leading-none font-extrabold tracking-tight text-balance text-foreground sm:text-6xl">
          {t("greeting", { name: learnerFirstName(profile.name) })}
        </h1>
      </div>
    </div>
  );
}

/** The page's shape while storage has not said who the learner is. */
function MyLearningShell() {
  return (
    <div
      data-testid="my-learning-shell"
      aria-hidden="true"
      className="flex flex-col gap-8"
    >
      <div className="flex items-center gap-5">
        <Skeleton className="size-14 rounded-full sm:size-[4.5rem]" />
        <div className="flex w-full flex-col gap-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-full max-w-md sm:h-14" />
        </div>
      </div>
      <Skeleton className="h-80 w-full rounded-[22px] lg:h-[380px]" />
    </div>
  );
}
