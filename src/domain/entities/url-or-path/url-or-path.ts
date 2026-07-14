import { z } from "zod";

/**
 * A string that is either a fully-qualified absolute URL or a site-relative
 * path beginning with `/`. Used for `Resource.url`, `VideoLesson.source`,
 * and `VideoLesson.poster` — v1 ships static assets under `/public` (see
 * design.md §D5, §D9) so relative paths are the natural form. The boundary
 * still rejects garbage (empty strings, schemes without a host, paths
 * without a leading `/`).
 */
export const urlOrRelativePath = () =>
  z
    .string()
    .min(1)
    .refine(
      (value) => isAbsoluteHttpUrl(value) || isSiteRelativePath(value),
      "Must be an absolute http(s) URL or a site-relative path beginning with '/'",
    );

const isAbsoluteHttpUrl = (value: string): boolean => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

// A site-relative path starts with `/` and is not followed by another `/`
// or `\` (so protocol-relative URLs like `//cdn.example.com/x` are rejected
// at the boundary — the spec calls for absolute or site-relative only).
const isSiteRelativePath = (value: string): boolean =>
  value.startsWith("/") && value.length > 1 && value[1] !== "/" && value[1] !== "\\";
