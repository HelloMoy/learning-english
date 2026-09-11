import "@testing-library/jest-dom/vitest";

import { SEEK_STEP_STORAGE_KEY } from "@/hooks/use-seek-step/use-seek-step";
import { DEFAULT_SEEK_STEP_SECONDS, SEEK_STEP_OPTIONS_SECONDS } from "@/lib/seek-run/seek-run";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import { DefaultLayoutContext, defaultLayoutIcons } from "@vidstack/react/player/layouts/default";
import { useTranslations } from "next-intl";
import type { ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { SeekStepMenu } from "./seek-step-menu";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

/**
 * Keys and their arguments, not copy: what matters here is which message the
 * component asks for and with what count, not how a locale phrases it.
 */
function translateToKeys(key: string, values?: { count?: number }) {
  return values?.count === undefined ? key : `${key}:${values.count}`;
}

/**
 * The layout's menu parts read only `icons` from its context, but the context
 * also carries signals the real `DefaultVideoLayout` owns and jsdom never
 * mounts. Standing those up would be testing the library rather than this
 * component, so the value is narrowed to the part that is actually read.
 */
const ICONS_ONLY = { icons: defaultLayoutIcons } as ComponentProps<
  typeof DefaultLayoutContext.Provider
>["value"];

/**
 * The menu is a part of the Default Layout, so it is rendered where the
 * library puts it: inside a player, under the layout's icon context. Without
 * that context `DefaultMenuButton` has no icons to draw and throws.
 */
function renderMenu() {
  return render(
    <MediaPlayer
      src="/videos/lesson.mp4"
      title="Long vs short vowels"
    >
      <MediaProvider />
      <DefaultLayoutContext.Provider value={ICONS_ONLY}>
        <SeekStepMenu />
      </DefaultLayoutContext.Provider>
    </MediaPlayer>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  // @ts-expect-error -- the mock stands in for the real `useTranslations`,
  // whose overloads a plain `vi.fn()` cannot satisfy.
  mockUseTranslations.mockReturnValue(translateToKeys);
});

afterEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("SeekStepMenu", () => {
  describe("GIVEN the setting's own copy", () => {
    test("WHEN rendered THEN it reads its namespace rather than the player's", () => {
      renderMenu();

      expect(mockUseTranslations).toHaveBeenCalledWith("Components.SeekStepMenu");
    });

    test("WHEN rendered THEN its button is named by that namespace's label", () => {
      renderMenu();

      expect(screen.getByRole("button")).toHaveTextContent("label");
    });
  });

  describe("GIVEN a learner who has never chosen", () => {
    test("WHEN rendered THEN the button hints the default step", () => {
      renderMenu();

      expect(screen.getByRole("button")).toHaveTextContent(`seconds:${DEFAULT_SEEK_STEP_SECONDS}`);
    });

    test("WHEN the menu is open THEN every offered step is an option", async () => {
      renderMenu();

      await userEvent.click(screen.getByRole("button"));

      const options = screen.getAllByRole("menuitemradio");
      expect(options).toHaveLength(SEEK_STEP_OPTIONS_SECONDS.length);
      for (const [index, step] of SEEK_STEP_OPTIONS_SECONDS.entries()) {
        expect(options[index]).toHaveTextContent(`seconds:${step}`);
      }
    });

    test("WHEN the menu is open THEN the default step is the checked option", async () => {
      renderMenu();

      await userEvent.click(screen.getByRole("button"));

      expect(
        screen.getByRole("menuitemradio", { name: `seconds:${DEFAULT_SEEK_STEP_SECONDS}` }),
      ).toBeChecked();
    });
  });

  describe("GIVEN a step already stored", () => {
    test("WHEN rendered THEN that step is the one hinted and checked", async () => {
      window.localStorage.setItem(SEEK_STEP_STORAGE_KEY, "10");
      renderMenu();

      await userEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("button")).toHaveTextContent("seconds:10");
      expect(screen.getByRole("menuitemradio", { name: "seconds:10" })).toBeChecked();
    });
  });

  describe("GIVEN the learner picks another step", () => {
    test("WHEN an option is chosen THEN it becomes the stored one", async () => {
      renderMenu();
      await userEvent.click(screen.getByRole("button"));

      await userEvent.click(screen.getByRole("menuitemradio", { name: "seconds:10" }));

      expect(window.localStorage.getItem(SEEK_STEP_STORAGE_KEY)).toBe("10");
    });

    test("WHEN an option is chosen THEN the button hints it", async () => {
      renderMenu();
      await userEvent.click(screen.getByRole("button"));

      await userEvent.click(screen.getByRole("menuitemradio", { name: "seconds:10" }));

      expect(screen.getByRole("button")).toHaveTextContent("seconds:10");
    });
  });
});
