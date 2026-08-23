"use client";

import { useSyncExternalStore } from "react";

/**
 * React does not re-render on its own when `getSnapshot` disagrees with
 * `getServerSnapshot` once hydration commits (facebook/react#26095), so the
 * subscription nudges it once on the next macrotask — by then the hydration
 * pass is done and the client value is safe to adopt. Returns the
 * unsubscribe function React calls on unmount.
 */
const subscribe = (onStoreChange: () => void): (() => void) => {
  const nudge = setTimeout(onStoreChange, 0);
  return () => clearTimeout(nudge);
};

const getSnapshot = (): boolean => true;

const getServerSnapshot = (): boolean => false;

/**
 * Client hook: reports whether React has finished hydrating the
 * server-rendered HTML.
 *
 * @remarks
 * Use it to gate any markup that legitimately differs between the server
 * and the browser — values read from `localStorage`, `window`, or a
 * provider that only resolves client-side (`next-themes`' `useTheme` is
 * the motivating case). Rendering that markup during hydration triggers
 * React's "server rendered HTML didn't match the client" error.
 *
 * Returns `false` on the server **and** during the client's hydration
 * render, then `true` on every render after that. `getServerSnapshot` is
 * what makes this work: React uses it both while generating HTML and while
 * hydrating, so the first client render matches the server byte for byte.
 *
 * Preferred over the `useState` + `useEffect(() => setMounted(true), [])`
 * pattern from the `next-themes` README because that one trips the React 19
 * `react-hooks/set-state-in-effect` lint rule.
 *
 * @example
 * ```tsx
 * const isHydrated = useIsHydrated();
 * const { theme } = useTheme();
 *
 * if (!isHydrated) return <Placeholder />;
 * return <span>{theme}</span>;
 * ```
 *
 * @returns `false` until hydration has committed, `true` afterwards
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
