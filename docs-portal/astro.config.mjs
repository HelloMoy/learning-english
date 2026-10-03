import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://docs.english-course.online",
  integrations: [
    starlight({
      title: "English Course Docs",
      customCss: ["./src/styles/cinema.css"],
      components: {
        ThemeProvider: "./src/components/ThemeProvider.astro",
        ThemeSelect: "./src/components/ThemeSelect.astro",
        SiteTitle: "./src/components/SiteTitle.astro",
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
      sidebar: [
        { label: "Design system", link: "/storybook/" },
        { label: "API reference", link: "/api/" },
      ],
    }),
  ],
});
