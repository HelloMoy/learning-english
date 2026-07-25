/**
 * Discriminated error union for the `findCourseCatalog` use case.
 *
 * The domain owns its own error model; delivery adapters translate
 * `Err` into the appropriate HTTP / UI / log response. Adding new
 * failure modes requires a new variant here AND a test that exercises it.
 */
export type FindCourseCatalogErrors = { kind: "internal-error"; cause: unknown };
