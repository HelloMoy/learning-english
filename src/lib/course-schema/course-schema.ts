/**
 * Builders for the schema.org objects the catalog publishes.
 *
 * @remarks
 * Open Graph gets a link a good-looking card; this is what gets a course into
 * search results as a course rather than as generic prose. They are different
 * vocabularies for different consumers and neither substitutes for the other.
 *
 * Every builder states only what the catalog actually holds. There are no
 * ratings, reviews, offers or prices anywhere below — the site has none, and
 * inventing them is precisely what those types are policed for.
 *
 * @category Metadata
 */

/** The brand, matching `og:site_name` and the header wordmark. */
const PUBLISHER = { "@type": "Organization" as const, name: "English Course" };

const SCHEMA_CONTEXT = "https://schema.org";

/**
 * The site itself and who publishes it.
 *
 * @param input.siteUrl - The absolute origin, from `siteUrl()`
 * @param input.locale - The locale being served
 * @returns A schema.org `WebSite`
 */
export function websiteSchema(input: { siteUrl: string; locale: string }) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "WebSite" as const,
    name: PUBLISHER.name,
    url: input.siteUrl,
    inLanguage: input.locale,
    publisher: PUBLISHER,
  };
}

/**
 * A course, in the vocabulary Google reads to build course results.
 *
 * @param input.course - The course as the catalog holds it
 * @param input.siteUrl - The absolute origin
 * @param input.locale - The locale being served
 * @returns A schema.org `Course`
 */
export function courseSchema(input: {
  course: {
    title: string;
    description: string;
    slug: string;
    language: string;
    lessonCount: number;
    moduleCount: number;
  };
  siteUrl: string;
  locale: string;
}) {
  const { course, siteUrl, locale } = input;
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "Course" as const,
    name: course.title,
    description: course.description,
    url: `${siteUrl}/${locale}/courses/${course.slug}`,
    // What the course teaches, not the locale it is presented in.
    inLanguage: course.language,
    provider: PUBLISHER,
    // `courseWorkload` is deliberately absent. The catalog knows how many
    // lessons a course has, not how long they take to work through, and
    // deriving one from the other would state a duration nobody measured.
    hasCourseInstance: {
      "@type": "CourseInstance" as const,
      courseMode: "online",
    },
  };
}

/**
 * A Lecture's video — or nothing.
 *
 * @remarks
 * Returns `null` when the lesson declares no `uploadDate`. Google requires one
 * on `VideoObject`, so emitting the type without it produces structured data
 * validators reject — worse than emitting none, because invalid markup can
 * suppress the rest of a page's results. Most of the catalog is undated today,
 * which is why the absent case is the common one rather than the edge.
 *
 * @param input.lesson - The lesson as the catalog holds it
 * @param input.url - The lesson's absolute URL
 * @returns A schema.org `VideoObject`, or `null` when the lesson is undated
 */
export function videoSchema(input: {
  lesson: {
    kind: "video";
    title: string;
    description: string;
    durationSeconds: number;
    uploadDate?: string;
    poster?: string;
  };
  siteUrl: string;
  locale: string;
  url: string;
}) {
  const { lesson, url } = input;
  if (lesson.uploadDate === undefined) return null;

  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "VideoObject" as const,
    name: lesson.title,
    description: lesson.description,
    uploadDate: lesson.uploadDate,
    duration: isoDuration(lesson.durationSeconds),
    contentUrl: url,
    publisher: PUBLISHER,
    ...(lesson.poster === undefined ? {} : { thumbnailUrl: lesson.poster }),
  };
}

/**
 * The trail from the catalog root to the current page.
 *
 * @param trail - Each step's name and absolute URL, root first
 * @returns A schema.org `BreadcrumbList`, positions numbered from one
 */
export function breadcrumbSchema(trail: Array<{ name: string; url: string }>) {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList" as const,
    itemListElement: trail.map((step, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: step.name,
      item: step.url,
    })),
  };
}

/**
 * Seconds as an ISO 8601 duration — the only form schema.org accepts.
 *
 * Zero-valued components are omitted rather than written as `0S`, so 60 seconds
 * reads `PT1M` and not `PT1M0S`. A zero duration still yields `PT0S`, because
 * an empty `PT` is not a duration.
 */
function isoDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const parts = [
    hours > 0 ? `${hours}H` : "",
    minutes > 0 ? `${minutes}M` : "",
    seconds > 0 ? `${seconds}S` : "",
  ].join("");

  return `PT${parts === "" ? "0S" : parts}`;
}
