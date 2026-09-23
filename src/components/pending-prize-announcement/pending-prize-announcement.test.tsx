import { PrizeReadyModal } from "@/components/modals/prize-ready-modal/prize-ready-modal";
import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type { LessonProgressSlice } from "@/domain/use-cases/find-course-catalog/find-course-catalog";
import {
  holdPrizeAnnouncement,
  refreshPendingPrizeAnnouncement,
} from "@/hooks/use-pending-prize-announcement/use-pending-prize-announcement";
import { usePathname } from "@/i18n/navigation";
import type { AchievementLevel } from "@/lib/learner-achievements/learner-achievements";
import { givenLearner } from "@/test-setup/learner-store/learner-store";
import { renderInLocale } from "@/test-setup/render-in-locale";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { act, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { PendingPrizeAnnouncement } from "./pending-prize-announcement";

const ANNOUNCE_KEY = "learning-english:prize-announce";

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "basic-course",
  title: "Basic Course",
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 2,
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

const lessonRuntimes: LessonProgressSlice[] = [0, 1].map((index) => ({
  id: LessonId.parse(faker.string.uuid()),
  moduleId: vowels.id,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: index + 1,
}));

const introduction = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "1-introduction",
  title: "Introduction",
  sequence: 2,
});

const introductionLesson: LessonProgressSlice = {
  id: LessonId.parse(faker.string.uuid()),
  moduleId: introduction.id,
  durationSeconds: 300,
  title: faker.lorem.words(3),
  sequence: 1,
};

const levels: AchievementLevel[] = [
  {
    course,
    modules: [vowels, introduction],
    lessonRuntimes: [...lessonRuntimes, introductionLesson],
  },
];

const announceStorageChange = () => {
  act(() => {
    refreshPendingPrizeAnnouncement();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

/** Every ticket of the module earned, so its prize is ready to claim. */
const readyToClaim = () => {
  for (const lesson of lessonRuntimes) {
    givenLearner.earnedTickets([lesson.id]);
  }
};

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
  vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
  vi.mocked(NiceModal.show).mockClear();
  vi.mocked(usePathname).mockReturnValue("/learning");
});

const renderAnnouncement = () => renderInLocale(<PendingPrizeAnnouncement levels={levels} />);

describe("PendingPrizeAnnouncement", () => {
  test("WHEN a prize was left unannounced THEN it is announced here AND the record is spent", async () => {
    // The learner moved on before the lesson page could tell them.
    readyToClaim();
    window.localStorage.setItem(ANNOUNCE_KEY, "2-vowels");
    announceStorageChange();

    renderAnnouncement();

    await waitFor(() =>
      expect(NiceModal.show).toHaveBeenCalledExactlyOnceWith(PrizeReadyModal, {
        prize: "harmonica",
        moduleTitle: "Vowels",
        moduleSlug: "2-vowels",
        ticketCount: 2,
      }),
    );
    expect(window.localStorage.getItem(ANNOUNCE_KEY)).toBeNull();
  });

  test("WHEN nothing is waiting THEN nothing is announced", async () => {
    readyToClaim();
    announceStorageChange();

    renderAnnouncement();

    await act(() => Promise.resolve());
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  test("WHEN the prize was already claimed THEN the record is dropped without a dialog", async () => {
    readyToClaim();
    givenLearner.claimedPrizes([vowels.slug]);
    window.localStorage.setItem(ANNOUNCE_KEY, "2-vowels");
    announceStorageChange();

    renderAnnouncement();

    await waitFor(() => expect(window.localStorage.getItem(ANNOUNCE_KEY)).toBeNull());
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  test("WHEN the learner is already at the counter THEN it stays quiet and spends the record", async () => {
    // The counter shows the prize and its Claim control; a dialog over it would
    // be telling them what they are looking at.
    vi.mocked(usePathname).mockReturnValue("/achievements");
    readyToClaim();
    window.localStorage.setItem(ANNOUNCE_KEY, "2-vowels");
    announceStorageChange();

    renderAnnouncement();

    await waitFor(() => expect(window.localStorage.getItem(ANNOUNCE_KEY)).toBeNull());
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  test("WHEN the page that won it is still showing the ticket THEN this waits for that page", async () => {
    // The lesson page plays the ticket first and then opens the dialog itself.
    // Announcing here in the meantime would interrupt the moment it belongs to.
    readyToClaim();
    window.localStorage.setItem(ANNOUNCE_KEY, "2-vowels");
    announceStorageChange();
    let release = () => {};
    act(() => {
      release = holdPrizeAnnouncement();
    });

    renderAnnouncement();

    await act(() => Promise.resolve());
    expect(NiceModal.show).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(ANNOUNCE_KEY)).toBe("2-vowels");

    // The learner leaves that page before its dialog was due.
    act(() => release());

    await waitFor(() => expect(NiceModal.show).toHaveBeenCalledTimes(1));
  });

  test("WHEN another prize is won later THEN that one is announced too", async () => {
    // This sits above the pages and never unmounts, so having spoken once must
    // not leave it unable to speak again.
    readyToClaim();
    window.localStorage.setItem(ANNOUNCE_KEY, "2-vowels");
    announceStorageChange();
    renderAnnouncement();
    await waitFor(() => expect(NiceModal.show).toHaveBeenCalledTimes(1));

    givenLearner.earnedTickets([introductionLesson.id]);
    window.localStorage.setItem(ANNOUNCE_KEY, "1-introduction");
    announceStorageChange();

    await waitFor(() => expect(NiceModal.show).toHaveBeenCalledTimes(2));
    expect(NiceModal.show).toHaveBeenLastCalledWith(
      PrizeReadyModal,
      expect.objectContaining({ moduleSlug: "1-introduction" }),
    );
  });

  test("WHEN the page renders again THEN it is not announced twice", async () => {
    readyToClaim();
    window.localStorage.setItem(ANNOUNCE_KEY, "2-vowels");
    announceStorageChange();
    const { rerender } = renderAnnouncement();

    await waitFor(() => expect(NiceModal.show).toHaveBeenCalledTimes(1));
    rerender(<PendingPrizeAnnouncement levels={levels} />);

    await act(() => Promise.resolve());
    expect(NiceModal.show).toHaveBeenCalledTimes(1);
  });
});
