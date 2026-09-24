import { PrizeReadyModal } from "@/components/modals/prize-ready-modal/prize-ready-modal";
import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import { refreshPendingPrizeAnnouncement } from "@/hooks/use-pending-prize-announcement/use-pending-prize-announcement";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { act, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { GlobalProviders } from "./global-providers";

// The real adapter reaches for `next/navigation`, which this layout cannot
// import; the providers' own job is what these tests are about.
vi.mock("nuqs/adapters/next/app", () => ({
  NuqsAdapter: ({ children }: { children: React.ReactNode }) => children,
}));

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 1,
  moduleCount: 1,
  sequence: 1,
});

const vowels = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 1,
});

const lesson: LessonProgressSlice = {
  id: LessonId.parse(faker.string.uuid()),
  moduleId: vowels.id,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: 1,
};

const levels: AchievementLevel[] = [{ course, modules: [vowels], lessonRuntimes: [lesson] }];

const announceStorageChange = () => {
  act(() => {
    refreshPendingPrizeAnnouncement();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
  vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
  vi.mocked(NiceModal.show).mockClear();
});

describe("GlobalProviders", () => {
  test("WHEN a page renders THEN its content is shown", () => {
    renderInLocale(
      <GlobalProviders levels={levels}>
        <p>A lesson</p>
      </GlobalProviders>,
    );

    expect(screen.getByText("A lesson")).toBeInTheDocument();
  });

  test("WHEN a prize was left unannounced THEN whatever page the learner opens announces it", async () => {
    // Mounted above the pages, so leaving the lesson cannot lose the news.
    givenLearner.earnedTickets([lesson.id]);
    window.localStorage.setItem("learning-english:prize-announce", "2-vowels");
    announceStorageChange();

    renderInLocale(
      <GlobalProviders levels={levels}>
        <p>Another lesson</p>
      </GlobalProviders>,
    );

    await waitFor(() =>
      expect(NiceModal.show).toHaveBeenCalledExactlyOnceWith(
        PrizeReadyModal,
        expect.objectContaining({ moduleSlug: "2-vowels" }),
      ),
    );
  });

  test("WHEN a page renders THEN the install-enabling worker is registered", () => {
    // It has to be mounted above the pages: the browser decides whether to
    // offer an install once per visit, not once per route the learner reaches.
    const register = vi.fn().mockResolvedValue({});
    vi.stubGlobal("navigator", { ...navigator, serviceWorker: { register } });

    renderInLocale(
      <GlobalProviders levels={levels}>
        <p>A lesson</p>
      </GlobalProviders>,
    );

    expect(register).toHaveBeenCalledWith("/sw.js");
    vi.unstubAllGlobals();
  });

  test("WHEN nothing is waiting THEN no dialog interrupts the page", async () => {
    renderInLocale(
      <GlobalProviders levels={levels}>
        <p>Another lesson</p>
      </GlobalProviders>,
    );

    await act(() => Promise.resolve());
    expect(NiceModal.show).not.toHaveBeenCalled();
  });
});
