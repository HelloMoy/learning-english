import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { isPrimaryPointerOnTheVideo } from "./video-pointer";

/** A pointer event as the listeners on the player element receive it. */
function pointerOn(target: EventTarget | null, button = 0): PointerEvent {
  return { target, button } as PointerEvent;
}

function anElementInsideTheProvider(): Element {
  const provider = document.createElement("div");
  provider.setAttribute("data-media-provider", "");
  const blocker = document.createElement("div");
  provider.append(blocker);
  return blocker;
}

describe("isPrimaryPointerOnTheVideo", () => {
  test("WHEN the pointer is the primary one on the provider THEN it is on the video", () => {
    expect(isPrimaryPointerOnTheVideo(pointerOn(anElementInsideTheProvider()))).toBe(true);
  });

  test("WHEN the button is not the primary one THEN it is not", () => {
    const secondaryButton = faker.number.int({ min: 1, max: 4 });

    expect(
      isPrimaryPointerOnTheVideo(pointerOn(anElementInsideTheProvider(), secondaryButton)),
    ).toBe(false);
  });

  test("WHEN the target is outside the provider THEN it is not", () => {
    // The control bar, the resume overlay and the hint's dismiss control.
    expect(isPrimaryPointerOnTheVideo(pointerOn(document.createElement("button")))).toBe(false);
  });

  test("WHEN there is no element target THEN it is not", () => {
    expect(isPrimaryPointerOnTheVideo(pointerOn(null))).toBe(false);
  });
});
