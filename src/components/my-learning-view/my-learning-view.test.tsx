import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { useRouter } from "@/i18n/navigation";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { MyLearningView } from "./my-learning-view";

const basic = aCourseView("basic-course", 1, [1, 3]);
const advanced = aCourseView("advanced-intermediate-course", 2, [2, 10]);
const courses = [basic, advanced];

const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });
const router = { replace: vi.fn(), push: vi.fn() };

const placeIn = (
  view: CourseForView,
  moduleIndex: number,
  lessonIndex: number,
  watchedAt: number,
) => ({
  location: ContinueWatchingLocation.parse({
    courseSlug: view.course.slug,
    moduleSlug: view.modules[moduleIndex]!.slug,
    lessonId: lessonOf(view, moduleIndex, lessonIndex).id,
  }),
  watchedAt,
});

beforeEach(() => {
  router.replace.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
});

const renderPage = (
  profiles = makeStubLearnerProfileRepository({ profile }),
  locale: "en" | "es" = "en",
) =>
  renderInLocale(
    <MyLearningView
      courses={courses}
      profiles={profiles}
    />,
    locale,
  );

describe("MyLearningView", () => {
  test("WHEN storage has not answered THEN a shell stands in for the page", () => {
    renderPage();

    expect(screen.getByTestId("my-learning-shell")).toBeInTheDocument();
  });

  test("WHEN the device has no profile THEN the learner is sent to the onboarding", async () => {
    renderPage(makeStubLearnerProfileRepository());

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
  });

  test("WHEN the learner is enrolled in nothing THEN they are sent to the first-course step", async () => {
    givenLearner.enrolledCourses([]);

    renderPage();

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith("/start/first-course?from=learning"),
    );
  });

  describe("GIVEN a learner enrolled in both who last watched Advanced", () => {
    const resumed = lessonOf(advanced, 1, 2);

    beforeEach(() => {
      givenLearner.enrolledCourses(["basic-course", "advanced-intermediate-course"]);
      givenLearner.positions({ [resumed.id]: 365 });
      givenLearner.continueWatchingByCourse([
        placeIn(advanced, 1, 2, Date.now() - 60_000),
        placeIn(basic, 1, 1, Date.now() - 86_400_000),
      ]);
    });

    test("WHEN the page renders THEN it greets the learner AND resumes the Advanced video", async () => {
      renderPage();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Welcome back, Ana." }),
      ).toBeInTheDocument();
      const tile = screen.getByTestId("resume-tile");
      expect(
        within(tile).getByRole("heading", { level: 2, name: resumed.title }),
      ).toBeInTheDocument();
      expect(within(tile).getByRole("link", { name: /Resume/ })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-2/lessons/${resumed.id}`,
      );
      expect(router.replace).not.toHaveBeenCalled();
    });

    test("WHEN the page renders THEN Advanced's progress panel sits beside it with View course", async () => {
      renderPage();

      const panel = await screen.findByTestId("course-progress-tile");
      expect(
        within(panel).getByRole("heading", { level: 2, name: advanced.course.title }),
      ).toBeInTheDocument();
      expect(within(panel).getByRole("link", { name: /View course/ })).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course",
      );
    });

    test("WHEN the page renders THEN the panel's course title leads to the course overview too", async () => {
      renderPage();

      const panel = await screen.findByTestId("course-progress-tile");
      const heading = within(panel).getByRole("heading", { level: 2, name: advanced.course.title });
      expect(within(heading).getByRole("link")).toHaveAttribute(
        "href",
        "/courses/advanced-intermediate-course",
      );
    });

    test("WHEN the page renders THEN Your courses lists both, Advanced as current", async () => {
      renderPage();

      expect(
        await screen.findByRole("heading", { level: 2, name: "2 courses you’re enrolled in" }),
      ).toBeInTheDocument();
      const cards = screen.getAllByTestId("enrolled-course-summary-card");
      expect(cards.map((card) => within(card).getByRole("heading").textContent)).toEqual([
        basic.course.title,
        advanced.course.title,
      ]);
      expect(cards.map((card) => card.dataset.current)).toEqual(["false", "true"]);
      expect(cards[0]).toHaveTextContent(lessonOf(basic, 1, 1).title);
    });

    test("WHEN the page renders THEN Browse courses opens Available courses", async () => {
      renderPage();

      expect(await screen.findByRole("link", { name: /Browse courses/ })).toHaveAttribute(
        "href",
        "/courses",
      );
    });
  });

  describe("GIVEN a learner enrolled in Basic who never opened a lesson", () => {
    test("WHEN the page renders THEN it offers to start the Basic Course", async () => {
      givenLearner.enrolledCourses(["basic-course"]);

      renderPage();

      expect(await screen.findByText("Start here")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: "1 course you’re enrolled in" }),
      ).toBeInTheDocument();
    });
  });

  test("WHEN rendered in es THEN the page copy comes from es.json", async () => {
    givenLearner.enrolledCourses(["basic-course"]);

    renderPage(makeStubLearnerProfileRepository({ profile }), "es");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Hola de nuevo, Ana." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explorar cursos/ })).toBeInTheDocument();
  });
});
