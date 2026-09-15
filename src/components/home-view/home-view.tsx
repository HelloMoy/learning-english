"use client";

import { ContinueBand } from "@/components/continue-band/continue-band";
import { Eyebrow } from "@/components/eyebrow/eyebrow";
import { LearnerQuestions } from "@/components/learner-questions/learner-questions";
import { LevelsTable } from "@/components/levels-table/levels-table";
import { NewVisitorHero } from "@/components/new-visitor-hero/new-visitor-hero";
import { StartCourseLink } from "@/components/start-course-link/start-course-link";
import { StartHereBand } from "@/components/start-here-band/start-here-band";
import { VowelLengthCard } from "@/components/vowel-length-card/vowel-length-card";
import type { Course } from "@/domain/entities/course/course";
import type { Module } from "@/domain/entities/module/module";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";

import { useTranslations } from "next-intl";

/** One catalog course with the structure progress is counted over. */
export type HomeLevel = {
  course: Course;
  modules: Module[];
  lessonRuntimes: LessonProgressSlice[];
};

/** The first lesson of the first course, which the closing band's offer is sized by. */
export type HomeFirstLesson = {
  href: string;
  minutes: number | null;
  courseTitle: string;
};

/**
 * The locale home: always the editorial landing.
 *
 * @remarks
 * The landing is the same for every visitor. A learner's own progress lives on
 * My learning, which the landing's primary action reaches — **Start course**
 * through the onboarding the first time, **Continue** directly once the device
 * holds a profile.
 *
 * Only the closing band follows the learner: a visitor is offered the first
 * lesson, and a learner with a card sees that card and is invited to continue.
 * The server renders the visitor's band, because only the browser can read the
 * profile.
 *
 * @param levels - The catalog, one entry per course, in sequence order
 * @param firstLesson - The first course's first lesson, or `null` for an empty catalog
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 */
export function HomeView({
  levels,
  firstLesson,
  profiles,
}: {
  levels: ReadonlyArray<HomeLevel>;
  firstLesson: HomeFirstLesson | null;
  profiles?: LearnerProfileRepository;
}) {
  const learner = useLearnerProfile(profiles);
  const firstLevel = levels[0];
  if (!firstLevel || firstLesson === null) {
    return <CatalogEmpty />;
  }

  const startCourse = <StartCourseLink profiles={profiles} />;

  return (
    <>
      <NewVisitorHero
        firstCourseTitle={firstLevel.course.title}
        firstCourseVideoCount={firstLevel.lessonRuntimes.length}
        action={startCourse}
        aside={<VowelLengthCard variant="hear-the-difference" />}
      />
      <LearnerQuestions />
      <LevelsSection levels={levels} />
      {learner.status === "present" ? (
        <ContinueBand
          profile={learner.profile}
          level={{ number: firstLevel.course.sequence, courseTitle: firstLevel.course.title }}
          lessonRuntimes={firstLevel.lessonRuntimes}
          action={startCourse}
        />
      ) : (
        <StartHereBand
          firstLessonMinutes={firstLesson.minutes}
          action={startCourse}
        />
      )}
    </>
  );
}

function LevelsSection({ levels }: { levels: ReadonlyArray<HomeLevel> }) {
  const t = useTranslations("HomePage.levels");

  return (
    <section className="flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        <h2 className="font-sans text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("heading", { count: levels.length })}
        </h2>
      </div>
      <LevelsTable
        courses={levels.map((level) => level.course)}
        continued={null}
      />
    </section>
  );
}

function CatalogEmpty() {
  const t = useTranslations("HomePage");

  return (
    <p
      className="text-sm text-muted-foreground"
      role="status"
    >
      {t("catalogEmpty")}
    </p>
  );
}
