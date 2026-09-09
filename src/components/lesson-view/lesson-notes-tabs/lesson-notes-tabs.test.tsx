import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocale, useTranslations } from "next-intl";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { LessonNotesTabs } from "./lesson-notes-tabs";

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(),
}));

const mockUseTranslations = vi.mocked(useTranslations);
const mockUseLocale = vi.mocked(useLocale);

const TRILINGUAL = [
  "# Intro",
  "",
  "## 🇪🇸 Español",
  "",
  "Texto en español.",
  "",
  "## 🇺🇸 English",
  "",
  "English text.",
  "",
  "## 🇧🇷 Português",
  "",
  "Texto em português.",
].join("\n");

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
    mockUseLocale.mockReturnValue("es");
  });

  test("Notes tab renders the active locale's notes and no other language", () => {
    mockUseLocale.mockReturnValue("es");
    render(<LessonNotesTabs markdown={TRILINGUAL} />);

    expect(screen.getByText("Texto en español.")).toBeInTheDocument();
    expect(screen.queryByText("English text.")).not.toBeInTheDocument();
    expect(screen.queryByText("Texto em português.")).not.toBeInTheDocument();
  });

  test("Notes tab follows the active locale to English", () => {
    mockUseLocale.mockReturnValue("en");
    render(<LessonNotesTabs markdown={TRILINGUAL} />);

    expect(screen.getByText("English text.")).toBeInTheDocument();
    expect(screen.queryByText("Texto en español.")).not.toBeInTheDocument();
    expect(screen.queryByText("Texto em português.")).not.toBeInTheDocument();
  });

  test("Notes tab follows the active locale to Portuguese", () => {
    mockUseLocale.mockReturnValue("pt");
    render(<LessonNotesTabs markdown={TRILINGUAL} />);

    expect(screen.getByText("Texto em português.")).toBeInTheDocument();
    expect(screen.queryByText("Texto en español.")).not.toBeInTheDocument();
    expect(screen.queryByText("English text.")).not.toBeInTheDocument();
  });

  test("notes missing the active locale fall back to English", () => {
    mockUseLocale.mockReturnValue("pt");
    render(<LessonNotesTabs markdown={BILINGUAL} />);

    expect(screen.getByText("English text.")).toBeInTheDocument();
    expect(screen.queryByText("Texto en español.")).not.toBeInTheDocument();
  });

  test("no language label is rendered above the notes", () => {
    render(<LessonNotesTabs markdown={TRILINGUAL} />);

    expect(screen.queryByText("Components.LessonTabs.spanish")).not.toBeInTheDocument();
    expect(screen.queryByText("Components.LessonTabs.english")).not.toBeInTheDocument();
    expect(screen.queryByText("Components.LessonTabs.portuguese")).not.toBeInTheDocument();
  });

  test("ambiguous notes render the body as-is without error", () => {
    render(<LessonNotesTabs markdown={"# Intro\n\nSolo un párrafo."} />);

    expect(screen.getByText("Solo un párrafo.")).toBeInTheDocument();
  });

  test("Transcript tab is marked disabled and reveals only the unavailable notice", async () => {
    const user = userEvent.setup();
    render(<LessonNotesTabs markdown={TRILINGUAL} />);
    const transcript = screen.getByRole("tab", { name: "Components.LessonTabs.transcript" });

    expect(transcript).toHaveAttribute("aria-disabled", "true");
    await user.click(transcript);
    expect(screen.getByText("Components.LessonTabs.transcriptUnavailable")).toBeInTheDocument();
    // No transcript content — the notes panel is no longer shown.
    expect(screen.queryByText("Texto en español.")).not.toBeInTheDocument();
  });

  test("does not inject raw HTML from the notes body", () => {
    const { container } = render(
      <LessonNotesTabs markdown={"Hola <script>alert('x')</script>\n\nHi there."} />,
    );
    expect(container.querySelector("script")).toBeNull();
  });

  test("delegates typography to the Markdown renderer instead of prose classes", () => {
    const { container } = render(<LessonNotesTabs markdown={TRILINGUAL} />);

    expect(container.querySelector('[class*="prose"]')).toBeNull();
  });
});
