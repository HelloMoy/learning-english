import type { CourseForView } from "@/domain/use-cases/find-course-for-view/find-course-for-view";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale, type TestLocale } from "@/test-setup/render-in-locale";
import { aCourseView, lessonOf } from "@/test-setup/stubs/course-views";

import NiceModal from "@ebay/nice-modal-react";
import { act, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { EnrollmentWelcomeModal } from "./enrollment-welcome-modal";

const COURSE_SLUG = "advanced-intermediate-course";
const advanced = aCourseView(COURSE_SLUG, 2, [3, 2]);
const firstVideo = lessonOf(advanced, 0, 0);
const firstVideoPath = `/courses/${COURSE_SLUG}/modules/module-1/lessons/${firstVideo.id}`;

/** The same course with no artwork on any video. */
const withoutPosters: CourseForView = {
  ...advanced,
  moduleSummaries: advanced.moduleSummaries.map((summary) => ({
    ...summary,
    lessons: summary.lessons.map((lesson) => ({ ...lesson, poster: undefined })),
  })),
};
const withoutVideos = aCourseView(COURSE_SLUG, 2, [0]);

/** NiceModal only renders what it has been told to show. */
const RegisteredModal = () => {
  NiceModal.useModal(EnrollmentWelcomeModal);
  return null;
};

type WelcomeOptions = { view?: CourseForView; locale?: TestLocale; focusOnClose?: () => void };

const openWelcome = async ({ view = advanced, locale, focusOnClose }: WelcomeOptions = {}) => {
  const user = userEvent.setup();
  renderInLocale(
    <NiceModal.Provider>
      <RegisteredModal />
      <button
        type="button"
        onClick={() => void NiceModal.show(EnrollmentWelcomeModal, { view, focusOnClose })}
      >
        open
      </button>
    </NiceModal.Provider>,
    locale,
  );
  await user.click(screen.getByRole("button", { name: "open" }));
  return { user, dialog: await screen.findByRole("dialog") };
};

const expectClosed = () =>
  waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

beforeEach(() => {
  givenLearner.enrolledCourses([COURSE_SLUG]);
});

describe("EnrollmentWelcomeModal", () => {
  describe("GIVEN a learner who just enrolled in a course with videos", () => {
    test("WHEN shown THEN it says they are in AND names the course and the video it starts with", async () => {
      // Act
      const { dialog } = await openWelcome();

      // Assert
      expect(screen.getByRole("dialog", { name: "You’re in!" })).toBe(dialog);
      expect(within(dialog).getByText("Enrolled")).toBeInTheDocument();
      expect(dialog).toHaveTextContent(
        `${advanced.course.title} is now in My learning. Start with ${firstVideo.title} (10:00), or come back whenever you like.`,
      );
    });

    test("WHEN shown THEN the video's poster is drawn as decoration", async () => {
      // Act
      const { dialog } = await openWelcome();

      // Assert
      const poster = dialog.querySelector("img");
      expect(poster).toHaveAttribute("src", firstVideo.poster);
      expect(poster).toHaveAttribute("alt", "");
    });

    test("WHEN the video has no poster THEN no artwork is drawn", async () => {
      // Act
      const { dialog } = await openWelcome({ view: withoutPosters });

      // Assert
      expect(dialog.querySelector("img")).toBeNull();
      expect(within(dialog).getByRole("link", { name: "Start course" })).toBeInTheDocument();
    });

    test("WHEN shown THEN Start course opens the first video, as the page's action does", async () => {
      // Act
      const { dialog } = await openWelcome();

      // Assert
      expect(within(dialog).getByRole("link", { name: "Start course" })).toHaveAttribute(
        "href",
        firstVideoPath,
      );
    });

    test("WHEN Start course is activated THEN the dialog closes", async () => {
      // Arrange
      const { user, dialog } = await openWelcome();
      const startCourse = within(dialog).getByRole("link", { name: "Start course" });
      startCourse.addEventListener("click", (event) => event.preventDefault());

      // Act
      await user.click(startCourse);

      // Assert
      await expectClosed();
    });

    test("WHEN Keep exploring is chosen THEN the dialog closes AND focus goes where the opener asked", async () => {
      // Arrange
      const focusOnClose = vi.fn();
      const { user } = await openWelcome({ focusOnClose });

      // Act
      await user.click(screen.getByRole("button", { name: "Keep exploring" }));

      // Assert
      await expectClosed();
      expect(focusOnClose).toHaveBeenCalledTimes(1);
    });

    test("WHEN Escape is pressed THEN the dialog closes AND focus goes where the opener asked", async () => {
      // Arrange
      const focusOnClose = vi.fn();
      const { user } = await openWelcome({ focusOnClose });

      // Act
      await user.keyboard("{Escape}");

      // Assert
      await expectClosed();
      expect(focusOnClose).toHaveBeenCalledTimes(1);
    });

    test("WHEN the close control is chosen THEN the dialog closes", async () => {
      // Arrange
      const { user } = await openWelcome();

      // Act
      await user.click(screen.getByRole("button", { name: "Close" }));

      // Assert
      await expectClosed();
    });

    test("WHEN the enrollment is withdrawn THEN the dialog closes on its own", async () => {
      // Arrange
      await openWelcome();

      // Act
      act(() => learnerStore.setState({ enrolledCourses: new Set() }));

      // Assert
      await expectClosed();
    });
  });

  describe("GIVEN a learner who just enrolled in a course with no videos", () => {
    test("WHEN shown THEN it names the course AND offers no artwork, no video and no start link", async () => {
      // Act
      const { dialog } = await openWelcome({ view: withoutVideos });

      // Assert
      expect(dialog).toHaveTextContent(`${withoutVideos.course.title} is now in My learning.`);
      expect(dialog).not.toHaveTextContent("Start with");
      expect(dialog.querySelector("img")).toBeNull();
      expect(within(dialog).queryByRole("link")).not.toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Keep exploring" })).toBeInTheDocument();
    });
  });

  describe("GIVEN another locale", () => {
    test("WHEN shown in es THEN the copy and the actions are Spanish", async () => {
      // Act
      const { dialog } = await openWelcome({ locale: "es" });

      // Assert
      expect(screen.getByRole("dialog", { name: "¡Ya estás dentro!" })).toBe(dialog);
      expect(within(dialog).getByText("Inscrito")).toBeInTheDocument();
      expect(dialog).toHaveTextContent(
        `${advanced.course.title} ya está en Mi aprendizaje. Empieza con ${firstVideo.title} (10:00) o vuelve cuando quieras.`,
      );
      expect(within(dialog).getByRole("link", { name: "Empezar el curso" })).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Seguir explorando" })).toBeInTheDocument();
    });

    test("WHEN shown in pt THEN the copy and the actions are Portuguese", async () => {
      // Act
      const { dialog } = await openWelcome({ locale: "pt" });

      // Assert
      expect(screen.getByRole("dialog", { name: "Você está dentro!" })).toBe(dialog);
      expect(within(dialog).getByText("Inscrito")).toBeInTheDocument();
      expect(within(dialog).getByRole("link", { name: "Começar o curso" })).toBeInTheDocument();
      expect(
        within(dialog).getByRole("button", { name: "Continuar explorando" }),
      ).toBeInTheDocument();
    });
  });
});
