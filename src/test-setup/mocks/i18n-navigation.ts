// Global mock for `@/i18n/navigation` (the locale-aware wrappers around
// `next/link` and `next/navigation` from next-intl).
//
// Why this exists:
// - `next/navigation` resolves to a path that Vitest cannot import in this
//   layout (the package ships `next/navigation.js`, not a directory).
// - Components that render a `<Link>` need a deterministic DOM anchor under
//   test, not the real next-intl wrapper.
// - Per the AGENTS convention: a global mock belongs in `vitest.setup.ts`,
//   not in every individual test that happens to import it.
//
// Behavior:
// - `Link` renders as a plain anchor. The test asserts on role, not on href.
// - Hooks (`usePathname`, `useRouter`, `getPathname`) return `vi.fn()`-style
//   stubs; tests that need specific behaviors can override locally with
//   `vi.mock("@/i18n/navigation", ...)` after this global.
// - `redirect` is a no-op stub so Server Component tests that call it
//   don't crash.

import { vi } from "vitest";

vi.mock("@/i18n/navigation", async () => {
  const React = await import("react");
  const passthroughAnchor = ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", { href, ...rest }, children);

  return {
    Link: passthroughAnchor,
    redirect: vi.fn(),
    usePathname: vi.fn(() => "/"),
    useRouter: vi.fn(() => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    })),
    getPathname: vi.fn(() => "/"),
  };
});
