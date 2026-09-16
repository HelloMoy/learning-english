import { PrizeReadyModal } from "@/components/modals/prize-ready-modal/prize-ready-modal";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import {
  markLessonComplete,
  unmarkLessonComplete,
} from "@/hooks/use-lesson-completion/use-lesson-completion";
import { useIsPrizeAnnouncementHeld } from "@/hooks/use-pending-prize-announcement/use-pending-prize-announcement";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";

import NiceModal from "@ebay/nice-modal-react";
import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  PRIZE_READY_DELAY_AFTER_FULLSCREEN_MS,
  useLessonRewardMoment,
} from "./use-lesson-reward-moment";

const courseId = CourseId.parse(faker.string.uuid());

const vowels = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId,
  slug: "2-vowels",
  title: "Vowels",
  sequence: 2,
});

const videoLesson = (sequence: number, title: string) =>
  Lesson.parse({
    kind: "video",
    id: LessonId.parse(faker.string.uuid()),
    courseId,
    moduleId: vowels.id,
    sequence,
    title,
    description: faker.lorem.sentence(),
    source: faker.internet.url(),
    durationSeconds: 300,
  });

const [schwa, soundI, weakMerger] = [
  videoLesson(1, "The schwa /ə/"),
  videoLesson(2, "The vowel sound /i/"),
  videoLesson(3, "The weak-vowel merger"),
];
const vowelsLessons = [schwa, soundI, weakMerger];

const storeCompletion = (...lessons: ReadonlyArray<Lesson>) => {
  for (const lesson of lessons) {
    window.localStorage.setItem(`learning-english:completed:${lesson.id}`, "1");
  }
};

const ticketKey = (lesson: Lesson) => `learning-english:ticket-earned:${lesson.id}`;

/** Lets the mount-time storage read settle, as it would before a learner can act. */
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

/** jsdom has no Fullscreen API, so what the browser would present is stood in for. */
const presentFullscreen = (element: Element | null) => {
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: element });
  act(() => {
    document.dispatchEvent(new Event("fullscreenchange"));
  });
};

const renderMoment = async (lesson: Lesson) => {
  const rendered = renderHook(() =>
    useLessonRewardMoment({ lesson, module: vowels, moduleLessons: vowelsLessons }),
  );
  await settle();
  return rendered;
};

beforeEach(async () => {
  window.localStorage.clear();
  await Promise.all(vowelsLessons.map((lesson) => unmarkLessonComplete(lesson.id)));
  refreshSavedPlaybackPositions();
  vi.spyOn(NiceModal, "show").mockResolvedValue(undefined);
  vi.mocked(NiceModal.show).mockClear();
  Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
});

afterEach(() => {
  // A test that fails while fake timers are installed would otherwise hand them
  // to every test after it, which reads as a cascade of timeouts.
  vi.useRealTimers();
});

