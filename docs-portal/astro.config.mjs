import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeExternalLinks from "rehype-external-links";

import { SIDEBAR } from "./src/navigation.mjs";
import { NEW_TAB, opensOutsideStarlight } from "./src/outbound-links.mjs";

export default defineConfig({
  site: "https://docs.english-course.online",
  markdown: {
    // Markdown links that leave Starlight (the changelog's commit links, any
    // link to Storybook or the API) open in a new tab. HTML written inside MDX
    // is not Markdown: it carries the attributes itself, and a test checks it.
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          test: (element) => opensOutsideStarlight(String(element.properties.href)),
          target: NEW_TAB.target,
          rel: NEW_TAB.rel.split(" "),
        },
      ],
    ],
  },
  integrations: [
    starlight({
      title: "English Course Docs",
      customCss: ["./src/styles/cinema.css"],
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
        SiteTitle: "./src/components/SiteTitle.astro",
        Hero: "./src/components/home/HomeHero.astro",
      },
      head: [
        { tag: "link", attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" } },
        {
          tag: "link",
          attrs: { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
        },
        {
          tag: "link",
          attrs: {
            rel: "stylesheet",
            href: "https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;800&family=Geist+Mono:wght@400;500&display=swap",
          },
        },
      ],
      sidebar: SIDEBAR,
      routeMiddleware: "./src/route-data.ts",
    }),
  ],
});
