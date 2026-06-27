import * as React from "react";
import { vi } from "vitest";

// Mock next/image to render a plain <img> tag.
// jsdom does not implement Next.js's image optimizer, so we replace it
// with the native element. Tests assert on the rendered <img> directly.
vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => React.createElement("img", props),
}));

// Mock next/font/google to return a Proxy that handles any font import.
// next/font requires network access and a real browser; in tests we only
// need a placeholder that satisfies the call signature
// `Font({ variable, subsets })` and exposes a stable CSS variable name.
vi.mock("next/font/google", () => {
  const createMockFont = (name: string) => ({
    className: `mocked-${name}`,
    variable: `--mocked-${name}`,
    style: { fontFamily: `mocked-${name}` },
  });

  return new Proxy(
    {},
    {
      get: (_target, prop: string) => () => createMockFont(String(prop).toLowerCase()),
    },
  );
});
