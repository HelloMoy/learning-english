import { screen, within } from "@testing-library/react";
import {
  Application,
  Comment,
  DeclarationReflection,
  FileRegistry,
  JSX,
  ProjectReflection,
  ReflectionKind,
  type Reflection,
} from "typedoc";
import { beforeAll, describe, expect, test } from "vitest";

import { cinemaHome, type HomeContext } from "./cinema-home.mts";

const VERSION = "0.1.0";

const context: HomeContext = {
  urlTo: (reflection) => `modules/${reflection.name}.html`,
  commentShortSummary: (reflection) =>
    JSX.createElement("p", null, reflection.comment?.summary.map((part) => part.text).join("")),
};

function documented<T extends Reflection>(reflection: T, summary: string): T {
  reflection.comment = new Comment([{ kind: "text", text: summary }]);
  return reflection;
}

function moduleNamed(
  project: ProjectReflection,
  name: string,
  exports: [string, ReflectionKind, string?][] = [],
): DeclarationReflection {
  const moduleReflection = new DeclarationReflection(name, ReflectionKind.Module, project);
  moduleReflection.children = exports.map(([exportName, kind, summary]) => {
    const declaration = new DeclarationReflection(exportName, kind, moduleReflection);
    return summary ? documented(declaration, summary) : declaration;
  });
  return moduleReflection;
}

function buildProject(): ProjectReflection {
  const project = new ProjectReflection("learning-english", new FileRegistry());
  project.packageVersion = VERSION;
  project.children = [
    moduleNamed(project, "domain/use-cases/find-next-lesson/find-next-lesson"),
    moduleNamed(project, "domain/use-cases/mark-lesson-complete/mark-lesson-complete"),
    moduleNamed(project, "domain/ports/clock/clock", [
      ["Clock", ReflectionKind.Interface, "Port: a clock the domain reads the time from."],
    ]),
    moduleNamed(project, "hooks/use-account-form/use-account-form", [
      ["AccountFieldProps", ReflectionKind.TypeAlias, "The props an account field needs."],
      ["useAccountForm", ReflectionKind.Function, "Client hook: drives one account form."],
    ]),
    moduleNamed(project, "hooks/use-count-up/use-count-up"),
    moduleNamed(project, "lib/format-duration/format-duration", [
      ["DurationParts", ReflectionKind.TypeAlias],
      ["formatDuration", ReflectionKind.Function, "Split a duration into hours and minutes."],
    ]),
    moduleNamed(project, "proxy"),
  ];
  return project;
}

function renderHome(): void {
  document.body.innerHTML = JSX.renderElement(cinemaHome(context, buildProject()));
}

function posterLink(title: string): HTMLElement {
  const layers = screen.getByRole("region", { name: "Start from the hexagon" });
  return within(layers).getByRole("link", { name: title });
}

function listItemOf(element: HTMLElement): HTMLElement {
  const item = element.closest("li");
  if (!item) throw new Error(`${element.textContent} is not inside a list item`);
  return item;
}

function posterFor(title: string): HTMLElement {
  return listItemOf(posterLink(title));
}

function moduleLink(name: string): HTMLElement {
  return screen.getByRole("link", { name });
}

beforeAll(async () => {
  // Loads TypeDoc's English strings, which ReflectionKind names come from.
  await Application.bootstrap({}, []);
});

describe("cinemaHome — marquee", () => {
  test("titles the page as the API reference", () => {
    renderHome();

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The API reference for English Course.",
    );
  });

  test("names the project in the eyebrow", () => {
    renderHome();

    expect(screen.getByText(/Now showing · learning-english/)).toBeInTheDocument();
  });

  test("shows the package version and the documented module count", () => {
    renderHome();

    expect(screen.getByText(`v${VERSION}`)).toBeInTheDocument();
    expect(screen.getByText("7 modules")).toBeInTheDocument();
  });
});

describe("cinemaHome — layer posters", () => {
  test("shows one poster per hexagon layer", () => {
    renderHome();

    for (const title of ["Use cases", "Ports", "Entities", "Adapters", "Hooks", "Components"]) {
      expect(posterFor(title)).toBeInTheDocument();
    }
  });

  test("counts the modules under each layer", () => {
    renderHome();

    expect(within(posterFor("Use cases")).getByText("2")).toBeInTheDocument();
    expect(within(posterFor("Ports")).getByText("1")).toBeInTheDocument();
    expect(within(posterFor("Entities")).getByText("0")).toBeInTheDocument();
  });

  test("links a poster to its folder in the module index", () => {
    renderHome();

    const target = posterLink("Hooks").getAttribute("href")?.slice(1) ?? "";
    expect(document.getElementById(target)).toHaveTextContent("hooks/use-count-up");
  });
});

describe("cinemaHome — module index", () => {
  test("links each module under its collapsed name", () => {
    renderHome();

    expect(moduleLink("lib/format-duration")).toHaveAttribute(
      "href",
      "modules/lib/format-duration/format-duration.html",
    );
  });

  test("summarises a module with its documented function", () => {
    renderHome();

    const row = listItemOf(moduleLink("lib/format-duration"));
    expect(row).toHaveTextContent("Split a duration into hours and minutes.");
  });

  test("prefers the function over a helper type documented before it", () => {
    renderHome();

    const row = listItemOf(moduleLink("hooks/use-account-form"));
    expect(row).toHaveTextContent("Client hook: drives one account form.");
    expect(row).not.toHaveTextContent("The props an account field needs.");
  });

  test("summarises a module of types with its documented type", () => {
    renderHome();

    const row = listItemOf(moduleLink("domain/ports/clock"));
    expect(row).toHaveTextContent("Port: a clock the domain reads the time from.");
  });

  test("lists the kinds of symbol a module exports", () => {
    renderHome();

    const row = listItemOf(moduleLink("lib/format-duration"));
    expect(within(row).getByText("Type Alias")).toBeInTheDocument();
    expect(within(row).getByText("Function")).toBeInTheDocument();
  });

  test("orders folders with the hexagon layers first", () => {
    renderHome();

    const index = screen.getByRole("region", { name: "All modules" });
    const folders = within(index)
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(folders).toEqual(["domain/use-cases", "domain/ports", "hooks", "lib", "src"]);
  });
});
