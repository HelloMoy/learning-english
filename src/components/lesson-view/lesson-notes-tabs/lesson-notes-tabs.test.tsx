import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonNotesTabs } from "./lesson-notes-tabs";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);

const BILINGUAL = [
  "# Intro",
  "",
  "## 🇪🇸 Español",
  "",
  "Texto en español.",
  "",
  "## 🇺🇸 English",
  "",
  "English text.",
].join("\n");

describe("LessonNotesTabs", () => {
  beforeEach(() => {
    mockUseTranslations.mockImplementation(
      () => ((key: string) => `Components.LessonTabs.${key}`) as never,
    );
  });

  test("Notes tab renders Español and English columns from bilingual notes", () => {
    render(<LessonNotesTabs markdown={BILINGUAL} />);
    expect(screen.getByText("Components.LessonTabs.spanish")).toBeInTheDocument();
    expect(screen.getByText("Components.LessonTabs.english")).toBeInTheDocument();
    expect(screen.getByText("Texto en español.")).toBeInTheDocument();
    expect(screen.getByText("English text.")).toBeInTheDocument();
  });

  test("ambiguous notes fall back to a single column without error", () => {
    render(<LessonNotesTabs markdown={"# Intro\n\nSolo un párrafo."} />);
    expect(screen.queryByText("Components.LessonTabs.spanish")).not.toBeInTheDocument();
    expect(screen.getByText("Solo un párrafo.")).toBeInTheDocument();
  });

  test("Transcript tab is marked disabled and reveals only the unavailable notice", async () => {
    const user = userEvent.setup();
    render(<LessonNotesTabs markdown={BILINGUAL} />);
    const transcript = screen.getByRole("tab", { name: "Components.LessonTabs.transcript" });
    expect(transcript).toHaveAttribute("aria-disabled", "true");
    await user.click(transcript);
    expect(screen.getByText("Components.LessonTabs.transcriptUnavailable")).toBeInTheDocument();
    // No transcript content — the notes columns are no longer shown.
    expect(screen.queryByText("Texto en español.")).not.toBeInTheDocument();
  });

  test("does not inject raw HTML from the notes body", () => {
    const { container } = render(
      <LessonNotesTabs markdown={"Hola <script>alert('x')</script>\n\nHi there."} />,
    );
    expect(container.querySelector("script")).toBeNull();
  });
});
