// The tracked course catalog. Hand-edited: this is the source of truth for
// every course, module, lesson and resource the app serves. There is no
// generation step — see openspec/specs/course-content-storage/spec.md.

import advancedIntermediateCourse from "@/content/advanced-intermediate-course.json";
import basicCourse from "@/content/basic-course.json";

/**
 * Every course manifest, in ladder order.
 *
 * @remarks
 * Static import cannot enumerate a directory, so adding a course means adding
 * its file and one line here. That is the whole cost of one-file-per-course.
 */
export const courseManifests: ReadonlyArray<unknown> = [basicCourse, advancedIntermediateCourse];
