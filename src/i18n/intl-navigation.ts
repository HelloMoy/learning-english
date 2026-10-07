import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * next-intl's locale-aware navigation APIs, exactly as the library builds
 * them.
 *
 * @remarks
 * Application code imports from `@/i18n/navigation` instead. That module
 * re-exports these and swaps in the `Link` and `useRouter` that also tag each
 * navigation with its route transition; this one exists so those two wrappers
 * have something to wrap without importing themselves.
 *
 * @internal
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
