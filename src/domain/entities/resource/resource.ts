import { LessonId, ResourceId } from "@/domain/entities/ids/ids";
import { urlOrRelativePath } from "@/domain/entities/url-or-path/url-or-path";

import { z } from "zod";

/**
 * The kind of a Resource — drives the icon in the UI and the filter in
 * `ResourceRepository.listByKind` (deferred). Defined as a Zod enum so the
 * domain rejects unknown values at the boundary.
 */
export const ResourceKind = z.enum(["pdf", "slides", "code", "other"]);

export type ResourceKind = z.infer<typeof ResourceKind>;

/**
 * A supplementary file attached to a Lesson. Resource is a first-class domain
 * entity in v1 (not a field of Lesson) so the Workbook view, analytics, and
 * shared Resources are possible without a refactor — see design.md §D1.
 *
 * `url` accepts either an absolute URL or a site-relative path beginning
 * with `/` (v1's static-asset convention — see design.md §D9 "Resource URL:
 * static or signed").
 */
export const Resource = z.object({
  id: ResourceId,
  lessonId: LessonId,
  title: z.string().min(1),
  url: urlOrRelativePath(),
  kind: ResourceKind,
});

export type Resource = z.infer<typeof Resource>;
