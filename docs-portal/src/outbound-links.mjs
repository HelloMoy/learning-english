/**
 * Which portal links leave the pages Starlight renders, and how they open.
 *
 * Plain JavaScript with no imports: `astro.config.mjs`, the portal's
 * components and the repository's own tests (which run without the portal's
 * dependencies installed) all read this one rule.
 */

/** Sites the portal hosts beside Starlight but does not render itself. */
export const HOSTED_SITES = ["/storybook/", "/api/"];

/** The attributes a link that leaves Starlight carries. */
export const NEW_TAB = { target: "_blank", rel: "noopener noreferrer" };

const ABSOLUTE_URL = /^[a-z][a-z\d+.-]*:/i;
const FILE_NAME = /\.[a-z\d]+$/i;

/**
 * Tells whether a link leaves the pages Starlight renders: an absolute URL, a
 * path into a hosted site, or a path to a file.
 *
 * @param {string} href - The link's target, as written
 * @returns {boolean} `true` when the link should open in a new tab
 */
export function opensOutsideStarlight(href) {
  if (ABSOLUTE_URL.test(href)) return true;

  const path = href.split(/[?#]/)[0];
  if (path === "") return false;
  return HOSTED_SITES.some((site) => path.startsWith(site)) || FILE_NAME.test(path);
}

/**
 * Keeps a page's previous/next links inside Starlight. Starlight builds them
 * from the sidebar, where Storybook and the API reference also sit; a
 * "previous page" that opens another site is not a previous page.
 *
 * @template {{ href: string }} Link
 * @param {{ prev?: Link, next?: Link }} pagination - Starlight's pagination for a page
 * @returns {{ prev?: Link, next?: Link }} The same links, minus any that leave Starlight
 */
export function paginationWithinStarlight({ prev, next }) {
  const withinStarlight = (link) => (link && !opensOutsideStarlight(link.href) ? link : undefined);
  return { prev: withinStarlight(prev), next: withinStarlight(next) };
}
