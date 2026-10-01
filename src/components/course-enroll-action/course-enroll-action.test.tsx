import { enrollInCourseAction } from "@/app/[locale]/learner-actions";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { fireCinemaConfetti } from "@/lib/cinema-confetti/cinema-confetti";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale, type TestLocale } from "@/test-setup/render-in-locale";
import { aCourseView, everyVideoOf, lessonOf } from "@/test-setup/stubs/course-views";

import NiceModal from "@ebay/nice-modal-react";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { CourseEnrollAction } from "./course-enroll-action";

vi.mock("@/lib/cinema-confetti/cinema-confetti", () => ({
  fireCinemaConfetti: vi.fn().mockResolvedValue(undefined),
}));

const advanced = aCourseView("advanced-intermediate-course", 2, [3, 2]);
const firstVideoPath = `/courses/advanced-intermediate-course/modules/module-1/lessons/${lessonOf(advanced, 0, 0).id}`;

/** The action as the app mounts it: under the provider its welcome dialog opens through. */
const renderAction = (view: CourseForView = advanced, locale?: TestLocale) =>
  renderInLocale(
    <NiceModal.Provider>
      <CourseEnrollAction view={view} />
    </NiceModal.Provider>,
    locale,
  );

beforeEach(() => {
  vi.mocked(enrollInCourseAction).mockClear();
  vi.mocked(fireCinemaConfetti).mockClear();
  givenLearner.enrolledCourses([]);
});

describe("CourseEnrollAction", () => {
  describe("GIVEN a learner not enrolled in the course", () => {
    test("WHEN it renders THEN it offers Enroll AND no Start course", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseEnrollAction view={view} />);

      // Assert
      expect(screen.getByRole("button", { name: "Enroll" })).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "Start course" })).not.toBeInTheDocument();
    });

    test("WHEN Enroll is activated THEN the action becomes Start course at once AND the enrollment is saved", async () => {
      // Arrange
      const user = userEvent.setup();
      renderAction();

      // Act
      await user.click(screen.getByRole("button", { name: "Enroll" }));

      // Assert — the page's action and the welcome's, the page's hidden behind the dialog.
      const startLinks = screen.getAllByRole("link", { name: "Start course", hidden: true });
      expect(startLinks).toHaveLength(2);
      for (const link of startLinks) expect(link).toHaveAttribute("href", firstVideoPath);
      expect(enrollInCourseAction).toHaveBeenCalledWith({
        courseSlug: "advanced-intermediate-course",
      });
    });

    test("WHEN Enroll is activated THEN the welcome opens AND the confetti is fired once", async () => {
      // Arrange
      const user = userEvent.setup();
      renderAction();

      // Act
      await user.click(screen.getByRole("button", { name: "Enroll" }));

      // Assert
      expect(await screen.findByRole("dialog", { name: "You’re in!" })).toBeInTheDocument();
      expect(fireCinemaConfetti).toHaveBeenCalledTimes(1);
    });

    test("WHEN the welcome is closed THEN focus lands on the action, now Start course", async () => {
      // Arrange
      const user = userEvent.setup();
      renderAction();
      await user.click(screen.getByRole("button", { name: "Enroll" }));

      // Act
      await user.click(await screen.findByRole("button", { name: "Keep exploring" }));

      // Assert
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByRole("link", { name: "Start course" })).toHaveFocus();
    });

    test("WHEN the server refuses the enrollment THEN the welcome closes AND Enroll is offered again", async () => {
      // Arrange
      const user = userEvent.setup();
      vi.mocked(enrollInCourseAction).mockResolvedValueOnce({ serverError: "refused" });
      renderAction();

      // Act
      await user.click(screen.getByRole("button", { name: "Enroll" }));

      // Assert
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Enroll" })).toHaveFocus();
      expect(learnerStore.getState().enrolledCourses.has("advanced-intermediate-course")).toBe(
        false,
      );
    });

    test("WHEN rendered in es THEN Enroll comes from es.json", () => {
      // Arrange
      const view = advanced;

      // Act
      renderInLocale(<CourseEnrollAction view={view} />, "es");

      // Assert
      expect(screen.getByRole("button", { name: "Inscribirme" })).toBeInTheDocument();
    });
  });

  describe("GIVEN a learner enrolled in the course", () => {
    test("WHEN it renders THEN no welcome opens AND no confetti is fired", () => {
      // Arrange
      act(() => givenLearner.enrolledCourses(["advanced-intermediate-course"]));

      // Act
      renderAction();

      // Assert
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(fireCinemaConfetti).not.toHaveBeenCalled();
    });

    test("WHEN it renders THEN Start course opens the first video", () => {
      // Arrange
      act(() => givenLearner.enrolledCourses(["advanced-intermediate-course"]));

      // Act
      renderInLocale(<CourseEnrollAction view={advanced} />, "pt");

      // Assert
      expect(screen.getByRole("link", { name: "Começar o curso" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
    });

    test("WHEN they have finished the recorded video THEN Continue where you left off opens the next one", () => {
      // Arrange
      const finished = lessonOf(advanced, 0, 0);
      act(() => {
        givenLearner.enrolledCourses(["advanced-intermediate-course"]);
        givenLearner.completed([finished.id]);
        givenLearner.continueWatching(
          ContinueWatchingLocation.parse({
            courseSlug: "advanced-intermediate-course",
            moduleSlug: "module-1",
            lessonId: finished.id,
          }),
        );
      });

      // Act
      renderInLocale(<CourseEnrollAction view={advanced} />);

      // Assert
      expect(screen.getByRole("link", { name: "Continue where you left off" })).toHaveAttribute(
        "href",
        `/courses/advanced-intermediate-course/modules/module-1/lessons/${lessonOf(advanced, 0, 1).id}`,
      );
      expect(screen.queryByRole("link", { name: "Start course" })).not.toBeInTheDocument();
    });

    test("WHEN they have watched everything THEN Watch again opens the first video", () => {
      // Arrange
      act(() => {
        givenLearner.enrolledCourses(["advanced-intermediate-course"]);
        givenLearner.completed(everyVideoOf(advanced));
      });

      // Act
      renderInLocale(<CourseEnrollAction view={advanced} />);

      // Assert
      expect(screen.getByRole("link", { name: "Watch again" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
    });

    test("WHEN rendered in es with progress THEN it reads Continuar donde lo dejaste", () => {
      // Arrange
      act(() => {
        givenLearner.enrolledCourses(["advanced-intermediate-course"]);
        givenLearner.completed([lessonOf(advanced, 0, 0).id]);
      });

      // Act
      renderInLocale(<CourseEnrollAction view={advanced} />, "es");

      // Assert
      expect(screen.getByRole("link", { name: "Continuar donde lo dejaste" })).toBeInTheDocument();
    });

    test("WHEN the course holds no video THEN nothing renders", () => {
      // Arrange
      const empty = aCourseView("advanced-intermediate-course", 2, [0]);
      act(() => givenLearner.enrolledCourses(["advanced-intermediate-course"]));

      // Act
      renderInLocale(<CourseEnrollAction view={empty} />);

      // Assert
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
