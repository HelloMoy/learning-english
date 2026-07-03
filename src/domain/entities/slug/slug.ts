import { z } from "zod";

/**
 * A URL-safe identifier for a course (kebab-case, ≥ 3 chars).
 *
 * Branded so a `slug` cannot be passed where a generic `string` is expected;
 * adapters that produce slugs (e.g. from URL params) must parse with this schema.
 */
export const Slug = z.string().min(3).brand<"Slug">();

export type Slug = z.infer<typeof Slug>;
