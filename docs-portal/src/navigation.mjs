import { NEW_TAB, opensOutsideStarlight } from "./outbound-links.mjs";

const REFERENCES = [
  { label: "Design system", link: "/storybook/" },
  { label: "API reference", link: "/api/" },
  { label: "Emails", link: "/emails/" },
  { label: "Architecture", link: "/architecture/" },
  { label: "Changelog", link: "/changelog/" },
];

/**
 * The portal's sidebar. Entries that leave Starlight open in a new tab, so
 * Storybook and the API reference never replace the portal.
 */
export const SIDEBAR = REFERENCES.map((entry) =>
  opensOutsideStarlight(entry.link) ? { ...entry, attrs: NEW_TAB } : entry,
);
