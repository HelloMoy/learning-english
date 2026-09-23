// Anything that could make the browser leave the site or climb out of the
// path: a scheme, a protocol-relative or doubled slash, a backslash (read as a
// slash by browsers), or a `..` segment.
const UNSAFE_PATH_PATTERN = /:|\/\/|\\|(^|\/)\.\.(\/|$)/;

/**
 * Whether a value is a path that can only lead somewhere on this site.
 *
 * @remarks
 * The shared first check behind every `next`-style return parameter: it must
 * be absolute, and it must not carry anything a browser could read as a
 * different origin or a climb out of the path.
 *
 * @param path - A candidate path, without its query string
 * @returns `true` when the path is absolute and free of unsafe syntax
 *
 * @category Utilities
 */
export function isSafeInternalPath(path: string): boolean {
  return path.startsWith("/") && !UNSAFE_PATH_PATTERN.test(path);
}
