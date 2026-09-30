import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { Course } from "@/domain/entities/course/course";
import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { useRouter } from "@/i18n/navigation";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { renderInLocale, type TestLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";
import { makeStubLearnerProfileRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { FirstCourseStep } from "./first-course-step";

const basic = aCourseView("basic-course", 1, [1, 17, 25, 4, 1]);
const profile = LearnerProfile.parse({ name: "Ana García", avatar: { kind: "initials" } });
const router = { replace: vi.fn(), push: vi.fn() };

beforeEach(() => {
  router.replace.mockClear();
  router.push.mockClear();
  vi.mocked(useRouter).mockReturnValue(router as never);
  vi.mocked(enrollInCourseAction).mockClear();
});

const renderStep = ({
  profiles = makeStubLearnerProfileRepository({ profile }),
  searchParams = "",
  course = basic,
  locale = "en",
}: {
  profiles?: ReturnType<typeof makeStubLearnerProfileRepository>;
  searchParams?: string;
  course?: typeof basic;
  locale?: TestLocale;
} = {}) =>
  renderInLocale(
    <NuqsTestingAdapter searchParams={searchParams}>
      <FirstCourseStep
        profiles={profiles}
        course={course}
      />
    </NuqsTestingAdapter>,
    locale,
  );

describe("FirstCourseStep — translated description", () => {
  describe("GIVEN a course translated into Portuguese", () => {
    test("WHEN the step opens in pt THEN the recommendation shows the Portuguese description", async () => {
      // Arrange
      const portuguese = faker.lorem.sentence();
      const course = {
        ...basic,
        course: Course.parse({
          ...basic.course,
          translations: { pt: { description: portuguese } },
        }),
      };

      // Act
      renderStep({ course, locale: "pt" });

      // Assert
      expect(await screen.findByText(portuguese)).toBeInTheDocument();
      expect(screen.queryByText(basic.course.description)).not.toBeInTheDocument();
    });
  });
});

describe("FirstCourseStep", () => {
  test("WHEN storage has not answered THEN a shell stands in for the step", () => {
    renderStep();

    expect(screen.getByTestId("onboarding-shell")).toBeInTheDocument();
  });

  test("WHEN the device has no profile THEN the learner is sent back to step one", async () => {
    renderStep({ profiles: makeStubLearnerProfileRepository() });

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/start"));
  });

  describe("GIVEN a learner with a card", () => {
    test("WHEN the step opens THEN it greets them by first name as step 3 of 3", async () => {
      renderStep();

      expect(
        await screen.findByRole("heading", { level: 1, name: "Your first course, Ana" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Step 3 of 3")).toBeInTheDocument();
    });

    test("WHEN the step opens THEN it recommends the course AND lists every module", async () => {
      renderStep();

      await screen.findByRole("heading", { level: 1 });
      expect(screen.getByText("Recommended for you")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { level: 2, name: basic.course.title }),
      ).toBeInTheDocument();
      expect(screen.getByText("Level 1 · 5 modules · 48 videos")).toBeInTheDocument();
      const modules = screen.getAllByTestId("first-course-module");
      expect(modules).toHaveLength(5);
      expect(modules[0]).toHaveTextContent(`01${basic.modules[0]!.title}`);
    });

    test("WHEN the course sits after a reference course THEN its facts print its level, not its sequence", async () => {
      renderStep({
        course: {
          ...aCourseView("basic-course", 2, [1, 3]),
          standing: { kind: "level", number: 1 },
        },
      });

      await screen.findByRole("heading", { level: 1 });
      expect(screen.getByText(/^Level 1 ·/)).toBeInTheDocument();
    });

    test("WHEN the step opens THEN no Not now action is offered", async () => {
      renderStep();

      await screen.findByRole("heading", { level: 1 });
      expect(screen.queryByRole("button", { name: /not now/i })).toBeNull();
      expect(screen.queryByRole("link", { name: /not now/i })).toBeNull();
    });

    test("WHEN Start is activated THEN the learner is enrolled AND the first video opens", async () => {
      const user = userEvent.setup();
      renderStep();

      await user.click(
        await screen.findByRole("button", { name: `Start the ${basic.course.title}` }),
      );

      expect(learnerStore.getState().enrolledCourses.has("basic-course")).toBe(true);
      expect(enrollInCourseAction).toHaveBeenCalledWith({ courseSlug: "basic-course" });
      expect(router.push).toHaveBeenCalledWith(
        `/courses/basic-course/modules/module-1/lessons/${lessonOf(basic, 0, 0).id}`,
      );
    });

    test("WHEN See all courses is read THEN it opens Available courses", async () => {
      renderStep();

      expect(await screen.findByRole("link", { name: "See all courses" })).toHaveAttribute(
        "href",
        "/courses",
      );
    });

    test("WHEN the step was reached from My learning THEN the step indicator is hidden", async () => {
      renderStep({ searchParams: "?from=learning" });

      await screen.findByRole("heading", { level: 1 });
      expect(screen.queryByText("Step 3 of 3")).toBeNull();
    });

    test("WHEN rendered in pt THEN the copy comes from pt.json", async () => {
      renderInLocale(
        <NuqsTestingAdapter>
          <FirstCourseStep
            profiles={makeStubLearnerProfileRepository({ profile })}
            course={basic}
          />
        </NuqsTestingAdapter>,
        "pt",
      );

      expect(
        await screen.findByRole("heading", { level: 1, name: "Seu primeiro curso, Ana" }),
      ).toBeInTheDocument();
    });
  });
});
