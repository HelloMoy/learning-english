import { vi } from "vitest";

// `server-only` throws unless the bundler resolves the `react-server`
// condition, which Vitest does not. Server modules are tested directly, so
// the guard is neutralized here; the Next build still enforces it.
vi.mock("server-only", () => ({}));
