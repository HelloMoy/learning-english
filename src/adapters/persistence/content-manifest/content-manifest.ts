import { parseCourseManifests } from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";
import {
  flattenCourseManifests,
  type FlattenedCatalog,
} from "@/adapters/persistence/content-manifest/flatten-course-manifests/flatten-course-manifests";
import { visibleCourseManifests } from "@/adapters/persistence/content-manifest/visible-course-manifests/visible-course-manifests";
import { courseManifests } from "@/content/courses";

/**
 * The course catalog, read from the tracked manifests under `src/content/`.
 *
 * @remarks
 * This is the replacement for the generated seed: there is no generation step,
 * and the manifests are the source of truth. They arrive here by static import,
 * so the data is resolved at build time and lands in the bundle — reading the
 * catalog touches no filesystem at run time and costs nothing per request.
 *
 * Validation happens once, when this module is first imported. A hand-edited
 * manifest that no longer describes a servable catalog therefore fails at load
 * with a message naming the offending lesson, rather than at render time with
 * an undefined field. That is deliberate: the manifests are edited by hand, so
 * the guard belongs at the point of use, not only in CI.
 *
 * A course that declares itself a draft is withheld here, before the flatten,
 * whenever the environment hides drafts — see {@link visibleCourseManifests}.
 * Every course the catalog does serve is validated first, so a draft manifest
 * still has to be well-formed to be withheld rather than to fail.
 *
 * @throws {@link InvalidCourseManifestError} at import time when a manifest is
 *         not servable
 * @category Content manifest
 */
export const contentCatalog: FlattenedCatalog = flattenCourseManifests(
  visibleCourseManifests(parseCourseManifests(courseManifests)),
);
