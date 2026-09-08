// Global stubs for three browser APIs jsdom does not implement:
// `IntersectionObserver`, `ResizeObserver`, and `window.matchMedia`.
//
// Why this exists:
// - Vidstack's `<MediaPlayer>` lazy-loads its provider behind an
//   `IntersectionObserver` and measures itself with a `ResizeObserver`;
//   `<DefaultVideoLayout>` reads `matchMedia` to pick its small/large layout.
//   Without these, mounting the player throws before any assertion runs.
// - They are capability gaps, not test doubles for our own code: every one of
//   them is a real browser API that jsdom simply omits. Per the AGENTS
//   convention, that belongs here rather than repeated in each test.
//
// Behavior:
// - Both observers are inert: they record nothing and never fire a callback.
//   Nothing in the suite depends on intersection or resize *notifications* —
//   the player's real loading and layout switching are Playwright's job — so a
//   stub that fires would only invent events a browser never sent.
// - `matchMedia` reports every query as unmatched, which is jsdom's own
//   viewport (0×0) answered honestly.
//
// A test that needs one of these to actually fire should install its own
// spy locally rather than teaching these stubs to emit.

/** An observer that accepts subscriptions and never reports anything. */
class InertObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: readonly number[] = [];

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): [] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  Object.defineProperty(globalThis, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: InertObserver,
  });
}

if (typeof globalThis.ResizeObserver === "undefined") {
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: InertObserver,
  });
}

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
      }) as MediaQueryList,
  });
}
