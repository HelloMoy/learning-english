import { Course } from "@/domain/entities/course/course";
import { CourseId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useTranslations } from "next-intl";

import { FeaturedCourse } from "./featured-course";

const courseId = CourseId.parse(faker.string.uuid());

/**
 * Labels are reviewer-facing copy, so they resolve from
 * `Stories.FeaturedCourse` and follow the locale toolbar. The module count
 * drives the numbered index strip underneath, which is why it is pinned to
 * ten rather than randomised — the strip's wrapping is part of what the
 * story is for.
 */
function FeaturedCourseStory({ posterUrl }: { posterUrl?: string | null }) {
  const t = useTranslations("Stories.FeaturedCourse");
  const course = Course.parse({
    id: courseId,
    slug: "advanced-intermediate-course",
    title: t("courseTitle"),
    description: t("courseDescription"),
    language: "en",
    lessonCount: 107,
    moduleCount: 10,
  });

  return (
    <FeaturedCourse
      course={course}
      href="/en/courses/advanced-intermediate-course"
      posterUrl={posterUrl}
      featuredLabel={t("featuredLabel")}
      featureLabel={t("featureLabel")}
      featureHeadline={t("featureHeadline")}
      countsLabel={t("countsLabel")}
    />
  );
}

/**
 * Typed against the component rather than `typeof meta`: the stories build
 * their props inside `render`, since both the course entity and the labels
 * depend on the active locale.
 */
const meta: Meta<typeof FeaturedCourse> = {
  title: "Components/FeaturedCourse",
  component: FeaturedCourse,
};

export default meta;
type Story = StoryObj<typeof FeaturedCourse>;

/**
 * No poster art. The card falls back to the typographic headline, which is
 * what the home page shows for a course with no artwork on disk.
 */
export const WithoutPoster: Story = {
  render: () => <FeaturedCourseStory />,
};

/**
 * With cover art. The headline is suppressed so it cannot collide with the
 * image, and the scrim carries the text contrast.
 */
export const WithPoster: Story = {
  render: () => <FeaturedCourseStory posterUrl="/thumbnails/vowels-short-vs-long.jpg" />,
};
