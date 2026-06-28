import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware wrappers around Next.js navigation APIs. Always import these
 * (`Link`, `redirect`, `usePathname`, `useRouter`, `getPathname`) instead of
 * the bare `next/link` and `next/navigation` exports — they automatically
 * preserve the active locale in the URL.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
