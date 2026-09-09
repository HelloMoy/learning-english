import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StructuredData } from "./structured-data";

/**
 * `StructuredData` renders one `<script type="application/ld+json">` and
 * nothing visible. There is no visual state to review, so these stories exist
 * to make the *payload* inspectable: each renders the component and prints the
 * JSON beside it, so the schema a page publishes can be read, copied into
 * Google's Rich Results Test, and compared against what the page claims.
 *
 * The escaping story is the one that earns its place — it demonstrates the
 * reason this component exists rather than each page interpolating a template
 * literal.
 */
const meta = {
  title: "Components/StructuredData",
  component: StructuredData,
  parameters: { layout: "padded" },
  decorators: [
    (Story, context) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Story />
        <pre
          style={{
            margin: 0,
            padding: 16,
            overflowX: "auto",
            fontSize: 12,
            lineHeight: 1.6,
            fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
            background: "var(--color-panel-2, #f4f4f5)",
            color: "var(--color-foreground, #18181b)",
          }}
        >
          {JSON.stringify(context.args.data, null, 2)}
        </pre>
      </div>
    ),
  ],
} satisfies Meta<typeof StructuredData>;

export default meta;
type Story = StoryObj<typeof meta>;

/** What a course page publishes: the vocabulary Google reads for course results. */
export const CourseSchema: Story = {
  args: {
    data: {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Basic Course",
      description: "American pronunciation from the ground up: vowel and consonant sounds.",
      url: "https://english-course.online/en/courses/basic-course",
      inLanguage: "en",
      provider: { "@type": "Organization", name: "English Course" },
      hasCourseInstance: { "@type": "CourseInstance", courseMode: "online" },
    },
  },
};

/** The trail a module or lesson page publishes, numbered from one. */
export const Breadcrumbs: Story = {
  args: {
    data: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Basic Course",
          item: "https://english-course.online/en/courses/basic-course",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Introduction",
          item: "https://english-course.online/en/courses/basic-course/modules/1-introduction",
        },
      ],
    },
  },
};

/**
 * A Lecture that declares an upload date. Most of the catalog does not, and
 * those lessons emit no `VideoObject` at all — Google requires the date, and
 * the type without it is markup validators reject.
 */
export const VideoObjectSchema: Story = {
  args: {
    data: {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: "Welcome",
      description: "An introduction to the course.",
      uploadDate: "2026-01-15",
      duration: "PT3M15S",
      contentUrl: "https://english-course.online/en/courses/…/lessons/…",
      publisher: { "@type": "Organization", name: "English Course" },
    },
  },
};

/**
 * The reason this component exists. Course titles are author-controlled text;
 * without escaping, a `</script>` inside one closes the tag early and turns
 * everything after it into live markup. Inspect the rendered DOM: the payload
 * is intact as JSON, and no element escaped the script.
 */
export const EscapesClosingTags: Story = {
  args: {
    data: {
      "@context": "https://schema.org",
      "@type": "Course",
      name: "Vowels </script><img src=x onerror=alert(1)>",
    },
  },
};
