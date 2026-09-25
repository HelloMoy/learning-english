// @vitest-environment node
import { takeStashedOffer } from "@/lib/install-offer-stash/install-offer-stash";

import { renderToString } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { useInstallPrompt } from "./use-install-prompt";

// jsdom always provides `window`, so only a Node environment can show what the
// server render of every page actually does with the install prompt.

function InstallAvailability() {
  const offer = useInstallPrompt();
  return <output>{offer.canInstall ? "offered" : "not offered"}</output>;
}

describe("the install prompt, rendered on the server", () => {
  test("GIVEN no browser WHEN the stash is read THEN nothing is waiting", () => {
    expect(takeStashedOffer()).toBeNull();
  });

  test("GIVEN no browser WHEN a page using the prompt renders THEN it completes with no offer", () => {
    const html = renderToString(<InstallAvailability />);

    expect(html).toContain("not offered");
  });
});
