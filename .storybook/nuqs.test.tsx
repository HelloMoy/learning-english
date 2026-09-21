import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useQueryState } from "nuqs";
import { describe, expect, it } from "vitest";

import { withNuqs } from "./nuqs";

/** A miniature of the only component that reads URL state: AchievementsView. */
function ClaimedPrize() {
  const [claimed, setClaimed] = useQueryState("claim");

  return <button onClick={() => setClaimed("vowels")}>{claimed ?? "nothing claimed"}</button>;
}

const storyContext = { parameters: {}, globals: {}, viewMode: "story" } as never;

const renderDecorated = () => render(withNuqs(() => <ClaimedPrize />, storyContext) as never);

describe("withNuqs", () => {
  it("lets a component read URL state instead of throwing for a missing adapter", () => {
    renderDecorated();

    expect(screen.getByRole("button")).toHaveTextContent("nothing claimed");
  });

  it("reads back a value the story itself wrote", async () => {
    const user = userEvent.setup();
    renderDecorated();

    await user.click(screen.getByRole("button"));

    expect(await screen.findByRole("button", { name: "vowels" })).toBeInTheDocument();
  });
});
