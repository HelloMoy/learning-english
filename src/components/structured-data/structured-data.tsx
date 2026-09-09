/**
 * Renders one schema.org payload as linked data.
 *
 * @remarks
 * This exists for the escaping. Course titles and descriptions are
 * author-controlled text, and a description containing `</script>` would
 * otherwise close the tag early and turn everything after it into live markup.
 * Serializing in one place — rather than interpolating a template literal on
 * four pages — means that is handled once.
 *
 * `<` is escaped to its unicode form, which JSON parsers read identically and
 * an HTML parser does not treat as the start of a tag. That is the standard
 * defence for JSON embedded in a document.
 *
 * No library. schema.org objects are plain JSON; a dependency here would earn
 * nothing.
 *
 * @example
 * ```tsx
 * <StructuredData data={courseSchema({ course, siteUrl })} />
 * ```
 *
 * @param props.data - Any JSON-serializable schema.org object
 * @returns A single `application/ld+json` script element
 * @category Metadata
 */
export function StructuredData({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from the catalog, never from a request, and is
      // escaped above. This is the documented way to emit linked data in React.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