describe("useLessonRewardMoment", () => {
  test("WHEN the page opens on an incomplete lesson THEN there is no moment", async () => {
    const { result } = await renderMoment(soundI);

    expect(result.current.ticket).toBeNull();
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  test("WHEN the page opens on a lesson completed earlier THEN it stays quiet", async () => {
    storeCompletion(soundI);

    const { result } = await renderMoment(soundI);

    expect(result.current.ticket).toBeNull();
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  test("WHEN the lesson is marked complete while open THEN a ticket moment names it and the module's progress", async () => {
    storeCompletion(schwa);
    const { result } = await renderMoment(soundI);

    await act(() => markLessonComplete(soundI.id));

    expect(result.current.ticket).toEqual({
      id: 1,
      lessonTitle: "The vowel sound /i/",
      symbol: "i",
      ticketsEarned: 2,
      ticketCount: 3,
      prize: "harmonica",
      moduleTitle: "Vowels",
      moduleSlug: "2-vowels",
      readiesPrize: false,
    });
    expect(NiceModal.show).not.toHaveBeenCalled();
  });

  test("WHEN a ticket is earned THEN it is stored, so un-marking cannot take it back", async () => {
    const { result } = await renderMoment(soundI);

    await act(() => markLessonComplete(soundI.id));

    expect(window.localStorage.getItem(ticketKey(soundI))).not.toBeNull();
    expect(result.current.ticket?.ticketsEarned).toBe(1);
  });

  test("WHEN a lesson naming no sound is completed THEN its ticket carries its position", async () => {
    const { result } = await renderMoment(weakMerger);

    await act(() => markLessonComplete(weakMerger.id));

    expect(result.current.ticket?.symbol).toBe("3");
  });

  test("WHEN playback crosses the finish threshold THEN the same ticket moment arrives", async () => {
    const { result } = await renderMoment(soundI);

    act(() => {
      window.localStorage.setItem(`learning-english:playback:${soundI.id}`, "299");
      refreshSavedPlaybackPositions();
    });

    expect(result.current.ticket?.lessonTitle).toBe("The vowel sound /i/");
  });

  describe("GIVEN the completion that collects the module's last ticket", () => {
    test("WHEN it happens THEN the prize is recorded at once, so leaving cannot lose it", async () => {
      // The dialog is five seconds away; the learner can be gone by then.
      storeCompletion(schwa, weakMerger);
      await renderMoment(soundI);

      await act(() => markLessonComplete(soundI.id));

      expect(window.localStorage.getItem("learning-english:prize-announce")).toBe("2-vowels");
    });

    test("WHEN this page announces it THEN the record is spent", async () => {
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));

      act(() => result.current.dismissTicket());

      expect(window.localStorage.getItem("learning-english:prize-announce")).toBeNull();
      expect(NiceModal.show).toHaveBeenCalledTimes(1);
    });

    test("WHEN it happens THEN this page holds the announcement, so nothing talks over the ticket", async () => {
      const held = renderHook(() => useIsPrizeAnnouncementHeld());
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);

      await act(() => markLessonComplete(soundI.id));

      expect(held.result.current).toBe(true);
      act(() => result.current.dismissTicket());
    });

    test("WHEN this page opens the dialog itself THEN it lets the announcement go", async () => {
      const held = renderHook(() => useIsPrizeAnnouncementHeld());
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));

      act(() => result.current.dismissTicket());

      expect(held.result.current).toBe(false);
    });

    test("WHEN the learner leaves before the dialog is due THEN the hold leaves with the page", async () => {
      // Whatever page they open next is what announces it instead.
      const held = renderHook(() => useIsPrizeAnnouncementHeld());
      storeCompletion(schwa, weakMerger);
      const { unmount } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));

      unmount();

      expect(held.result.current).toBe(false);
    });

    test("WHEN an ordinary ticket is earned THEN nothing is held", async () => {
      const held = renderHook(() => useIsPrizeAnnouncementHeld());
      const { result } = await renderMoment(soundI);

      await act(() => markLessonComplete(soundI.id));

      expect(held.result.current).toBe(false);
      act(() => result.current.dismissTicket());
    });

    test("WHEN an ordinary ticket is earned THEN nothing is recorded", async () => {
      const { result } = await renderMoment(soundI);

      await act(() => markLessonComplete(soundI.id));
      act(() => result.current.dismissTicket());

      expect(window.localStorage.getItem("learning-english:prize-announce")).toBeNull();
    });

    test("WHEN it happens THEN the ticket plays first AND no dialog interrupts it", async () => {
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);

      await act(() => markLessonComplete(soundI.id));

      expect(result.current.ticket).toMatchObject({
        ticketsEarned: 3,
        ticketCount: 3,
        readiesPrize: true,
      });
      expect(NiceModal.show).not.toHaveBeenCalled();
    });

    test("WHEN the ticket has left THEN the waiting-prize dialog opens", async () => {
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));

      act(() => result.current.dismissTicket());

      expect(result.current.ticket).toBeNull();
      expect(NiceModal.show).toHaveBeenCalledExactlyOnceWith(PrizeReadyModal, {
        prize: "harmonica",
        moduleTitle: "Vowels",
        moduleSlug: "2-vowels",
        ticketCount: 3,
      });
    });

    test("WHEN the learner is watching fullscreen THEN the dialog waits until the page is back", async () => {
      // A dialog they cannot see must not be listening for the Escape they
      // meant for the video — and `fullscreenchange` fires when the exit
      // begins, so opening on it spends the entrance behind the restore.
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));
      presentFullscreen(document.createElement("div"));

      act(() => result.current.dismissTicket());
      expect(NiceModal.show).not.toHaveBeenCalled();

      vi.useFakeTimers();
      presentFullscreen(null);
      expect(NiceModal.show).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(PRIZE_READY_DELAY_AFTER_FULLSCREEN_MS);
      });
      vi.useRealTimers();

      expect(NiceModal.show).toHaveBeenCalledExactlyOnceWith(PrizeReadyModal, {
        prize: "harmonica",
        moduleTitle: "Vowels",
        moduleSlug: "2-vowels",
        ticketCount: 3,
      });
    });

    test("WHEN the learner leaves fullscreen before the ticket has left THEN the dialog still waits for the ticket", async () => {
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);
      presentFullscreen(document.createElement("div"));
      await act(() => markLessonComplete(soundI.id));

      // Out of fullscreen, but the notification is still on screen.
      presentFullscreen(null);
      expect(NiceModal.show).not.toHaveBeenCalled();

      act(() => result.current.dismissTicket());

      expect(NiceModal.show).toHaveBeenCalledExactlyOnceWith(PrizeReadyModal, {
        prize: "harmonica",
        moduleTitle: "Vowels",
        moduleSlug: "2-vowels",
        ticketCount: 3,
      });
    });

    test("WHEN the learner stays in fullscreen THEN the dialog keeps waiting", async () => {
      storeCompletion(schwa, weakMerger);
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));
      presentFullscreen(document.createElement("div"));

      act(() => result.current.dismissTicket());
      presentFullscreen(document.createElement("div"));

      expect(NiceModal.show).not.toHaveBeenCalled();
    });

    test("WHEN an ordinary ticket has left in fullscreen THEN nothing waits for the learner", async () => {
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));
      presentFullscreen(document.createElement("div"));

      act(() => result.current.dismissTicket());
      presentFullscreen(null);

      expect(NiceModal.show).not.toHaveBeenCalled();
    });

    test("WHEN an ordinary ticket has left THEN no dialog follows it", async () => {
      const { result } = await renderMoment(soundI);
      await act(() => markLessonComplete(soundI.id));

      act(() => result.current.dismissTicket());

      expect(NiceModal.show).not.toHaveBeenCalled();
    });
  });

  test("WHEN the page re-renders after a completion THEN the moment is not repeated", async () => {
    const { result, rerender } = await renderMoment(soundI);

    await act(() => markLessonComplete(soundI.id));
    rerender();
    await act(() => markLessonComplete(schwa.id));

    expect(result.current.ticket?.id).toBe(1);
  });

  test("WHEN the lesson is un-marked and completed again THEN its ticket is not announced twice", async () => {
    const { result } = await renderMoment(soundI);

    await act(() => markLessonComplete(soundI.id));
    act(() => result.current.dismissTicket());
    await act(() => unmarkLessonComplete(soundI.id));
    await act(() => markLessonComplete(soundI.id));

    expect(result.current.ticket).toBeNull();
  });

  test("WHEN the ticket is dismissed THEN nothing is left on screen", async () => {
    const { result } = await renderMoment(soundI);

    await act(() => markLessonComplete(soundI.id));
    act(() => result.current.dismissTicket());

    expect(result.current.ticket).toBeNull();
  });
});
